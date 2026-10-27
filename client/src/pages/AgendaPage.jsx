// ============================================================
// AgendaPage — Diseño con countdown en tiempo real
// ============================================================

import { useEffect, useState } from 'react';
import heroImg    from '../assets/agenda-hero.jpg';
import icChat     from '../assets/ic-chat.jpg';
import icRobot    from '../assets/ic-robot.jpg';
import icCalendar from '../assets/ic-calendar.jpg';
import icTooth    from '../assets/ic-tooth.jpg';
import icLight    from '../assets/ic-lightning.jpg';
import icHospital from '../assets/ic-hospital.jpg';
import '../styles/agenda.css';

const WHATSAPP_URL = 'https://wa.me/51936205023?text=CITA';

// ── Lógica: tiempo hasta el próximo viernes a las 7:30 AM (hora Perú UTC-5) ──
function getCountdownState() {
  const now = new Date();
  // Ajuste a hora Perú (UTC-5)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const peru = new Date(utc + -5 * 60 * 60000);

  const dow = peru.getDay(); // 0=Dom ... 5=Vie
  const minOfDay = peru.getHours() * 60 + peru.getMinutes();
  const OPEN  = 7 * 60 + 30;  // 7:30 AM
  const CLOSE = 13 * 60;      // 1:00 PM (estimado fin de cupos)

  // ── Viernes en horario activo ──
  if (dow === 5 && minOfDay >= OPEN && minOfDay < CLOSE) {
    return { status: 'open' };
  }

  // ── Calcular próximo viernes 7:30 ──
  let daysUntil = (5 - dow + 7) % 7;
  if (daysUntil === 0) daysUntil = 7; // ya pasó el viernes de hoy

  const target = new Date(peru);
  target.setDate(peru.getDate() + daysUntil);
  target.setHours(7, 30, 0, 0);

  const diff = target - peru;
  return {
    status: 'waiting',
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

// ── Componente Countdown ──
function Countdown() {
  const [state, setState] = useState(() => getCountdownState());

  useEffect(() => {
    const t = setInterval(() => setState(getCountdownState()), 1000);
    return () => clearInterval(t);
  }, []);

  if (state.status === 'open') {
    return (
      <div className="ag-cd-open">
        <span className="ag-cd-open-dot" />
        <span className="ag-cd-open-text">¡Las citas están abiertas ahora!</span>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="ag-cd-open-btn">
          Enviar "CITA" <i className="fa-solid fa-arrow-right" />
        </a>
      </div>
    );
  }

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="ag-cd-wrap">
      <p className="ag-cd-label">Próximas citas abren en</p>
      <div className="ag-cd-digits">
        <div className="ag-cd-unit">
          <span className="ag-cd-num">{pad(state.days)}</span>
          <span className="ag-cd-sub">días</span>
        </div>
        <span className="ag-cd-sep">:</span>
        <div className="ag-cd-unit">
          <span className="ag-cd-num">{pad(state.hours)}</span>
          <span className="ag-cd-sub">horas</span>
        </div>
        <span className="ag-cd-sep">:</span>
        <div className="ag-cd-unit">
          <span className="ag-cd-num">{pad(state.minutes)}</span>
          <span className="ag-cd-sub">min</span>
        </div>
        <span className="ag-cd-sep">:</span>
        <div className="ag-cd-unit">
          <span className="ag-cd-num ag-cd-num--sec">{pad(state.seconds)}</span>
          <span className="ag-cd-sub">seg</span>
        </div>
      </div>
      <p className="ag-cd-footer-note">Viernes · 7:30 a.m. · Hasta agotar cupos</p>
    </div>
  );
}

// ── Contador animado para stats ──
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}{suffix}</span>;
}

const STEPS = [
  { num: '01', img: icChat,     color: '#25D366', bg: 'rgba(37,211,102,0.1)',
    title: 'Escríbenos "CITA"',
    desc: 'Envía esa palabra por WhatsApp al número del consultorio el día viernes.' },
  { num: '02', img: icRobot,    color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',
    title: 'El chatbot responde',
    desc: 'Solo activo los viernes mientras haya cupos. Te guiará de inmediato.' },
  { num: '03', img: icCalendar, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',
    title: 'Viernes · 7:30 a.m.',
    desc: 'Ese es el único día y hora en que se asignan citas.' },
  { num: '04', img: icTooth,    color: '#10B981', bg: 'rgba(16,185,129,0.1)',
    title: '¡Preséntate puntual!',
    desc: 'El día de tu cita llega a tiempo y disfruta tu atención.' },
];

export default function AgendaPage() {
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('ag-visible'); ro.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.ag-reveal').forEach((el) => ro.observe(el));

    const statsEl = document.querySelector('.ag-stats-row');
    if (statsEl) {
      const so = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setStatsVisible(true); so.disconnect(); }
      }, { threshold: 0.3 });
      so.observe(statsEl);
    }
    return () => ro.disconnect();
  }, []);

  return (
    <div className="ag-page">

      {/* ── HERO ── */}
      <section className="ag-hero-split">

        {/* Izquierda */}
        <div className="ag-hero-left">
          <div className="ag-badge-pill">
            <span className="ag-badge-dot" />
            Citas · Solo los viernes
          </div>

          <h1 className="ag-hero-h1">
            Agenda tu cita<br />
            <span className="ag-hero-h1-accent">dental en minutos</span>
          </h1>

          {/* Countdown en tiempo real */}
          <Countdown />

          <p className="ag-hero-desc">
            Sin llamadas. Envía <strong>"CITA"</strong> por WhatsApp el día viernes
            y el chatbot te asigna tu turno <strong>mientras queden cupos</strong>.
          </p>

          <div className="ag-hero-phone-card">
            <div className="ag-hero-phone-icon-wrap">
              <i className="fa-brands fa-whatsapp" />
            </div>
            <div>
              <div className="ag-hero-phone-label">WhatsApp del consultorio</div>
              <div className="ag-hero-phone-num">+51 936 205 023</div>
            </div>
          </div>

          <div className="ag-hero-cta-row">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="ag-btn-wa" id="btn-agenda-hero">
              <i className="fa-brands fa-whatsapp" />
              Enviar "CITA" ahora
            </a>
            <div className="ag-hero-hint">
              <i className="fa-solid fa-shield-halved" />
              Gratuito · CSSR
            </div>
          </div>
        </div>

        {/* Derecha */}
        <div className="ag-hero-right">
          <div className="ag-hero-img-wrap">
            <img src={heroImg} alt="Agenda tu cita dental por WhatsApp" className="ag-hero-img" />
            <div className="ag-float-badge ag-float-badge--tl">
              <i className="fa-solid fa-calendar-check" />
              <span>¡Es muy fácil!</span>
            </div>
            <div className="ag-float-badge ag-float-badge--br">
              <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} />
              <span>Solo envía "CITA"</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="ag-stats-row">
        <div className="ag-stat">
          <strong>{statsVisible ? <Counter target={500} suffix="+" /> : '0+'}</strong>
          <span>Pacientes atendidos</span>
        </div>
        <div className="ag-stat-divider" />
        <div className="ag-stat">
          <strong>{statsVisible ? <Counter target={7} suffix=" años" /> : '0 años'}</strong>
          <span>De servicio continuo</span>
        </div>
        <div className="ag-stat-divider" />
        <div className="ag-stat">
          <strong>100%</strong>
          <span>Gratuito · CSSR</span>
        </div>
        <div className="ag-stat-divider" />
        <div className="ag-stat">
          <strong>Viernes</strong>
          <span>7:30 a.m. · Citas</span>
        </div>
      </div>

      {/* ── PASOS ── */}
      <section className="ag-steps-section">
        <div className="ag-container">
          <div className="ag-section-header ag-reveal">
            <div className="ag-section-tag">Proceso</div>
            <h2 className="ag-section-h2">¿Cómo funciona?</h2>
            <p className="ag-section-p">4 pasos simples, todo desde tu celular</p>
          </div>
          <div className="ag-timeline">
            {STEPS.map((s, i) => (
              <div key={i} className="ag-timeline-step ag-reveal"
                style={{ '--sc': s.color, '--sb': s.bg }}>
                <div className="ag-ts-top">
                  <div className="ag-ts-icon">
                    <img src={s.img} alt={s.title} />
                  </div>
                  <div className="ag-ts-num">{s.num}</div>
                </div>
                <div className="ag-ts-body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="ag-steps-cta ag-reveal">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="ag-btn-wa ag-btn-wa--lg" id="btn-agenda-steps">
              <i className="fa-brands fa-whatsapp" />
              Comenzar · Enviar "CITA"
            </a>
            <p className="ag-steps-cta-note">
              <i className="fa-solid fa-circle-info" />
              &nbsp;Chatbot activo <strong>solo los viernes</strong> hasta agotar cupos
            </p>
          </div>
        </div>
      </section>

      {/* ── URGENCIAS ── */}
      <section className="ag-urgency-section">
        <div className="ag-container">
          <div className="ag-urgency-glass ag-reveal">
            <div className="ag-ug-left">
              <div className="ag-ug-emoji">
                <img src={icLight} alt="Urgencias" />
              </div>
              <div>
                <h2 className="ag-ug-title">Cupos de Urgencia</h2>
                <p className="ag-ug-sub">Para quienes no pueden esperar</p>
              </div>
            </div>
            <div className="ag-ug-items">
              <div className="ag-ug-item">
                <div className="ag-ug-bullet"><img src={icHospital} alt="Consultorio" /></div>
                <p><strong>Todos los días a las 7:00 a.m.</strong> de forma presencial en el consultorio.</p>
              </div>
              <div className="ag-ug-item">
                <div className="ag-ug-bullet"><i className="fa-solid fa-user-group" /></div>
                <p>Solo para las <strong>2 primeras personas en llegar.</strong></p>
              </div>
              <div className="ag-ug-item">
                <div className="ag-ug-bullet"><i className="fa-solid fa-clipboard-list" /></div>
                <p>Se atienden <strong>después de todos los pacientes citados.</strong></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTAS ── */}
      <section className="ag-notes-section">
        <div className="ag-container">
          <div className="ag-section-header ag-reveal">
            <div className="ag-section-tag">Importante</div>
            <h2 className="ag-section-h2">Recuerda siempre</h2>
          </div>
          <div className="ag-notes-grid">
            <div className="ag-note ag-reveal" style={{ '--nc': '#EF4444', '--nb': 'rgba(239,68,68,0.08)' }}>
              <div className="ag-note-icon-wrap"><i className="fa-solid fa-phone-slash" /></div>
              <h4>Sin llamadas</h4>
              <p>Solo comunicación por <strong>WhatsApp.</strong></p>
            </div>
            <div className="ag-note ag-reveal" style={{ '--nc': '#F59E0B', '--nb': 'rgba(245,158,11,0.08)' }}>
              <div className="ag-note-icon-wrap"><i className="fa-regular fa-calendar" /></div>
              <h4>Solo los viernes</h4>
              <p>Citas únicamente los <strong>viernes a las 7:30 a.m.</strong></p>
            </div>
            <div className="ag-note ag-reveal" style={{ '--nc': '#3B82F6', '--nb': 'rgba(59,130,246,0.08)' }}>
              <div className="ag-note-icon-wrap"><i className="fa-solid fa-robot" /></div>
              <h4>Chatbot los viernes</h4>
              <p>El asistente responde <strong>solo los viernes</strong> mientras haya cupos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="ag-footer-cta">
        <div className="ag-footer-glow" />
        <div className="ag-container ag-footer-inner">
          <div className="ag-footer-tooth">🦷</div>
          <h2>¿Listo para sonreír mejor?</h2>
          <p>Envía <strong>"CITA"</strong> los viernes y el chatbot hará el resto.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="ag-btn-wa ag-btn-wa--xl" id="btn-agenda-footer">
            <i className="fa-brands fa-whatsapp" />
            Agendar · 936 205 023
          </a>
          <p className="ag-footer-legal">Centro de Salud San Ramón · CSSR</p>
        </div>
      </section>

    </div>
  );
}
