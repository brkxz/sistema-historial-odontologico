import { useEffect } from 'react';

const SERVICES = [
  {
    icon: 'fa-solid fa-teeth-open',
    title: 'Odontología General',
    desc: 'Diagnóstico, profilaxis y tratamiento de caries con equipamiento de alta precisión. Cuidado preventivo para preservar tus piezas dentales a largo plazo.',
    tag: 'Preventivo',
  },
  {
    icon: 'fa-solid fa-child-reaching',
    title: 'Odontopediatría',
    desc: 'Atención especializada para niños con enfoque en psicología infantil. Creamos experiencias positivas para construir hábitos saludables desde temprana edad.',
    tag: 'Infantil',
  },
  {
    icon: 'fa-solid fa-wand-magic-sparkles',
    title: 'Estética Dental',
    desc: 'Blanqueamiento dental, carillas de porcelana y diseño de sonrisa personalizado. Transformamos tu sonrisa con tecnología de última generación.',
    tag: 'Estético',
  },
  {
    icon: 'fa-solid fa-microscope',
    title: 'Endodoncia',
    desc: 'Tratamiento de conductos con anestesia local efectiva y mínima invasión. Preservamos tus piezas dentales naturales con el máximo confort.',
    tag: 'Especializado',
  },
  {
    icon: 'fa-solid fa-align-center',
    title: 'Ortodoncia',
    desc: 'Brackets metálicos y cerámicos de alta calidad para la alineación ideal de tu dentadura. Mejoramos tu mordida y estética facial de forma gradual.',
    tag: 'Corrección',
  },
  {
    icon: 'fa-solid fa-scissors',
    title: 'Cirugía Oral',
    desc: 'Extracciones simples y complejas, incluyendo terceros molares. Procedimientos seguros con anestesia local y protocolos postoperatorios precisos.',
    tag: 'Cirugía',
  },
];

const STATS = [
  { value: '5+', label: 'Años de experiencia' },
  { value: '2,000+', label: 'Pacientes atendidos' },
  { value: '6', label: 'Especialidades' },
  { value: '98%', label: 'Satisfacción' },
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
            Atención odontológica integral con tecnología de vanguardia y un equipo comprometido con tu salud bucal.
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

      {/* CTA */}
      <section className="landing-cta-section landing-reveal" style={{ padding: '80px 0' }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <div className="landing-label-text" style={{ justifyContent: 'center' }}>
            <i className="fa-brands fa-whatsapp" /> Agenda tu cita
          </div>
          <h2 className="landing-section-title" style={{ marginTop: '12px', marginBottom: '16px' }}>
            ¿Listo para cuidar tu sonrisa?
          </h2>
          <p className="landing-section-subtitle" style={{ marginBottom: '32px' }}>
            Contáctanos y agenda tu consulta sin costo de valoración inicial.
          </p>
          <a
            href="https://wa.me/51936205023"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn-primary"
          >
            <i className="fa-brands fa-whatsapp" /> Escribir por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
