// ============================================================
// LandingPage — Página de Inicio (Hero + Stats)
// ============================================================

import { useEffect } from 'react';
import heroImg from '../assets/ChatGPT Image 5 mar 2026, 11_34_30.png';

export default function LandingPage() {
  // ── Preloader ──
  useEffect(() => {
    const preloader = document.getElementById('landing-preloader');
    if (preloader) {
      const timer = setTimeout(() => preloader.classList.add('loaded'), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Generate particles ──
  useEffect(() => {
    const container = document.getElementById('landing-particles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.classList.add('landing-particle');
      const size = Math.random() * 12 + 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.setProperty('--dur', (Math.random() * 6 + 6) + 's');
      p.style.setProperty('--delay', (Math.random() * 4) + 's');
      p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
      p.style.setProperty('--ty', (Math.random() * -100 - 20) + 'px');
      container.appendChild(p);
    }
  }, []);

  // ── Scroll reveal ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.landing-reveal, .landing-reveal-scale').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ── Animated counters ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.number').forEach((num) => {
            const raw = num.textContent.trim();
            const value = parseFloat(raw.replace(/[^0-9.]/g, ''));
            const suffix = raw.replace(/[0-9.,]/g, '');
            let current = 0;
            const increment = value / 60;
            const isFloat = String(value).includes('.');
            const timer = setInterval(() => {
              current += increment;
              if (current >= value) { current = value; clearInterval(timer); }
              num.textContent = (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;
            }, 25);
          });
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.3 }
    );
    document.querySelectorAll('.landing-stats-grid').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* PRELOADER */}
      <div className="preloader" id="landing-preloader">
        <div className="preloader-logo"><i className="fa-solid fa-tooth" /> Servicio de Odontología</div>
        <div className="preloader-spinner" />
      </div>

      {/* HERO */}
      <section className="landing-hero" id="inicio">
        <div className="landing-hero-bg-accent" />
        <div className="landing-hero-bg-accent-2" />
        <div className="landing-particles" id="landing-particles" />
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-content">
            <div className="landing-label-text">
              <i className="fa-solid fa-sparkles" style={{ fontSize: '0.7rem' }} />
              Atención Dental
            </div>
            <h1 className="landing-title-main">
              El arte de una<br /><em>sonrisa</em> perfecta.
            </h1>
            <p className="landing-subtitle">
              Servicio de Odontología especializada en estética dental y salud bucal integral.
              Brindamos tratamientos de primer nivel para niños y adultos en un entorno de confort absoluto.
            </p>
            <div className="landing-hero-cta">
              <a href="https://wa.me/51936205023" target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
                <i className="fa-brands fa-whatsapp" /> Agenda tu cita
              </a>
              <a href="/servicios" className="landing-btn-secondary">
                <i className="fa-solid fa-stethoscope" /> Ver Servicios
              </a>
            </div>
          </div>
          <div className="landing-hero-visual">
            <img src={heroImg} alt="Servicio de Odontología" className="landing-hero-image" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="landing-stats-section">
        <div className="landing-container landing-stats-grid landing-reveal">
          <div className="landing-stat-block">
            <span className="number">500+</span>
            <span className="label">Pacientes Satisfechos</span>
          </div>
          <div className="landing-stat-block">
            <span className="number">98%</span>
            <span className="label">Resultados Garantizados</span>
          </div>
          <div className="landing-stat-block">
            <span className="number">10+</span>
            <span className="label">Años de Experiencia</span>
          </div>
          <div className="landing-stat-block">
            <span className="number">6</span>
            <span className="label">Especialidades</span>
          </div>
        </div>
      </section>
    </>
  );
}
