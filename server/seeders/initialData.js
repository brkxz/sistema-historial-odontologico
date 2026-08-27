import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize, User, Tooth } from '../models/index.js';

// Datos de dientes según sistema FDI (Federación Dental Internacional)
const teethData = [
  // Cuadrante Superior Derecho (1x)
  { tooth_number: 18, name: 'Tercer Molar Superior Derecho', type: 'molar', quadrant: 'superior_derecho' },
  { tooth_number: 17, name: 'Segundo Molar Superior Derecho', type: 'molar', quadrant: 'superior_derecho' },
  { tooth_number: 16, name: 'Primer Molar Superior Derecho', type: 'molar', quadrant: 'superior_derecho' },
  { tooth_number: 15, name: 'Segundo Premolar Superior Derecho', type: 'premolar', quadrant: 'superior_derecho' },
  { tooth_number: 14, name: 'Primer Premolar Superior Derecho', type: 'premolar', quadrant: 'superior_derecho' },
  { tooth_number: 13, name: 'Canino Superior Derecho', type: 'canino', quadrant: 'superior_derecho' },
  { tooth_number: 12, name: 'Incisivo Lateral Superior Derecho', type: 'incisivo', quadrant: 'superior_derecho' },
  { tooth_number: 11, name: 'Incisivo Central Superior Derecho', type: 'incisivo', quadrant: 'superior_derecho' },

  // Cuadrante Superior Izquierdo (2x)
  { tooth_number: 21, name: 'Incisivo Central Superior Izquierdo', type: 'incisivo', quadrant: 'superior_izquierdo' },
  { tooth_number: 22, name: 'Incisivo Lateral Superior Izquierdo', type: 'incisivo', quadrant: 'superior_izquierdo' },
  { tooth_number: 23, name: 'Canino Superior Izquierdo', type: 'canino', quadrant: 'superior_izquierdo' },
  { tooth_number: 24, name: 'Primer Premolar Superior Izquierdo', type: 'premolar', quadrant: 'superior_izquierdo' },
  { tooth_number: 25, name: 'Segundo Premolar Superior Izquierdo', type: 'premolar', quadrant: 'superior_izquierdo' },
  { tooth_number: 26, name: 'Primer Molar Superior Izquierdo', type: 'molar', quadrant: 'superior_izquierdo' },
  { tooth_number: 27, name: 'Segundo Molar Superior Izquierdo', type: 'molar', quadrant: 'superior_izquierdo' },
  { tooth_number: 28, name: 'Tercer Molar Superior Izquierdo', type: 'molar', quadrant: 'superior_izquierdo' },

  // Cuadrante Inferior Izquierdo (3x)
  { tooth_number: 38, name: 'Tercer Molar Inferior Izquierdo', type: 'molar', quadrant: 'inferior_izquierdo' },
  { tooth_number: 37, name: 'Segundo Molar Inferior Izquierdo', type: 'molar', quadrant: 'inferior_izquierdo' },
  { tooth_number: 36, name: 'Primer Molar Inferior Izquierdo', type: 'molar', quadrant: 'inferior_izquierdo' },
  { tooth_number: 35, name: 'Segundo Premolar Inferior Izquierdo', type: 'premolar', quadrant: 'inferior_izquierdo' },
  { tooth_number: 34, name: 'Primer Premolar Inferior Izquierdo', type: 'premolar', quadrant: 'inferior_izquierdo' },
  { tooth_number: 33, name: 'Canino Inferior Izquierdo', type: 'canino', quadrant: 'inferior_izquierdo' },
  { tooth_number: 32, name: 'Incisivo Lateral Inferior Izquierdo', type: 'incisivo', quadrant: 'inferior_izquierdo' },
  { tooth_number: 31, name: 'Incisivo Central Inferior Izquierdo', type: 'incisivo', quadrant: 'inferior_izquierdo' },

  // Cuadrante Inferior Derecho (4x)
  { tooth_number: 41, name: 'Incisivo Central Inferior Derecho', type: 'incisivo', quadrant: 'inferior_derecho' },
  { tooth_number: 42, name: 'Incisivo Lateral Inferior Derecho', type: 'incisivo', quadrant: 'inferior_derecho' },
  { tooth_number: 43, name: 'Canino Inferior Derecho', type: 'canino', quadrant: 'inferior_derecho' },
  { tooth_number: 44, name: 'Primer Premolar Inferior Derecho', type: 'premolar', quadrant: 'inferior_derecho' },
  { tooth_number: 45, name: 'Segundo Premolar Inferior Derecho', type: 'premolar', quadrant: 'inferior_derecho' },
  { tooth_number: 46, name: 'Primer Molar Inferior Derecho', type: 'molar', quadrant: 'inferior_derecho' },
  { tooth_number: 47, name: 'Segundo Molar Inferior Derecho', type: 'molar', quadrant: 'inferior_derecho' },
  { tooth_number: 48, name: 'Tercer Molar Inferior Derecho', type: 'molar', quadrant: 'inferior_derecho' },
];

async function seed() {
  try {
    console.log('🦷 Iniciando seed de la base de datos...\n');

    // Sincronizar base de datos (crear tablas)
    await sequelize.sync({ force: true });
    console.log('✅ Tablas creadas correctamente.\n');

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      password_hash: hashedPassword,
      full_name: 'Administrador del Sistema',
      email: 'admin@clinicadental.com',
      role: 'admin',
      specialty: 'Administración',
      is_active: true,
    });
    console.log(`✅ Usuario administrador creado: ${admin.username}`);

    // Crear usuario odontólogo de ejemplo
    const dentistPassword = await bcrypt.hash('odontologo123', 10);
    const dentist = await User.create({
      username: 'dr.garcia',
      password_hash: dentistPassword,
      full_name: 'Dr. Carlos García López',
      email: 'dr.garcia@clinicadental.com',
      role: 'odontologo',
      specialty: 'Odontología General',
      is_active: true,
    });
    console.log(`✅ Usuario odontólogo creado: ${dentist.username}`);

    // Crear dientes
    await Tooth.bulkCreate(teethData);
    console.log(`✅ ${teethData.length} dientes creados (sistema FDI).\n`);

    console.log('════════════════════════════════════════════');
    console.log('  🎉 Base de datos inicializada con éxito');
    console.log('════════════════════════════════════════════');
    console.log('');
    console.log('  Credenciales de acceso:');
    console.log('  ─────────────────────────');
    console.log('  Admin:      admin / admin123');
    console.log('  Odontólogo: dr.garcia / odontologo123');
    console.log('');
    console.log('════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

seed();
