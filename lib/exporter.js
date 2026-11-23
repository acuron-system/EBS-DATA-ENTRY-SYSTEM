const ExcelJS = require('exceljs');
const path = require('path');
const { getSchoolName } = require('./schools');

const TEMPLATE_PATH = path.join(__dirname, '..', 'EBS 2026 - 2027.xlsx');

/**
 * Split Date string (YYYY-MM-DD or DD-MM-YYYY) into DD, MM, YYYY components
 */
function splitDate(dateStr) {
  if (!dateStr) return { dd: '', mm: '', yyyy: '' };
  const str = String(dateStr).trim();
  const parts = str.includes('-') ? str.split('-') : str.split('/');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return { yyyy: parts[0], mm: parts[1].padStart(2, '0'), dd: parts[2].padStart(2, '0') };
    } else {
      // DD-MM-YYYY
      return { dd: parts[0].padStart(2, '0'), mm: parts[1].padStart(2, '0'), yyyy: parts[2] };
    }
  }
  return { dd: '', mm: '', yyyy: '' };
}

/**
 * Map teacher designation to target Form Sheet
 */
function getTargetSheetName(designation, rec = {}) {
  const d = String(designation || '').toUpperCase().trim();
  const schoolName = String(rec.school_name || '').toUpperCase();
  
  if (d.includes('HEAD MASTER') || d.includes('HEADMASTER') || d.includes('HM')) {
    if (d.includes('HS HM') || (!d.includes('HSS') && (schoolName.includes(' HIGH SCHOOL') || schoolName.endsWith(' HS') || schoolName.includes(' HS.')))) {
      return 'HS HM';
    }
    return 'HSS HM';
  }
  if (d.includes('BT') || d.includes('BACHELOR OF TEACHING') || d.includes('TAMIL PANDIT') || d.includes('MALAYALAM PANDIT') || d.includes('PHYSICAL DIRECTOR GR.II') || d.includes('COMPUTER INSTRUCTOR GR.II')) return 'BT';
  if (d.includes('SECONDARY GRADE') || d.includes('SECONDARY  GRADE') || d.includes('SEC GRADE')) return 'SEC GRADE';
  if (d.includes('SPECIAL') || d.includes('DRAWING') || d.includes('MUSIC') || d.includes('SEWING') || d.includes('CRAFT') || d.includes('PHYSICAL EDUCATION') || d.includes('AGRICULTURE')) return 'SPL TEACHER';
  if (d.includes('OFFICE') || d.includes('ASSISTANT') || d.includes('CLERK') || d.includes('WATCHMAN') || d.includes('SWEEPER') || d.includes('LAB') || d.includes('RECORD')) return 'OFFICE';
  
  // Default for PG. ASST., Physical Director Gr.I, Vocational Instructor Gr.I, Computer Instructor Gr.I
  return 'PG';
}

/**
 * Map post name in Checklist to row index
 */
const CHECKLIST_POST_ROWS = {
  'Head Master HSS/HS': 4,
  'Post Graduate Assistant': 5,
  'PHYSICAL DIRECTOR GR.I': 6,
  'Bachelor Of Teaching Assistant': 7,
  'Tamil Pandit': 8,
  'MALAYALAM PANDIT': 9,
  'VOCATIONAL INSTRUCTOR GR.I': 10,
  'PHYSICAL DIRECTOR GR.II': 11,
  'COMPUTER INSTRUCTOR GR.I': 12,
  'COMPUTER INSTRUCTOR GR.II': 13,
  'SECONDARY  GRADE ASSISTANT': 14,
  'PHYSICAL EDUCATION TEACHER': 15,
  'SPECIAL TEACHER (DRAWING)': 16,
  'SPECIAL TEACHER (MUSIC )': 17,
  'SPECIAL TEACHER (SEWING )': 18,
  'SPECIAL TEACHER (CRAFT )': 19,
  'AGRICULTURE INSTRUCTOR': 20,
  'ASSISTANT': 21,
  'JUNIOR ASSISTANT': 22,
  'LAB ASSISTANT': 23,
  'RECORD ASSISTANT': 24,
  'RECORD CLERK': 25,
  'OFFICE ASSISTANT': 26,
  'WATCHMAN': 27,
  'SWEEPER': 28
};

function getChecklistPostName(designation) {
  if (!designation) return 'Post Graduate Assistant';
  const trimmed = String(designation).trim();
  if (CHECKLIST_POST_ROWS[trimmed]) return trimmed;
  
  const found = Object.keys(CHECKLIST_POST_ROWS).find(k => k.toUpperCase().replace(/\s+/g, ' ') === trimmed.toUpperCase().replace(/\s+/g, ' '));
  if (found) return found;

  const d = trimmed.toUpperCase();
  if (d.includes('HSS HM') || d.includes('HS HM') || d.includes('HEAD MASTER') || d.includes('HEADMASTER') || d.includes('HIGH SCHOOL')) return 'Head Master HSS/HS';
  if (d.includes('PHYSICAL DIRECTOR GR.II') || d.includes('PD GR.II') || d.includes('PD GR 2')) return 'PHYSICAL DIRECTOR GR.II';
  if (d.includes('PHYSICAL DIRECTOR') || d.includes('PD GR.I') || d.includes('PD GR 1')) return 'PHYSICAL DIRECTOR GR.I';
  if (d.includes('COMPUTER INSTRUCTOR GR.II')) return 'COMPUTER INSTRUCTOR GR.II';
  if (d.includes('COMPUTER INSTRUCTOR')) return 'COMPUTER INSTRUCTOR GR.I';
  if (d.includes('VOCATIONAL')) return 'VOCATIONAL INSTRUCTOR GR.I';
  if (d.includes('PG') || d.includes('POST GRADUATE')) return 'Post Graduate Assistant';
  if (d.includes('TAMIL PANDIT')) return 'Tamil Pandit';
  if (d.includes('MALAYALAM PANDIT')) return 'MALAYALAM PANDIT';
  if (d.includes('BT') || d.includes('BACHELOR')) return 'Bachelor Of Teaching Assistant';
  if (d.includes('SECONDARY') || d.includes('SEC GRADE')) return 'SECONDARY  GRADE ASSISTANT';
  if (d.includes('PHYSICAL EDUCATION') || d.includes('PET')) return 'PHYSICAL EDUCATION TEACHER';
  if (d.includes('DRAWING')) return 'SPECIAL TEACHER (DRAWING)';
  if (d.includes('MUSIC')) return 'SPECIAL TEACHER (MUSIC )';
  if (d.includes('SEWING')) return 'SPECIAL TEACHER (SEWING )';
  if (d.includes('CRAFT')) return 'SPECIAL TEACHER (CRAFT )';
  if (d.includes('AGRICULTURE')) return 'AGRICULTURE INSTRUCTOR';
  if (d.includes('JUNIOR ASSISTANT')) return 'JUNIOR ASSISTANT';
  if (d.includes('LAB ASSISTANT')) return 'LAB ASSISTANT';
  if (d.includes('RECORD CLERK')) return 'RECORD CLERK';
  if (d.includes('RECORD ASSISTANT')) return 'RECORD ASSISTANT';
  if (d.includes('OFFICE ASSISTANT')) return 'OFFICE ASSISTANT';
  if (d.includes('WATCHMAN')) return 'WATCHMAN';
  if (d.includes('SWEEPER')) return 'SWEEPER';
  if (d.includes('ASSISTANT')) return 'ASSISTANT';
  return 'Post Graduate Assistant';
}

/**
 * Generates an EBS Excel Workbook or single sheet from the official template
 */
async function generateEbsExport({ records = [], targetSheet = 'ALL', udise = 'ALL', format = 'xlsx' }) {
  const templateWb = new ExcelJS.Workbook();
  await templateWb.xlsx.readFile(TEMPLATE_PATH);

  // Group records by target sheet
  const grouped = {
    'HSS HM': [],
    'HS HM': [],
    'PG': [],
    'BT': [],
    'SEC GRADE': [],
    'SPL TEACHER': [],
    'OFFICE': []
  };

  records.forEach(rec => {
    const sName = getTargetSheetName(rec.designation, rec);
    if (grouped[sName]) {
      grouped[sName].push(rec);
    } else {
      grouped['PG'].push(rec);
    }
  });

  // 1. Populate CHECK sheet & fix formulas
  const checkWs = templateWb.getWorksheet('CHECK');
  if (checkWs) {
    let headerSchoolLabel = 'ALL DISTRICT INSTITUTIONS';
    if (udise && udise !== 'ALL') {
      const sName = getSchoolName(udise) || (records[0] ? records[0].school_name : '');
      headerSchoolLabel = `${udise} - ${sName}`;
    } else if (records.length > 0) {
      const uniqueUdises = [...new Set(records.map(r => r.udise_code))];
      if (uniqueUdises.length === 1) {
        headerSchoolLabel = `${uniqueUdises[0]} - ${records[0].school_name}`;
      }
    }
    checkWs.getCell('A2').value = ` School Name : ${headerSchoolLabel}`;

    // Normalize formula references in CHECK to avoid ExcelJS shared formula errors
    for (let r = 4; r <= 30; r++) {
      checkWs.getCell(`F${r}`).value = { formula: `SUM(C${r}:E${r})` };
    }
    checkWs.getCell('C31').value = { formula: 'SUM(C4:C30)' };
    checkWs.getCell('D31').value = { formula: 'SUM(D4:D30)' };
    checkWs.getCell('E31').value = { formula: 'SUM(E4:E30)' };
    checkWs.getCell('F31').value = { formula: 'SUM(C31:E31)' };

    // Count posts by category
    const postCounts = {};
    Object.keys(CHECKLIST_POST_ROWS).forEach(k => {
      postCounts[k] = { approved: 0, unapproved: 0, selfFinance: 0 };
    });

    records.forEach(r => {
      const postName = getChecklistPostName(r.designation);
      if (!postCounts[postName]) postCounts[postName] = { approved: 0, unapproved: 0, selfFinance: 0 };
      const nature = String(r.appointment_nature || '').toLowerCase();
      if (nature.includes('un-approved') || nature.includes('unapproved')) {
        postCounts[postName].unapproved++;
      } else if (nature.includes('self-finance') || nature.includes('selffinance')) {
        postCounts[postName].selfFinance++;
      } else {
        postCounts[postName].approved++;
      }
    });

    Object.entries(CHECKLIST_POST_ROWS).forEach(([postName, rowIdx]) => {
      const c = postCounts[postName] || { approved: 0, unapproved: 0, selfFinance: 0 };
      checkWs.getCell(rowIdx, 3).value = c.approved > 0 ? c.approved : null;
      checkWs.getCell(rowIdx, 4).value = c.unapproved > 0 ? c.unapproved : null;
      checkWs.getCell(rowIdx, 5).value = c.selfFinance > 0 ? c.selfFinance : null;
    });
  }

  // Helper to copy cell formatting
  function setFormattedCell(ws, rowIdx, colIdx, value) {
    const cell = ws.getCell(rowIdx, colIdx);
    cell.value = value !== undefined && value !== null ? value : '';
  }

  // 2. Populate Teacher Form Sheets
  ['HSS HM', 'HS HM', 'PG', 'BT', 'SEC GRADE', 'SPL TEACHER', 'OFFICE'].forEach(sName => {
    const ws = templateWb.getWorksheet(sName);
    if (!ws) return;

    const sheetRecords = grouped[sName] || [];
    let currentRow = 6;

    sheetRecords.forEach((rec, idx) => {
      const dob = splitDate(rec.dob);
      const ret = splitDate(rec.date_of_retirement);
      const app = splitDate(rec.date_of_appointment);
      const reg = splitDate(rec.date_of_appointment);

      if (sName === 'HSS HM' || sName === 'HS HM') {
        setFormattedCell(ws, currentRow, 1, idx + 1);
        setFormattedCell(ws, currentRow, 2, 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 3, rec.block || rec.area || 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 4, rec.udise_code);
        setFormattedCell(ws, currentRow, 5, rec.school_name);
        setFormattedCell(ws, currentRow, 6, rec.school_type);
        setFormattedCell(ws, currentRow, 7, rec.teacher_name);
        setFormattedCell(ws, currentRow, 8, rec.sex);
        setFormattedCell(ws, currentRow, 9, rec.designation);
        setFormattedCell(ws, currentRow, 10, rec.qualification);
        setFormattedCell(ws, currentRow, 11, rec.main_subject);
        setFormattedCell(ws, currentRow, 12, rec.other_subject || 'NIL');
        setFormattedCell(ws, currentRow, 13, rec.medium_of_teaching);
        setFormattedCell(ws, currentRow, 14, dob.dd);
        setFormattedCell(ws, currentRow, 15, dob.mm);
        setFormattedCell(ws, currentRow, 16, dob.yyyy);
        setFormattedCell(ws, currentRow, 17, ret.dd);
        setFormattedCell(ws, currentRow, 18, ret.mm);
        setFormattedCell(ws, currentRow, 19, ret.yyyy);
        setFormattedCell(ws, currentRow, 20, app.dd);
        setFormattedCell(ws, currentRow, 21, app.mm);
        setFormattedCell(ws, currentRow, 22, app.yyyy);
        setFormattedCell(ws, currentRow, 23, reg.dd);
        setFormattedCell(ws, currentRow, 24, reg.mm);
        setFormattedCell(ws, currentRow, 25, reg.yyyy);
        setFormattedCell(ws, currentRow, 26, rec.appointment_nature || '');
        setFormattedCell(ws, currentRow, 27, rec.address);
        setFormattedCell(ws, currentRow, 28, rec.area);
        setFormattedCell(ws, currentRow, 29, rec.mobile_no);
        setFormattedCell(ws, currentRow, 30, '');
        setFormattedCell(ws, currentRow, 31, rec.remarks || '');
      } else if (sName === 'PG') {
        setFormattedCell(ws, currentRow, 1, idx + 1);
        setFormattedCell(ws, currentRow, 2, 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 3, rec.block || rec.area || 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 4, rec.udise_code);
        setFormattedCell(ws, currentRow, 5, rec.school_name);
        setFormattedCell(ws, currentRow, 6, rec.school_type);
        setFormattedCell(ws, currentRow, 7, rec.teacher_name);
        setFormattedCell(ws, currentRow, 8, rec.sex);
        setFormattedCell(ws, currentRow, 9, rec.designation);
        setFormattedCell(ws, currentRow, 10, rec.qualification);
        setFormattedCell(ws, currentRow, 11, rec.main_subject);
        setFormattedCell(ws, currentRow, 12, rec.other_subject || 'NIL');
        setFormattedCell(ws, currentRow, 13, rec.main_subject);
        setFormattedCell(ws, currentRow, 14, rec.medium_of_teaching);
        setFormattedCell(ws, currentRow, 15, dob.dd);
        setFormattedCell(ws, currentRow, 16, dob.mm);
        setFormattedCell(ws, currentRow, 17, dob.yyyy);
        setFormattedCell(ws, currentRow, 18, ret.dd);
        setFormattedCell(ws, currentRow, 19, ret.mm);
        setFormattedCell(ws, currentRow, 20, ret.yyyy);
        setFormattedCell(ws, currentRow, 21, app.dd);
        setFormattedCell(ws, currentRow, 22, app.mm);
        setFormattedCell(ws, currentRow, 23, app.yyyy);
        setFormattedCell(ws, currentRow, 24, reg.dd);
        setFormattedCell(ws, currentRow, 25, reg.mm);
        setFormattedCell(ws, currentRow, 26, reg.yyyy);
        setFormattedCell(ws, currentRow, 27, rec.appointment_nature || '');
        setFormattedCell(ws, currentRow, 28, rec.address);
        setFormattedCell(ws, currentRow, 29, rec.area);
        setFormattedCell(ws, currentRow, 30, rec.email_id);
        setFormattedCell(ws, currentRow, 31, rec.mobile_no);
        setFormattedCell(ws, currentRow, 32, '');
        setFormattedCell(ws, currentRow, 33, rec.remarks || '');
      } else if (sName === 'BT') {
        setFormattedCell(ws, currentRow, 1, idx + 1);
        setFormattedCell(ws, currentRow, 2, 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 3, rec.block || rec.area || 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 4, rec.udise_code);
        setFormattedCell(ws, currentRow, 5, rec.school_name);
        setFormattedCell(ws, currentRow, 6, rec.school_type);
        setFormattedCell(ws, currentRow, 7, rec.teacher_name);
        setFormattedCell(ws, currentRow, 8, rec.sex);
        setFormattedCell(ws, currentRow, 9, rec.designation);
        setFormattedCell(ws, currentRow, 10, rec.qualification);
        setFormattedCell(ws, currentRow, 11, rec.main_subject);
        setFormattedCell(ws, currentRow, 12, rec.other_subject || 'NIL');
        setFormattedCell(ws, currentRow, 13, rec.main_subject);
        setFormattedCell(ws, currentRow, 14, rec.medium_of_teaching);
        setFormattedCell(ws, currentRow, 15, dob.dd);
        setFormattedCell(ws, currentRow, 16, dob.mm);
        setFormattedCell(ws, currentRow, 17, dob.yyyy);
        setFormattedCell(ws, currentRow, 18, ret.dd);
        setFormattedCell(ws, currentRow, 19, ret.mm);
        setFormattedCell(ws, currentRow, 20, ret.yyyy);
        setFormattedCell(ws, currentRow, 21, app.dd);
        setFormattedCell(ws, currentRow, 22, app.mm);
        setFormattedCell(ws, currentRow, 23, app.yyyy);
        setFormattedCell(ws, currentRow, 24, reg.dd);
        setFormattedCell(ws, currentRow, 25, reg.mm);
        setFormattedCell(ws, currentRow, 26, reg.yyyy);
        setFormattedCell(ws, currentRow, 27, '');
        setFormattedCell(ws, currentRow, 28, '');
        setFormattedCell(ws, currentRow, 29, '');
        setFormattedCell(ws, currentRow, 30, rec.appointment_nature || '');
        setFormattedCell(ws, currentRow, 31, rec.address);
        setFormattedCell(ws, currentRow, 32, rec.area);
        setFormattedCell(ws, currentRow, 33, rec.email_id);
        setFormattedCell(ws, currentRow, 34, rec.mobile_no);
        setFormattedCell(ws, currentRow, 35, '');
        setFormattedCell(ws, currentRow, 36, rec.remarks || '');
      } else if (sName === 'SEC GRADE') {
        setFormattedCell(ws, currentRow, 1, idx + 1);
        setFormattedCell(ws, currentRow, 2, 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 3, rec.block || rec.area || 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 4, rec.udise_code);
        setFormattedCell(ws, currentRow, 5, rec.school_name);
        setFormattedCell(ws, currentRow, 6, rec.school_type);
        setFormattedCell(ws, currentRow, 7, rec.teacher_name);
        setFormattedCell(ws, currentRow, 8, rec.sex);
        setFormattedCell(ws, currentRow, 9, rec.designation);
        setFormattedCell(ws, currentRow, 10, rec.qualification);
        setFormattedCell(ws, currentRow, 11, rec.main_subject);
        setFormattedCell(ws, currentRow, 12, rec.other_subject || 'NIL');
        setFormattedCell(ws, currentRow, 13, rec.medium_of_teaching);
        setFormattedCell(ws, currentRow, 14, dob.dd);
        setFormattedCell(ws, currentRow, 15, dob.mm);
        setFormattedCell(ws, currentRow, 16, dob.yyyy);
        setFormattedCell(ws, currentRow, 17, ret.dd);
        setFormattedCell(ws, currentRow, 18, ret.mm);
        setFormattedCell(ws, currentRow, 19, ret.yyyy);
        setFormattedCell(ws, currentRow, 20, app.dd);
        setFormattedCell(ws, currentRow, 21, app.mm);
        setFormattedCell(ws, currentRow, 22, app.yyyy);
        setFormattedCell(ws, currentRow, 23, reg.dd);
        setFormattedCell(ws, currentRow, 24, reg.mm);
        setFormattedCell(ws, currentRow, 25, reg.yyyy);
        setFormattedCell(ws, currentRow, 26, '');
        setFormattedCell(ws, currentRow, 27, '');
        setFormattedCell(ws, currentRow, 28, '');
        setFormattedCell(ws, currentRow, 29, rec.appointment_nature || '');
        setFormattedCell(ws, currentRow, 30, rec.address);
        setFormattedCell(ws, currentRow, 31, rec.area);
        setFormattedCell(ws, currentRow, 32, rec.mobile_no);
        setFormattedCell(ws, currentRow, 33, '');
        setFormattedCell(ws, currentRow, 34, rec.remarks || '');
      } else if (sName === 'SPL TEACHER') {
        setFormattedCell(ws, currentRow, 1, idx + 1);
        setFormattedCell(ws, currentRow, 2, 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 3, rec.block || rec.area || 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 4, rec.udise_code);
        setFormattedCell(ws, currentRow, 5, rec.school_name);
        setFormattedCell(ws, currentRow, 6, rec.school_type);
        setFormattedCell(ws, currentRow, 7, rec.teacher_name);
        setFormattedCell(ws, currentRow, 8, rec.sex);
        setFormattedCell(ws, currentRow, 9, rec.designation);
        setFormattedCell(ws, currentRow, 10, rec.qualification);
        setFormattedCell(ws, currentRow, 11, rec.main_subject);
        setFormattedCell(ws, currentRow, 12, rec.other_subject || 'NIL');
        setFormattedCell(ws, currentRow, 13, rec.medium_of_teaching);
        setFormattedCell(ws, currentRow, 14, dob.dd);
        setFormattedCell(ws, currentRow, 15, dob.mm);
        setFormattedCell(ws, currentRow, 16, dob.yyyy);
        setFormattedCell(ws, currentRow, 17, ret.dd);
        setFormattedCell(ws, currentRow, 18, ret.mm);
        setFormattedCell(ws, currentRow, 19, ret.yyyy);
        setFormattedCell(ws, currentRow, 20, app.dd);
        setFormattedCell(ws, currentRow, 21, app.mm);
        setFormattedCell(ws, currentRow, 22, app.yyyy);
        setFormattedCell(ws, currentRow, 23, reg.dd);
        setFormattedCell(ws, currentRow, 24, reg.mm);
        setFormattedCell(ws, currentRow, 25, reg.yyyy);
        setFormattedCell(ws, currentRow, 26, rec.appointment_nature || '');
        setFormattedCell(ws, currentRow, 27, rec.address);
        setFormattedCell(ws, currentRow, 28, rec.area);
        setFormattedCell(ws, currentRow, 29, rec.email_id);
        setFormattedCell(ws, currentRow, 30, rec.mobile_no);
        setFormattedCell(ws, currentRow, 31, '');
        setFormattedCell(ws, currentRow, 32, rec.remarks || '');
      } else if (sName === 'OFFICE') {
        setFormattedCell(ws, currentRow, 1, idx + 1);
        setFormattedCell(ws, currentRow, 2, 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 3, rec.block || rec.area || 'MARTHANDAM');
        setFormattedCell(ws, currentRow, 4, rec.udise_code);
        setFormattedCell(ws, currentRow, 5, rec.school_name);
        setFormattedCell(ws, currentRow, 6, rec.school_type);
        setFormattedCell(ws, currentRow, 7, rec.teacher_name);
        setFormattedCell(ws, currentRow, 8, rec.sex);
        setFormattedCell(ws, currentRow, 9, rec.designation);
        setFormattedCell(ws, currentRow, 10, rec.qualification);
        setFormattedCell(ws, currentRow, 11, dob.dd);
        setFormattedCell(ws, currentRow, 12, dob.mm);
        setFormattedCell(ws, currentRow, 13, dob.yyyy);
        setFormattedCell(ws, currentRow, 14, ret.dd);
        setFormattedCell(ws, currentRow, 15, ret.mm);
        setFormattedCell(ws, currentRow, 16, ret.yyyy);
        setFormattedCell(ws, currentRow, 17, app.dd);
        setFormattedCell(ws, currentRow, 18, app.mm);
        setFormattedCell(ws, currentRow, 19, app.yyyy);
        setFormattedCell(ws, currentRow, 20, reg.dd);
        setFormattedCell(ws, currentRow, 21, reg.mm);
        setFormattedCell(ws, currentRow, 22, reg.yyyy);
        setFormattedCell(ws, currentRow, 23, rec.appointment_nature || '');
        setFormattedCell(ws, currentRow, 24, rec.address);
        setFormattedCell(ws, currentRow, 25, rec.area);
        setFormattedCell(ws, currentRow, 26, rec.email_id);
        setFormattedCell(ws, currentRow, 27, rec.mobile_no);
        setFormattedCell(ws, currentRow, 28, '');
        setFormattedCell(ws, currentRow, 29, rec.remarks || '');
      }

      currentRow++;
    });
  });

  // 3. Handle Single Sheet Export Mode
  if (targetSheet && targetSheet !== 'ALL') {
    const sourceWs = templateWb.getWorksheet(targetSheet);
    if (!sourceWs) {
      throw new Error(`Sheet "${targetSheet}" not found in template.`);
    }

    // Export single worksheet as CSV
    if (format === 'csv') {
      const csvLines = [];
      sourceWs.eachRow((row) => {
        const rowVals = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          let val = cell.value;
          if (val && typeof val === 'object') {
            if (val.result !== undefined) val = val.result;
            else if (val.text !== undefined) val = val.text;
            else if (val.formula !== undefined) val = val.result || '';
            else val = '';
          }
          const cleanStr = String(val !== null && val !== undefined ? val : '').replace(/"/g, '""');
          rowVals.push(`"${cleanStr}"`);
        });
        csvLines.push(rowVals.join(','));
      });
      const schoolSuffix = (udise && udise !== 'ALL') ? `_${udise}` : '';
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: `EBS_${targetSheet.replace(/[^a-zA-Z0-9_-]/g, '_')}${schoolSuffix}_${new Date().toISOString().slice(0, 10)}.csv`,
        buffer: Buffer.from('\uFEFF' + csvLines.join('\n'), 'utf8')
      };
    }

    // Export single sheet as Excel Workbook
    templateWb.worksheets.forEach(ws => {
      if (ws.name !== targetSheet) {
        templateWb.removeWorksheet(ws.id);
      }
    });

    const buffer = await templateWb.xlsx.writeBuffer();
    const schoolSuffix = (udise && udise !== 'ALL') ? `_${udise}` : '';
    return {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `EBS_${targetSheet.replace(/[^a-zA-Z0-9_-]/g, '_')}${schoolSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      buffer
    };
  }

  // Full Multi-Sheet Workbook Export (.xlsx)
  const buffer = await templateWb.xlsx.writeBuffer();
  const schoolSuffix = (udise && udise !== 'ALL') ? `_${udise}` : '_District_All_Schools';
  return {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `EBS_2026-2027${schoolSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    buffer
  };
}

module.exports = {
  generateEbsExport
};
