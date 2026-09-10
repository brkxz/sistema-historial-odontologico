import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger', onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const variantClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {variant === 'danger' && <AlertTriangle size={20} color="var(--error)" />}
            {title}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCancel} disabled={loading}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {message}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className={`btn ${variantClass}`} onClick={handleConfirm} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
