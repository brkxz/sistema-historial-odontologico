import 'dotenv/config';
import { sequelize, Patient, Treatment, Tooth, TreatmentTeeth, Odontogram, User } from '../models/index.js';

const DEMO_PATIENTS = [
  {
    dni: '74839201',
    first_name: 'María Elena',
    last_name: 'Quispe Huamán',
    birth_date: '1995-04-12',
    age: 29,
    gender: 'F',
    phone: '984512345',
    address: 'Av. Los Pioneros 450, San Ramón, Chanchamayo',
    email: 'maria.quispe@gmail.com',
    treatments: [
      {
        treatment_date: '2024-01-15',
        reason: 'Dolor agudo en muela superior derecha al comer dulces',
        procedure_performed: 'Apertura cavitaria y obturación estética con resina fotocurable 3M en pieza 16',
        observations: 'Diagnóstico: K02.1 Caries de la dentina. Prescripción: Ibuprofeno 400mg c/8h por 3 días.',
        next_appointment: '2024-06-15',
        teeth: [16],
        odontogram: [{ tooth_number: 16, condition: 'obturado', surface: 'Oclusal' }],
      },
      {
        treatment_date: '2024-06-20',
        reason: 'Control y limpieza dental semestral',
        procedure_performed: 'Destartraje supragingival con ultrasonido y profilaxis con pasta abrasiva',
        observations: 'Diagnóstico: K05.0 Gingivitis marginal crónica. Indicación: Enjuague de Clorhexidina 0.12%.',
        next_appointment: '2024-12-20',
        teeth: [11, 21, 31, 41],
        odontogram: [
          { tooth_number: 11, condition: 'sano' },
          { tooth_number: 21, condition: 'sano' },
          { tooth_number: 31, condition: 'sano' },
          { tooth_number: 41, condition: 'sano' },
        ],
      },
    ],
  },
  {
    dni: '48291034',
    first_name: 'Carlos Alberto',
    last_name: 'Rojas Mendoza',
    birth_date: '1988-08-23',
    age: 36,
    gender: 'M',
    phone: '964112233',
    address: 'Jr. Progreso 120, La Merced, Chanchamayo',
    email: 'carlos.rojas@hotmail.com',
    treatments: [
      {
        treatment_date: '2023-11-10',
        reason: 'Inflamación y dolor nocturno intenso en molar inferior',
        procedure_performed: 'Tratamiento de conducto (Endodoncia multirradicular) y medicación intraconducto',
        observations: 'Diagnóstico: K04.0 Pulpitis irreversible en pieza 46. Amoxicilina 500mg + Ketorolaco 10mg.',
        next_appointment: '2024-03-05',
        teeth: [46],
        odontogram: [{ tooth_number: 46, condition: 'endodoncia', surface: 'Total' }],
      },
      {
        treatment_date: '2024-03-05',
        reason: 'Colocación de corona definitiva tras endodoncia',
        procedure_performed: 'Cementación de corona de porcelana sobre metal en pieza 46',
        observations: 'Buen ajuste oclusal. Paciente dado de alta de este tratamiento.',
        next_appointment: '2024-09-05',
        teeth: [46],
        odontogram: [{ tooth_number: 46, condition: 'corona' }],
      },
    ],
  },
  {
    dni: '70123456',
    first_name: 'Rosa Angélica',
    last_name: 'Flores Condori',
    birth_date: '2001-11-05',
    age: 23,
    gender: 'F',
    phone: '954789123',
    address: 'Sector Campamento Chanchamayo, San Ramón',
    email: 'rosa.flores@outlook.com',
    treatments: [
      {
        treatment_date: '2024-02-18',
        reason: 'Molestia e inflamación en muelas del juicio inferiores',
        procedure_performed: 'Exodoncia quirúrgica de terceros molares 38 y 48 bajo anestesia local',
        observations: 'Diagnóstico: K01.1 Dientes retenidos. Indicaciones: Naproxeno 550mg c/12h por 3 días y hielo local.',
        next_appointment: '2024-02-25',
        teeth: [38, 48],
        odontogram: [
          { tooth_number: 38, condition: 'ausente' },
          { tooth_number: 48, condition: 'ausente' },
        ],
      },
    ],
  },
  {
    dni: '46027897',
    first_name: 'Eracleo Juan',
    last_name: 'Huamani Mendoza',
    birth_date: '1989-06-18',
    age: 35,
    gender: 'M',
    phone: '987654321',
    address: 'Av. Selva Central 340, San Ramón',
    email: 'e.huamani@gmail.com',
    treatments: [
      {
        treatment_date: '2024-04-10',
        reason: 'Sensibilidad dental al tomar bebidas frías',
        procedure_performed: 'Sellantes de fosas y fisuras y aplicación de flúor barniz en piezas 14, 15, 24, 25',
        observations: 'Diagnóstico: K02.0 Caries inicial de esmalte. Recomendación: Pasta desensibilizante diaria.',
        next_appointment: '2024-10-10',
        teeth: [14, 15, 24, 25],
        odontogram: [
          { tooth_number: 14, condition: 'sellante' },
          { tooth_number: 15, condition: 'sellante' },
          { tooth_number: 24, condition: 'sellante' },
          { tooth_number: 25, condition: 'sellante' },
        ],
      },
    ],
  },
];

async function seedDemoData() {
  try {
    console.log('🏥 Cargando historias clínicas de demostración para el Hospital San Ramón...');

    const dentist = await User.findOne({ where: { role: 'odontologo' } }) || await User.findOne();
    const allTeeth = await Tooth.findAll();
    const teethMap = {};
    allTeeth.forEach((t) => {
      teethMap[t.tooth_number] = t.id;
    });

    for (const pData of DEMO_PATIENTS) {
      let [patient] = await Patient.findOrCreate({
        where: { dni: pData.dni },
        defaults: {
          first_name: pData.first_name,
          last_name: pData.last_name,
          birth_date: pData.birth_date,
          age: pData.age,
          gender: pData.gender,
          phone: pData.phone,
          address: pData.address,
          email: pData.email,
          registered_by: dentist.id,
          registration_date: pData.treatments[0]?.treatment_date || '2024-01-01',
        },
      });

      console.log(`✅ Paciente listo: [${patient.dni}] ${patient.first_name} ${patient.last_name}`);

      for (const tData of pData.treatments) {
        const treatment = await Treatment.create({
          patient_id: patient.id,
          dentist_id: dentist.id,
          treatment_date: tData.treatment_date,
          reason: tData.reason,
          procedure_performed: tData.procedure_performed,
          observations: tData.observations,
          next_appointment: tData.next_appointment || null,
        });

        if (tData.teeth && tData.teeth.length > 0) {
          for (const num of tData.teeth) {
            const toothId = teethMap[num];
            if (toothId) {
              await TreatmentTeeth.findOrCreate({
                where: { treatment_id: treatment.id, tooth_id: toothId },
                defaults: { treatment_id: treatment.id, tooth_id: toothId },
              });
            }
          }
        }

        if (tData.odontogram && tData.odontogram.length > 0) {
          for (const o of tData.odontogram) {
            const toothId = teethMap[o.tooth_number];
            if (toothId) {
              const [odontEntry, created] = await Odontogram.findOrCreate({
                where: { patient_id: patient.id, tooth_id: toothId },
                defaults: {
                  patient_id: patient.id,
                  tooth_id: toothId,
                  dentist_id: dentist.id,
                  condition: o.condition,
                  surface: o.surface || '',
                  treatment_id: treatment.id,
                },
              });
              if (!created) {
                await odontEntry.update({
                  condition: o.condition,
                  surface: o.surface || '',
                  treatment_id: treatment.id,
                  dentist_id: dentist.id,
                });
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 ¡Historias clínicas de demostración cargadas con éxito en Neon PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cargar datos de demo:', error);
    process.exit(1);
  }
}

seedDemoData();
