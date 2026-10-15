// =============================================
// UTILIDAD: Exportar Historial Clínico a PDF
// Usa jsPDF (ya instalado en el proyecto)
// =============================================
import { jsPDF } from 'jspdf';

/** Colores del sistema */
const COLOR = {
  primary:   [13, 148, 136],  // teal-600
  dark:      [15, 23, 42],    // slate-900
  muted:     [100, 116, 139], // slate-500
  border:    [226, 232, 240], // slate-200
  white:     [255, 255, 255],
  lightBg:   [248, 250, 252], // slate-50
  danger:    [239, 68, 68],
  warning:   [245, 158, 11],
};

function setColor(doc, color, type = 'text') {
  if (type === 'text') doc.setTextColor(...color);
  else doc.setFillColor(...color);
}

function setFont(doc, size, style = 'normal') {
  doc.setFontSize(size);
  doc.setFont('helvetica', style);
}

function drawLine(doc, x1, y, x2, color = COLOR.border) {
  doc.setDrawColor(...color);
  doc.line(x1, y, x2, y);
}

function drawFilledRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

/**
 * Exporta el historial clínico completo del paciente a PDF.
 *
 * @param {Object} patient   - Objeto paciente con sus datos
 * @param {Array}  treatments - Array de atenciones del paciente
 */
export async function exportPatientHistoryPDF(patient, treatments = []) {
  const doc   = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const W     = 210; // Ancho A4
  const margin = 15;
  const contentW = W - margin * 2;
  let y = 0;

  // ─── ENCABEZADO ───────────────────────────────────────────────────────────
  drawFilledRect(doc, 0, 0, W, 38, COLOR.primary);
  setColor(doc, COLOR.white, 'text');
  setFont(doc, 18, 'bold');
  doc.text('Hospital San Ramón', margin, 14);
  setFont(doc, 10, 'normal');
  doc.text('Servicio de Odontología — Chanchamayo, Perú', margin, 20);
  setFont(doc, 8, 'normal');
  doc.text(`Documento generado: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 27);
  doc.text(`Sistema de Historial Odontológico Digital v2.0`, margin, 32);

  // Logo simbólico (diente)
  setFont(doc, 22, 'bold');
  doc.text('🦷', W - margin - 20, 20);

  y = 45;

  // ─── DATOS DEL PACIENTE ───────────────────────────────────────────────────
  drawFilledRect(doc, margin, y, contentW, 7, COLOR.primary);
  setColor(doc, COLOR.white, 'text');
  setFont(doc, 9, 'bold');
  doc.text('DATOS DEL PACIENTE', margin + 3, y + 5);
  y += 10;

  const fields = [
    ['Nombre completo', `${patient.first_name} ${patient.last_name}`],
    ['DNI',            patient.dni || '-'],
    ['Fecha de nacimiento', patient.birth_date ? new Date(patient.birth_date + 'T12:00:00').toLocaleDateString('es-PE') : '-'],
    ['Edad',           patient.age ? `${patient.age} años` : '-'],
    ['Género',         patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : '-'],
    ['Teléfono',       patient.phone || '-'],
    ['Dirección',      patient.address || '-'],
    ['Email',          patient.email || '-'],
    ['Tipo de sangre', patient.blood_type || '-'],
    ['Fecha registro', patient.registration_date ? new Date(patient.registration_date).toLocaleDateString('es-PE') : '-'],
  ];

  const col1W = 55;
  fields.forEach(([label, value], i) => {
    const rowY = y + i * 7;
    if (i % 2 === 0) drawFilledRect(doc, margin, rowY, contentW, 7, COLOR.lightBg);
    setColor(doc, COLOR.muted, 'text');
    setFont(doc, 8, 'normal');
    doc.text(label + ':', margin + 2, rowY + 5);
    setColor(doc, COLOR.dark, 'text');
    setFont(doc, 8, 'bold');
    doc.text(String(value).substring(0, 65), margin + col1W, rowY + 5);
  });
  y += fields.length * 7 + 4;
  drawLine(doc, margin, y, W - margin, COLOR.border);
  y += 5;

  // ─── ANTECEDENTES MÉDICOS ─────────────────────────────────────────────────
  if (patient.medical_history || patient.allergies || patient.medications) {
    drawFilledRect(doc, margin, y, contentW, 7, [239, 68, 68]);
    setColor(doc, COLOR.white, 'text');
    setFont(doc, 9, 'bold');
    doc.text('⚠  ANTECEDENTES MÉDICOS IMPORTANTES', margin + 3, y + 5);
    y += 9;

    const medFields = [
      ['Historial médico',  patient.medical_history],
      ['Alergias',          patient.allergies],
      ['Medicamentos actuales', patient.medications],
    ].filter(([, v]) => v);

    medFields.forEach(([label, value]) => {
      setColor(doc, COLOR.muted, 'text');
      setFont(doc, 8, 'bold');
      doc.text(label + ':', margin + 2, y + 4);
      setColor(doc, [180, 40, 40], 'text');
      setFont(doc, 8, 'normal');
      const lines = doc.splitTextToSize(value, contentW - 50);
      doc.text(lines, margin + 50, y + 4);
      y += Math.max(lines.length * 5, 8);
    });
    y += 4;
    drawLine(doc, margin, y, W - margin);
    y += 5;
  }

  // ─── HISTORIAL DE ATENCIONES ──────────────────────────────────────────────
  drawFilledRect(doc, margin, y, contentW, 7, COLOR.primary);
  setColor(doc, COLOR.white, 'text');
  setFont(doc, 9, 'bold');
  doc.text(`HISTORIAL DE ATENCIONES (${treatments.length} registro${treatments.length !== 1 ? 's' : ''})`, margin + 3, y + 5);
  y += 10;

  if (treatments.length === 0) {
    setColor(doc, COLOR.muted, 'text');
    setFont(doc, 9, 'normal');
    doc.text('No hay atenciones registradas.', margin + 3, y + 5);
    y += 10;
  } else {
    treatments.forEach((t, idx) => {
      // Verificar si necesitamos nueva página
      if (y > 250) {
        doc.addPage();
        y = margin;
        // Header mínimo en nueva página
        drawFilledRect(doc, 0, 0, W, 12, COLOR.primary);
        setColor(doc, COLOR.white, 'text');
        setFont(doc, 8, 'bold');
        doc.text(`Historial: ${patient.first_name} ${patient.last_name} (continúa)`, margin, 8);
        y = 18;
      }

      // Fila de atención
      const rowBg = idx % 2 === 0 ? COLOR.lightBg : COLOR.white;
      const neededH = 8 + 
        (t.procedure_performed ? 6 : 0) + 
        (t.observations ? 6 : 0) +
        (t.next_appointment ? 6 : 0);

      drawFilledRect(doc, margin, y, contentW, neededH + 2, rowBg);

      // Número y fecha
      setFont(doc, 8, 'bold');
      setColor(doc, COLOR.primary, 'text');
      doc.text(`#${idx + 1}`, margin + 2, y + 5);
      setColor(doc, COLOR.dark, 'text');
      const dateStr = t.treatment_date
        ? new Date(t.treatment_date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';
      doc.text(dateStr, margin + 10, y + 5);

      // Odontólogo
      setColor(doc, COLOR.muted, 'text');
      setFont(doc, 7, 'normal');
      doc.text(`Dr(a). ${t.dentist?.full_name || 'N/A'}`, margin + 45, y + 5);

      // Motivo
      setColor(doc, COLOR.dark, 'text');
      setFont(doc, 8, 'bold');
      doc.text('Motivo: ', margin + 2, y + 11);
      setFont(doc, 8, 'normal');
      doc.text(t.reason || '-', margin + 20, y + 11);

      let rowY = y + 11;

      if (t.procedure_performed) {
        rowY += 6;
        setFont(doc, 8, 'bold');
        setColor(doc, COLOR.muted, 'text');
        doc.text('Procedimiento: ', margin + 2, rowY);
        setFont(doc, 8, 'normal');
        setColor(doc, COLOR.dark, 'text');
        const lines = doc.splitTextToSize(t.procedure_performed, contentW - 38);
        doc.text(lines[0], margin + 35, rowY);
      }

      if (t.observations) {
        rowY += 6;
        setFont(doc, 8, 'bold');
        setColor(doc, COLOR.muted, 'text');
        doc.text('Observaciones: ', margin + 2, rowY);
        setFont(doc, 8, 'normal');
        setColor(doc, COLOR.dark, 'text');
        const lines = doc.splitTextToSize(t.observations, contentW - 38);
        doc.text(lines[0], margin + 35, rowY);
      }

      if (t.next_appointment) {
        rowY += 6;
        setFont(doc, 8, 'bold');
        setColor(doc, [245, 158, 11], 'text');
        doc.text('Próxima cita: ', margin + 2, rowY);
        setFont(doc, 8, 'normal');
        doc.text(new Date(t.next_appointment + 'T12:00:00').toLocaleDateString('es-PE'), margin + 33, rowY);
      }

      // Dientes afectados
      if (t.treatmentTeeth?.length > 0) {
        rowY += 6;
        setColor(doc, COLOR.muted, 'text');
        setFont(doc, 7, 'normal');
        const teeth = t.treatmentTeeth.map(tt => `D${tt.tooth?.tooth_number || '?'}`).join(', ');
        doc.text(`Dientes: ${teeth}`, margin + 2, rowY);
      }

      y += neededH + 4;
    });
  }

  // ─── PIE DE PÁGINA ────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawLine(doc, margin, 285, W - margin, COLOR.border);
    setFont(doc, 7, 'normal');
    setColor(doc, COLOR.muted, 'text');
    doc.text('Este documento es de uso médico confidencial.', margin, 290);
    doc.text(`Página ${i} de ${pageCount}`, W - margin - 20, 290);
  }

  // Descargar
  const fileName = `historial_${patient.dni || patient.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Exporta un reporte de atenciones resumido por fecha/odontólogo a PDF
 */
export async function exportReportPDF(reportData, title = 'Reporte', subtitle = '') {
  const doc    = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const W      = 210;
  const margin = 15;
  const cW     = W - margin * 2;
  let y = 0;

  // Header
  drawFilledRect(doc, 0, 0, W, 30, COLOR.primary);
  setColor(doc, COLOR.white, 'text');
  setFont(doc, 16, 'bold');
  doc.text('Hospital San Ramón — Odontología', margin, 12);
  setFont(doc, 11, 'bold');
  doc.text(title, margin, 20);
  if (subtitle) {
    setFont(doc, 9, 'normal');
    doc.text(subtitle, margin, 27);
  }
  y = 38;

  // Tabla de datos
  drawFilledRect(doc, margin, y, cW, 7, COLOR.primary);
  setColor(doc, COLOR.white, 'text');
  setFont(doc, 8, 'bold');
  const cols = Object.keys(reportData[0] || {});
  const colW = cW / cols.length;
  cols.forEach((col, i) => doc.text(col, margin + i * colW + 2, y + 5));
  y += 8;

  reportData.forEach((row, idx) => {
    if (y > 260) { doc.addPage(); y = 15; }
    if (idx % 2 === 0) drawFilledRect(doc, margin, y, cW, 7, COLOR.lightBg);
    setColor(doc, COLOR.dark, 'text');
    setFont(doc, 8, 'normal');
    cols.forEach((col, i) => {
      const val = String(row[col] ?? '-').substring(0, 28);
      doc.text(val, margin + i * colW + 2, y + 5);
    });
    y += 7;
  });

  // Footer
  setFont(doc, 7, 'normal');
  setColor(doc, COLOR.muted, 'text');
  doc.text(`Generado el ${new Date().toLocaleDateString('es-PE')}`, margin, 288);

  const fileName = `reporte_${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
