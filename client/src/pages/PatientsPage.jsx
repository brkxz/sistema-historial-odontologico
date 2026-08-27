import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { patientService, reniecService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { Search, UserPlus, Eye, Edit, ChevronLeft, ChevronRight, Globe, Loader } from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const prefilledDni = searchParams.get('dni') || '';

  useEffect(() => {
    if (searchParams.get('dni')) {
      setShowForm(true);
    }
    loadPatients();
  }, [page]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await patientService.getAll(search, page);
      setPatients(data.patients);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPatients();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">Gestión y registro de pacientes ({total} registrados)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingPatient(null); setShowForm(true); }}>
          <UserPlus size={18} /> Nuevo Paciente
        </button>
      </div>

      {/* Buscador */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, maxWidth: '400px' }}
          placeholder="Buscar por DNI, nombre o apellido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-secondary" onClick={handleSearch}>
          <Search size={18} /> Buscar
        </button>
      </div>

      {/* Modal/Form para crear/editar paciente */}
      {showForm && (
        <PatientForm
          patient={editingPatient}
          prefilledDni={prefilledDni}
          onClose={() => { setShowForm(false); setEditingPatient(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditingPatient(null);
            loadPatients();
            toast.success(editingPatient ? 'Paciente actualizado' : 'Paciente registrado');
          }}
        />
      )}

      {/* Tabla */}
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Cargando pacientes...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="empty-state card">
          <h3>No se encontraron pacientes</h3>
          <p>Registre un nuevo paciente para comenzar</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre Completo</th>
                  <th>Edad</th>
                  <th>Teléfono</th>
                  <th>F. Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.dni}</td>
                    <td>{p.first_name} {p.last_name}</td>
                    <td>{p.age || '-'}</td>
                    <td>{p.phone || '-'}</td>
                    <td>
                      {p.registration_date
                        ? new Date(p.registration_date).toLocaleDateString('es-PE')
                        : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/historial/${p.id}`)}
                          title="Ver historial"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditingPatient(p); setShowForm(true); }}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Página {page} de {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================
// Componente: Formulario de Paciente (Modal)
// =============================================
function PatientForm({ patient, prefilledDni, onClose, onSaved }) {
  const [searchParams] = useSearchParams();
  const prefilledFirstName = searchParams.get('first_name') || '';
  const prefilledLastName = searchParams.get('last_name') || '';
  const prefilledBirthDate = searchParams.get('birth_date') || '';
  const prefilledAddress = searchParams.get('address') || '';
  const prefilledGender = searchParams.get('gender') || '';

  // Calcular edad desde fecha de nacimiento pre-llenada
  const calcAge = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const [form, setForm] = useState({
    dni: patient?.dni || prefilledDni || '',
    first_name: patient?.first_name || prefilledFirstName || '',
    last_name: patient?.last_name || prefilledLastName || '',
    birth_date: patient?.birth_date || prefilledBirthDate || '',
    age: patient?.age || (prefilledBirthDate ? calcAge(prefilledBirthDate) : ''),
    gender: patient?.gender || prefilledGender || '',
    phone: patient?.phone || '',
    address: patient?.address || prefilledAddress || '',
    email: patient?.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [consultingReniec, setConsultingReniec] = useState(false);
  const [reniecStatus, setReniecStatus] = useState(''); // '', 'success', 'error'
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-calcular edad si cambia fecha de nacimiento
      if (name === 'birth_date' && value) {
        const today = new Date();
        const birth = new Date(value);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        updated.age = age;
      }
      return updated;
    });

    // Auto-consultar RENIEC si se completan 8 dígitos en el campo DNI
    if (name === 'dni' && value.replace(/\D/g, '').length === 8 && !patient) {
      consultarReniec(value.replace(/\D/g, ''));
    }

    // Limpiar estado de RENIEC si cambian el DNI
    if (name === 'dni') {
      setReniecStatus('');
    }
  };

  const consultarReniec = async (dniValue) => {
    const dniToSearch = dniValue || form.dni;
    if (!/^\d{8}$/.test(dniToSearch)) {
      toast.warning('El DNI debe tener 8 dígitos');
      return;
    }

    setConsultingReniec(true);
    setReniecStatus('');
    try {
      const result = await reniecService.consultarDni(dniToSearch);
      if (result.success && result.data) {
        const updates = {
          first_name: result.data.nombres || '',
          last_name: `${result.data.apellidoPaterno || ''} ${result.data.apellidoMaterno || ''}`.trim() || '',
        };

        // Fecha de nacimiento si viene en la respuesta
        if (result.data.fechaNacimiento) {
          updates.birth_date = result.data.fechaNacimiento;
          // Calcular edad automáticamente
          const today = new Date();
          const birth = new Date(result.data.fechaNacimiento);
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
          updates.age = age;
        }

        // Dirección si viene
        if (result.data.direccion) {
          const dir = [result.data.direccion, result.data.distrito, result.data.provincia, result.data.departamento]
            .filter(Boolean).join(', ');
          updates.address = dir;
        }

        // Género detectado por nombre
        if (result.data.genero) {
          updates.gender = result.data.genero;
        }

        setForm((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== '' && v !== undefined)),
        }));
        setReniecStatus('success');
        toast.success('Datos autocompletados desde RENIEC');
      }
    } catch (error) {
      setReniecStatus('error');
      if (error.message.includes('Token') || error.message.includes('configurado')) {
        toast.warning('Consulta RENIEC no disponible');
      } else if (error.message.includes('no encontrado')) {
        toast.warning('DNI no encontrado en RENIEC');
      } else {
        toast.error('Error al consultar RENIEC');
      }
    } finally {
      setConsultingReniec(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.dni || !form.first_name || !form.last_name) {
      toast.warning('DNI, nombres y apellidos son obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (patient) {
        await patientService.update(patient.id, form);
      } else {
        await patientService.create(form);
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
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {patient ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">DNI *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <input
                  type="text"
                  name="dni"
                  className="form-input"
                  value={form.dni}
                  onChange={handleChange}
                  maxLength={8}
                  placeholder="12345678"
                  required
                  disabled={!!patient}
                  style={{ flex: 1 }}
                />
                {!patient && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => consultarReniec()}
                    disabled={consultingReniec || form.dni.length !== 8}
                    title="Consultar RENIEC"
                    style={{
                      minWidth: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      ...(reniecStatus === 'success'
                        ? { borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }
                        : reniecStatus === 'error'
                        ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }
                        : {}),
                    }}
                  >
                    {consultingReniec ? (
                      <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    ) : reniecStatus === 'success' ? (
                      <span style={{ fontSize: '16px' }}>✓</span>
                    ) : (
                      <Globe size={18} />
                    )}
                  </button>
                )}
              </div>
              {consultingReniec && (
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--primary)',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <Globe size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  Consultando RENIEC...
                </div>
              )}
              {reniecStatus === 'success' && !consultingReniec && (
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: '#10b981',
                  marginTop: '4px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  ✓ Datos completados desde RENIEC
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Sexo</label>
              <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nombres *</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Nombres del paciente"
                required
                style={reniecStatus === 'success' && form.first_name ? {
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.05)',
                } : {}}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Apellidos del paciente"
                required
                style={reniecStatus === 'success' && form.last_name ? {
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.05)',
                } : {}}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input
                type="date"
                name="birth_date"
                className="form-input"
                value={form.birth_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Edad</label>
              <input
                type="number"
                name="age"
                className="form-input"
                value={form.age}
                onChange={handleChange}
                placeholder="Edad"
                min={0}
                max={150}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={form.phone}
                onChange={handleChange}
                placeholder="999 999 999"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                name="address"
                className="form-input"
                value={form.address}
                onChange={handleChange}
                placeholder="Dirección del paciente"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                patient ? 'Actualizar' : 'Registrar Paciente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

