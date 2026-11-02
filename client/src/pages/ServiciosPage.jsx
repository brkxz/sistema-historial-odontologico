import { useEffect } from 'react';

const SERVICES = [
  {
    icon: 'fa-solid fa-shield-heart',
    title: 'Tratamientos Preventivos',
    desc: 'Eliminación de sarro (tartrectomía), limpiezas profundas (profilaxis), aplicación tópica de flúor y sellantes para proteger el esmalte y prevenir enfermedades bucales antes de que aparezcan.',
    tag: 'Preventivo',
  },
  {
    icon: 'fa-solid fa-tooth',
    title: 'Tratamientos Recuperativos',
    desc: 'Restauraciones y curaciones con resinas estéticas, extracciones dentales, tratamientos del nervio y manejo del dolor. Devolvemos la función y salud de tus piezas dentales.',
    tag: 'Recuperativo',
  },
  {
    icon: 'fa-solid fa-child-reaching',
    title: 'Odontopediatría',
    desc: 'Tratamientos especializados en niños: terapias del nervio en dientes de leche (pulpotomías y pulpectomías), medidas preventivas y orientación en hábitos de higiene bucal desde temprana edad.',
    tag: 'Infantil',
  },
  {
    icon: 'fa-solid fa-notes-medical',
    title: 'Consulta y Diagnóstico',
    desc: 'Evaluación odontológica completa, diagnóstico oportuno y plan de tratamiento personalizado. Atención integral para toda la familia con cobertura SIS sin costo.',
    tag: 'Consulta',
  },
];

const STATS = [
  { value: '500+', label: 'Pacientes atendidos' },
  { value: '03',   label: 'Consultorios Equipados' },
  { value: '100%', label: 'Gratuito con SIS' },
  { value: 'CSSR', label: 'Red Integrada de Salud' },
];

export default function ServiciosPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.landing-reveal, .landing-reveal-scale').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="landing-page-hero" style={{ paddingBottom: '24px' }}>
        <div className="landing-container">
          <div className="landing-label-text">
            <i className="fa-solid fa-stethoscope" /> Tratamientos
          </div>
          <h1 className="landing-title-main">Nuestros Servicios</h1>
          <p className="landing-subtitle" style={{ margin: '0 auto 40px' }}>
            Atención odontológica integral y gratuita para usuarios con SIS activo. Consultas, curaciones, limpiezas, extracciones y más — sin costo para ti.
          </p>

          {/* Stats strip */}
          <div className="svc-stats-strip landing-reveal">
            {STATS.map((s, i) => (
              <div key={i} className="svc-stat-item">
                <span className="svc-stat-value">{s.value}</span>
                <span className="svc-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GRID DE SERVICIOS */}
      <section className="landing-services-section" id="servicios" style={{ paddingTop: '40px' }}>
        <div className="landing-container">
          <div className="landing-services-grid">
            {SERVICES.map((svc, i) => (
              <div
                key={i}
                className="landing-service-card landing-reveal-scale"
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <div className="svc-card-top">
                  <div className="landing-service-icon">
                    <i className={svc.icon} />
                  </div>
                  <span className="svc-card-tag">{svc.tag}</span>
                </div>
                <h3>{svc.title}</h3>
                <p>{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONSULTORIOS */}
      <section className="landing-services-section landing-reveal" style={{ paddingTop: '20px', paddingBottom: '40px', background: 'var(--bg-secondary, #f8fafc)' }}>
        <div className="landing-container">
          <div className="landing-label-text" style={{ marginBottom: '10px' }}>
            <i className="fa-solid fa-door-open" /> Infraestructura
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary, #0f172a)' }}>
            Nuestros Consultorios
          </h2>
          <p style={{ color: 'var(--text-secondary, #64748b)', marginBottom: '28px', maxWidth: '520px' }}>
            Contamos con 03 consultorios equipados para brindarte una atención segura y de calidad.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

            {/* Consultorio 1 */}
            <div className="landing-service-card landing-reveal-scale" style={{ transitionDelay: '0s' }}>
              <div className="svc-card-top">
                <div className="landing-service-icon">
                  <i className="fa-solid fa-tooth" />
                </div>
                <span className="svc-card-tag">Consultorio 01</span>
              </div>
              <h3>Odontología General</h3>
              <p>Atención a adultos: curaciones, limpiezas, extracciones y tratamientos recuperativos con equipamiento moderno.</p>
            </div>

            {/* Consultorio 2 */}
            <div className="landing-service-card landing-reveal-scale" style={{ transitionDelay: '0.07s' }}>
              <div className="svc-card-top">
                <div className="landing-service-icon">
                  <i className="fa-solid fa-tooth" />
                </div>
                <span className="svc-card-tag">Consultorio 02</span>
              </div>
              <h3>Odontología General</h3>
              <p>Segundo consultorio de atención general para reducir tiempos de espera y ampliar la cobertura diaria de pacientes.</p>
            </div>

            {/* Consultorio 3 */}
            <div className="landing-service-card landing-reveal-scale" style={{ transitionDelay: '0.14s' }}>
              <div className="svc-card-top">
                <div className="landing-service-icon">
                  <i className="fa-solid fa-child-reaching" />
                </div>
                <span className="svc-card-tag">Consultorio 03</span>
              </div>
              <h3>Odontopediatría</h3>
              <p>Consultorio especializado en la atención de niños y adolescentes, con ambiente adecuado para una experiencia tranquila y segura.</p>
            </div>

          </div>
        </div>
      </section>

      {/* COBERTURA SIS */}
      <section className="svc-sis-section landing-reveal">
        <div className="landing-container">
          <div className="svc-sis-inner">
            <div className="svc-sis-badge">
              <i className="fa-solid fa-shield-heart" />
              <span>SIS</span>
            </div>
            <div className="svc-sis-body">
              <h3 className="svc-sis-title">Cobertura del Seguro Integral de Salud</h3>
              <p className="svc-sis-desc">
                Si cuentas con tu <strong>SIS activo y adscrito</strong> a esta red de salud, todos los servicios son
                completamente <strong>gratuitos</strong>: consultas, evaluaciones, limpiezas, curaciones, extracciones
                y medicamentos indicados por el odontólogo.
              </p>
            </div>
            <div className="svc-sis-tag">100% gratuito</div>
          </div>
        </div>
      </section>

      {/* FRASE CIERRE */}
      <section className="svc-quote-section landing-reveal">
        <div className="landing-container">
          <div className="svc-quote-inner">
            <div className="svc-quote-line" />
            <blockquote className="svc-quote-text">
              "La salud bucal es el reflejo de tu bienestar general.<br />
              <em>Cada tratamiento que ofrecemos parte de ese principio.</em>"
            </blockquote>
            <div className="svc-quote-meta">
              <span className="svc-quote-org">Centro de Salud de San Ramón · Chanchamayo</span>
              <span className="svc-quote-sep">—</span>
              <span className="svc-quote-dept">Servicio de Odontología</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
