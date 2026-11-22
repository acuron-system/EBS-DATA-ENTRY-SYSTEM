require('dotenv').config();
const app = require('./api/index');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
===========================================================
  EBS DATA ENTRY SYSTEM - DEO (Secondary) Marthandam
  District Educational Office Portal
===========================================================
  Server running at: http://localhost:${PORT}
  Environment:       ${process.env.NODE_ENV || 'development'}
  Database:          ${process.env.DATABASE_URL ? 'PostgreSQL (Cloud)' : 'SQLite (Local data.db)'}

  Roles & Default Credentials:
  ---------------------------------------------------------
  1. ADMIN ROLE (Full district access across all 138 schools):
     Username: admin
     Password: ${process.env.ADMIN_PASSWORD || 'Admin@DEO2026'}

  2. SCHOOL USER (Scoped access to individual school data):
     Username: <11-digit UDISE Code> (e.g. 33300700117)
     Password: <UDISE_Code>@123      (e.g. 33300700117@123)
===========================================================
`);
});

