import { useEffect, useRef } from 'react';

const TEAM_PHOTOS = [
  { src: '/equipo/manuel-romani.jpg',  alt: 'C.D. Manuel Jesus Romani Maldonado' },
  { src: '/equipo/elio-tamara.jpg',    alt: 'C.D. Elio Elvis Támara Trinidad' },
  { src: '/equipo/jimy-osorio.jpg',    alt: 'C.D. Jimy Aldo Osorio Rosales' },
  { src: '/equipo/yolanda-aliaga.jpg', alt: 'C.D. Yolanda Guadalupe Aliaga Kriete' },
];

export default function EquipoPage() {
  useEffect(() => {
    // Animación reveal al hacer scroll
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

    // Efecto 3D tilt en las tarjetas
    const cards = document.querySelectorAll('.equipo-photo-card');
    cards.forEach((card) => {
      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const cx = rect.width  / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -14;   // inclinación vertical
        const rotateY = ((x - cx) / cx) *  14;   // inclinación horizontal
        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.06)`;
        card.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 40px rgba(3,105,161,0.25)`;
      };
      const handleLeave = () => {
        card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
      };
      const handleClick = () => {
        card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(0.96)';
        setTimeout(() => {
          card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
        }, 150);
      };
      card.addEventListener('mousemove',  handleMove);
      card.addEventListener('touchmove',  handleMove, { passive: true });
      card.addEventListener('mouseleave', handleLeave);
      card.addEventListener('touchend',   handleLeave);
      card.addEventListener('click',      handleClick);
    });

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 220px))',
            gap: '20px',
            justifyContent: 'center',
          }}>
            {TEAM_PHOTOS.map((p, i) => (
              <div
                key={i}
                className="landing-reveal-scale"
                style={{ transitionDelay: `${i * 0.1}s`, width: '100%' }}
              >
                <div
                  className="equipo-photo-card"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    width: '100%',
                  }}
                >
                  <img
                    src={p.src}
                    alt={p.alt}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
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

