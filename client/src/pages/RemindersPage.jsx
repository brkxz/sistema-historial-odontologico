import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Bell, Wifi, WifiOff, MessageSquare, Send, RefreshCw,
  Clock, Users, CheckCircle, AlertTriangle, Settings,
  Play, Square, QrCode, Smartphone, X, TerminalSquare, Info
} from 'lucide-react';
import '../styles/reminders.css';

// Conecta al mismo backend del sistema (Render en producción, localhost en dev)
const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : (import.meta.env.DEV ? 'http://localhost:3001' : 'https://odontologia-api-9a6v.onrender.com');

/* ── Helpers ── */
function fmtTime(date) {
  return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function statusLabel(s) {
  if (s === 'connected')  return 'Conectado';
  if (s === 'qr')         return 'Esperando QR';
  if (s === 'loading')    return 'Iniciando...';
  if (s === 'closing')    return 'Cerrando...';
  return 'Desconectado';
}
function statusBadgeClass(s) {
  if (s === 'connected')  return 'connected';
  if (s === 'qr')         return 'qr';
  if (s === 'loading')    return 'loading';
  return 'disconnected';
}
function logTypeLabel(t) {
  if (t === 'success') return '[OK]   ';
  if (t === 'warning') return '[WARN] ';
  if (t === 'error')   return '[ERR]  ';
  if (t === 'system')  return '[SYS]  ';
  return '[INFO] ';
}

/* ── Modal QR ── */
function QrModal({ qrData, onClose }) {
  return (
    <div className="rem-modal-overlay" onClick={onClose}>
      <div className="rem-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Escanea el código QR</h3>
        <p>Abre WhatsApp en tu celular, ve a <strong>Dispositivos vinculados</strong> y escanea este código.</p>
        {qrData
          ? <img src={qrData} alt="QR WhatsApp" className="rem-qr-img" />
          : <div className="rem-qr-placeholder"><QrCode size={40} /><span>Generando código...</span></div>
        }
        <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14} /> Cerrar</button>
      </div>
    </div>
  );
}

/* ── Componente principal ── */
export default function RemindersPage() {
  const socketRef = useRef(null);
  const logEndRef = useRef(null);

  const [connected,   setConnected]   = useState(false);
  const [botStatus,   setBotStatus]   = useState('loading');
  const [qrData,      setQrData]      = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [pacientes,   setPacientes]   = useState([]);
  const [logs,        setLogs]        = useState([{ type: 'system', msg: 'Conectando con el servidor...', time: new Date().toISOString() }]);

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [cronHour,    setCronHour]    = useState('09');
  const [cronMin,     setCronMin]     = useState('00');
  const [cronPeriod,  setCronPeriod]  = useState('AM');

  const [freePatient, setFreePatient] = useState('');
  const [freeMsg,     setFreeMsg]     = useState('');
  const [sendingFree, setSendingFree] = useState(false);
  const [sendingWs,   setSendingWs]   = useState(null);

  const addLog = useCallback((type, msg) => {
    setLogs(prev => {
      const next = [...prev, { type, msg, time: new Date().toISOString() }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      timeout: 10000,
      path: '/socket.io',
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      addLog('system', `Conectado al servidor (${BACKEND_URL}).`);
      socket.emit('dentalbot:get_pacientes');
    });
    socket.on('disconnect', () => {
      setConnected(false);
      addLog('system', 'Desconectado del servidor.');
    });
    socket.on('connect_error', (e) => {
      setConnected(false);
      addLog('error', `Sin conexión con el servidor: ${e.message}`);
    });
    socket.on('dentalbot:status', (s) => {
      setBotStatus(typeof s === 'string' ? s : 'disconnected');
    });
    socket.on('dentalbot:qr', (data) => {
      setBotStatus('qr');
      setQrData(data);
      setShowQrModal(true);
      addLog('warning', 'WhatsApp requiere escanear el código QR.');
    });
    socket.on('dentalbot:log', (entry) => {
      addLog(entry?.type ?? 'info', entry?.msg ?? String(entry));
    });
    socket.on('dentalbot:pacientes_data', (data) => {
      if (Array.isArray(data)) {
        setPacientes(data);
        addLog('info', `${data.length} paciente(s) para mañana cargados.`);
      }
    });
    socket.on('dentalbot:paciente_enviado', ({ numeroWs }) => {
      setPacientes(prev => prev.map(p => p.numeroWs === numeroWs ? { ...p, enviado: true } : p));
    });
    socket.on('dentalbot:config', (cfg) => {
      if (cfg?.autoRevisarEnabled !== undefined) setAutoEnabled(cfg.autoRevisarEnabled);
      if (cfg?.cronTime) {
        const [hStr, mStr] = cfg.cronTime.split(':');
        let h = parseInt(hStr, 10);
        const period = h >= 12 ? 'PM' : 'AM';
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        setCronHour(String(h).padStart(2, '0'));
        setCronMin(mStr?.padStart(2, '0') ?? '00');
        setCronPeriod(period);
      }
    });

    return () => socket.disconnect();
  }, [addLog]);

  /* ── Acciones ── */
  const emit = (event, data) => socketRef.current?.connected && socketRef.current.emit(event, data);

  const handleManualCheck = () => { emit('dentalbot:manual_check'); addLog('info', 'Solicitud de envío manual enviada...'); };
  const handleToggleAuto  = () => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    emit('dentalbot:toggle_auto', next);
    addLog('info', `Auto-envío ${next ? 'activado' : 'desactivado'}.`);
  };
  const handleSetCron = () => {
    let h = parseInt(cronHour, 10);
    if (cronPeriod === 'PM' && h !== 12) h += 12;
    if (cronPeriod === 'AM' && h === 12) h = 0;
    const timeStr = `${String(h).padStart(2,'0')}:${cronMin}`;
    emit('dentalbot:set_cron_time', timeStr);
    addLog('info', `Horario configurado a ${cronHour}:${cronMin} ${cronPeriod}.`);
  };
  const handleRefresh = () => { emit('dentalbot:refresh_pacientes'); addLog('info', 'Actualizando lista...'); };
  const handleSendToPatient = (p) => {
    setSendingWs(p.numeroWs);
    emit('dentalbot:send_to_patient', p);
    addLog('info', `Enviando recordatorio a ${p.nombre}...`);
    setTimeout(() => setSendingWs(null), 4000);
  };
  const handleSendFree = () => {
    if (!freePatient || !freeMsg.trim()) return;
    setSendingFree(true);
    emit('dentalbot:send_free_message', { numeroWs: freePatient, message: freeMsg.trim() });
    const p = pacientes.find(x => x.numeroWs === freePatient);
    addLog('info', `Mensaje enviado a ${p?.nombre ?? freePatient}.`);
    setFreeMsg('');
    setSendingFree(false);
  };
  const handleLogout = () => { emit('dentalbot:logout'); addLog('warning', 'Cerrando sesión de WhatsApp...'); };

  const sentCount    = pacientes.filter(p => p.enviado).length;
  const pendingCount = pacientes.length - sentCount;
  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="page-container rem-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Bell size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Recordatorios WhatsApp
          </h1>
          <p className="page-subtitle">DentalBot integrado — envío automático de recordatorios de citas</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span className={`rem-badge ${connected ? statusBadgeClass(botStatus) : 'disconnected'}`}>
            <span className="rem-badge dot" />
            {connected ? statusLabel(botStatus) : 'Sin conexión'}
          </span>
          {connected && botStatus === 'qr' && (
            <button className="btn btn-sm btn-secondary" onClick={() => setShowQrModal(true)}>
              <QrCode size={14} /> Ver QR
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="rem-stats">
        <div className="rem-stat-card">
          <div className={`rem-stat-icon ${connected ? 'green' : 'gray'}`}>
            {connected ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div className="rem-stat-body">
            <div className="rem-stat-label">Servidor</div>
            <div className="rem-stat-value">{connected ? 'Online' : 'Offline'}</div>
            <div className="rem-stat-sub">Backend sistema</div>
          </div>
        </div>

        <div className="rem-stat-card">
          <div className={`rem-stat-icon ${botStatus === 'connected' ? 'green' : botStatus === 'loading' ? 'orange' : 'gray'}`}>
            <Smartphone size={20} />
          </div>
          <div className="rem-stat-body">
            <div className="rem-stat-label">WhatsApp</div>
            <div className="rem-stat-value">{botStatus === 'connected' ? 'Vinculado' : botStatus === 'qr' ? 'QR' : botStatus === 'loading' ? 'Iniciando' : '—'}</div>
            <div className="rem-stat-sub">Sesión Baileys</div>
          </div>
        </div>

        <div className="rem-stat-card">
          <div className="rem-stat-icon blue"><Users size={20} /></div>
          <div className="rem-stat-body">
            <div className="rem-stat-label">Pacientes mañana</div>
            <div className="rem-stat-value">{pacientes.length}</div>
            <div className="rem-stat-sub">{pendingCount} pendientes · {sentCount} enviados</div>
          </div>
        </div>

        <div className="rem-stat-card">
          <div className={`rem-stat-icon ${autoEnabled ? 'purple' : 'gray'}`}><Clock size={20} /></div>
          <div className="rem-stat-body">
            <div className="rem-stat-label">Auto-envío</div>
            <div className="rem-stat-value">{autoEnabled ? `${cronHour}:${cronMin} ${cronPeriod}` : 'Inactivo'}</div>
            <div className="rem-stat-sub">{autoEnabled ? 'Programado' : 'Desactivado'}</div>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      {connected && (
        <div className="rem-grid">

          {/* Columna izquierda — Config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div className="rem-card">
              <div className="rem-card-header">
                <span className="rem-card-title"><Settings size={16} /> Configuración</span>
              </div>
              <div className="rem-card-body">

                <div className="rem-toggle-row">
                  <div className="rem-toggle-info">
                    <span>Envíos Automáticos</span>
                    <span>{autoEnabled ? 'Activo — enviará según horario' : 'Desactivado'}</span>
                  </div>
                  <label className="rem-switch">
                    <input type="checkbox" checked={autoEnabled} onChange={handleToggleAuto} />
                    <span className="rem-switch-slider" />
                  </label>
                </div>

                <div className="rem-field">
                  <label>Horario de envío automático</label>
                  <div className="rem-time-picker">
                    <select value={cronHour} onChange={(e) => setCronHour(e.target.value)} className="form-select">
                      {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="rem-time-sep">:</span>
                    <select value={cronMin} onChange={(e) => setCronMin(e.target.value)} className="form-select">
                      {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={cronPeriod} onChange={(e) => setCronPeriod(e.target.value)} className="form-select">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleSetCron} style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                    <CheckCircle size={14} /> Guardar horario
                  </button>
                </div>

                <div className="rem-divider" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={handleManualCheck} disabled={botStatus !== 'connected'}>
                    <Send size={15} /> Enviar recordatorios ahora
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
                    <RefreshCw size={14} /> Actualizar lista de pacientes
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="rem-card">
              <div className="rem-card-header">
                <span className="rem-card-title"><Smartphone size={16} /> WhatsApp</span>
              </div>
              <div className="rem-card-body">
                <div className={`rem-wa-card ${botStatus === 'connected' ? '' : botStatus}`}>
                  <div className="rem-wa-info">
                    {botStatus === 'connected' && <CheckCircle size={16} />}
                    {botStatus === 'qr'        && <QrCode size={16} />}
                    {botStatus === 'loading'   && <RefreshCw size={16} className="rem-pulsing" />}
                    {(botStatus === 'disconnected' || botStatus === 'closing') && <WifiOff size={16} />}
                    {botStatus === 'connected'  ? 'Sesión activa'       :
                     botStatus === 'qr'         ? 'Escanea el QR'      :
                     botStatus === 'loading'    ? 'Iniciando sesión...' : 'Sin sesión'}
                  </div>
                  {botStatus === 'qr' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => setShowQrModal(true)}>
                      <QrCode size={13} /> Ver QR
                    </button>
                  )}
                </div>
                {botStatus === 'connected' && (
                  <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                    <Square size={13} /> Cerrar sesión WA
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Columna derecha — Log */}
          <div className="rem-card rem-log-wrap">
            <div className="rem-card-header">
              <span className="rem-card-title"><TerminalSquare size={16} /> Registro de actividad</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setLogs([])}><X size={13} /> Limpiar</button>
            </div>
            <div className="rem-log-container">
              {logs.length === 0
                ? <span className="rem-log-empty">— Sin actividad —</span>
                : logs.map((l, i) => (
                    <div key={i} className="rem-log-entry">
                      <span className="rem-log-time">{fmtTime(l.time)}</span>
                      <span className={`rem-log-type ${l.type}`}>{logTypeLabel(l.type)}</span>
                      <span className="rem-log-msg">{l.msg}</span>
                    </div>
                  ))
              }
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Tabla de pacientes */}
      {connected && (
        <div className="rem-card">
          <div className="rem-card-header">
            <span className="rem-card-title"><Users size={16} /> Citas para mañana ({pacientes.length})</span>
            <button className="btn btn-ghost btn-sm" onClick={handleRefresh}><RefreshCw size={13} /> Actualizar</button>
          </div>
          <div className="rem-table-wrap">
            <table className="rem-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>WhatsApp</th>
                  <th>Hora</th>
                  <th>Consultorio</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.length === 0 ? (
                  <tr><td colSpan={6} className="rem-table-empty">Sin pacientes para mañana. Haz clic en Actualizar.</td></tr>
                ) : (
                  pacientes.map((p, i) => (
                    <tr key={i} className={p.enviado ? 'sent' : ''}>
                      <td>
                        <div className="rem-patient-name">{p.nombre}</div>
                        {p.vacuna && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.vacuna}</div>}
                      </td>
                      <td><span className="rem-patient-ws">{p.numeroWs}</span></td>
                      <td>{p.hora || '—'}</td>
                      <td>{p.consultorio || '—'}</td>
                      <td>
                        {p.enviado
                          ? <span className="rem-badge-sent"><CheckCircle size={11} /> Enviado</span>
                          : <span className="rem-badge-pending">Pendiente</span>
                        }
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          disabled={p.enviado || sendingWs === p.numeroWs || botStatus !== 'connected'}
                          onClick={() => handleSendToPatient(p)}
                        >
                          {sendingWs === p.numeroWs ? <RefreshCw size={13} className="rem-pulsing" /> : <Send size={13} />}
                          {p.enviado ? 'Enviado' : 'Enviar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje personalizado */}
      {connected && (
        <div className="rem-card">
          <div className="rem-card-header">
            <span className="rem-card-title"><MessageSquare size={16} /> Mensaje personalizado</span>
          </div>
          <div className="rem-card-body">
            <div className="rem-free-grid">
              <div className="rem-field">
                <label>Paciente destinatario</label>
                <select className="form-select" value={freePatient} onChange={(e) => setFreePatient(e.target.value)}>
                  <option value="">— Seleccionar paciente —</option>
                  {pacientes.map((p, i) => (
                    <option key={i} value={p.numeroWs}>{p.nombre} ({p.numeroWs})</option>
                  ))}
                </select>
              </div>
              <div className="rem-field">
                <label>Mensaje</label>
                <textarea
                  className="form-textarea rem-free-textarea"
                  placeholder="Escribe un mensaje personalizado..."
                  value={freeMsg}
                  onChange={(e) => setFreeMsg(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                disabled={!freePatient || !freeMsg.trim() || sendingFree || botStatus !== 'connected'}
                onClick={handleSendFree}
              >
                <Send size={15} />
                {sendingFree ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {showQrModal && <QrModal qrData={qrData} onClose={() => setShowQrModal(false)} />}
    </div>
  );
}
