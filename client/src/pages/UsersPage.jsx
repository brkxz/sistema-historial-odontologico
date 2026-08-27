import { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Edit, Shield, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { isAdmin } = useAuth();
  const toast = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data.users);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      await userService.update(user.id, { is_active: !user.is_active });
      toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'}`);
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="empty-state card">
        <Shield size={48} />
        <h3>Acceso Restringido</h3>
        <p>Solo los administradores pueden gestionar usuarios</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /><p>Cargando usuarios...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">Gestión de usuarios del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowForm(true); }}>
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => { setShowForm(false); setEditingUser(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Rol</th>
              <th>Especialidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.full_name}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                    {u.role === 'admin' ? (
                      <><ShieldCheck size={12} /> Admin</>
                    ) : (
                      <><Shield size={12} /> Odontólogo</>
                    )}
                  </span>
                </td>
                <td>{u.specialty || '-'}</td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-success' : 'badge-error'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditingUser(u); setShowForm(true); }}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleActive(u)}
                      title={u.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {u.is_active ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserForm({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    password: '',
    full_name: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'odontologo',
    specialty: user?.specialty || '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.full_name || (!user && !form.password)) {
      toast.warning('Complete los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (user) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await userService.update(user.id, updateData);
        toast.success('Usuario actualizado');
      } else {
        await userService.create(form);
        toast.success('Usuario creado');
      }
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Usuario *</label>
              <input
                type="text"
                className="form-input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={!!user}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{user ? 'Nueva Contraseña' : 'Contraseña *'}</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={user ? 'Dejar vacío para no cambiar' : ''}
                required={!user}
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Nombre Completo *</label>
              <input
                type="text"
                className="form-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="odontologo">Odontólogo</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label className="form-label">Especialidad</label>
              <input
                type="text"
                className="form-input"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="Ej: Odontología General, Ortodoncia..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (user ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
