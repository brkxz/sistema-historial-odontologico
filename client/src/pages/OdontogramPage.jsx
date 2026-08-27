import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { odontogramService, patientService, teethService } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { Search, Save } from 'lucide-react';

const CONDITIONS = [
  { value: 'sano', label: 'Sano', color: 'var(--success)' },
  { value: 'caries', label: 'Caries', color: 'var(--error)' },
  { value: 'obturado', label: 'Obturado', color: 'var(--info)' },
  { value: 'ausente', label: 'Ausente', color: 'var(--text-muted)' },
  { value: 'fracturado', label: 'Fracturado', color: 'var(--warning)' },
  { value: 'endodoncia', label: 'Endodoncia', color: '#EC4899' },
  { value: 'corona', label: 'Corona', color: 'var(--accent)' },
  { value: 'puente', label: 'Puente', color: '#06B6D4' },
  { value: 'sellante', label: 'Sellante', color: '#22D3EE' },
  { value: 'protesis', label: 'Prótesis', color: '#A78BFA' },
];

export default function OdontogramPage() {
  const [patient, setPatient] = useState(null);
  const [searchDni, setSearchDni] = useState('');
  const [allTeeth, setAllTeeth] = useState([]);
  const [odontogramData, setOdontogramData] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadTeeth();
  }, []);

  const loadTeeth = async () => {
    try {
      const data = await teethService.getAll();
      setAllTeeth(data.teeth);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const searchPatient = async () => {
    if (!searchDni.trim()) return;
    setLoading(true);
    try {
      const data = await patientService.searchByDni(searchDni.trim());
      setPatient(data.patient);
      await loadOdontogram(data.patient.id);
    } catch {
      toast.error('Paciente no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const loadOdontogram = async (patientId) => {
    try {
      const data = await odontogramService.getByPatient(patientId);
      const map = {};
      data.odontogram.forEach((entry) => {
        map[entry.tooth_id] = entry;
      });
      setOdontogramData(map);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateTooth = async (condition, surface = '', notes = '') => {
    if (!selectedTooth || !patient) return;
    try {
      await odontogramService.update({
        patient_id: patient.id,
        tooth_id: selectedTooth.id,
        condition,
        surface,
        notes,
      });
      setOdontogramData((prev) => ({
        ...prev,
        [selectedTooth.id]: { ...prev[selectedTooth.id], condition, surface, notes },
      }));
      toast.success(`Diente ${selectedTooth.tooth_number} actualizado`);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  // Agrupar dientes por fila
  const upperRight = allTeeth.filter((t) => t.quadrant === 'superior_derecho').sort((a, b) => b.tooth_number - a.tooth_number);
  const upperLeft = allTeeth.filter((t) => t.quadrant === 'superior_izquierdo').sort((a, b) => a.tooth_number - b.tooth_number);
  const lowerLeft = allTeeth.filter((t) => t.quadrant === 'inferior_izquierdo').sort((a, b) => b.tooth_number - a.tooth_number);
  const lowerRight = allTeeth.filter((t) => t.quadrant === 'inferior_derecho').sort((a, b) => a.tooth_number - b.tooth_number);

  const getToothCondition = (toothId) => odontogramData[toothId]?.condition || '';

  return (
    <div>
      <h1 className="page-title">Odontograma</h1>
      <p className="page-subtitle mb-lg">Representación visual del estado dental del paciente</p>

      {/* Buscar paciente */}
      <div className="card mb-lg">
        {patient ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="patient-avatar" style={{ width: 44, height: 44, fontSize: 'var(--font-size-md)' }}>
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{patient.first_name} {patient.last_name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  DNI: {patient.dni}
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPatient(null); setOdontogramData({}); setSelectedTooth(null); }}>
              Cambiar Paciente
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, maxWidth: '300px' }}
              placeholder="Ingrese DNI del paciente..."
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
            />
            <button className="btn btn-primary" onClick={searchPatient} disabled={loading}>
              <Search size={18} /> Buscar
            </button>
          </div>
        )}
      </div>

      {patient && (
        <>
          {/* Odontograma Visual */}
          <div className="odontogram-chart animate-in">
            <div className="odontogram-row-label">Arcada Superior</div>
            <div className="odontogram-row">
              {[...upperRight, ...upperLeft].map((tooth) => (
                <div
                  key={tooth.id}
                  className={`tooth-wrapper ${selectedTooth?.id === tooth.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTooth(tooth)}
                  title={`${tooth.tooth_number} - ${tooth.name}`}
                >
                  <div className={`tooth ${getToothCondition(tooth.id)}`}>
                    {tooth.tooth_number}
                  </div>
                  <span className="tooth-number">{tooth.tooth_number}</span>
                </div>
              ))}
            </div>

            <div className="odontogram-divider" />

            <div className="odontogram-row">
              {[...lowerLeft, ...lowerRight].map((tooth) => (
                <div
                  key={tooth.id}
                  className={`tooth-wrapper ${selectedTooth?.id === tooth.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTooth(tooth)}
                  title={`${tooth.tooth_number} - ${tooth.name}`}
                >
                  <span className="tooth-number">{tooth.tooth_number}</span>
                  <div className={`tooth ${getToothCondition(tooth.id)}`}>
                    {tooth.tooth_number}
                  </div>
                </div>
              ))}
            </div>
            <div className="odontogram-row-label">Arcada Inferior</div>
          </div>

          {/* Leyenda */}
          <div className="odontogram-legend">
            {CONDITIONS.map((c) => (
              <div key={c.value} className="legend-item">
                <div className="legend-color" style={{ borderColor: c.color, background: `${c.color}22` }} />
                {c.label}
              </div>
            ))}
          </div>

          {/* Panel de detalle del diente seleccionado */}
          {selectedTooth && (
            <div className="tooth-detail-panel animate-in">
              <div className="tooth-detail-header">
                <div>
                  <h3 className="tooth-detail-title">
                    Diente #{selectedTooth.tooth_number} - {selectedTooth.name}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Tipo: {selectedTooth.type} • Cuadrante: {selectedTooth.quadrant?.replace('_', ' ')}
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTooth(null)}>✕</button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label mb-sm">Estado actual:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      className={`btn btn-sm ${getToothCondition(selectedTooth.id) === c.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateTooth(c.value)}
                      style={getToothCondition(selectedTooth.id) === c.value ? { background: c.color } : {}}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {odontogramData[selectedTooth.id] && (
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  <strong>Estado:</strong>{' '}
                  <span className={`badge badge-${getToothCondition(selectedTooth.id) === 'sano' ? 'success' : 'warning'}`}>
                    {CONDITIONS.find((c) => c.value === getToothCondition(selectedTooth.id))?.label || 'Sin registro'}
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
