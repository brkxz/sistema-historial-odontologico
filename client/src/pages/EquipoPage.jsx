import { useEffect } from 'react';

const TEAM_PHOTOS = [
  { src: '/equipo/manuel-romani.jpg',  alt: 'C.D. Manuel Jesus Romani Maldonado' },
  { src: '/equipo/elio-tamara.jpg',    alt: 'C.D. Elio Elvis Támara Trinidad' },
  { src: '/equipo/jimy-osorio.jpg',    alt: 'C.D. Jimy Aldo Osorio Rosales' },
  { src: '/equipo/yolanda-aliaga.jpg', alt: 'C.D. Yolanda Guadalupe Aliaga Kriete' },
];

export default function EquipoPage() {
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
            <i className="fa-solid fa-user-doctor" /> Nuestro Equipo
          </div>
          <h1 className="landing-title-main">Profesionales Comprometidos</h1>
          <p className="landing-subtitle" style={{ margin: '0 auto' }}>
            Un equipo titulado y experimentado, dedicado a brindarte la mejor atención odontológica en Chanchamayo.
          </p>
        </div>
      </section>

      {/* GALERÍA DE FOTOS */}
      <section style={{ padding: '40px 0 72px' }}>
        <div className="landing-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            justifyItems: 'center',
          }}>
            {TEAM_PHOTOS.map((p, i) => (
              <div
                key={i}
                className="landing-reveal-scale"
                style={{
                  transitionDelay: `${i * 0.1}s`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  maxWidth: '320px',
                  width: '100%',
                }}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section style={{ padding: '0 0 72px' }} className="landing-reveal">
        <div className="landing-container">
          <div className="equipo-values-grid">
            <div className="equipo-value-item">
              <span className="equipo-value-num">01</span>
              <h4>Compromiso clínico</h4>
              <p>Cada diagnóstico se basa en evidencia y protocolos actualizados. No improvisamos con tu salud.</p>
            </div>
            <div className="equipo-value-item">
              <span className="equipo-value-num">02</span>
              <h4>Trato humano</h4>
              <p>Entendemos que una visita dental puede generar ansiedad. Trabajamos para que tu experiencia sea cómoda.</p>
            </div>
            <div className="equipo-value-item">
              <span className="equipo-value-num">03</span>
              <h4>Formación continua</h4>
              <p>Nuestro equipo se actualiza constantemente en técnicas y materiales de última generación.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function EquipoPage() {
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
            <i className="fa-solid fa-user-doctor" /> Nuestro Equipo
          </div>
          <h1 className="landing-title-main">Profesionales Comprometidos</h1>
          <p className="landing-subtitle" style={{ margin: '0 auto' }}>
            Un equipo titulado y experimentado, dedicado a brindarte la mejor atención odontológica en Chanchamayo.
          </p>
        </div>
      </section>

      {/* CARDS */}
      <section className="landing-team-section" id="equipo" style={{ paddingTop: '40px' }}>
        <div className="landing-container">
          <div className="landing-team-grid">
            {TEAM.map((member, i) => (
              <div
                key={i}
                className="landing-team-member landing-reveal-scale"
                style={{
                  transitionDelay: `${i * 0.1}s`,
                  borderTop: `3px solid ${member.color}`,
                }}
              >
                {/* Avatar: foto real o iniciales */}
                {member.photo ? (
                  <div
                    className="landing-member-avatar"
                    style={{
                      background: 'transparent',
                      border: `2px solid ${member.color}55`,
                      padding: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={member.photo}
                      alt={member.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                    />
                  </div>
                ) : (
                  <div
                    className="landing-member-avatar"
                    style={{
                      background: `${member.color}18`,
                      border: `2px solid ${member.color}55`,
                      color: member.color,
                    }}
                  >
                    {member.initials}
                  </div>
                )}
                <h3>{member.name}</h3>
                <span
                  className="landing-member-badge"
                  style={{
                    color: member.color,
                    background: `${member.color}18`,
                  }}
                >
                  {member.specialty}
                </span>
                {member.cop && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    <i className="fa-solid fa-id-badge" style={{ marginRight: '4px' }} />
                    COP Nro: {member.cop}
                  </p>
                )}
                <p className="landing-member-detail">{member.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FRASE CIERRE */}
      <section style={{ padding: '72px 0' }} className="landing-reveal">
        <div className="landing-container">
          <div className="equipo-values-grid">
            <div className="equipo-value-item">
              <span className="equipo-value-num">01</span>
              <h4>Compromiso clínico</h4>
              <p>Cada diagnóstico se basa en evidencia y protocolos actualizados. No improvisamos con tu salud.</p>
            </div>
            <div className="equipo-value-item">
              <span className="equipo-value-num">02</span>
              <h4>Trato humano</h4>
              <p>Entendemos que una visita dental puede generar ansiedad. Trabajamos para que tu experiencia sea cómoda.</p>
            </div>
            <div className="equipo-value-item">
              <span className="equipo-value-num">03</span>
              <h4>Formación continua</h4>
              <p>Nuestro equipo se actualiza constantemente en técnicas y materiales de última generación.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
