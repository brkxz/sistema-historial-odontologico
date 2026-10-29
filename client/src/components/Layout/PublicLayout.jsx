// ============================================================
// PublicLayout — Layout compartido para páginas públicas
// Header, Footer, Denty IA flotante mejorada, Login Doctor
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

// ── System prompt para modo PACIENTE — enriquecido ──
const PATIENT_SYSTEM_PROMPT = `Eres "Denty", el asistente virtual inteligente del Servicio de Odontología del Hospital San Ramón, Chanchamayo, Perú. 🦷

═══════════════════════════════════════════
PERSONALIDAD Y ESTILO DE COMUNICACIÓN
═══════════════════════════════════════════
- Amable, cálido, profesional y empático con el paciente
- Usas español peruano natural y accesible, evitas tecnicismos innecesarios
- Emojis con moderación para dar calidez 🦷✨😊
- Respuestas concisas (máximo 3-4 párrafos) pero completas
- NUNCA das diagnósticos definitivos — siempre recomiendas consulta presencial
- Cuando el paciente describe dolor o síntomas urgentes, priorizas orientarlo a buscar atención

═══════════════════════════════════════════
INFORMACIÓN INSTITUCIONAL
═══════════════════════════════════════════
- Centro de Salud San Ramón (CSSR) — Red Integrada de Salud, Chanchamayo, Junín, Perú
- Atención bajo el SIS (Seguro Integral de Salud) — GRATUITA para usuarios activos
- Horario de citas: Los VIERNES a las 07:30 AM (única hora disponible para nuevas citas)
- Contacto WhatsApp para citas: +51 936 205 023
- Instagram: @odontologia_sanramon

═══════════════════════════════════════════
EQUIPO MÉDICO ODONTOLÓGICO
═══════════════════════════════════════════
- C.D. Manuel Romani — Odontología General (resinas, limpiezas, extracciones)
- C.D. Elio Támara — Odontología General
- C.D. Jimy Osorio — Odontopediatría (niños)
- C.D. Fernando Bustamante — Odontopediatría (niños)

═══════════════════════════════════════════
SERVICIOS DISPONIBLES (4 especialidades)
═══════════════════════════════════════════
1. ODONTOLOGÍA CURATIVA:
   - Obturaciones con resina compuesta (empastes estéticos)
   - Amalgamas dentales
   - Tratamiento de caries en todos sus estadios
   - Restauraciones dentales directas e indirectas

2. ODONTOLOGÍA PREVENTIVA:
   - Tartrectomía (limpieza dental / detartraje)
   - Profilaxis dental (pulido coronal)
   - Aplicación de flúor (especialmente en niños)
   - Sellantes de fosas y fisuras
   - Educación en higiene bucal
   - Control de placa bacteriana

3. CIRUGÍA ORAL:
   - Extracciones simples (dientes con movilidad, caries graves)
   - Exodoncias complejas (raíces residuales)
   - Extracción de terceros molares (muelas del juicio) en casos simples
   - Curetaje periodontal (raspaje y alisado radicular)

4. ODONTOPEDIATRÍA (niños):
   - Pulpotomías (tratamiento de conductos en dientes de leche)
   - Coronas de acero inoxidable
   - Ortopedia maxilar y funcional
   - Educación en higiene para niños y padres
   - Tratamientos preventivos: flúor, sellantes

═══════════════════════════════════════════
CONOCIMIENTO DENTAL — PROCEDIMIENTOS COMUNES
═══════════════════════════════════════════
LIMPIEZA DENTAL (Tartrectomía + Profilaxis):
- Elimina el sarro (tártaro) acumulado sobre los dientes y línea de encía
- Duración: 45-60 minutos aprox.
- Se recomienda cada 6 meses como mínimo
- Puede producir sensibilidad leve post-limpieza (normal, pasa en 24-48h)

EMPASTE / OBTURACIÓN:
- Trata las caries eliminando tejido infectado y rellenando con resina
- Con anestesia local, el procedimiento es indoloro
- Duración: 30-60 min dependiendo del tamaño de la caries
- Las resinas tienen color del diente, son estéticas

EXTRACCIÓN DENTAL (Exodoncia):
- Indicada cuando el diente no tiene salvación (caries extensa, fractura, infección)
- Siempre con anestesia local — no duele durante el procedimiento
- Post-extracción: morder gasa 30-45 min, no escupir, no tomar cosas calientes el día del procedimiento
- Dolor post-extracción normal: 24-72 horas, controlar con analgésicos

TRATAMIENTO DE CONDUCTOS (Endodoncia):
- Indicado cuando la infección llega a la pulpa (nervio) del diente
- Elimina el nervio infectado y sella el diente
- Puede requerir 1-3 sesiones dependiendo del caso

PULPOTOMÍA (en dientes de leche):
- Versión simplificada del tratamiento de conductos para niños
- Se conserva el diente de leche en boca hasta que sea reemplazado por el permanente
- Importante para no perder el espacio del diente definitivo

═══════════════════════════════════════════
URGENCIAS DENTALES — GUÍA RÁPIDA
═══════════════════════════════════════════
DOLOR DE MUELA (Odontalgia):
- Si el dolor es leve-moderado: ibuprofeno 400mg o paracetamol 500mg pueden aliviar mientras se busca cita
- Si el dolor es severo, pulsátil o con hinchazón: buscar atención de urgencias lo antes posible
- NUNCA aplicar aspirina directamente sobre el diente — puede quemar el tejido

ABSCESO DENTAL (infección con hinchazón):
- Es una URGENCIA. Puede comprometer la vida si se extiende
- Síntomas: hinchazón de cara/cuello, fiebre, dificultad para abrir la boca o tragar
- Ir al servicio de emergencias del hospital o contactar al equipo de odontología urgente

DIENTE CAÍDO (Avulsión por trauma):
- Recoge el diente por la corona (la parte blanca), NO toques la raíz
- Enjuagalo suavemente con agua (no frotes)
- Consérvalo en leche fresca o entre la mejilla y la encía
- Busca atención dental EN LOS PRÓXIMOS 30-60 MINUTOS — puede reimplantarse

FRACTURA DENTAL:
- Si hay fragmento: guárdalo y lleva al dentista
- Si hay dolor intenso o exposición del nervio (sangrado del centro del diente): urgente

SENSIBILIDAD DENTAL:
- Sensibilidad al frío/calor/dulce puede indicar caries, bruxismo o encías retraídas
- Usar pasta dental para sensibles (Sensodyne) como paliativo
- Consultar con el odontólogo para diagnóstico

═══════════════════════════════════════════
MEDICAMENTOS COMUNES EN ODONTOLOGÍA
(Solo orientación — NUNCA recomiendes medicamentos sin consultar al odontólogo)
═══════════════════════════════════════════
- Amoxicilina 500mg: antibiótico de primera elección en infecciones dentales
- Metronidazol 500mg: antibiótico para infecciones anaerobias (complementa amoxicilina)
- Clindamicina 300mg: alternativa en pacientes alérgicos a penicilinas
- Ibuprofeno 400-600mg: analgésico/antiinflamatorio para dolor dental moderado
- Paracetamol 500-1000mg: analgésico para dolor leve, apto para niños y embarazadas
- Ketorolaco 10mg: analgésico potente para dolor post-quirúrgico
- Clorhexidina 0.12% (enjuague): antiséptico bucal post-extracción/cirugía

═══════════════════════════════════════════
HIGIENE BUCAL — CONSEJOS IMPORTANTES
═══════════════════════════════════════════
- Cepillarse al menos 2-3 veces al día (obligatorio antes de dormir)
- Usar hilo dental o cepillos interdentales al menos 1 vez al día
- Usar pasta dental con flúor (mínimo 1000 ppm)
- Evitar azúcares frecuentes entre comidas (son el principal factor de caries)
- Cambiar el cepillo cada 3 meses o cuando las cerdas estén desgastadas
- El flúor tópico en niños es fundamental para prevenir caries

═══════════════════════════════════════════
REGLAS DE ORO
═══════════════════════════════════════════
1. NUNCA des un diagnóstico definitivo — solo el odontólogo puede hacerlo tras examinar al paciente
2. Puedes mencionar medicamentos SOLO como orientación general, NO como prescripción
3. Para emergencias serias, siempre orienta a buscar atención presencial URGENTE
4. Si preguntan por el sistema de citas: los VIERNES a las 07:30 AM vía WhatsApp +51 936 205 023
5. Si el paciente menciona dificultad para hablar/respirar/tragar por hinchazón: indica ir a EMERGENCIAS YA
6. Sé conversacional, cálido y accesible — el paciente puede estar nervioso`;

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';

// ID de sesión único por visita (para agrupar conversaciones en la DB)
function getSessionId() {
  let sid = sessionStorage.getItem('denty_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem('denty_session', sid);
  }
  return sid;
}

const QUICK_SUGGESTIONS = [
  '¿Cuáles son sus servicios?',
  '¿Cómo saco una cita?',
  'Me duele una muela 😣',
  '¿Atienden niños?',
  '¿El SIS cubre todo?',
  '¿Qué es una limpieza dental?',
  '¿Cuánto tarda un empaste?',
  '¿Qué hago si se me cae un diente?',
];

// ── ChatWidget como componente separado para evitar re-renders ──
function ChatWidgetInner({ isFloating, onClose, chatMessages, isThinking, messagesEndRef, chatInput, setChatInput, sendChatMessage, formatMessage, onRate }) {
  const chatInputRef = useRef(null);

  // Auto-focus cuando se abre el chat
  useEffect(() => {
    if (isFloating) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFloating]);

  const handleKeyDown = (e) => {
    // Enter envía, Shift+Enter nueva línea
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim() && !isThinking) {
        sendChatMessage(chatInput);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendChatMessage(chatInput);
  };

  return (
    <div className={isFloating ? 'landing-chatbot-floating' : 'landing-chatbot'}>
      {isFloating && (
        <button className="landing-chatbot-close" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      )}
      <div className="landing-chatbot-header">
        <div className="landing-chatbot-avatar"><i className="fa-solid fa-tooth" /></div>
        <div className="landing-chatbot-header-text">
          <h4>Denty — Asistente Virtual</h4>
          <span>● En línea · IA Odontológica</span>
        </div>
      </div>
      <div className="landing-chatbot-messages">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`landing-chat-msg ${msg.role}`}>
            <div className="landing-chat-msg-avatar">
              {msg.role === 'assistant' ? <i className="fa-solid fa-tooth" /> : <i className="fa-solid fa-user" />}
            </div>
            <div className="landing-chat-msg-content">
              <div className={`landing-chat-msg-bubble${msg.isError ? ' error' : ''}`} dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              {/* Botones de rating — solo para mensajes del asistente (no el primero ni errores) */}
              {msg.role === 'assistant' && i > 0 && !msg.isError && msg.conversation_id && (
                <div className="landing-chat-msg-rating">
                  <button
                    className={`landing-chat-rating-btn${msg.rating === 1 ? ' active-pos' : ''}`}
                    onClick={() => onRate(i, msg.conversation_id, 1)}
                    title="Respuesta útil"
                    disabled={msg.rating !== undefined}
                  >
                    <i className="fa-solid fa-thumbs-up" />
                  </button>
                  <button
                    className={`landing-chat-rating-btn${msg.rating === -1 ? ' active-neg' : ''}`}
                    onClick={() => onRate(i, msg.conversation_id, -1)}
                    title="Respuesta no útil"
                    disabled={msg.rating !== undefined}
                  >
                    <i className="fa-solid fa-thumbs-down" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="landing-chat-msg assistant">
            <div className="landing-chat-msg-avatar"><i className="fa-solid fa-tooth" /></div>
            <div className="landing-chat-msg-content">
              <div className="landing-chat-msg-bubble">
                <div className="landing-chat-typing"><span /><span /><span /></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {chatMessages.length <= 1 && (
        <div className="landing-chat-suggestions">
          {QUICK_SUGGESTIONS.map((s, i) => (
            <button key={i} className="landing-chat-suggestion" onClick={() => sendChatMessage(s)}>{s}</button>
          ))}
        </div>
      )}
      <form className="landing-chatbot-input" onSubmit={handleSubmit}>
        <textarea
          ref={chatInputRef}
          placeholder="Escribe tu consulta... (Enter para enviar)"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          rows={1}
          style={{ resize: 'none', overflowY: 'auto', maxHeight: '100px' }}
        />
        <button type="submit" disabled={isThinking || !chatInput.trim()}>
          <i className="fa-solid fa-paper-plane" />
        </button>
      </form>
      <div className="landing-chatbot-footer-hint">
        <i className="fa-solid fa-shield-halved" /> Tus consultas son privadas · IA especializada en odontología
      </div>
    </div>
  );
}

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Chat state ──
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy **Denty**, tu asistente dental virtual del Hospital San Ramón. Puedo ayudarte con:\n\n🦷 **Consultas** sobre salud bucal\n📅 **Citas** (Viernes 7:30 AM)\n💊 **Urgencias** dentales\n✅ **SIS** — atención gratuita\n\n¿En qué puedo ayudarte hoy?',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(getSessionId());

  // ── Scroll handler for header ──
  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Scroll to top on navigation ──
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isThinking]);

  // ── Rating de respuestas ──
  const handleRate = useCallback(async (msgIndex, conversationId, rating) => {
    if (!conversationId) return;
    // Actualizar UI inmediatamente
    setChatMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, rating } : m));
    // Enviar al backend
    try {
      await fetch(`${API_BASE}/ai/rate-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, rating }),
      });
    } catch {
      // Rating no crítico — si falla no importa
    }
  }, []);

  // ── Chat send message con manejo robusto de errores ──
  const sendChatMessage = useCallback(async (messageText) => {
    const text = messageText.trim();
    if (!text || isThinking) return;

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);

    try {
      // Detectar comandos de navegación locales
      const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const adminPatterns = [
        'panel del administrador', 'panel admin', 'acceso admin',
        'iniciar sesion', 'login', 'soy doctor', 'soy odontologo',
        'acceder como doctor', 'panel de administracion', 'quiero entrar al sistema',
        'acceso administrativo', 'denti panel', 'denty panel',
      ];

      if (adminPatterns.some((p) => normalized.includes(p))) {
        setChatMessages((prev) => [...prev, {
          role: 'assistant',
          content: '¡Claro! Te redirijo al panel de administración del sistema. 🔐',
          timestamp: Date.now(),
        }]);
        setIsThinking(false);
        setTimeout(() => navigate('/login'), 800);
        return;
      }

      const allMessages = [...chatMessages, userMsg];
      const recentMessages = allMessages.slice(-10);

      const contents = [
        { role: 'user', parts: [{ text: PATIENT_SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: '¡Hola! 👋 Soy Denty, tu asistente dental virtual del Hospital San Ramón. ¿En qué puedo ayudarte?' }] },
        ...recentMessages.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      ];

      // Fetch con timeout de 30 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE}/ai/public-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, session_id: sessionId.current }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      // Intentar extraer respuesta de diferentes formatos
      let rawText = '';
      let conversationId = data?.conversation_id || null;

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawText = data.candidates[0].content.parts[0].text;
      } else if (data?.choices?.[0]?.message?.content) {
        rawText = data.choices[0].message.content;
      } else if (typeof data?.text === 'string') {
        rawText = data.text;
      }

      if (!rawText) throw new Error('Sin respuesta');

      // Parsear acciones de navegación
      const actionMatch = rawText.match(/\[ACTION:navigate:([^\]]+)\]/);
      const cleanText = rawText.replace(/\[ACTION:[^\]]+\]/g, '').trim();

      setChatMessages((prev) => [...prev, {
        role: 'assistant', content: cleanText, timestamp: Date.now(),
        conversation_id: conversationId,
      }]);

      if (actionMatch) setTimeout(() => navigate(actionMatch[1]), 800);
    } catch (err) {
      let errorContent;
      if (err.name === 'AbortError') {
        errorContent = 'La respuesta tardó demasiado. 😔 Nuestro servidor está procesando muchas consultas. Intenta de nuevo en un momento.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorContent = 'No puedo conectarme al servidor en este momento. 😔 Verifica tu conexión o contáctanos por WhatsApp al **+51 936 205 023**.';
      } else {
        errorContent = 'Lo siento, tengo un problema técnico. 😔 Intenta de nuevo o contáctanos por WhatsApp al **+51 936 205 023** para asistencia directa.';
      }
      setChatMessages((prev) => [...prev, {
        role: 'assistant', content: errorContent, timestamp: Date.now(), isError: true,
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [chatMessages, isThinking, navigate]);

  const closeMobileNav = () => { setMobileNavOpen(false); document.body.style.overflow = ''; };
  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
    document.body.style.overflow = mobileNavOpen ? '' : 'hidden';
  };

  function formatMessage(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="landing-page">
      {/* CURSOR GLOW */}
      <div className="cursor-glow" id="landing-cursor-glow" />

      {/* MOBILE NAV */}
      <nav className={`landing-mobile-nav ${mobileNavOpen ? 'active' : ''}`}>
        <NavLink to="/" onClick={closeMobileNav}>Inicio</NavLink>
        <NavLink to="/servicios" onClick={closeMobileNav}>Servicios</NavLink>
        <NavLink to="/nosotros" onClick={closeMobileNav}>Nosotros</NavLink>
        <NavLink to="/equipo" onClick={closeMobileNav}>Equipo</NavLink>
        <NavLink to="/contacto" onClick={closeMobileNav}>Contacto</NavLink>
        <button className="landing-mobile-login" onClick={() => { closeMobileNav(); setShowLoginModal(true); }}>
          <i className="fa-solid fa-user-doctor" /> Acceso Doctor
        </button>
      </nav>

      {/* HEADER */}
      <header className={`landing-header ${isHeaderScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          <NavLink className="landing-logo" to="/">
            <i className="fa-solid fa-tooth" /> Servicio de Odontología
          </NavLink>
          <ul className="landing-nav-links">
            <li><NavLink to="/" end className={isActive('/') ? 'active' : ''}>Inicio</NavLink></li>
            <li><NavLink to="/servicios" className={isActive('/servicios') ? 'active' : ''}>Servicios</NavLink></li>
            <li><NavLink to="/nosotros" className={isActive('/nosotros') ? 'active' : ''}>Nosotros</NavLink></li>
            <li><NavLink to="/equipo" className={isActive('/equipo') ? 'active' : ''}>Equipo</NavLink></li>
            <li><NavLink to="/contacto" className="landing-nav-btn">Contacto</NavLink></li>
          </ul>
          {/* Botón acceso doctor */}
          <button className="landing-doctor-login-btn" onClick={() => setShowLoginModal(true)}>
            <i className="fa-solid fa-user-doctor" /> <span className="landing-doctor-btn-label">Acceso Doctor</span>
          </button>
          <button className={`landing-hamburger ${mobileNavOpen ? 'active' : ''}`} onClick={toggleMobileNav} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <Outlet context={{ ChatWidget: ChatWidgetInner, sendChatMessage }} />

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          {/* Logo + subtítulo */}
          <NavLink className="landing-footer-logo" to="/">
            <i className="fa-solid fa-tooth" />
            <span>
              Servicio de Odontología
              <span className="footer-logo-sub">Hospital San Ramón · Chanchamayo</span>
            </span>
          </NavLink>

          {/* Redes sociales — solo TikTok, Facebook, WhatsApp */}
          <div className="landing-social-links">
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="tt">
              <i className="fa-brands fa-tiktok" />
            </a>
            <a href="https://www.facebook.com/share/1DysHEgQix/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="fb">
              <i className="fa-brands fa-facebook-f" />
            </a>
            <a href="https://wa.me/51936205023" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="wa">
              <i className="fa-brands fa-whatsapp" />
            </a>
          </div>

          {/* Copyright */}
          <div className="landing-footer-bottom">
            © 2025 <strong>Servicio de Odontología</strong><br />
            Todos los derechos reservados.
          </div>
        </div>
      </footer>

      
      {/* DENTY FLOATING CHAT FAB */}
      {!showFloatingChat && (
        <button className="landing-denty-fab" onClick={() => setShowFloatingChat(true)} aria-label="Abrir chat con Denty">
          <span className="landing-denty-fab-ring" />
          <span className="landing-denty-fab-ring landing-denty-fab-ring--2" />
          <span className="landing-denty-fab-label">Asistente IA</span>
          <span className="landing-denty-fab-inner">
            <span className="landing-denty-fab-emoji">🦷</span>
            <span className="landing-denty-fab-pulse" />
          </span>
        </button>
      )}

      {/* FLOATING CHAT OVERLAY */}
      {showFloatingChat && (
        <>
          <div className="landing-chatbot-overlay" onClick={() => setShowFloatingChat(false)} />
          <ChatWidgetInner
            isFloating
            onClose={() => setShowFloatingChat(false)}
            chatMessages={chatMessages}
            isThinking={isThinking}
            messagesEndRef={messagesEndRef}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={sendChatMessage}
            formatMessage={formatMessage}
            onRate={handleRate}
          />
        </>
      )}

      {/* ═══ MODAL: ¿Eres Doctor? Inicia Sesión ═══ */}
      {showLoginModal && (
        <div className="landing-login-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="landing-login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="landing-login-modal-close" onClick={() => setShowLoginModal(false)}>
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="landing-login-modal-icon">
              <i className="fa-solid fa-user-doctor" />
            </div>
            <h3>Acceso para Doctores</h3>
            <p>
              Si eres parte del equipo médico del Servicio de Odontología,
              inicia sesión para acceder al panel de administración del sistema.
            </p>
            <button
              className="landing-login-modal-btn"
              onClick={() => { setShowLoginModal(false); navigate('/login'); }}
            >
              <i className="fa-solid fa-right-to-bracket" /> Iniciar Sesión
            </button>
            <span className="landing-login-modal-hint">
              Solo personal autorizado del hospital
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
