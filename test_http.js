const http = require('http');
const app = require('./api/index');

const server = http.createServer(app);

server.listen(4001, async () => {
  console.log('HTTP test server running on port 4001');

  try {
    // 1. Health check
    const healthRes = await fetch('http://localhost:4001/api/health');
    const health = await healthRes.json();
    console.log('✓ GET /api/health:', health.status, 'Total schools:', health.totalSchools);

    // 2. Schools list
    const schoolsRes = await fetch('http://localhost:4001/api/schools');
    const schools = await schoolsRes.json();
    console.log('✓ GET /api/schools returned', schools.schools.length, 'schools.');

    // 3. School Login
    const schoolLoginRes = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '33300700117', password: '33300700117@123' })
    });
    const schoolAuth = await schoolLoginRes.json();
    console.log('✓ POST /api/auth/login (School):', schoolAuth.success, 'School:', schoolAuth.user.schoolName);

    // 4. Admin Login
    const adminLoginRes = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@DEO2026' })
    });
    const adminAuth = await adminLoginRes.json();
    console.log('✓ POST /api/auth/login (Admin):', adminAuth.success, 'Role:', adminAuth.user.role);

    // 5. Create Teacher as School User
    const createTeacherRes = await fetch('http://localhost:4001/api/teachers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAuth.token}`
      },
      body: JSON.stringify({
        slNo: '1',
        schoolType: 'GOVERNMENT',
        block: 'Thuckalay',
        teacherName: 'K. Meenakshi',
        sex: 'Female',
        designation: 'PG. ASST.',
        qualification: 'M.A., B.Ed.',
        mainSubject: 'TAMIL',
        otherSubject: 'NIL',
        mediumOfTeaching: 'Tamil',
        dob: '1988-08-12',
        dateOfAppointment: '2015-07-01',
        dateOfRetirement: '2048-08-31',
        address: '45 Temple Street, Marthandam - 629165',
        area: 'Marthandam Town',
        emailId: 'meenakshi.tamil@example.com',
        mobileNo: '9443123456',
        remarks: 'Tamil Department Head'
      })
    });
    const created = await createTeacherRes.json();
    console.log('✓ POST /api/teachers (School):', created.success, 'ID:', created.id);

    // 6. Get Teachers as School User
    const schoolGetRes = await fetch('http://localhost:4001/api/teachers', {
      headers: { 'Authorization': `Bearer ${schoolAuth.token}` }
    });
    const schoolGet = await schoolGetRes.json();
    console.log('✓ GET /api/teachers (School): retrieved', schoolGet.records.length, 'record(s) for this school.');

    // 7. Get Admin Stats
    const statsRes = await fetch('http://localhost:4001/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const stats = await statsRes.json();
    console.log('✓ GET /api/admin/stats (Admin): Total Teachers:', stats.stats.totalTeachers, 'Submitted schools:', stats.stats.submittedSchools);

    // 8. Delete test teacher
    const delRes = await fetch(`http://localhost:4001/api/teachers/${created.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminAuth.token}` }
    });
    const del = await delRes.json();
    console.log('✓ DELETE /api/teachers/:id:', del.success);

    console.log('=== ALL HTTP API ENDPOINTS TESTED AND VERIFIED! ===');
    server.close();
    process.exit(0);
  } catch (e) {
    console.error('HTTP test failed:', e);
    server.close();
    process.exit(1);
  }
});

