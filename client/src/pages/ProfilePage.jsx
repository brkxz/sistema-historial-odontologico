import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { User, Lock, Save, Mail, Stethoscope, Shield, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const toast = useToast();

  // Estado del formulario de perfil
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    specialty: user?.specialty || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Estado del formulario de contraseña
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.full_name.trim()) {
      toast.warning('El nombre completo es requerido');
      return;
    }

    setSavingProfile(true);
    try {
      const data = await authService.updateProfile(profile);
      // Actualizar datos en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { current_password, new_password, confirm_password } = passwords;

    if (!current_password || !new_password || !confirm_password) {
      toast.warning('Complete todos los campos de contraseña');
      return;
    }

    if (new_password.length < 6) {
      toast.warning('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (new_password !== confirm_password) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword(current_password, new_password);
      toast.success('Contraseña actualizada correctamente');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Administra tu información personal y seguridad</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="profile-info-card card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
          <div className="profile-avatar">
            {getInitials(user?.full_name)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
              {user?.full_name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              <span className={`badge ${user?.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                {user?.role === 'admin' ? (
                  <><ShieldCheck size={12} /> Administrador</>
                ) : (
                  <><Shield size={12} /> Odontólogo</>
                )}
              </span>
              {user?.specialty && (
                <span style={{ color: 'var(--text-muted)' }}>• {user.specialty}</span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
              Usuario: @{user?.username}
            </p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Formulario de Perfil */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px', fontSize: 'var(--font-size-lg)' }}>
            <User size={20} color="var(--primary)" />
            Información Personal
          </h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                className="form-input"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">
                <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Correo Electrónico
              </label>
              <input
                type="email"
                className="form-input"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">
                <Stethoscope size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Especialidad
              </label>
              <input
                type="text"
                className="form-input"
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                placeholder="Ej: Odontología General, Ortodoncia..."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ width: '100%' }}>
              {savingProfile ? (
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                <><Save size={16} /> Guardar Cambios</>
              )}
            </button>
          </form>
        </div>

        {/* Formulario de Contraseña */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px', fontSize: 'var(--font-size-lg)' }}>
            <Lock size={20} color="var(--warning)" />
            Cambiar Contraseña
          </h3>
          {user?.auth_provider && user.auth_provider !== 'local' ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <Lock size={32} color="var(--text-muted)" />
              <p style={{ color: 'var(--text-secondary)', margin: '12px 0 0' }}>
                Tu cuenta usa inicio de sesión con Google. No puedes cambiar la contraseña aquí.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Contraseña Actual *</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwords.current_password}
                  onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Nueva Contraseña *</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwords.confirm_password}
                  onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-warning" disabled={savingPassword} style={{ width: '100%' }}>
                {savingPassword ? (
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <><Lock size={16} /> Cambiar Contraseña</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
