// ============================================================
// NosotrosPage — Página Quiénes Somos
// ============================================================

import { useEffect } from 'react';
import fotoConsultorio from '../assets/foto.png';

export default function NosotrosPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.landing-reveal, .landing-reveal-left, .landing-reveal-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Parallax about image ──
  useEffect(() => {
    const handleScroll = () => {
      const aboutImg = document.querySelector('.landing-about-img');
      if (aboutImg) {
        const rect = aboutImg.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const offset = (window.innerHeight - rect.top) * 0.04;
          aboutImg.style.transform = `translateY(${offset}px) scale(1.02)`;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* PAGE HERO + ABOUT */}
      <section className="landing-page-hero">
        <section className="landing-about-section" id="nosotros">
          <div className="landing-container landing-about-grid">
            <div className="landing-about-content landing-reveal-left">
              <div className="landing-section-label">
                <i className="fa-solid fa-heart-pulse" /> Quiénes Somos
              </div>
              <h2 className="landing-section-title">Más que odontología, diseñamos bienestar</h2>
              <p className="landing-about-text">
                En Servicio de Odontología, nos especializamos en cuidar de tu salud bucal para
                niños y adultos. Nuestro equipo profesional utiliza tecnología avanzada para brindarte
                diagnósticos precisos y tratamientos eficaces en un ambiente cómodo y seguro.
              </p>
              <p className="landing-about-text">
                Nos preocupamos por tu sonrisa y la de tu familia, por eso ofrecemos controles
                periódicos y asesoramiento profesional para prevenir problemas dentales. Ven y
                descubre un servicio personalizado que hará la diferencia en tu bienestar.
              </p>
            </div>
            <div className="landing-about-img-wrap landing-reveal-right">
              <img src={fotoConsultorio} alt="Consultorio Dental Premium" className="landing-about-img" />
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
