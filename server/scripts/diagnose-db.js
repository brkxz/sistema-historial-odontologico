import 'dotenv/config';
import sequelize from '../config/database.js';

async function diagnose() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión DB OK');

    // Ver columnas de la tabla patients
    const [patientsColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Columnas de patients:');
    patientsColumns.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) nullable:${c.is_nullable}`));

    // Probar búsqueda por DNI directamente
    const [result] = await sequelize.query(
      `SELECT id, dni, first_name, last_name, deleted_at FROM patients WHERE dni = '60806793' LIMIT 1`
    );
    console.log('\n🔍 Resultado búsqueda DNI 60806793:', result.length === 0 ? 'No encontrado' : result[0]);

    // Contar pacientes totales
    const [count] = await sequelize.query(`SELECT COUNT(*) as total FROM patients`);
    console.log('\n📊 Total pacientes:', count[0].total);

    // Ver columnas de treatments
    const [treatmentsColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'treatments' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Columnas de treatments:');
    treatmentsColumns.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    // Ver columnas de users
    const [usersColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Columnas de users:');
    usersColumns.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

diagnose();
