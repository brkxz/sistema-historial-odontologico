import { useEffect } from 'react';

const TEAM = [
  {
    initials: 'MR',
    name: 'C.D. Manuel Romani',
    specialty: 'Odontología General',
    color: '#4FC3F7',
    bg: 'rgba(79, 195, 247, 0.12)',
    detail: 'Más de 10 años de experiencia en diagnóstico y tratamiento preventivo.',
  },
  {
    initials: 'ET',
    name: 'C.D. Elio Támara',
    specialty: 'Odontología General',
    color: '#81C784',
    bg: 'rgba(129, 199, 132, 0.12)',
    detail: 'Especialista en odontología restauradora y tratamientos de caries complejos.',
  },
  {
    initials: 'JO',
    name: 'C.D. Jimy Osorio',
    specialty: 'Odontopediatría',
    color: '#FFB74D',
    bg: 'rgba(255, 183, 77, 0.12)',
    detail: 'Experto en manejo de conducta infantil y atención odontológica pediátrica.',
  },
  {
    initials: 'FB',
    name: 'C.D. Fernando Bustamante',
    specialty: 'Odontopediatría',
    color: '#CE93D8',
    bg: 'rgba(206, 147, 216, 0.12)',
    detail: 'Dedicado al desarrollo dental infantil y la prevención temprana.',
  },
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
                {/* Avatar con iniciales */}
                <div
                  className="landing-member-avatar"
                  style={{
                    background: member.bg,
                    border: `2px solid ${member.color}55`,
                    color: member.color,
                  }}
                >
                  {member.initials}
                </div>
                <h3>{member.name}</h3>
                <span
                  style={{
                    color: member.color,
                    background: `${member.color}18`,
                  }}
                >
                  {member.specialty}
                </span>
                <p className="landing-member-detail">{member.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 0', textAlign: 'center' }} className="landing-reveal">
        <div className="landing-container">
          <p className="landing-section-subtitle" style={{ marginBottom: '24px' }}>
            ¿Quieres agendar una cita con uno de nuestros especialistas?
          </p>
          <a
            href="https://wa.me/51936205023"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-btn-primary"
          >
            <i className="fa-brands fa-whatsapp" /> Contactar por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
