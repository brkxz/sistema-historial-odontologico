// ============================================================
// ContactoPage — Página de Contacto y Redes Sociales
// ============================================================

import { useEffect } from 'react';

export default function ContactoPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.landing-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="landing-contact-section" id="contacto" style={{ paddingTop: '8rem' }}>
      <div className="landing-container">
        {/* Header */}
        <div className="landing-contact-header landing-reveal">
          <div className="landing-section-label" style={{ color: 'var(--landing-primary)' }}>
            <i className="fa-solid fa-map-pin" /> Encuéntranos
          </div>
          <h1 className="landing-section-title">Contacto &amp; Redes Sociales</h1>
          <p className="landing-section-subtitle">
            Estamos donde estás. Escríbenos, síguenos o visítanos.
          </p>
        </div>

        {/* Info Cards */}
        <div className="landing-contact-info-row landing-reveal">
          <div className="landing-contact-info-card">
            <div className="landing-contact-info-icon"><i className="fa-solid fa-location-dot" /></div>
            <div>
              <strong>Ubicación</strong>
              <span>Av. Chanchamayo, Junín, Perú</span>
            </div>
          </div>
          <div className="landing-contact-info-card">
            <div className="landing-contact-info-icon"><i className="fa-solid fa-phone" /></div>
            <div>
              <strong>Teléfono</strong>
              <a href="tel:+51936205023" className="landing-contact-phone">+51 936 205 023</a>
              <span className="landing-contact-hint">(No se permiten llamadas, solo mensajes)</span>
            </div>
          </div>
          <div className="landing-contact-info-card">
            <div className="landing-contact-info-icon"><i className="fa-solid fa-clock" /></div>
            <div>
              <strong>Horario</strong>
              <span>Viernes a las 07:30 AM</span>
              <span className="landing-contact-hint">Solo a esta hora se dan citas</span>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="landing-contact-social-title landing-reveal">Síguenos en nuestras redes</div>
        <div className="landing-contact-social-row">
          <a href="https://www.facebook.com/share/1DysHEgQix/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="landing-contact-social-btn cpb-fb landing-reveal" style={{ transitionDelay: '0s' }}>
            <div className="landing-contact-social-icon"><i className="fa-brands fa-facebook-f" /></div>
            <div><div className="landing-contact-social-name">Facebook</div><div className="landing-contact-social-sub">Visitar página</div></div>
            <i className="fa-solid fa-arrow-up-right-from-square landing-contact-social-arrow" />
          </a>
          <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" className="landing-contact-social-btn cpb-tt landing-reveal" style={{ transitionDelay: '0.1s' }}>
            <div className="landing-contact-social-icon"><i className="fa-brands fa-tiktok" /></div>
            <div><div className="landing-contact-social-name">TikTok</div><div className="landing-contact-social-sub">Ver videos</div></div>
            <i className="fa-solid fa-arrow-up-right-from-square landing-contact-social-arrow" />
          </a>
          <a href="https://wa.me/51936205023" target="_blank" rel="noopener noreferrer" className="landing-contact-social-btn cpb-wa landing-reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="landing-contact-social-icon"><i className="fa-brands fa-whatsapp" /></div>
            <div><div className="landing-contact-social-name">WhatsApp</div><div className="landing-contact-social-sub">Escribir ahora</div></div>
            <i className="fa-solid fa-arrow-up-right-from-square landing-contact-social-arrow" />
          </a>
        </div>

        {/* Map */}
        <div className="landing-contact-map-wrap landing-reveal">
          <div className="landing-contact-map-label">
            <i className="fa-solid fa-map-location-dot" /> Cómo llegar
          </div>
          <div className="landing-contact-map-frame">
            <iframe
              src="https://maps.google.com/maps?q=-11.119436,-75.354046&hl=es&z=15&output=embed"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hospital San Ramón Chanchamayo Junín Perú"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
