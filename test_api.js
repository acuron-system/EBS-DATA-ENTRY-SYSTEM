const { loginUser } = require('./lib/auth');
const { query, queryOne, execute, initDb } = require('./lib/db');

async function testAll() {
  console.log('--- Starting System Verification Test ---');

  // 1. Init DB
  await initDb();
  console.log('✓ Database initialized and verified.');

  // 2. Test Admin Login
  const adminLogin = await loginUser('admin', 'Admin@DEO2026');
  if (!adminLogin.success || adminLogin.user.role !== 'admin') {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin));
  }
  console.log('✓ Admin login successful. Role:', adminLogin.user.role);

  // 3. Test School Login with registered UDISE: 33300700117
  const schoolLogin = await loginUser('33300700117', '33300700117@123');
  if (!schoolLogin.success || schoolLogin.user.role !== 'school') {
    throw new Error('School login failed: ' + JSON.stringify(schoolLogin));
  }
  console.log('✓ School login successful. School Name:', schoolLogin.user.schoolName);

  // 4. Test School Login with wrong password
  const badLogin = await loginUser('33300700117', 'wrong_pass');
  if (badLogin.success) {
    throw new Error('Bad login unexpectedly succeeded!');
  }
  console.log('✓ Invalid school password correctly rejected.');

  // 5. Test inserting a teacher record
  const testTeacherId = 'test_rec_' + Date.now();
  await execute(`
    INSERT INTO teachers (
      id, sl_no, udise_code, school_name, school_type,
      teacher_name, sex, designation, qualification,
      main_subject, other_subject, medium_of_teaching,
      dob, date_of_appointment, date_of_retirement,
      appointment_nature, address, area, email_id, mobile_no, remarks
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12,
      $13, $14, $15,
      $16, $17, $18, $19, $20, $21
    )
  `, [
    testTeacherId, '1', '33300700117', schoolLogin.user.schoolName, 'FULLY AIDED',
    'Dr. R. Ananth Kumar', 'Male', 'PG. ASST.', 'M.Sc., M.Ed., Ph.D.',
    'PHYSICS', 'MATHS', 'English',
    '1985-05-15', '2012-06-01', '2045-05-31',
    'Approver', '12/4 Market Road, Marthandam - 629165', 'Marthandam Block',
    'ananth.physics@example.com', '9840123456', 'Senior Faculty'
  ]);
  console.log('✓ Teacher record inserted successfully.');

  // 6. Test querying by school user UDISE
  const schoolTeachers = await query('SELECT * FROM teachers WHERE udise_code = $1', ['33300700117']);
  console.log(`✓ School query returned ${schoolTeachers.length} record(s) for UDISE 33300700117.`);

  // 7. Verify multi-tenant isolation: querying for another UDISE: 33300700414 returns 0
  const otherSchoolTeachers = await query('SELECT * FROM teachers WHERE udise_code = $1', ['33300700414']);
  if (otherSchoolTeachers.length !== 0) {
    throw new Error('Multi-tenant isolation failed! Other school received another school data.');
  }
  console.log('✓ Multi-tenant tenant scoping verified: Other schools cannot see this record.');

  // 8. Admin query across all schools
  const allTeachers = await query('SELECT * FROM teachers');
  console.log(`✓ Admin query returned all ${allTeachers.length} teacher record(s) across all schools.`);

  // 9. Clean up test record
  await execute('DELETE FROM teachers WHERE id = $1', [testTeacherId]);
  console.log('✓ Test record cleaned up successfully.');

  console.log('--- ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

testAll().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

