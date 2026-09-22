// ============================================================
// ErrorBoundary - Captura errores de React en render/hooks
// Muestra mensaje amigable en vez de pantalla blanca
// ============================================================

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error capturado:', error);
    console.error('[ErrorBoundary] Info:', info?.componentStack);
  }

  handleReload() {
    // Limpiar estado y recargar la página
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          background: 'var(--bg-dark, #F0F4F8)',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card, #fff)',
            borderRadius: '16px',
            padding: '40px 32px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid var(--border, #E2E8F0)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🦷</div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary, #0F172A)',
              marginBottom: '8px',
            }}>
              Algo salió mal
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #475569)',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}>
              Ocurrió un error inesperado. El equipo ha sido notificado.
              Intenta volver al inicio.
            </p>
            <button
              onClick={() => this.handleReload()}
              style={{
                background: 'var(--primary, #0369A1)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Volver al inicio
            </button>
            {import.meta.env.DEV && (
              <details style={{ marginTop: '16px', textAlign: 'left' }}>
                <summary style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: 'var(--error, #DC2626)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  background: 'var(--error-bg)',
                  padding: '8px',
                  borderRadius: '6px',
                }}>
                  {this.state.error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
