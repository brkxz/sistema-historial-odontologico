import { useEffect } from 'react';

const SERVICES = [
  {
    icon: 'fa-solid fa-tooth',
    title: 'Odontología Curativa',
    desc: 'Restauraciones y curaciones dentales definitivas utilizando resinas estéticas de alta calidad. Devolvemos la función y estética de tus piezas dentales.',
    tag: 'Curativa',
  },
  {
    icon: 'fa-solid fa-shield-heart',
    title: 'Odontología Preventiva',
    desc: 'Eliminación de sarro (tartrectomía), limpiezas profundas (profilaxis) y aplicación tópica de flúor para proteger el esmalte y prevenir enfermedades bucales.',
    tag: 'Preventiva',
  },
  {
    icon: 'fa-solid fa-scissors',
    title: 'Cirugía Oral',
    desc: 'Extracciones dentales simples y manejo farmacológico para controlar el dolor y las infecciones bucales. Procedimientos seguros con anestesia local.',
    tag: 'Cirugía',
  },
  {
    icon: 'fa-solid fa-child-reaching',
    title: 'Odontopediatría',
    desc: 'Tratamientos especializados en niños: terapias del nervio en dientes de leche (pulpotomías y pulpactomías) y medidas preventivas de ortopedia maxilar.',
    tag: 'Infantil',
  },
];

const STATS = [
  { value: '500+', label: 'Pacientes atendidos' },
  { value: '4', label: 'Especialidades' },
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
              <span className="svc-quote-org">Hospital San Ramón · Chanchamayo</span>
              <span className="svc-quote-sep">—</span>
              <span className="svc-quote-dept">Servicio de Odontología</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
