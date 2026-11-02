/**
 * dentalbot.js — Servicio DentalBot integrado al servidor principal
 * WhatsApp (Baileys) + Google Sheets + Socket.IO
 * Se inicializa desde server.js al arrancar el servidor.
 */

import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require      = createRequire(import.meta.url);
const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);

// ── Configuración ────────────────────────────────────────────────────────────
const SHEET_ID  = process.env.DENTAL_SHEET_ID || '1NbAtoy6opm-iVfWUp2-ucDOXyPRSFIoHferhib7DTKU';
const DATA_DIR  = process.env.DENTAL_DATA_DIR
    ? process.env.DENTAL_DATA_DIR
    : path.join(__dirname, '..', 'dentalbot_data');

const CONFIG_FILE  = path.join(DATA_DIR, 'config.json');
const AUTH_FOLDER  = path.join(DATA_DIR, 'auth_info_baileys');
const ENVIOS_TAB   = 'REGISTRO_ENVIOS';
const PC_NAME      = os.hostname();

const MESES_ES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];

// ── Asegurar carpeta de datos ─────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Config ────────────────────────────────────────────────────────────────────
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (_) {}
    return { autoRevisarEnabled: true, cronTime: '09:00', botSilenciado: false };
}
function saveConfig(cfg) {
    try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8'); } catch (_) {}
}

// ── Estado global del bot ─────────────────────────────────────────────────────
const botState = { status: 'loading', qrData: null };
let   botConfig = loadConfig();
let   sock = null;
let   isConnecting = false;
let   reconnectTimer = null;
let   dailyCronJob = null;
let   _io = null;   // referencia al Socket.IO server (se asigna en init)

// ── Caché de pacientes ────────────────────────────────────────────────────────
let _pacientesCache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function invalidarCache() { _pacientesCache = null; _cacheTime = 0; }

// ── Módulos diferidos (Baileys es ESM) ───────────────────────────────────────
let _makeWASocket, _useMultiFileAuthState, _DisconnectReason,
    _makeCacheableSignalKeyStore, _fetchLatestBaileysVersion,
    _pino, _Boom, _google, _cron, _QRCode, _credenciales;
let _modulesLoaded = false;

async function loadModules() {
    if (_modulesLoaded) return;
    try {
        const baileys = await import('@whiskeysockets/baileys');
        _makeWASocket               = baileys.default?.makeWASocket || baileys.makeWASocket || baileys.default || baileys;
        _useMultiFileAuthState      = baileys.useMultiFileAuthState;
        _DisconnectReason           = baileys.DisconnectReason;
        _makeCacheableSignalKeyStore= baileys.makeCacheableSignalKeyStore;
        _fetchLatestBaileysVersion  = baileys.fetchLatestBaileysVersion;

        _pino  = require('pino');
        _Boom  = require('@hapi/boom').Boom;
        const googlePkg = await import('googleapis');
        _google = googlePkg.google;
        _cron   = require('node-cron');
        _QRCode = require('qrcode');

        // Credenciales Google Sheets — desde variable de entorno o archivo local
        if (process.env.GOOGLE_CREDENTIALS_JSON) {
            _credenciales = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        } else {
            const credPath = path.join(__dirname, '..', 'credenciales.json');
            if (fs.existsSync(credPath)) {
                _credenciales = JSON.parse(fs.readFileSync(credPath, 'utf8'));
            } else {
                console.warn('[DentalBot] credenciales.json no encontrado. Google Sheets deshabilitado.');
            }
        }

        _modulesLoaded = true;
        console.log('[DentalBot] Módulos cargados correctamente.');
    } catch (err) {
        console.error('[DentalBot] Error cargando módulos:', err.message);
    }
}

// ── Helpers de emisión ────────────────────────────────────────────────────────
function emitLog(msg, type = 'info') {
    if (_io) _io.emit('dentalbot:log', { msg, type, time: new Date().toISOString() });
    console.log(`[DentalBot][${type.toUpperCase()}] ${msg}`);
}
function updateStatus(newStatus) {
    botState.status = newStatus;
    if (_io) _io.emit('dentalbot:status', newStatus);
}

// ── Google Sheets ─────────────────────────────────────────────────────────────
let _sheets = null;
function getSheets() {
    if (!_sheets && _google && _credenciales) {
        const auth = new _google.auth.GoogleAuth({
            credentials: { client_email: _credenciales.client_email, private_key: _credenciales.private_key },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        _sheets = _google.sheets({ version: 'v4', auth });
    }
    return _sheets;
}

function getFechaManana() {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function getTabManana() {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${String(d.getDate()).padStart(2,'0')} DE ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;
}

async function obtenerPacientesManana() {
    const sheets = getSheets();
    if (!sheets) return [];
    const tabName = getTabManana();
    const fechaDisplay = getFechaManana();
    console.log(`[DentalBot] Buscando pestaña: "${tabName}"`);
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `'${tabName}'!A6:AH60`,
            valueRenderOption: 'FORMATTED_VALUE',
        });
        const filas = response.data.values;
        if (!filas || !filas.length) return [];

        const bloques = [];
        for (let r = 0; r < filas.length; r++) {
            const fila = filas[r] || [];
            const docs = [];
            for (let c = 0; c < fila.length; c++) {
                const cell = (fila[c] || '').toString().trim().toUpperCase();
                if (cell.startsWith('C.D.') || cell.startsWith('ESP. C.D.'))
                    docs.push({ nombre: fila[c].toString().trim(), colInicio: c });
            }
            if (docs.length) bloques.push({ filaHeaderIdx: r, doctores: docs });
        }
        if (!bloques.length) return [];

        const pacientes = [];
        for (let b = 0; b < bloques.length; b++) {
            const bloque = bloques[b];
            const dataStart = bloque.filaHeaderIdx + 2;
            const dataEnd = (b + 1 < bloques.length) ? bloques[b+1].filaHeaderIdx : filas.length;
            for (let i = dataStart; i < dataEnd; i++) {
                const fila = filas[i];
                if (!fila || !fila[0]) continue;
                const hora = fila[0].toString().trim();
                if (!hora || /^(MA[ÑN]ANA|TARDE|TURNO|HORARIO)/i.test(hora)) continue;
                if (!/^\d{1,2}:\d{2}/.test(hora)) continue;
                for (const doc of bloque.doctores) {
                    const nombre  = (fila[doc.colInicio]   || '').toString().trim();
                    const celular = (fila[doc.colInicio+3] || '').toString().trim();
                    if (!nombre || !celular) continue;
                    if (/ADICIONAL/i.test(nombre)) continue;
                    let numeroWs = celular.replace(/\D/g, '');
                    if (numeroWs.length < 7) continue;
                    if (numeroWs.length === 9) numeroWs = '51' + numeroWs;
                    else if (!numeroWs.startsWith('51') && numeroWs.length < 11) numeroWs = '51' + numeroWs;
                    const edad = parseInt((fila[doc.colInicio+2] || '').toString().trim());
                    const consultorio = (!isNaN(edad) && edad <= 11) ? 'Odontopediatría' : 'Odontología General';
                    const docCorto = doc.nombre.split(' ').slice(0,4).join(' ');
                    pacientes.push({ nombre, numeroWs, vacuna: `consulta con ${docCorto}`, fecha: fechaDisplay, hora, consultorio });
                }
            }
        }
        console.log(`[DentalBot] ${pacientes.length} paciente(s) para mañana.`);
        return pacientes;
    } catch (e) {
        if (!e.message?.includes('Unable to parse range'))
            console.error('[DentalBot] Error Sheets:', e.message);
        return [];
    }
}

async function obtenerPacientesCached(force = false) {
    const now = Date.now();
    if (!force && _pacientesCache && (now - _cacheTime) < CACHE_TTL) return _pacientesCache;
    const p = await obtenerPacientesManana();
    _pacientesCache = p; _cacheTime = Date.now();
    return p;
}

// ── Registro de envíos ────────────────────────────────────────────────────────
async function asegurarTabEnvios() {
    const sheets = getSheets(); if (!sheets) return;
    try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets.properties.title' });
        if (!meta.data.sheets.some(s => s.properties.title === ENVIOS_TAB)) {
            await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: ENVIOS_TAB } } }] } });
            await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `'${ENVIOS_TAB}'!A1:G1`, valueInputOption: 'RAW', requestBody: { values: [['Fecha Envío','Hora','Paciente','Número','Cita Para','Doctor','PC']] } });
        }
    } catch (_) {}
}

async function registrarEnvio(p) {
    const sheets = getSheets(); if (!sheets) return;
    try {
        const now = new Date();
        const fecha = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
        const hora  = now.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
        await sheets.spreadsheets.values.append({ spreadsheetId: SHEET_ID, range: `'${ENVIOS_TAB}'!A:G`, valueInputOption: 'RAW', requestBody: { values: [[fecha, hora, p.nombre, p.numeroWs, p.fecha||'', p.vacuna||'', PC_NAME]] } });
    } catch (_) {}
}

async function obtenerEnviadosHoy() {
    const sheets = getSheets(); if (!sheets) return new Set();
    try {
        const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `'${ENVIOS_TAB}'!A:D`, valueRenderOption: 'FORMATTED_VALUE' });
        const rows = resp.data.values || [];
        const hoy  = new Date();
        const fechaHoy = `${hoy.getDate().toString().padStart(2,'0')}/${(hoy.getMonth()+1).toString().padStart(2,'0')}/${hoy.getFullYear()}`;
        const set = new Set();
        for (const r of rows) { if (r[0] === fechaHoy && r[3]) set.add(r[3]); }
        return set;
    } catch (_) { return new Set(); }
}

async function enriquecerConEstado(pacientes) {
    try {
        const enviados = await obtenerEnviadosHoy();
        return pacientes.map(p => ({ ...p, enviado: enviados.has(p.numeroWs) }));
    } catch (_) {
        return pacientes.map(p => ({ ...p, enviado: false }));
    }
}

// ── Envío de mensajes ─────────────────────────────────────────────────────────
async function sendWithRetry(chatId, mensaje, retries = 2) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
    for (let i = 0; i <= retries; i++) {
        try {
            await sock.sendMessage(chatId, { text: mensaje });
            return true;
        } catch (e) {
            if (i < retries) { await new Promise(r => setTimeout(r, 5000)); continue; }
            throw e;
        }
    }
}

async function revisarYEnviar() {
    if (botState.status !== 'connected') return emitLog('Bot no conectado.', 'error');
    emitLog('Buscando citas para mañana...', 'info');
    try {
        const pacientes = await obtenerPacientesCached(true);
        if (!pacientes.length) return emitLog(`Sin citas para: ${getFechaManana()}`, 'info');
        const enviados = await obtenerEnviadosHoy();
        const pendientes = pacientes.filter(p => !enviados.has(p.numeroWs));
        if (!pendientes.length) return emitLog(`Todos los recordatorios ya fueron enviados.`, 'success');
        emitLog(`${pendientes.length} recordatorio(s) pendientes de envío.`, 'info');
        let count = 0;
        for (const p of pendientes) {
            const consultorio = p.consultorio || 'Odontología General';
            const msg = `Hola *${p.nombre}* 👋, le recordamos que tiene una cita odontológica de *${p.vacuna}* programada para *mañana ${p.fecha}* a las *${p.hora}* 🕐.\n\n🏥 *Consultorio:* ${consultorio}\n\n⚠️ *Por favor, llegue 10 minutos antes* de su cita.\n\n¡Le esperamos! 🦷`;
            emitLog(`Enviando a ${p.nombre}...`, 'info');
            await new Promise(r => setTimeout(r, 5000));
            try {
                await sendWithRetry(`${p.numeroWs}@s.whatsapp.net`, msg);
                await registrarEnvio(p);
                emitLog(`Enviado a ${p.nombre}.`, 'success');
                count++;
                if (_io) _io.emit('dentalbot:paciente_enviado', { numeroWs: p.numeroWs });
            } catch (e) { emitLog(`Error con ${p.nombre}: ${e.message}`, 'error'); }
        }
        emitLog(`Listo: ${count}/${pendientes.length} enviados.`, 'system');
    } catch (e) { emitLog('Error grave: ' + e.message, 'error'); }
}

// ── Cron ───────────────────────────────────────────────────────────────────────
function programarCron() {
    if (dailyCronJob) dailyCronJob.stop();
    if (!_cron) return;
    const [hour, minute] = botConfig.cronTime.split(':');
    dailyCronJob = _cron.schedule(`${Number(minute)} ${Number(hour)} * * *`, () => {
        if (botConfig.autoRevisarEnabled) {
            emitLog(`Revisión automática (${botConfig.cronTime})...`, 'system');
            revisarYEnviar();
        }
    });
}

// ── Auth state ────────────────────────────────────────────────────────────────
let _authState = null, _saveCreds = null, _cachedKeyStore = null, _cachedVersion = null;

async function getAuthState() {
    if (!_authState) {
        const { state, saveCreds } = await _useMultiFileAuthState(AUTH_FOLDER);
        _authState = state;
        _saveCreds = saveCreds;
        _cachedKeyStore = _makeCacheableSignalKeyStore(state.keys, _pino({ level: 'silent' }));
    }
    return { state: _authState, saveCreds: _saveCreds, keyStore: _cachedKeyStore };
}
function resetAuthState() { _authState = null; _saveCreds = null; _cachedKeyStore = null; }

// ── Conexión WhatsApp ─────────────────────────────────────────────────────────
async function connectWhatsApp() {
    if (isConnecting) return;
    isConnecting = true;
    try {
        if (sock) { try { sock.ev.removeAllListeners(); sock.end(); } catch (_) {} sock = null; }
        const { state, saveCreds, keyStore } = await getAuthState();
        if (!_cachedVersion) {
            const { version } = await _fetchLatestBaileysVersion();
            _cachedVersion = version;
        }
        sock = _makeWASocket({
            version: _cachedVersion,
            auth: { creds: state.creds, keys: keyStore },
            printQRInTerminal: false,
            logger: _pino({ level: 'silent' }),
            browser: ['Ubuntu', 'Chrome', '114.0.0'],
            generateHighQualityLinkPreview: false,
            markOnlineOnConnect: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            shouldSyncHistoryMessage: () => false,
            getMessage: async () => ({ conversation: '' }),
        });

        sock.ev.on('creds.update', _saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                try {
                    const qrImage = await _QRCode.toDataURL(qr);
                    botState.qrData = qrImage;
                    updateStatus('qr');
                    if (_io) _io.emit('dentalbot:qr', qrImage);
                    emitLog('Escanea el código QR en el panel.', 'warning');
                } catch (_) {}
            }
            if (connection === 'open') {
                isConnecting = false;
                updateStatus('connected');
                botState.qrData = null;
                emitLog('WhatsApp vinculado y listo.', 'success');
                await asegurarTabEnvios();
                programarCron();
            }
            if (connection === 'close') {
                isConnecting = false;
                const shouldReconnect = lastDisconnect?.error instanceof _Boom
                    ? lastDisconnect.error.output?.statusCode !== _DisconnectReason.loggedOut
                    : true;
                emitLog(`Conexión cerrada. ${shouldReconnect ? 'Reconectando...' : 'Sesión cerrada.'}`, 'warning');
                if (shouldReconnect) {
                    updateStatus('loading');
                    if (reconnectTimer) clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => connectWhatsApp(), 5000);
                } else {
                    updateStatus('disconnected');
                    try { if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (_) {}
                    resetAuthState();
                    reconnectTimer = setTimeout(() => connectWhatsApp(), 8000);
                }
            }
        });
    } catch (e) {
        isConnecting = false;
        emitLog('Error de conexión: ' + e.message, 'error');
        reconnectTimer = setTimeout(() => connectWhatsApp(), 10000);
    }
}

// ── Socket.IO — eventos del panel ────────────────────────────────────────────
function setupSocketEvents(io) {
    _io = io;

    io.on('connection', (socket) => {
        // Enviar estado actual al conectarse
        socket.emit('dentalbot:status', botState.status);
        socket.emit('dentalbot:config', { autoRevisarEnabled: botConfig.autoRevisarEnabled, cronTime: botConfig.cronTime });
        if (botState.status === 'qr' && botState.qrData) socket.emit('dentalbot:qr', botState.qrData);

        // Cargar pacientes al conectar
        (async () => {
            try {
                const p = await obtenerPacientesCached();
                const pe = await enriquecerConEstado(p);
                socket.emit('dentalbot:pacientes_data', pe);
            } catch (_) {}
        })();

        socket.on('dentalbot:manual_check', () => {
            emitLog('Envío manual desde el panel.', 'system');
            revisarYEnviar();
        });

        socket.on('dentalbot:toggle_auto', (enabled) => {
            botConfig.autoRevisarEnabled = enabled;
            saveConfig(botConfig);
            emitLog(`Auto-envío ${enabled ? 'activado' : 'desactivado'}.`, enabled ? 'success' : 'warning');
        });

        socket.on('dentalbot:set_cron_time', (timeStr) => {
            botConfig.cronTime = timeStr;
            saveConfig(botConfig);
            programarCron();
            io.emit('dentalbot:config', { autoRevisarEnabled: botConfig.autoRevisarEnabled, cronTime: botConfig.cronTime });
            emitLog(`Horario actualizado a ${timeStr}.`, 'success');
        });

        socket.on('dentalbot:get_pacientes', async () => {
            try {
                const p = await obtenerPacientesCached();
                const pe = await enriquecerConEstado(p);
                socket.emit('dentalbot:pacientes_data', pe);
            } catch (e) { emitLog('Error cargando pacientes: ' + e.message, 'error'); }
        });

        socket.on('dentalbot:refresh_pacientes', async () => {
            try {
                invalidarCache();
                const p = await obtenerPacientesCached(true);
                const pe = await enriquecerConEstado(p);
                socket.emit('dentalbot:pacientes_data', pe);
                emitLog(`Lista actualizada: ${p.length} paciente(s).`, 'success');
            } catch (e) { emitLog('Error actualizando: ' + e.message, 'error'); }
        });

        socket.on('dentalbot:send_to_patient', async (paciente) => {
            if (botState.status !== 'connected') return emitLog('WhatsApp no conectado.', 'error');
            try {
                const consultorio = paciente.consultorio || 'Odontología General';
                const msg = `Hola *${paciente.nombre}* 👋, le recordamos que tiene una cita odontológica de *${paciente.vacuna}* programada para *mañana ${paciente.fecha}* a las *${paciente.hora}* 🕐.\n\n🏥 *Consultorio:* ${consultorio}\n\n⚠️ *Por favor, llegue 10 minutos antes* de su cita.\n\n¡Le esperamos! 🦷`;
                await sendWithRetry(`${paciente.numeroWs}@s.whatsapp.net`, msg);
                await registrarEnvio(paciente);
                emitLog(`Recordatorio enviado a ${paciente.nombre}.`, 'success');
                io.emit('dentalbot:paciente_enviado', { numeroWs: paciente.numeroWs });
            } catch (e) { emitLog(`Error: ${e.message}`, 'error'); }
        });

        socket.on('dentalbot:send_free_message', async ({ numeroWs, message }) => {
            if (botState.status !== 'connected') return emitLog('WhatsApp no conectado.', 'error');
            let num = (numeroWs || '').replace(/\D/g, '');
            if (num.length === 9) num = '51' + num;
            else if (!num.startsWith('51') && num.length < 11) num = '51' + num;
            try {
                await sendWithRetry(`${num}@s.whatsapp.net`, message);
                emitLog(`Mensaje enviado a +${num}.`, 'success');
            } catch (e) { emitLog(`Error enviando a +${num}: ${e.message}`, 'error'); }
        });

        socket.on('dentalbot:logout', async () => {
            emitLog('Cerrando sesión de WhatsApp...', 'warning');
            updateStatus('closing');
            try { if (sock) await sock.logout(); } catch (_) {}
            try { if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (_) {}
            resetAuthState();
            updateStatus('loading');
            setTimeout(() => connectWhatsApp(), 3000);
        });

        socket.on('dentalbot:refresh_session', () => {
            emitLog('Reconectando...', 'system');
            if (sock) { try { sock.ev.removeAllListeners(); sock.end(); } catch (_) {} sock = null; }
            isConnecting = false;
            resetAuthState();
            setTimeout(() => connectWhatsApp(), 2000);
        });
    });
}

// ── Inicialización pública ────────────────────────────────────────────────────
export async function initDentalBot(io) {
    console.log('[DentalBot] Iniciando servicio...');
    await loadModules();
    setupSocketEvents(io);
    if (_modulesLoaded) {
        await connectWhatsApp();
    } else {
        console.warn('[DentalBot] Módulos no cargados — WhatsApp deshabilitado. Verifica credenciales.');
        updateStatus('disconnected');
    }
}

export { botState, botConfig };



// ── Función pública: obtener pacientes para cualquier fecha ───────────────────
export async function obtenerPacientesPorDia(date) {
    await loadModules();
    if (!_modulesLoaded) return [];
    const sheets = getSheets();
    if (!sheets) return [];

    const dia       = String(date.getDate()).padStart(2, '0');
    const mes       = MESES_ES[date.getMonth()];
    const anio      = date.getFullYear();
    const tabName   = `${dia} DE ${mes} ${anio}`;
    const fechaDisplay = `${dia}/${String(date.getMonth()+1).padStart(2,'0')}/${anio}`;

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `'${tabName}'!A6:AH60`,
            valueRenderOption: 'FORMATTED_VALUE',
        });
        const filas = response.data.values;
        if (!filas || !filas.length) return [];

        const bloques = [];
        for (let r = 0; r < filas.length; r++) {
            const fila = filas[r] || [];
            const docs = [];
            for (let c = 0; c < fila.length; c++) {
                const cell = (fila[c] || '').toString().trim().toUpperCase();
                if (cell.startsWith('C.D.') || cell.startsWith('ESP. C.D.'))
                    docs.push({ nombre: fila[c].toString().trim(), colInicio: c });
            }
            if (docs.length) bloques.push({ filaHeaderIdx: r, doctores: docs });
        }
        if (!bloques.length) return [];

        const pacientes = [];
        for (let b = 0; b < bloques.length; b++) {
            const bloque   = bloques[b];
            const dataStart = bloque.filaHeaderIdx + 2;
            const dataEnd   = (b + 1 < bloques.length) ? bloques[b+1].filaHeaderIdx : filas.length;
            for (let i = dataStart; i < dataEnd; i++) {
                const fila = filas[i];
                if (!fila || !fila[0]) continue;
                const hora = fila[0].toString().trim();
                if (!hora || /^(MA[ÑN]ANA|TARDE|TURNO|HORARIO)/i.test(hora)) continue;
                if (!/^\d{1,2}:\d{2}/.test(hora)) continue;
                for (const doc of bloque.doctores) {
                    const nombre  = (fila[doc.colInicio]   || '').toString().trim();
                    const dni     = (fila[doc.colInicio+1] || '').toString().trim();
                    const edadRaw = (fila[doc.colInicio+2] || '').toString().trim();
                    const celular = (fila[doc.colInicio+3] || '').toString().trim();
                    if (!nombre || /ADICIONAL/i.test(nombre)) continue;
                    let numeroWs = celular.replace(/\D/g, '');
                    if (numeroWs.length === 9) numeroWs = '51' + numeroWs;
                    else if (!numeroWs.startsWith('51') && numeroWs.length > 0 && numeroWs.length < 11) numeroWs = '51' + numeroWs;
                    const edad = parseInt(edadRaw);
                    const consultorio = (!isNaN(edad) && edad <= 11) ? 'Odontopediatría' : 'Odontología General';
                    pacientes.push({
                        nombre, dni, edad: edadRaw, celular: numeroWs,
                        hora, consultorio, doctor: doc.nombre, fecha: fechaDisplay,
                    });
                }
            }
        }
        return pacientes;
    } catch (e) {
        if (!e.message?.includes('Unable to parse range'))
            console.error('[DentalBot] Error Sheets para', fechaDisplay, ':', e.message);
        return [];
    }
}
