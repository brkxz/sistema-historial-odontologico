import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, reniecService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { Search, Mic, MicOff, UserPlus, History, FilePlus, Phone, Mail, MapPin, Calendar, Globe, AlertCircle } from 'lucide-react';

export default function SearchPage() {
  const [dni, setDni] = useState('');
  const [patient, setPatient] = useState(null);
  const [reniecData, setReniecData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReniec, setLoadingReniec] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Inicializar reconocimiento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-PE';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Extraer números del texto hablado
        const numbers = transcript.replace(/\D/g, '');
        if (numbers) {
          setDni(numbers);
          toast.info(`DNI detectado: ${numbers}`);
          // Auto-buscar
          setTimeout(() => searchPatient(numbers), 500);
        } else {
          toast.warning('No se detectó un número de DNI');
        }
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
        toast.error('Error en el reconocimiento de voz');
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast.warning('Su navegador no soporta búsqueda por voz');
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
      toast.info('Escuchando... Diga el número de DNI');
    }
  };

  // Consultar RENIEC cuando no se encuentra en la BD local
  const consultarReniec = async (dniToSearch) => {
    setLoadingReniec(true);
    try {
      const result = await reniecService.consultarDni(dniToSearch);
      if (result.success && result.data) {
        setReniecData(result.data);
        toast.success('Datos encontrados en RENIEC');
      }
    } catch (error) {
      // No mostrar error si simplemente no se encontró
      if (error.message.includes('no encontrado')) {
        toast.warning('DNI no encontrado en RENIEC');
      } else if (error.message.includes('Token') || error.message.includes('configurado')) {
        toast.warning('Consulta RENIEC no disponible: Token no configurado');
      } else {
        toast.error('Error al consultar RENIEC: ' + error.message);
      }
    } finally {
      setLoadingReniec(false);
    }
  };

  const searchPatient = async (searchDni) => {
    const dniToSearch = searchDni || dni;
    if (!dniToSearch.trim()) {
      toast.warning('Ingrese un número de DNI');
      return;
    }

    setLoading(true);
    setPatient(null);
    setNotFound(false);
    setReniecData(null);

    try {
      const data = await patientService.searchByDni(dniToSearch.trim());
      setPatient(data.patient);
    } catch (error) {
      if (error.message.includes('no encontrado')) {
        setNotFound(true);
        // Auto-consultar RENIEC si no se encontró localmente y tiene 8 dígitos
        if (/^\d{8}$/.test(dniToSearch.trim())) {
          consultarReniec(dniToSearch.trim());
        }
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPatient();
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Navegar a registrar paciente con datos de RENIEC pre-llenados
  const registrarConReniec = () => {
    if (reniecData) {
      const paramData = {
        dni: reniecData.dni,
        first_name: reniecData.nombres,
        last_name: `${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`.trim(),
      };
      // Agregar fecha de nacimiento si viene
      if (reniecData.fechaNacimiento) {
        paramData.birth_date = reniecData.fechaNacimiento;
      }
      // Agregar dirección si viene
      if (reniecData.direccion) {
        paramData.address = [reniecData.direccion, reniecData.distrito, reniecData.provincia, reniecData.departamento]
          .filter(Boolean).join(', ');
      }
      // Agregar género detectado
      if (reniecData.genero) {
        paramData.gender = reniecData.genero;
      }
      const params = new URLSearchParams(paramData);
      navigate(`/pacientes/nuevo?${params.toString()}`);
    } else {
      navigate(`/pacientes/nuevo?dni=${dni}`);
    }
  };

  return (
    <div>
      <div className="search-section">
        <h2>🔍 Buscar Paciente</h2>
        <p>Ingrese el número de DNI del paciente para consultar su información e historial</p>

        <div className="search-box">
          <input
            id="search-dni-input"
            type="text"
            className="form-input"
            placeholder="INGRESE DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyPress}
            maxLength={8}
            autoFocus
          />
          <button
            id="voice-search-btn"
            className={`voice-btn ${listening ? 'listening' : ''}`}
            onClick={toggleVoice}
            title={listening ? 'Detener' : 'Búsqueda por voz'}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            id="search-btn"
            className="btn btn-primary btn-lg"
            onClick={() => searchPatient()}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                <Search size={18} />
                Buscar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultado: Paciente encontrado */}
      {patient && (
        <div className="patient-result card">
          <div className="patient-card-header">
            <div className="patient-avatar">
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
            <div>
              <div className="patient-name">
                {patient.first_name} {patient.last_name}
              </div>
              <div className="patient-dni">DNI: {patient.dni}</div>
            </div>
          </div>

          <div className="patient-details">
            <div className="patient-detail-item">
              <span className="patient-detail-label">Edad</span>
              <span className="patient-detail-value">
                {patient.age || calculateAge(patient.birth_date)} años
              </span>
            </div>
            <div className="patient-detail-item">
              <span className="patient-detail-label">Sexo</span>
              <span className="patient-detail-value">
                {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : '-'}
              </span>
            </div>
            <div className="patient-detail-item">
              <span className="patient-detail-label">
                <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                Teléfono
              </span>
              <span className="patient-detail-value">{patient.phone || '-'}</span>
            </div>
            <div className="patient-detail-item">
              <span className="patient-detail-label">
                <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                Correo
              </span>
              <span className="patient-detail-value">{patient.email || '-'}</span>
            </div>
            <div className="patient-detail-item">
              <span className="patient-detail-label">
                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                Dirección
              </span>
              <span className="patient-detail-value">{patient.address || '-'}</span>
            </div>
            <div className="patient-detail-item">
              <span className="patient-detail-label">
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                F. Registro
              </span>
              <span className="patient-detail-value">
                {patient.registration_date
                  ? new Date(patient.registration_date).toLocaleDateString('es-PE')
                  : '-'}
              </span>
            </div>
          </div>

          {/* Últimas atenciones */}
          {patient.treatments && patient.treatments.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Últimas atenciones:
              </h4>
              {patient.treatments.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '4px',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <span>{t.reason}</span>
                  <span className="badge badge-primary">
                    {new Date(t.treatment_date).toLocaleDateString('es-PE')}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="patient-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/historial/${patient.id}`)}
            >
              <History size={18} /> Ver Historial
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate(`/nueva-atencion?patient_id=${patient.id}`)}
            >
              <FilePlus size={18} /> Nueva Atención
            </button>
          </div>
        </div>
      )}

      {/* No encontrado - con datos de RENIEC */}
      {notFound && (
        <div className="patient-not-found card">
          <h3>Paciente no registrado en el sistema</h3>
          <p>No se encontró un paciente con el DNI: <strong>{dni}</strong></p>

          {/* Cargando RENIEC */}
          {loadingReniec && (
            <div className="reniec-loading" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              margin: '16px 0',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              animation: 'fadeIn 0.3s ease',
            }}>
              <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  <Globe size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Consultando RENIEC...
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Buscando datos del ciudadano en el Registro Nacional
                </div>
              </div>
            </div>
          )}

          {/* Datos de RENIEC encontrados */}
          {reniecData && (
            <div className="reniec-result" style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              margin: '16px 0',
              animation: 'fadeIn 0.4s ease',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                color: '#10b981',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                <Globe size={16} />
                Datos encontrados en RENIEC
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>DNI</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>{reniecData.dni}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombres</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>{reniecData.nombres}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>Apellido Paterno</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>{reniecData.apellidoPaterno}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '4px' }}>Apellido Materno</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>{reniecData.apellidoMaterno}</div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={registrarConReniec}
                style={{ width: '100%' }}
              >
                <UserPlus size={18} /> Registrar este Paciente
              </button>
            </div>
          )}

          {/* Si no hay datos de RENIEC y no está cargando */}
          {!reniecData && !loadingReniec && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/pacientes/nuevo?dni=${dni}`)}
            >
              <UserPlus size={18} /> Registrar Paciente
            </button>
          )}
        </div>
      )}
    </div>
  );
}
