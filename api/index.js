const express = require('express');
const cors = require('cors');
const path = require('path');
const { query, queryOne, execute, initDb, isPostgres } = require('../lib/db');
const { authenticateToken, requireAdmin, loginUser } = require('../lib/auth');
const { SCHOOL_DIRECTORY, isValidUdise, getSchoolName } = require('../lib/schools');
const { generateEbsExport } = require('../lib/exporter');

const app = express();

// Robust CORS & Chrome Private Network Access (PNA) handling
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (origin !== '*' && origin !== 'null') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Request-Private-Network');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel maps /api/index.js to one serverless function. Preserve the original
// Express route when vercel.json rewrites /api/* to this function.
app.use((req, res, next) => {
  try {
    const parsed = new URL(req.url, 'http://vercel.local');
    const forwardedPath = parsed.searchParams.get('__vercel_path');
    if (forwardedPath && forwardedPath.startsWith('/api/')) {
      parsed.searchParams.delete('__vercel_path');
      req.url = forwardedPath + (parsed.searchParams.size ? '?' + parsed.searchParams.toString() : '');
    }
  } catch (err) {
    return next(err);
  }
  next();
});


// Serve static assets from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ensure database is initialized
let dbInitialized = false;
async function ensureDbInit() {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (e) {
      console.error('Database initialization error:', e);
    }
  }
}

// Middleware to ensure DB is ready on each request
app.use(async (req, res, next) => {
  await ensureDbInit();
  next();
});

// ==========================================
// 1. Health & Directory Endpoints
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isPostgres ? 'PostgreSQL' : 'SQLite',
    totalSchools: Object.keys(SCHOOL_DIRECTORY).length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/schools', (req, res) => {
  const schoolsList = Object.entries(SCHOOL_DIRECTORY).map(([udise, name]) => ({
    udiseCode: udise,
    schoolName: name
  }));
  res.json({ success: true, schools: schoolsList });
});

// ==========================================
// 2. Authentication Endpoints
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await loginUser(username, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ==========================================
// 3. Teacher Records CRUD Endpoints
// ==========================================

/**
 * GET /api/teachers
 * School user: gets only their school's records
 * Admin user: gets all records (or filtered by ?udise=...)
 */
app.get('/api/teachers', authenticateToken, async (req, res) => {
  try {
    const { role, schoolUdise } = req.user;
    const { udise, search, schoolType, designation, mainSubject, block } = req.query;

    let sql = 'SELECT * FROM teachers';
    const params = [];
    const conditions = [];

    if (role === 'school') {
      // Strictly isolate to the logged-in school's UDISE
      conditions.push(`udise_code = $${params.length + 1}`);
      params.push(schoolUdise);
    } else if (role === 'admin') {
      // Admin can filter by specific school UDISE
      if (udise && udise !== 'ALL') {
        conditions.push(`udise_code = $${params.length + 1}`);
        params.push(udise);
      }
    }

    if (block) {
      conditions.push(`block = $${params.length + 1}`);
      params.push(block);
    }

    if (schoolType) {
      conditions.push(`school_type = $${params.length + 1}`);
      params.push(schoolType);
    }

    if (designation) {
      conditions.push(`designation = $${params.length + 1}`);
      params.push(designation);
    }

    if (mainSubject) {
      conditions.push(`main_subject = $${params.length + 1}`);
      params.push(mainSubject);
    }

    if (search) {
      const term = `%${search.trim()}%`;
      const idx = params.length + 1;
      conditions.push(`(
        LOWER(teacher_name) LIKE LOWER($${idx}) OR
        LOWER(udise_code) LIKE LOWER($${idx}) OR
        LOWER(school_name) LIKE LOWER($${idx}) OR
        LOWER(COALESCE(block, '')) LIKE LOWER($${idx}) OR
        LOWER(main_subject) LIKE LOWER($${idx}) OR
        LOWER(designation) LIKE LOWER($${idx}) OR
        mobile_no LIKE $${idx}
      )`);
      params.push(term);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Order by sl_no numeric asc or created_at desc
    sql += ' ORDER BY CAST(sl_no AS INTEGER) ASC, created_at DESC';

    const records = await query(sql, params);
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    console.error('Fetch teachers error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve teacher records.' });
  }
});

/**
 * GET /api/teachers/:id
 */
app.get('/api/teachers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await queryOne('SELECT * FROM teachers WHERE id = $1', [id]);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (req.user.role === 'school' && record.udise_code !== req.user.schoolUdise) {
      return res.status(403).json({ success: false, message: 'Access denied to this record.' });
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error('Get teacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve teacher record.' });
  }
});

/**
 * POST /api/teachers
 * Create a new teacher record
 */
app.post('/api/teachers', authenticateToken, async (req, res) => {
  try {
    const { role, schoolUdise, schoolName: userSchoolName } = req.user;
    const body = req.body;

    let targetUdise = '';
    let targetSchoolName = '';

    if (role === 'school') {
      targetUdise = schoolUdise;
      targetSchoolName = userSchoolName || getSchoolName(schoolUdise);
    } else if (role === 'admin') {
      targetUdise = String(body.udiseCode || '').trim();
      targetSchoolName = String(body.schoolName || '').trim() || getSchoolName(targetUdise);
    }

    // Validation
    if (!/^\d{10,11}$/.test(targetUdise)) {
      return res.status(400).json({ success: false, message: 'Invalid 10 or 11-digit UDISE Code.' });
    }
    if (!targetSchoolName) {
      return res.status(400).json({ success: false, message: 'School Name is required.' });
    }
    if (!body.teacherName || !body.teacherName.trim()) {
      return res.status(400).json({ success: false, message: 'Teacher Name is required.' });
    }
    if (!body.sex) {
      return res.status(400).json({ success: false, message: 'Sex is required.' });
    }
    if (!body.designation) {
      return res.status(400).json({ success: false, message: 'Designation is required.' });
    }
    if (!body.qualification || !body.qualification.trim()) {
      return res.status(400).json({ success: false, message: 'Educational Qualification is required.' });
    }
    if (!body.mainSubject) {
      return res.status(400).json({ success: false, message: 'Main Subject is required.' });
    }
    if (!body.mediumOfTeaching) {
      return res.status(400).json({ success: false, message: 'Medium of Teaching is required.' });
    }
    if (!body.dob || !body.dateOfAppointment || !body.dateOfRetirement) {
      return res.status(400).json({ success: false, message: 'Date of Birth, Appointment, and Retirement are required.' });
    }
    if (!body.address || !body.address.trim()) {
      return res.status(400).json({ success: false, message: 'Address with Pincode is required.' });
    }
    if (!body.area || !body.area.trim()) {
      return res.status(400).json({ success: false, message: 'Area is required.' });
    }
    if (!body.emailId || !body.emailId.trim()) {
      return res.status(400).json({ success: false, message: 'Email ID is required.' });
    }
    if (!/^\d{10}$/.test(String(body.mobileNo || '').trim())) {
      return res.status(400).json({ success: false, message: 'Mobile Number must be a valid 10-digit number.' });
    }

    const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const slNo = String(body.slNo || '').trim() || '1';
    const schoolType = body.schoolType || 'GOVERNMENT';
    const block = body.block ? String(body.block).trim() : '';
    const otherSubject = body.otherSubject || 'NIL';
    const appointmentNature = body.appointmentNature || '';
    const remarks = body.remarks || '';

    const sql = `
      INSERT INTO teachers (
        id, sl_no, udise_code, school_name, block, school_type,
        teacher_name, sex, designation, qualification,
        main_subject, other_subject, medium_of_teaching,
        dob, date_of_appointment, date_of_retirement,
        appointment_nature, address, area, email_id, mobile_no, remarks
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20, $21, $22
      )
    `;

    const params = [
      id, slNo, targetUdise, targetSchoolName, block, schoolType,
      body.teacherName.trim(), body.sex, body.designation, body.qualification.trim(),
      body.mainSubject, otherSubject, body.mediumOfTeaching,
      body.dob, body.dateOfAppointment, body.dateOfRetirement,
      appointmentNature, body.address.trim(), body.area.trim(), body.emailId.trim(), body.mobileNo.trim(), remarks.trim()
    ];

    await execute(sql, params);

    res.json({
      success: true,
      id,
      message: 'Teacher record saved successfully to the database.'
    });
  } catch (err) {
    console.error('Create teacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to save teacher record.' });
  }
});

/**
 * PUT /api/teachers/:id
 * Update an existing teacher record
 */
app.put('/api/teachers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, schoolUdise } = req.user;
    const body = req.body;

    const existing = await queryOne('SELECT * FROM teachers WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (role === 'school' && existing.udise_code !== schoolUdise) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot edit records of other schools.' });
    }

    let targetUdise = existing.udise_code;
    let targetSchoolName = existing.school_name;

    if (role === 'admin' && body.udiseCode) {
      targetUdise = String(body.udiseCode).trim();
      targetSchoolName = body.schoolName || getSchoolName(targetUdise) || existing.school_name;
    }

    const slNo = body.slNo ? String(body.slNo).trim() : existing.sl_no;
    const schoolType = body.schoolType || existing.school_type;
    const block = body.block !== undefined ? String(body.block).trim() : (existing.block || '');
    const teacherName = body.teacherName ? body.teacherName.trim() : existing.teacher_name;
    const sex = body.sex || existing.sex;
    const designation = body.designation || existing.designation;
    const qualification = body.qualification ? body.qualification.trim() : existing.qualification;
    const mainSubject = body.mainSubject || existing.main_subject;
    const otherSubject = body.otherSubject || existing.other_subject;
    const mediumOfTeaching = body.mediumOfTeaching || existing.medium_of_teaching;
    const dob = body.dob || existing.dob;
    const dateOfAppointment = body.dateOfAppointment || existing.date_of_appointment;
    const dateOfRetirement = body.dateOfRetirement || existing.date_of_retirement;
    const appointmentNature = body.appointmentNature !== undefined ? body.appointmentNature : existing.appointment_nature;
    const address = body.address ? body.address.trim() : existing.address;
    const area = body.area ? body.area.trim() : existing.area;
    const emailId = body.emailId ? body.emailId.trim() : existing.email_id;
    const mobileNo = body.mobileNo ? body.mobileNo.trim() : existing.mobile_no;
    const remarks = body.remarks !== undefined ? body.remarks.trim() : existing.remarks;

    const sql = `
      UPDATE teachers SET
        sl_no = $1,
        udise_code = $2,
        school_name = $3,
        block = $4,
        school_type = $5,
        teacher_name = $6,
        sex = $7,
        designation = $8,
        qualification = $9,
        main_subject = $10,
        other_subject = $11,
        medium_of_teaching = $12,
        dob = $13,
        date_of_appointment = $14,
        date_of_retirement = $15,
        appointment_nature = $16,
        address = $17,
        area = $18,
        email_id = $19,
        mobile_no = $20,
        remarks = $21,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $22
    `;

    const params = [
      slNo, targetUdise, targetSchoolName, block, schoolType,
      teacherName, sex, designation, qualification,
      mainSubject, otherSubject, mediumOfTeaching,
      dob, dateOfAppointment, dateOfRetirement,
      appointmentNature, address, area, emailId, mobileNo, remarks,
      id
    ];

    await execute(sql, params);

    res.json({
      success: true,
      message: 'Teacher record updated successfully in the database.'
    });
  } catch (err) {
    console.error('Update teacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to update teacher record.' });
  }
});

/**
 * DELETE /api/teachers/:id
 * Delete a teacher record
 */
app.delete('/api/teachers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, schoolUdise } = req.user;

    const existing = await queryOne('SELECT * FROM teachers WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (role === 'school' && existing.udise_code !== schoolUdise) {
      return res.status(403).json({ success: false, message: 'Access denied: You cannot delete records of other schools.' });
    }

    await execute('DELETE FROM teachers WHERE id = $1', [id]);

    res.json({ success: true, message: 'Teacher record deleted successfully.' });
  } catch (err) {
    console.error('Delete teacher error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete teacher record.' });
  }
});

// ==========================================
// 4. Admin Management & Dashboard Statistics
// ==========================================

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Total teachers
    const totalTeachersRow = await queryOne('SELECT COUNT(*) as count FROM teachers');
    const totalTeachers = parseInt(totalTeachersRow.count || totalTeachersRow['count(*)'] || 0, 10);

    // 2. Active schools count (with >= 1 teacher)
    const activeSchoolsRow = await queryOne('SELECT COUNT(DISTINCT udise_code) as count FROM teachers');
    const submittedSchools = parseInt(activeSchoolsRow.count || activeSchoolsRow['count(*)'] || 0, 10);

    // 3. Breakdown by school type
    const bySchoolTypeRows = await query(`
      SELECT school_type, COUNT(*) as count 
      FROM teachers 
      GROUP BY school_type
    `);
    const bySchoolType = {};
    bySchoolTypeRows.forEach(r => {
      bySchoolType[r.school_type] = parseInt(r.count, 10);
    });

    // 4. Breakdown by designation
    const byDesignationRows = await query(`
      SELECT designation, COUNT(*) as count 
      FROM teachers 
      GROUP BY designation 
      ORDER BY count DESC
    `);
    const byDesignation = {};
    byDesignationRows.forEach(r => {
      byDesignation[r.designation] = parseInt(r.count, 10);
    });

    // 5. School submission progress table (all 138 schools)
    const schoolCounts = await query(`
      SELECT udise_code, COUNT(*) as teacher_count, MAX(updated_at) as last_updated
      FROM teachers
      GROUP BY udise_code
    `);
    const countMap = {};
    schoolCounts.forEach(r => {
      countMap[r.udise_code] = {
        count: parseInt(r.teacher_count, 10),
        lastUpdated: r.last_updated
      };
    });

    const schoolSummaries = Object.entries(SCHOOL_DIRECTORY).map(([udise, name]) => {
      const info = countMap[udise] || { count: 0, lastUpdated: null };
      return {
        udiseCode: udise,
        schoolName: name,
        teacherCount: info.count,
        lastUpdated: info.lastUpdated,
        status: info.count > 0 ? 'Submitted' : 'Pending'
      };
    });

    res.json({
      success: true,
      stats: {
        totalSchools: Object.keys(SCHOOL_DIRECTORY).length,
        submittedSchools,
        pendingSchools: Object.keys(SCHOOL_DIRECTORY).length - submittedSchools,
        totalTeachers,
        bySchoolType,
        byDesignation,
        schoolSummaries
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute administrative statistics.' });
  }
});

// ==========================================
// 5. Official EBS Report Export Endpoint
// ==========================================
app.get('/api/export', authenticateToken, async (req, res) => {
  try {
    const { role, schoolUdise } = req.user;
    const { sheet = 'ALL', format = 'xlsx', udise = 'ALL', schoolType, designation, mainSubject, block, search } = req.query;

    let targetUdise = udise;
    if (role === 'school') {
      targetUdise = schoolUdise; // School can only export their own school data
    }

    let sql = 'SELECT * FROM teachers';
    const params = [];
    const conditions = [];

    if (targetUdise && targetUdise !== 'ALL') {
      conditions.push(`udise_code = $${params.length + 1}`);
      params.push(targetUdise);
    }

    if (block) {
      conditions.push(`block = $${params.length + 1}`);
      params.push(block);
    }

    if (schoolType) {
      conditions.push(`school_type = $${params.length + 1}`);
      params.push(schoolType);
    }

    if (designation) {
      conditions.push(`designation = $${params.length + 1}`);
      params.push(designation);
    }

    if (mainSubject) {
      conditions.push(`main_subject = $${params.length + 1}`);
      params.push(mainSubject);
    }

    if (search) {
      const term = `%${search.trim()}%`;
      const idx = params.length + 1;
      conditions.push(`(
        LOWER(teacher_name) LIKE LOWER($${idx}) OR
        LOWER(udise_code) LIKE LOWER($${idx}) OR
        LOWER(school_name) LIKE LOWER($${idx}) OR
        LOWER(COALESCE(block, '')) LIKE LOWER($${idx}) OR
        LOWER(main_subject) LIKE LOWER($${idx}) OR
        LOWER(designation) LIKE LOWER($${idx}) OR
        mobile_no LIKE $${idx}
      )`);
      params.push(term);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY CAST(sl_no AS INTEGER) ASC, created_at DESC';

    const records = await query(sql, params);

    const exportResult = await generateEbsExport({
      records,
      targetSheet: sheet,
      udise: targetUdise,
      format
    });

    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate official EBS export: ' + err.message });
  }
});

// Fallback for non-API client routes to index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
