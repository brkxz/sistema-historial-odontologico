// ============================================================
// PublicLayout — Layout compartido para páginas públicas
// Header, Footer, WhatsApp, Denty IA flotante, Login Doctor
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

// ── System prompt para modo PACIENTE ──
const PATIENT_SYSTEM_PROMPT = `Eres "Denty", el asistente virtual de atención al paciente del Servicio de Odontología del Hospital San Ramón, Chanchamayo, Perú. 🦷

PERSONALIDAD:
- Eres amable, cálido, profesional y empático
- Usas español peruano natural y accesible
- Emojis con moderación para dar calidez 🦷✨😊
- Nunca das diagnósticos definitivos — siempre recomiendas consulta presencial
- Tus respuestas son concisas (máximo 3 párrafos)

QUÉ PUEDES HACER:
1. Responder consultas generales sobre salud bucal y odontología
2. Explicar procedimientos dentales comunes
3. Orientar sobre síntomas dentales comunes
4. Informar sobre los servicios que ofrece el consultorio
5. Dar consejos de prevención e higiene bucal
6. Ayudar a agendar citas (orientar al paciente a comunicarse por WhatsApp)
7. Responder sobre horarios, ubicación y contacto

SERVICIOS DEL CONSULTORIO:
- Odontología General: Resinas, amalgamas, limpiezas dentales
- Endodoncia: Tratamiento de conductos
- Cirugía Oral: Extracciones simples y complejas, terceros molares
- Estética Dental: Blanqueamiento, carillas, diseño de sonrisa
- Ortodoncia: Brackets metálicos, cerámicos
- Odontopediatría: Atención especializada para niños
- Periodoncia: Tratamiento de encías, raspaje
- Prótesis Dental: Coronas, puentes, prótesis removibles

INFORMACIÓN DEL CONSULTORIO:
- Hospital San Ramón, Chanchamayo, Junín, Perú
- WhatsApp: +51 936 205 023
- Horario: Viernes a las 07:30 AM (solo a esta hora se dan citas)

EQUIPO MÉDICO:
- C.D Manuel Romani — Odontología General
- C.D Elio Támara — Odontología General
- C.D Jimy Osorio — Odontopediatría
- C.D Fernando Bustamante — Odontopediatría

REGLAS:
- NUNCA des un diagnóstico definitivo
- No recetes medicamentos específicos
- Si preguntan por emergencias dentales, orienta sobre primeros auxilios pero recomienda ir al consultorio urgente
- Sé conversacional y accesible`;

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';

const QUICK_SUGGESTIONS = [
  '¿Cuáles son sus servicios?',
  '¿Cuánto cuesta una limpieza?',
  'Me duele una muela',
  '¿Atienden niños?',
  'Quiero agendar una cita',
  '¿Cuál es el horario?',
];

// ── ChatWidget como componente separado para evitar re-renders ──
function ChatWidgetInner({ isFloating, onClose, chatMessages, isThinking, messagesEndRef, chatInput, setChatInput, sendChatMessage, formatMessage }) {
  const chatInputRef = useRef(null);

  const handleChatSubmit = (e) => { e.preventDefault(); sendChatMessage(chatInput); };

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
          <span>● En línea</span>
        </div>
      </div>
      <div className="landing-chatbot-messages">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`landing-chat-msg ${msg.role}`}>
            <div className="landing-chat-msg-avatar">
              {msg.role === 'assistant' ? <i className="fa-solid fa-tooth" /> : <i className="fa-solid fa-user" />}
            </div>
            <div className="landing-chat-msg-bubble" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
          </div>
        ))}
        {isThinking && (
          <div className="landing-chat-msg assistant">
            <div className="landing-chat-msg-avatar"><i className="fa-solid fa-tooth" /></div>
            <div className="landing-chat-msg-bubble">
              <div className="landing-chat-typing"><span /><span /><span /></div>
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
      <form className="landing-chatbot-input" onSubmit={handleChatSubmit}>
        <input ref={chatInputRef} type="text" placeholder="Escribe tu consulta..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isThinking} />
        <button type="submit" disabled={isThinking || !chatInput.trim()}><i className="fa-solid fa-paper-plane" /></button>
      </form>
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
      content: '¡Hola! 👋 Soy **Denty**, tu asistente dental virtual. Puedo ayudarte con consultas sobre salud bucal, nuestros servicios y agendar citas. ¿En qué puedo ayudarte hoy?',
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
        { role: 'model', parts: [{ text: '¡Hola! 👋 Soy Denty, tu asistente dental virtual. ¿En qué puedo ayudarte?' }] },
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
        body: JSON.stringify({ contents }),
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
      }]);

      if (actionMatch) setTimeout(() => navigate(actionMatch[1]), 800);
    } catch (err) {
      let errorContent;
      if (err.name === 'AbortError') {
        errorContent = 'La respuesta tardó demasiado. 😔 Nuestro servidor está procesando muchas consultas. Intenta de nuevo en un momento.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorContent = 'No puedo conectarme al servidor en este momento. 😔 Verifica tu conexión a internet o contáctanos por WhatsApp al +51 936 205 023.';
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
          <div className="landing-footer-logo">
            <i className="fa-solid fa-tooth" /> Servicio de Odontología
          </div>
          <div className="landing-social-links">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
            <a href="https://www.facebook.com/share/1DysHEgQix/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i className="fa-brands fa-tiktok" /></a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
            <a href="https://wa.me/51936205023" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp" /></a>
          </div>
          <div className="landing-footer-bottom">
            © 2025 Servicio de Odontología — Hospital San Ramón, Chanchamayo. Todos los derechos reservados.
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
