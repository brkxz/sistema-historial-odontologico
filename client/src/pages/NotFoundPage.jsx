import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">
          <AlertTriangle size={48} />
        </div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Página no encontrada</h2>
        <p className="not-found-text">
          La página que buscas no existe o ha sido movida.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ gap: '8px' }}>
          <Home size={18} />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
