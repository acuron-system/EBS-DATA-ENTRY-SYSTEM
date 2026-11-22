/**
 * EBS DATA ENTRY SYSTEM - Client Application
 * District Educational Office (Secondary) Marthandam
 */

// API Base URL (if page is opened as file:///, talk to localhost:3000 backend)
const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:3000' : '';

// Global State
let currentUser = null;
let allSchoolsList = [];
let schoolRecords = [];
let adminRecords = [];
let adminStatsData = null;
let confirmCallback = null;
let adminSearchDebounceTimer = null;

// Official 138 Registered Schools Directory (local instant cache)
const EMBEDDED_SCHOOLS = [
  {"udiseCode":"33300700117","schoolName":"ABRAHAM MEMORIAL .HSS-MARUTHANCODE"},
  {"udiseCode":"33300700414","schoolName":"AIDED HIGHER SECONDARY SCHOOL, MOTTAKALAI"},
  {"udiseCode":"33300600714","schoolName":"AIDED HS. KATTATHURAI"},
  {"udiseCode":"33300500319","schoolName":"AMALA CONVENT(G) H.S.S,THUCKALAY"},
  {"udiseCode":"33300900311","schoolName":"AMSI HIGH SCHOOL"},
  {"udiseCode":"33300600412","schoolName":"ARUNACHALAM HSS., THIRUVATTAR"},
  {"udiseCode":"33300500513","schoolName":"CARMAL GIRLS HSS MANALIKARAI"},
  {"udiseCode":"33300900709","schoolName":"CHRIST THE KING HS PIRACODE"},
  {"udiseCode":"33300500210","schoolName":"CHRISTUCOIL LMS HR SEC SCHOOL PALLIYADI"},
  {"udiseCode":"33300800708","schoolName":"CONCORDIA HR.SEC.SCHOOL-POTTETI"},
  {"udiseCode":"33300900117","schoolName":"CONCORDIA LUTHERAN HIGH SCHOOL,  KALPARAPOTTAI"},
  {"udiseCode":"33300800618","schoolName":"CSI SCHOOL FOR THE BLIND, IRENIPURAM"},
  {"udiseCode":"33300900614","schoolName":"CSI VV (G) HS IRENIPURAM"},
  {"udiseCode":"33300900612","schoolName":"CSI VV HSS IRENIPURAM"},
  {"udiseCode":"33300600503","schoolName":"DEVASAM H.S. THIRPARAPPU"},
  {"udiseCode":"33300700206","schoolName":"G H S  KALIAKKAVILAI"},
  {"udiseCode":"33300700207","schoolName":"G H S MECODE"},
  {"udiseCode":"33300700228","schoolName":"G H S S (BOYS)MARTHANDAM"},
  {"udiseCode":"33300700229","schoolName":"G H S S GIRLS MARTHANDAM"},
  {"udiseCode":"33300700225","schoolName":"G H S S VILAVANCODE"},
  {"udiseCode":"33300700419","schoolName":"GBFM HS DEVICODE"},
  {"udiseCode":"33300900706","schoolName":"GHS ATHENCODE"},
  {"udiseCode":"33300700110","schoolName":"GHS CHEMMANKALAI"},
  {"udiseCode":"33300800609","schoolName":"GHS KANJIRACODE"},
  {"udiseCode":"33300800417","schoolName":"GHS KEEZHKULAM WEST"},
  {"udiseCode":"33300600423","schoolName":"GHS KESAVAPURAM"},
  {"udiseCode":"33300600907","schoolName":"GHS KOTHAYAR LOWER CAMP"},
  {"udiseCode":"33300500515","schoolName":"GHS KUMARAPURAM"},
  {"udiseCode":"33300700111","schoolName":"GHS MELPURAM"},
  {"udiseCode":"33300500802","schoolName":"GHS PERUNCHILAMBU"},
  {"udiseCode":"33300500606","schoolName":"GHS PEYANKUZHI"},
  {"udiseCode":"33300700902","schoolName":"GHS- PULIYOORSALAI"},
  {"udiseCode":"33300600307","schoolName":"GHS THACHOOR"},
  {"udiseCode":"33300800311","schoolName":"GHS UDAYA MARTHANDAM"},
  {"udiseCode":"33300800610","schoolName":"GHS UNNAMALAIKADAI"},
  {"udiseCode":"33300500106","schoolName":"GHS VATHIYARKONAM"},
  {"udiseCode":"33300700810","schoolName":"GHS- VELLAMCODE"},
  {"udiseCode":"33300600106","schoolName":"GHS VILLUNNIKONAM"},
  {"udiseCode":"33300500605","schoolName":"GHS(GIRLS),ERANIEL"},
  {"udiseCode":"33300600114","schoolName":"GHS. CHERUKOLE"},
  {"udiseCode":"33300600408","schoolName":"GHS. CHERUPPALOR"},
  {"udiseCode":"33300600707","schoolName":"GHS. ERAVIPUTHOORKADAI"},
  {"udiseCode":"33300600604","schoolName":"GHS. PONMANAI"},
  {"udiseCode":"33300600803","schoolName":"GHS. THIRUNANTHIKARAI"},
  {"udiseCode":"33300600409","schoolName":"GHS. THIRUVARAMBU"},
  {"udiseCode":"33300600410","schoolName":"GHS. THIRUVATTAR"},
  {"udiseCode":"33300600706","schoolName":"GHS. VEEYANOOR"},
  {"udiseCode":"33300600208","schoolName":"GHS.POOVANCODE"},
  {"udiseCode":"33300800705","schoolName":"GHSS KARUNGAL"},
  {"udiseCode":"33300600708","schoolName":"GHSS KATTATHURAI"},
  {"udiseCode":"33300800406","schoolName":"GHSS KEEZHKULAM"},
  {"udiseCode":"33300800312","schoolName":"GHSS MATHICODE"},
  {"udiseCode":"33300800611","schoolName":"GHSS NATTALAM"},
  {"udiseCode":"33300700112","schoolName":"GHSS THIKKURICHY"},
  {"udiseCode":"33300600606","schoolName":"GHSS. KULASEKARAM"},
  {"udiseCode":"33300500607","schoolName":"GHSS.KANDANVILAI"},
  {"udiseCode":"33300700811","schoolName":"GHSS-ARUMANAI"},
  {"udiseCode":"33300500712","schoolName":"GHSS-KANNATTUVILAI"},
  {"udiseCode":"33300800105","schoolName":"GHSS-NALLOOR"},
  {"udiseCode":"33300700306","schoolName":"GHSS-PALUKAL"},
  {"udiseCode":"33300500711","schoolName":"GHSS-THRIVITHANCODE"},
  {"udiseCode":"33300900107","schoolName":"GOVERNMENT  HIGHER SECONDARY  SCHOOL ,KOLLENCODE"},
  {"udiseCode":"33300900307","schoolName":"GOVERNMENT HIGH SCHOOL  ANANTHAMANGALAM"},
  {"udiseCode":"33300500404","schoolName":"GOVERNMENT HIGH SCHOOL, MOOLACHI"},
  {"udiseCode":"33300700711","schoolName":"GOVERNMENT HIGH SCHOOL,UTHIRAMCODE"},
  {"udiseCode":"33300900308","schoolName":"GOVERNMENT HIGHER SECONDARY SCHOOL  THENGAPATTANAM"},
  {"udiseCode":"33300500308","schoolName":"GOVERNMENT HIGHER SECONDARY SCHOOL,KALKULAM"},
  {"udiseCode":"33300700603","schoolName":"GOVERNMENT MODEL HIGHER SECONDARY SCHOOL  KADAYAL"},
  {"udiseCode":"33300900408","schoolName":"GOVERNMENT MODEL HIGHER SECONDARY SCHOOL MUNCHIRAI"},
  {"udiseCode":"33300700605","schoolName":"GOVERNMENT TRIBAL RESIDENTIAL HIGHER SECONDARY SCHOOL, PATHUKANI"},
  {"udiseCode":"33300900226","schoolName":"GOVT ADW HIGHER SECONDARY SCHOOL KALINGARAJAPURAM"},
  {"udiseCode":"33300600605","schoolName":"GOVT HIGH SCHOOL MANGALAM"},
  {"udiseCode":"33300900607","schoolName":"GOVT HS MARAYAPURAM"},
  {"udiseCode":"33300900705","schoolName":"GOVT HS PALKULAM"},
  {"udiseCode":"33300900208","schoolName":"GOVT HSS EZHUDESAPATTU"},
  {"udiseCode":"33300500310","schoolName":"GOVT MODEL HR SEC SCHOOL THUCKALAY"},
  {"udiseCode":"33300600504","schoolName":"GOVT. TRIBAL RESIDENTIAL HSS PECHIPPARAI"},
  {"udiseCode":"33300600908","schoolName":"GTR HIGH SCHOOL -MANALODAI"},
  {"udiseCode":"33300500609","schoolName":"HACKER MEMORIAL HSS ,NEYYOOR"},
  {"udiseCode":"33300700416","schoolName":"HF HSS MUKKUTTUKAL"},
  {"udiseCode":"33300700610","schoolName":"HOLY FAMILY H S ARUKANI"},
  {"udiseCode":"33300700812","schoolName":"HSS-ARUMANAI"},
  {"udiseCode":"33300500715","schoolName":"INFANT JESUS GIRLS HIGH SCHOOL -  MULAGUMOODU"},
  {"udiseCode":"33300700813","schoolName":"KAMARAJ MEMORIAL HSS-PANTHALUVILAI, MANJALUMOODU"},
  {"udiseCode":"33300700232","schoolName":"L M S GIRLS H S S MARTHANDAM"},
  {"udiseCode":"33300700231","schoolName":"L.M.S HIGHER SECONDARY SCHOOL FOR BOYS,MARTHANDAM."},
  {"udiseCode":"33300800210","schoolName":"LMS HSS - MATHICODE"},
  {"udiseCode":"33300500514","schoolName":"LMS HSS KADAMALAIKUNTU"},
  {"udiseCode":"33300900710","schoolName":"M.M.K.M. H.S. VARUTHATTU"},
  {"udiseCode":"33300600211","schoolName":"M.V. H.S. CHENKODI"},
  {"udiseCode":"33300900118","schoolName":"MAR GREGORIOS M.S.C. HIGH SCHOOL KIRATHOOR"},
  {"udiseCode":"33300700237","schoolName":"MJKM MSC.HR.SEC. SCHOOL, CHRISTURAJAPURAM -MARTHANDAM"},
  {"udiseCode":"33300900214","schoolName":"PIUS XI  HSS  THOOTHOOR"},
  {"udiseCode":"33300700707","schoolName":"PPM H S S ANDUCODE"},
  {"udiseCode":"33300700415","schoolName":"PRIVATE HSS KALLUPALAM"},
  {"udiseCode":"33300500209","schoolName":"RC HIGH SCHOOL PALLIYADI"},
  {"udiseCode":"33300500511","schoolName":"RCHS CHEMPARUTHIVILAI"},
  {"udiseCode":"33300900122","schoolName":"RTM LMS HSS VENKANCHI"},
  {"udiseCode":"33300700116","schoolName":"SACRED HEART H S PACODE"},
  {"udiseCode":"33300900120","schoolName":"SREEDEVI GIRLS Higher Secondary  School  KOLLAMCODE"},
  {"udiseCode":"33300900121","schoolName":"ST ALOYSIUS HSS MARTHANDANTHURAI"},
  {"udiseCode":"33300900610","schoolName":"ST ANTONYS HS KAPPUKADU"},
  {"udiseCode":"33300900411","schoolName":"ST FRANCIS HSS  VAVARAI"},
  {"udiseCode":"33300700311","schoolName":"ST JAMES H S PARAKUNNU"},
  {"udiseCode":"33300900116","schoolName":"ST JOSEPH HIGH SCHOOL,  SILUVAIPURAM"},
  {"udiseCode":"33300900213","schoolName":"ST JOSEPH HS KARUNYAPURAM"},
  {"udiseCode":"33300500716","schoolName":"ST JOSEPH'S HSS MULAGUMOODU"},
  {"udiseCode":"33300700221","schoolName":"ST JOSEPH'S HSS THIRUTHAPURAM"},
  {"udiseCode":"33300700612","schoolName":"ST MARYS HSS KALIYAL"},
  {"udiseCode":"33300700413","schoolName":"ST MARYS HSS MELPALAI"},
  {"udiseCode":"33300900129","schoolName":"ST NICHOLAS HIGH SCHOOL NEERODITHURAI"},
  {"udiseCode":"33300900119","schoolName":"ST STEPHEN HIGH SCHOOL  SOUTHPALAVILAI"},
  {"udiseCode":"33300800617","schoolName":"ST. AHS ELAVUVILAI"},
  {"udiseCode":"33300800412","schoolName":"ST. AHSS ENAMPUTHENTHURAI"},
  {"udiseCode":"33300800209","schoolName":"ST. ALOYSIUS GIRLS HSS VELLIAVILAI"},
  {"udiseCode":"33300800318","schoolName":"ST. ANTONY'S  HIGH SCHOOL ,THUNDATHUVILAI"},
  {"udiseCode":"33300800707","schoolName":"ST. ANTONY'S HIGH SCHOOL, MULLANGANAVILAI"},
  {"udiseCode":"33300600906","schoolName":"ST. ANTONY'S HS. SURULACODE"},
  {"udiseCode":"33300800319","schoolName":"ST. BERNADETTE'S HSS MANGALAKUNTU"},
  {"udiseCode":"33300800509","schoolName":"ST. FRANCIS HSS VENCODE"},
  {"udiseCode":"33300800208","schoolName":"ST. FRANCIS XAVIER H.S - ALANCHI"},
  {"udiseCode":"33300800411","schoolName":"ST. HELEN HS ENAYAM"},
  {"udiseCode":"33300800507","schoolName":"ST. JHS VALIYAVILAI"},
  {"udiseCode":"33300800413","schoolName":"ST. JO HS-RAMANTHURAI"},
  {"udiseCode":"33300800615","schoolName":"ST. JOHN VIANNEY'S GIRLS' HR. SEC. SCHOOL , PALLIYADI"},
  {"udiseCode":"33300600712","schoolName":"ST. JOSEPH'S HIGH SCHOOL MULAVILAI"},
  {"udiseCode":"33300600713","schoolName":"ST. JOSEPH'S HIGH SCHOOL PILANKALAI"},
  {"udiseCode":"33300800508","schoolName":"ST. JOSEPH'S HIGHER SECONDARY SCHOOL VIZHUNTHAYAMBALAM"},
  {"udiseCode":"33300500516","schoolName":"ST. MARY GORETTY HSS  MANALIKARAI"},
  {"udiseCode":"33300800616","schoolName":"ST. MSC HS NATTALAM"},
  {"udiseCode":"33300600506","schoolName":"ST. PETER'S HSS. CHEKKAL"},
  {"udiseCode":"33300600805","schoolName":"ST. URSULA'S GIRLS HSS KULASEKHARAM"},
  {"udiseCode":"33300900510","schoolName":"ST.EPHREM'S M.S.C  HSS, SOORIACODE"},
  {"udiseCode":"33300800325","schoolName":"ST.JOSEPH HIGH SCHOOL-MATHIRAVILAI"},
  {"udiseCode":"33300500109","schoolName":"St.Joseph's M.S.C.H.S.S,Chellamkonam"},
  {"udiseCode":"33300700611","schoolName":"ST.THOMAS HIGH SCHOOL-NETTA"},
  {"udiseCode":"33300700209","schoolName":"T. C. K. H. S. S PADANTHALUMOODU"},
  {"udiseCode":"33300600109","schoolName":"YETTACODE HSS. YETTACODE"},
  {"udiseCode":"3330097696","schoolName":"DEMO MATRIC HR SEC SCHOOL"}
];

// Official Subjects Registry (35 subjects)
const SUBJECT_OPTIONS = [
  "TAMIL",
  "MALAYALAM",
  "ENGLISH",
  "MATHS",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "BOTANY",
  "ZOOLOGY",
  "COMPUTER SCIENCE",
  "EMPLOYABILIGY SKILLS",
  "COMPUTER APPLICATION",
  "MICRO BIOLOGY",
  "BUSINESS MATHS AND STATISTIC",
  "HOME SCIENCE",
  "STATISTICS",
  "VANCE TAMIL",
  "ETHICS AND INDIAN CULTURE",
  "HISTORY",
  "GEOGRAPHY",
  "ECONOMICS",
  "POLITICAL SCIENCE",
  "COMMERCE",
  "ACCOUNTANCY",
  "NURSING (G)",
  "NURSING (V)",
  "BASIC ELECTRICAL ENGG. THEORY",
  "BASIC ELECTRONICS ENGG. THEORY",
  "BASIC CIVIL ENGG. THEROY",
  "BASIC MECHANICAL ENGG THEORY",
  "AGRICULTURE SICENCE THEORY",
  "OFFICE MANAGEMENT AND SECRETARYSHIP THEORY",
  "LANGUAGE HINDI",
  "LANGUAGE FRENCH",
  "NIL"
];

// ==========================================
// Authentication Token Helpers
// ==========================================
function getAuthToken() {
  try {
    return localStorage.getItem("auth_token") || null;
  } catch (e) {
    return null;
  }
}

function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  } catch (e) {}
}

/**
 * Universal API fetch helper
 * Automatically injects API_BASE and Bearer auth token
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  options.headers = options.headers || {};
  const token = getAuthToken();
  if (token && !options.headers["Authorization"]) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  // When opened via file:///, omit credentials to prevent cross-origin cookie rejection in Chrome
  if (window.location.protocol !== "file:") {
    options.credentials = "include";
  }
  return fetch(url, options);
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.protocol === "file:") {
    const banner = document.getElementById("fileNoticeBanner");
    if (banner) banner.classList.remove("hidden");
  }

  // Pre-seed schools list immediately from embedded cache
  allSchoolsList = EMBEDDED_SCHOOLS;
  populateSchoolSelects();

  populateSubjectDropdowns();
  setupInputNumericFilters();
  setupUdiseLiveLookup();

  // Load dynamically from backend if available
  await loadSchoolsDirectory();
  await checkCurrentSession();
});

/**
 * Populate Main & Other Subject dropdowns across all forms
 */
function populateSubjectDropdowns() {
  document.querySelectorAll(".subject-select-main").forEach(sel => {
    sel.innerHTML = '<option value="" disabled selected>-- Select Main Subject --</option>';
    SUBJECT_OPTIONS.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      sel.appendChild(opt);
    });
  });

  document.querySelectorAll(".subject-select-other").forEach(sel => {
    sel.innerHTML = '';
    SUBJECT_OPTIONS.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub;
      opt.textContent = sub;
      if (sub === "NIL") opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

/**
 * Filter numeric-only fields
 */
function setupInputNumericFilters() {
  ["schoolUdiseInput", "schoolMobileNo", "adminModalMobile"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        el.value = el.value.replace(/\D/g, "");
      });
    }
  });
}

/**
 * Live UDISE validation and school name lookup in Login View
 */
function setupUdiseLiveLookup() {
  const input = document.getElementById("schoolUdiseInput");
  const counter = document.getElementById("schoolDigitCounter");
  const badge = document.getElementById("schoolMatchBadge");
  const preview = document.getElementById("schoolNamePreview");
  const previewText = document.getElementById("schoolNamePreviewText");

  input.addEventListener("input", () => {
    const val = input.value.trim();
    counter.textContent = `${val.length} digits`;

    const matched = allSchoolsList.find(s => s.udiseCode === val);
    if (matched) {
      badge.classList.remove("hidden");
      preview.classList.remove("hidden");
      previewText.textContent = matched.schoolName;
      counter.classList.replace("text-slate-400", "text-emerald-600");
      counter.classList.add("font-bold");
    } else {
      badge.classList.add("hidden");
      preview.classList.add("hidden");
      previewText.textContent = "";
      counter.classList.replace("text-emerald-600", "text-slate-400");
      counter.classList.remove("font-bold");
    }
    hideLoginError();
  });

  document.getElementById("schoolPasswordInput").addEventListener("input", hideLoginError);
  document.getElementById("adminUsernameInput").addEventListener("input", hideLoginError);
  document.getElementById("adminPasswordInput").addEventListener("input", hideLoginError);
}

/**
 * Fetch directory of 138 schools from server
 */
async function loadSchoolsDirectory() {
  try {
    const res = await apiFetch("/api/schools");
    const data = await res.json();
    if (data.success && Array.isArray(data.schools)) {
      allSchoolsList = data.schools;
      populateSchoolSelects();
    }
  } catch (e) {
    // Falls back seamlessly to EMBEDDED_SCHOOLS
    console.warn("Using embedded schools directory fallback.");
  }
}

/**
 * Populate school selection dropdowns in admin filter and modal
 */
function populateSchoolSelects() {
  const filterSel = document.getElementById("adminFilterSchool");
  const modalSel = document.getElementById("adminModalSchoolSelect");
  const exportSel = document.getElementById("exportSchoolSelect");

  if (filterSel) {
    filterSel.innerHTML = '<option value="ALL">All District Schools</option>';
    allSchoolsList.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.udiseCode;
      opt.textContent = `${s.udiseCode} - ${s.schoolName}`;
      filterSel.appendChild(opt);
    });
  }

  if (modalSel) {
    modalSel.innerHTML = '<option value="" disabled selected>-- Select School from Directory --</option>';
    allSchoolsList.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.udiseCode;
      opt.textContent = `${s.udiseCode} - ${s.schoolName}`;
      modalSel.appendChild(opt);
    });
  }

  if (exportSel) {
    const currentVal = exportSel.value;
    exportSel.innerHTML = '<option value="ALL">All District Schools (Combined Workbook)</option>';
    allSchoolsList.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.udiseCode;
      opt.textContent = `${s.udiseCode} - ${s.schoolName}`;
      exportSel.appendChild(opt);
    });
    if (currentVal) exportSel.value = currentVal;
  }
}

/**
 * Check if user already has an active session
 */
async function checkCurrentSession() {
  const token = getAuthToken();
  if (!token) {
    showLoginView();
    return;
  }

  try {
    const res = await apiFetch("/api/auth/me");
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      renderAppForUser(currentUser);
    } else {
      setAuthToken(null);
      showLoginView();
    }
  } catch (e) {
    showLoginView();
  }
}

// ==========================================
// Authentication & Role Routing
// ==========================================

function switchLoginTab(role) {
  const tabSchool = document.getElementById("tabSchoolLogin");
  const tabAdmin = document.getElementById("tabAdminLogin");
  const formSchool = document.getElementById("schoolLoginForm");
  const formAdmin = document.getElementById("adminLoginForm");

  hideLoginError();

  if (role === "school") {
    tabSchool.className = "flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer text-center bg-white shadow-xs text-slate-900";
    tabAdmin.className = "flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer text-center text-slate-600 hover:text-slate-900";
    formSchool.classList.remove("hidden");
    formAdmin.classList.add("hidden");
  } else {
    tabAdmin.className = "flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer text-center bg-white shadow-xs text-slate-900";
    tabSchool.className = "flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer text-center text-slate-600 hover:text-slate-900";
    formAdmin.classList.remove("hidden");
    formSchool.classList.add("hidden");
  }
}

function showLoginError(title, msg) {
  const box = document.getElementById("loginErrorAlert");
  document.getElementById("loginErrorTitle").textContent = title;
  document.getElementById("loginErrorMessage").textContent = msg;
  box.classList.remove("hidden", "animate-shake");
  void box.offsetWidth;
  box.classList.add("animate-shake");
}

function hideLoginError() {
  document.getElementById("loginErrorAlert").classList.add("hidden");
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPass = input.type === "password";
  input.type = isPass ? "text" : "password";
  const icon = btn.querySelector("i");
  if (isPass) {
    icon.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    icon.classList.replace("fa-eye-slash", "fa-eye");
  }
}

// School Login Submission
document.getElementById("schoolLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideLoginError();

  const udise = document.getElementById("schoolUdiseInput").value.trim();
  const password = document.getElementById("schoolPasswordInput").value;

  if (!udise) {
    showLoginError("UDISE Code Required", "Please enter your institutional UDISE Code.");
    return;
  }
  if (!/^\d{10,11}$/.test(udise)) {
    showLoginError("Invalid Format", "UDISE Code must be 10 or 11 numeric digits.");
    return;
  }
  if (!password) {
    showLoginError("Password Required", "Please enter your password in format <UDISE_Code>@123.");
    return;
  }

  const btn = document.getElementById("schoolSubmitBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Verifying...';

  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: udise, password })
    });
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      setAuthToken(data.token);
      showToast(`Welcome, ${currentUser.schoolName}!`, "success");
      renderAppForUser(currentUser);
    } else {
      showLoginError("Authentication Failed", data.message || "Invalid credentials.");
    }
  } catch (err) {
    const hint = (window.location.protocol === 'file:')
      ? "Cannot connect to server at http://localhost:3000. Please start the server by running 'npm start' (or double-clicking 'start.bat') in your project folder, then open http://localhost:3000."
      : "Could not connect to the server. Please check your network or ensure the server is running.";
    showLoginError("Connection Error", hint);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Verify &amp; Enter School Portal</span><i class="fa-solid fa-arrow-right text-xs"></i>';
  }
});

// Admin Login Submission
document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideLoginError();

  const username = document.getElementById("adminUsernameInput").value.trim();
  const password = document.getElementById("adminPasswordInput").value;

  if (!username || !password) {
    showLoginError("Credentials Required", "Please enter administrator username and password.");
    return;
  }

  const btn = document.getElementById("adminSubmitBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Authenticating...';

  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      setAuthToken(data.token);
      showToast("Signed in as District Administrator.", "success");
      renderAppForUser(currentUser);
    } else {
      showLoginError("Admin Authentication Failed", data.message || "Invalid credentials.");
    }
  } catch (err) {
    const hint = (window.location.protocol === 'file:')
      ? "Cannot reach server at http://localhost:3000. Please start the server with 'npm start' (or double-click 'start.bat') and visit http://localhost:3000."
      : "Could not connect to the server. Please check your network or ensure the server is running.";
    showLoginError("Connection Error", hint);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In as District Administrator</span><i class="fa-solid fa-lock-open text-xs"></i>';
  }
});

// Logout Handler
async function handleLogout() {
  openConfirmModal(
    "Sign Out",
    "Are you sure you want to sign out of the EBS DATA ENTRY SYSTEM?",
    async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } catch (e) {}
      setAuthToken(null);
      currentUser = null;
      schoolRecords = [];
      adminRecords = [];
      showLoginView();
      showToast("Signed out successfully.", "info");
    }
  );
}

function showLoginView() {
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("schoolDashboard").classList.add("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");

  document.getElementById("unauthHeaderBadge").classList.remove("hidden");
  document.getElementById("authHeaderGroup").classList.add("hidden");
}

function renderAppForUser(user) {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("unauthHeaderBadge").classList.add("hidden");
  document.getElementById("authHeaderGroup").classList.remove("hidden");

  const roleLabel = document.getElementById("userRoleLabel");
  const schoolHeader = document.getElementById("schoolHeaderName");

  if (user.role === "admin") {
    roleLabel.textContent = "District Admin";
    schoolHeader.classList.add("hidden");
    document.getElementById("schoolDashboard").classList.add("hidden");
    document.getElementById("adminDashboard").classList.remove("hidden");
    initAdminDashboard();
  } else {
    roleLabel.textContent = "School User";
    schoolHeader.textContent = user.schoolName || user.schoolUdise;
    schoolHeader.classList.remove("hidden");
    document.getElementById("adminDashboard").classList.add("hidden");
    document.getElementById("schoolDashboard").classList.remove("hidden");
    initSchoolDashboard();
  }
}

// ==========================================
// School User Features & Handlers
// ==========================================

async function initSchoolDashboard() {
  document.getElementById("schoolBannerUdise").textContent = currentUser.schoolUdise;
  document.getElementById("schoolBannerName").textContent = currentUser.schoolName;

  // Lock school details in form
  document.getElementById("schoolFormUdise").value = currentUser.schoolUdise;
  document.getElementById("schoolFormName").value = currentUser.schoolName;

  await loadSchoolTeachers();
}

async function loadSchoolTeachers() {
  try {
    const res = await apiFetch("/api/teachers");
    const data = await res.json();
    if (data.success && Array.isArray(data.records)) {
      schoolRecords = data.records;
      const countEl = document.getElementById("schoolTeacherCount");
      if (countEl) countEl.textContent = schoolRecords.length;
      renderSchoolTable();
      calculateSchoolNextSlNo();
    }
  } catch (e) {
    console.error("loadSchoolTeachers error:", e);
    showToast("Failed to fetch teacher records from database.", "error");
  }
}

function calculateSchoolNextSlNo() {
  const slInput = document.getElementById("schoolSlNo");
  const isEditing = !!document.getElementById("schoolEditRecordId")?.value;
  if (!slInput || isEditing) return;

  const maxSl = (schoolRecords || []).reduce((max, r) => {
    const n = parseInt(r.sl_no, 10);
    return !isNaN(n) && n > max ? n : max;
  }, 0);
  slInput.value = maxSl + 1;
}

function renderSchoolTable() {
  const tbody = document.getElementById("schoolRecordsTableBody");
  const empty = document.getElementById("schoolEmptyState");
  if (!tbody) return;

  const searchInput = document.getElementById("schoolSearchInput");
  const query = (searchInput ? searchInput.value : "").toLowerCase().trim();

  const filtered = (schoolRecords || []).filter(r => {
    if (!query) return true;
    return (
      (r.teacher_name || "").toLowerCase().includes(query) ||
      (r.main_subject || "").toLowerCase().includes(query) ||
      (r.designation || "").toLowerCase().includes(query) ||
      (r.mobile_no || "").includes(query)
    );
  });

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    if (empty) empty.classList.remove("hidden");
    return;
  }

  if (empty) empty.classList.add("hidden");

  filtered.forEach(rec => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="px-4 py-3 sticky left-0 bg-white border-r border-slate-100 z-10">
        <div class="flex items-center space-x-2">
          <button type="button" onclick="editSchoolRecord('${rec.id}')" title="Edit Record" class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" onclick="deleteSchoolRecord('${rec.id}', '${escapeHTML(rec.teacher_name)}')" title="Delete Record" class="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
      <td class="px-4 py-3 font-semibold text-slate-900">${escapeHTML(rec.sl_no)}</td>
      <td class="px-4 py-3 font-mono text-slate-700">${escapeHTML(rec.udise_code)}</td>
      <td class="px-4 py-3 font-medium text-slate-900">${escapeHTML(rec.school_name)}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">${escapeHTML(rec.school_type)}</span></td>
      <td class="px-4 py-3 font-semibold text-indigo-950">${escapeHTML(rec.teacher_name)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.sex)}</td>
      <td class="px-4 py-3 font-medium">${escapeHTML(rec.designation)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.qualification)}</td>
      <td class="px-4 py-3 font-semibold text-emerald-800">${escapeHTML(rec.main_subject)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHTML(rec.other_subject)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.medium_of_teaching)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.dob)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.date_of_appointment)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.date_of_retirement)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHTML(rec.appointment_nature || "-")}</td>
      <td class="px-4 py-3 max-w-xs truncate" title="${escapeHTML(rec.address)}">${escapeHTML(rec.address)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.area)}</td>
      <td class="px-4 py-3 text-indigo-600">${escapeHTML(rec.email_id)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.mobile_no)}</td>
      <td class="px-4 py-3 max-w-xs truncate text-slate-500" title="${escapeHTML(rec.remarks)}">${escapeHTML(rec.remarks || "-")}</td>
    `;
    tbody.appendChild(tr);
  });
}

// School Form Submission (Create or Update)
document.getElementById("schoolTeacherForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const editId = document.getElementById("schoolEditRecordId").value;
  const sexRadio = document.querySelector('input[name="schoolSex"]:checked');

  if (!sexRadio) {
    showToast("Please select SEX (Male, Female, or Others).", "error");
    return;
  }

  const mobile = document.getElementById("schoolMobileNo").value.trim();
  if (!/^\d{10}$/.test(mobile)) {
    showToast("Mobile number must be exactly 10 digits.", "error");
    document.getElementById("schoolMobileNo").focus();
    return;
  }

  if (!this.checkValidity()) {
    this.reportValidity();
    showToast("Please fill in all mandatory fields marked with *.", "error");
    return;
  }

  const payload = {
    slNo: document.getElementById("schoolSlNo").value.trim(),
    udiseCode: currentUser.schoolUdise,
    schoolName: currentUser.schoolName,
    schoolType: document.getElementById("schoolFormType").value,
    teacherName: document.getElementById("schoolTeacherName").value.trim(),
    sex: sexRadio.value,
    designation: document.getElementById("schoolDesignation").value,
    qualification: document.getElementById("schoolQualification").value.trim(),
    mainSubject: document.getElementById("schoolMainSubject").value,
    otherSubject: document.getElementById("schoolOtherSubject").value || "NIL",
    mediumOfTeaching: document.getElementById("schoolMediumOfTeaching").value,
    dob: document.getElementById("schoolDob").value,
    dateOfAppointment: document.getElementById("schoolDateOfAppointment").value,
    dateOfRetirement: document.getElementById("schoolDateOfRetirement").value,
    appointmentNature: document.getElementById("schoolAppointmentNature").value || "",
    address: document.getElementById("schoolAddress").value.trim(),
    area: document.getElementById("schoolArea").value.trim(),
    emailId: document.getElementById("schoolEmailId").value.trim(),
    mobileNo: mobile,
    remarks: document.getElementById("schoolRemarks").value.trim()
  };

  const btn = document.getElementById("schoolSubmitRecordBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saving...';

  try {
    const url = editId ? `/api/teachers/${editId}` : "/api/teachers";
    const method = editId ? "PUT" : "POST";

    const res = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(editId ? "Teacher record updated in database!" : "Teacher record saved to database!", "success");
      cancelSchoolEdit();
      await loadSchoolTeachers();
    } else {
      showToast(data.message || "Failed to save record.", "error");
    }
  } catch (err) {
    console.error("Save teacher error:", err);
    showToast("Error while saving record: " + (err.message || "Network error"), "error");
  } finally {
    const currentBtn = document.getElementById("schoolSubmitRecordBtn");
    if (currentBtn) {
      currentBtn.disabled = false;
      const isEditing = !!document.getElementById("schoolEditRecordId")?.value;
      currentBtn.innerHTML = '<i class="fa-solid fa-plus-circle mr-2"></i> <span id="schoolSubmitBtnText">' + (isEditing ? "Update Record" : "Save Teacher Record") + '</span>';
    }
  }
});

function editSchoolRecord(id) {
  const rec = schoolRecords.find(r => r.id === id);
  if (!rec) return;

  document.getElementById("schoolEditRecordId").value = rec.id;
  document.getElementById("schoolSlNo").value = rec.sl_no;
  document.getElementById("schoolFormType").value = rec.school_type;
  document.getElementById("schoolTeacherName").value = rec.teacher_name;

  const sexRadio = document.querySelector(`input[name="schoolSex"][value="${rec.sex}"]`);
  if (sexRadio) sexRadio.checked = true;

  document.getElementById("schoolDesignation").value = rec.designation;
  document.getElementById("schoolQualification").value = rec.qualification;
  document.getElementById("schoolMainSubject").value = rec.main_subject;
  document.getElementById("schoolOtherSubject").value = rec.other_subject || "NIL";
  document.getElementById("schoolMediumOfTeaching").value = rec.medium_of_teaching;
  document.getElementById("schoolDob").value = rec.dob;
  document.getElementById("schoolDateOfAppointment").value = rec.date_of_appointment;
  document.getElementById("schoolDateOfRetirement").value = rec.date_of_retirement;
  document.getElementById("schoolAppointmentNature").value = rec.appointment_nature || "";
  document.getElementById("schoolAddress").value = rec.address;
  document.getElementById("schoolArea").value = rec.area;
  document.getElementById("schoolEmailId").value = rec.email_id;
  document.getElementById("schoolMobileNo").value = rec.mobile_no;
  document.getElementById("schoolRemarks").value = rec.remarks || "";

  updateAppointmentHighlight('schoolFormType', 'schoolAppointmentNatureWrapper', 'schoolAidedBadge', 'schoolAppointmentNature');

  // UI state for editing
  document.getElementById("schoolEditModeBanner").classList.remove("hidden");
  const btn = document.getElementById("schoolSubmitRecordBtn");
  if (btn) {
    btn.className = "w-full sm:w-auto px-7 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-md transition cursor-pointer flex items-center justify-center";
    btn.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i> <span id="schoolSubmitBtnText">Update Record</span>';
  }

  window.scrollTo({ top: 150, behavior: "smooth" });
}

function cancelSchoolEdit() {
  const editIdEl = document.getElementById("schoolEditRecordId");
  if (editIdEl) editIdEl.value = "";

  const formEl = document.getElementById("schoolTeacherForm");
  if (formEl) formEl.reset();

  if (currentUser) {
    const udiseEl = document.getElementById("schoolFormUdise");
    if (udiseEl) udiseEl.value = currentUser.schoolUdise || "";
    const nameEl = document.getElementById("schoolFormName");
    if (nameEl) nameEl.value = currentUser.schoolName || "";
  }

  const otherSubEl = document.getElementById("schoolOtherSubject");
  if (otherSubEl) otherSubEl.value = "NIL";

  const editBanner = document.getElementById("schoolEditModeBanner");
  if (editBanner) editBanner.classList.add("hidden");

  const btn = document.getElementById("schoolSubmitRecordBtn");
  if (btn) {
    btn.className = "w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md transition cursor-pointer flex items-center justify-center";
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-plus-circle mr-2"></i> <span id="schoolSubmitBtnText">Save Teacher Record</span>';
  }

  updateAppointmentHighlight('schoolFormType', 'schoolAppointmentNatureWrapper', 'schoolAidedBadge', 'schoolAppointmentNature');
  calculateSchoolNextSlNo();
}

function confirmResetSchoolForm() {
  openConfirmModal(
    "Clear Form",
    "Are you sure you want to clear all entered inputs in the teacher form?",
    cancelSchoolEdit
  );
}

function deleteSchoolRecord(id, name) {
  openConfirmModal(
    "Delete Teacher Record",
    `Are you sure you want to permanently delete the record for "${name}" from the database?`,
    async () => {
      try {
        const res = await apiFetch(`/api/teachers/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          showToast("Record deleted from database.", "info");
          await loadSchoolTeachers();
        } else {
          showToast(data.message || "Failed to delete record.", "error");
        }
      } catch (err) {
        showToast("Network error while deleting record.", "error");
      }
    }
  );
}

function exportSchoolCSV() {
  if (schoolRecords.length === 0) {
    showToast("No records available to export.", "error");
    return;
  }
  generateAndDownloadCSV(schoolRecords, `Teacher_Registry_${currentUser.schoolUdise}_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ==========================================
// District Master Admin Features & Handlers
// ==========================================

async function initAdminDashboard() {
  await Promise.all([
    loadAdminStats(),
    loadAdminTeachers()
  ]);
}

async function loadAdminStats() {
  try {
    const res = await apiFetch("/api/admin/stats");
    const data = await res.json();
    if (data.success && data.stats) {
      adminStatsData = data.stats;
      document.getElementById("kpiTotalSchools").textContent = data.stats.totalSchools;
      document.getElementById("kpiSubmittedSchools").textContent = data.stats.submittedSchools;
      document.getElementById("kpiPendingSchools").textContent = `${data.stats.pendingSchools} pending`;
      document.getElementById("kpiTotalTeachers").textContent = data.stats.totalTeachers;

      const govt = data.stats.bySchoolType["GOVERNMENT"] || 0;
      const fullyAided = data.stats.bySchoolType["FULLY AIDED"] || 0;
      const partAided = data.stats.bySchoolType["PARTIALLY AIDED"] || 0;
      const selfFin = data.stats.bySchoolType["SELF FINANCE"] || 0;

      document.getElementById("kpiGovtCount").textContent = govt;
      document.getElementById("kpiAidedCount").textContent = fullyAided + partAided;
      document.getElementById("kpiOtherTypeCount").textContent = `Self-Finance: ${selfFin}`;

      renderAdminStatusTable();
    }
  } catch (e) {
    console.error("Failed to load admin stats:", e);
  }
}

async function loadAdminTeachers() {
  const schoolUdise = document.getElementById("adminFilterSchool").value;
  const schoolType = document.getElementById("adminFilterSchoolType").value;
  const designation = document.getElementById("adminFilterDesignation").value;
  const search = document.getElementById("adminSearchInput").value.trim();

  const params = new URLSearchParams();
  if (schoolUdise && schoolUdise !== "ALL") params.append("udise", schoolUdise);
  if (schoolType) params.append("schoolType", schoolType);
  if (designation) params.append("designation", designation);
  if (search) params.append("search", search);

  try {
    const res = await apiFetch(`/api/teachers?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      adminRecords = data.records;
      document.getElementById("adminRecordsTabCount").textContent = adminRecords.length;
      document.getElementById("adminRecordsLoadedCount").textContent = adminRecords.length;
      renderAdminTable();
    }
  } catch (e) {
    showToast("Error retrieving master teacher records.", "error");
  }
}

function loadAdminTeachersDebounced() {
  clearTimeout(adminSearchDebounceTimer);
  adminSearchDebounceTimer = setTimeout(loadAdminTeachers, 300);
}

function resetAdminFilters() {
  document.getElementById("adminFilterSchool").value = "ALL";
  document.getElementById("adminFilterSchoolType").value = "";
  document.getElementById("adminFilterDesignation").value = "";
  document.getElementById("adminSearchInput").value = "";
  loadAdminTeachers();
}

function switchAdminSubTab(tab) {
  const btnRecords = document.getElementById("adminTabRecordsBtn");
  const btnStatus = document.getElementById("adminTabStatusBtn");
  const viewRecords = document.getElementById("adminRecordsSubTab");
  const viewStatus = document.getElementById("adminStatusSubTab");

  if (tab === "records") {
    btnRecords.className = "pb-3 text-sm font-bold text-indigo-700 border-b-2 border-indigo-600 transition flex items-center space-x-2";
    btnStatus.className = "pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition flex items-center space-x-2";
    viewRecords.classList.remove("hidden");
    viewStatus.classList.add("hidden");
  } else {
    btnStatus.className = "pb-3 text-sm font-bold text-indigo-700 border-b-2 border-indigo-600 transition flex items-center space-x-2";
    btnRecords.className = "pb-3 text-sm font-semibold text-slate-500 hover:text-slate-800 border-b-2 border-transparent transition flex items-center space-x-2";
    viewStatus.classList.remove("hidden");
    viewRecords.classList.add("hidden");
    loadAdminStats();
  }
}

function renderAdminTable() {
  const tbody = document.getElementById("adminRecordsTableBody");
  const empty = document.getElementById("adminEmptyState");

  tbody.innerHTML = "";

  if (adminRecords.length === 0) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  adminRecords.forEach(rec => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="px-4 py-3 sticky left-0 bg-white border-r border-slate-100 z-10">
        <div class="flex items-center space-x-2">
          <button type="button" onclick="openAdminEditTeacherModal('${rec.id}')" title="Edit Teacher" class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" onclick="deleteAdminTeacherRecord('${rec.id}', '${escapeHTML(rec.teacher_name)}')" title="Delete Teacher" class="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
      <td class="px-4 py-3 font-semibold text-slate-900">${escapeHTML(rec.sl_no)}</td>
      <td class="px-4 py-3 font-mono font-semibold text-blue-900">${escapeHTML(rec.udise_code)}</td>
      <td class="px-4 py-3 font-medium text-slate-900">${escapeHTML(rec.school_name)}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">${escapeHTML(rec.school_type)}</span></td>
      <td class="px-4 py-3 font-semibold text-indigo-950">${escapeHTML(rec.teacher_name)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.sex)}</td>
      <td class="px-4 py-3 font-medium">${escapeHTML(rec.designation)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.qualification)}</td>
      <td class="px-4 py-3 font-semibold text-emerald-800">${escapeHTML(rec.main_subject)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHTML(rec.other_subject)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.medium_of_teaching)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.dob)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.date_of_appointment)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.date_of_retirement)}</td>
      <td class="px-4 py-3 text-slate-600">${escapeHTML(rec.appointment_nature || "-")}</td>
      <td class="px-4 py-3 max-w-xs truncate" title="${escapeHTML(rec.address)}">${escapeHTML(rec.address)}</td>
      <td class="px-4 py-3">${escapeHTML(rec.area)}</td>
      <td class="px-4 py-3 text-indigo-600">${escapeHTML(rec.email_id)}</td>
      <td class="px-4 py-3 font-mono">${escapeHTML(rec.mobile_no)}</td>
      <td class="px-4 py-3 max-w-xs truncate text-slate-500" title="${escapeHTML(rec.remarks)}">${escapeHTML(rec.remarks || "-")}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminStatusTable() {
  if (!adminStatsData || !Array.isArray(adminStatsData.schoolSummaries)) return;

  const tbody = document.getElementById("adminStatusTableBody");
  const query = (document.getElementById("adminStatusSearch").value || "").toLowerCase().trim();

  const filtered = adminStatsData.schoolSummaries.filter(s => {
    if (!query) return true;
    return s.udiseCode.includes(query) || s.schoolName.toLowerCase().includes(query);
  });

  tbody.innerHTML = "";

  filtered.forEach((s, idx) => {
    const isSubmitted = s.teacherCount > 0;
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="px-4 py-3 text-slate-500">${idx + 1}</td>
      <td class="px-4 py-3 font-mono font-semibold text-slate-900">${s.udiseCode}</td>
      <td class="px-4 py-3 font-medium text-slate-900">${escapeHTML(s.schoolName)}</td>
      <td class="px-4 py-3 text-center">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isSubmitted ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}">
          ${s.teacherCount}
        </span>
      </td>
      <td class="px-4 py-3">
        ${isSubmitted
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check mr-1 text-[10px]"></i> Submitted</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800"><i class="fa-solid fa-clock mr-1 text-[10px]"></i> Pending</span>'
        }
      </td>
      <td class="px-4 py-3 text-right">
        <button type="button" onclick="adminFilterToSchool('${s.udiseCode}')" class="px-3 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer">
          View Records
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function adminFilterToSchool(udise) {
  switchAdminSubTab("records");
  const filterSel = document.getElementById("adminFilterSchool");
  filterSel.value = udise;
  loadAdminTeachers();
}

function exportAdminMasterCSV() {
  if (adminRecords.length === 0) {
    showToast("No records match current filters to export.", "error");
    return;
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  generateAndDownloadCSV(adminRecords, `Master_District_Teacher_Registry_${dateStr}.csv`);
}

function exportSchoolStatusCSV() {
  if (!adminStatsData || !adminStatsData.schoolSummaries) return;

  const headers = ["S.No", "UDISE Code", "School Name", "Teachers Registered", "Submission Status", "Last Updated"];
  const rows = [];
  rows.push(headers.map(h => `"${h}"`).join(","));

  adminStatsData.schoolSummaries.forEach((s, idx) => {
    rows.push([
      idx + 1,
      `\t${s.udiseCode}`,
      s.schoolName,
      s.teacherCount,
      s.status,
      s.lastUpdated || "N/A"
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  });

  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `DEO_Marthandam_138_Schools_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
}

// ==========================================
// Admin Teacher Modal Handling
// ==========================================

function openAdminAddTeacherModal() {
  document.getElementById("adminTeacherForm").reset();
  document.getElementById("adminModalRecordId").value = "";
  document.getElementById("adminModalTitle").textContent = "Add Teacher Record (Admin Console)";
  document.getElementById("adminModalSchoolSelect").disabled = false;
  document.getElementById("adminModalUdise").value = "";
  document.getElementById("adminModalOtherSubject").value = "NIL";
  updateAppointmentHighlight('adminModalSchoolType', 'adminModalAppointmentWrapper', 'adminModalAidedBadge', 'adminModalAppointmentNature');

  const modal = document.getElementById("adminTeacherModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function openAdminEditTeacherModal(id) {
  const rec = adminRecords.find(r => r.id === id);
  if (!rec) return;

  document.getElementById("adminModalRecordId").value = rec.id;
  document.getElementById("adminModalTitle").textContent = `Edit Teacher: ${rec.teacher_name}`;

  const select = document.getElementById("adminModalSchoolSelect");
  select.value = rec.udise_code;
  select.disabled = true; // Lock school during edit

  document.getElementById("adminModalUdise").value = rec.udise_code;
  document.getElementById("adminModalSlNo").value = rec.sl_no;
  document.getElementById("adminModalSchoolType").value = rec.school_type;
  document.getElementById("adminModalTeacherName").value = rec.teacher_name;
  document.getElementById("adminModalSex").value = rec.sex;
  document.getElementById("adminModalDesignation").value = rec.designation;
  document.getElementById("adminModalQualification").value = rec.qualification;
  document.getElementById("adminModalMainSubject").value = rec.main_subject;
  document.getElementById("adminModalOtherSubject").value = rec.other_subject || "NIL";
  document.getElementById("adminModalMedium").value = rec.medium_of_teaching;
  document.getElementById("adminModalDob").value = rec.dob;
  document.getElementById("adminModalDateAppointment").value = rec.date_of_appointment;
  document.getElementById("adminModalDateRetirement").value = rec.date_of_retirement;
  document.getElementById("adminModalAppointmentNature").value = rec.appointment_nature || "";
  document.getElementById("adminModalAddress").value = rec.address;
  document.getElementById("adminModalArea").value = rec.area;
  document.getElementById("adminModalEmail").value = rec.email_id;
  document.getElementById("adminModalMobile").value = rec.mobile_no;
  document.getElementById("adminModalRemarks").value = rec.remarks || "";

  updateAppointmentHighlight('adminModalSchoolType', 'adminModalAppointmentWrapper', 'adminModalAidedBadge', 'adminModalAppointmentNature');

  const modal = document.getElementById("adminTeacherModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAdminTeacherModal() {
  const modal = document.getElementById("adminTeacherModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.getElementById("adminTeacherForm").reset();
}

function handleAdminModalSchoolChange() {
  const udise = document.getElementById("adminModalSchoolSelect").value;
  document.getElementById("adminModalUdise").value = udise;
}

document.getElementById("adminTeacherForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const editId = document.getElementById("adminModalRecordId").value;
  const udise = document.getElementById("adminModalUdise").value;
  const matchedSchool = allSchoolsList.find(s => s.udiseCode === udise);

  if (!udise || !matchedSchool) {
    showToast("Please select a valid school from the dropdown.", "error");
    return;
  }

  const mobile = document.getElementById("adminModalMobile").value.trim();
  if (!/^\d{10}$/.test(mobile)) {
    showToast("Mobile number must be 10 digits.", "error");
    return;
  }

  const payload = {
    slNo: document.getElementById("adminModalSlNo").value.trim(),
    udiseCode: udise,
    schoolName: matchedSchool.schoolName,
    schoolType: document.getElementById("adminModalSchoolType").value,
    teacherName: document.getElementById("adminModalTeacherName").value.trim(),
    sex: document.getElementById("adminModalSex").value,
    designation: document.getElementById("adminModalDesignation").value,
    qualification: document.getElementById("adminModalQualification").value.trim(),
    mainSubject: document.getElementById("adminModalMainSubject").value,
    otherSubject: document.getElementById("adminModalOtherSubject").value || "NIL",
    mediumOfTeaching: document.getElementById("adminModalMedium").value,
    dob: document.getElementById("adminModalDob").value,
    dateOfAppointment: document.getElementById("adminModalDateAppointment").value,
    dateOfRetirement: document.getElementById("adminModalDateRetirement").value,
    appointmentNature: document.getElementById("adminModalAppointmentNature").value || "",
    address: document.getElementById("adminModalAddress").value.trim(),
    area: document.getElementById("adminModalArea").value.trim(),
    emailId: document.getElementById("adminModalEmail").value.trim(),
    mobileNo: mobile,
    remarks: document.getElementById("adminModalRemarks").value.trim()
  };

  const btn = document.getElementById("adminModalSaveBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...';

  try {
    const url = editId ? `/api/teachers/${editId}` : "/api/teachers";
    const method = editId ? "PUT" : "POST";

    const res = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(editId ? "Record updated in master database!" : "New teacher added for school!", "success");
      closeAdminTeacherModal();
      await loadAdminTeachers();
      await loadAdminStats();
    } else {
      showToast(data.message || "Failed to save record.", "error");
    }
  } catch (err) {
    showToast("Network error while updating record.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Save Record to Database";
  }
});

function deleteAdminTeacherRecord(id, name) {
  openConfirmModal(
    "Delete Teacher Record",
    `Administrator Action: Are you sure you want to delete "${name}" from the district database?`,
    async () => {
      try {
        const res = await apiFetch(`/api/teachers/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          showToast("Record permanently deleted.", "info");
          await loadAdminTeachers();
          await loadAdminStats();
        } else {
          showToast(data.message || "Failed to delete record.", "error");
        }
      } catch (err) {
        showToast("Error deleting record.", "error");
      }
    }
  );
}

// ==========================================
// Shared Helpers & Utilities
// ==========================================

function updateAppointmentHighlight(typeSelectId, wrapperId, badgeId, inputId) {
  const typeEl = document.getElementById(typeSelectId);
  const wrapper = document.getElementById(wrapperId);
  const badge = document.getElementById(badgeId);
  const input = document.getElementById(inputId);

  if (!typeEl || !wrapper || !badge || !input) return;

  const isAided = typeEl.value === "FULLY AIDED" || typeEl.value === "PARTIALLY AIDED";
  if (isAided) {
    wrapper.classList.add("bg-indigo-50/70", "border", "border-indigo-200/80");
    badge.classList.remove("hidden");
    input.classList.replace("border-slate-300", "border-indigo-400");
  } else {
    wrapper.classList.remove("bg-indigo-50/70", "border", "border-indigo-200/80");
    badge.classList.add("hidden");
    input.classList.replace("border-indigo-400", "border-slate-300");
  }
}

function generateAndDownloadCSV(records, filename) {
  const headers = [
    "Sl No",
    "UDISE CODE",
    "SCHOOL NAME",
    "SCHOOL TYPE",
    "NAME OF THE TEACHER",
    "SEX",
    "DESIGNATION",
    "EDUCATIONAL QUALIFICATION",
    "MAIN SUBJECT TEACHING",
    "OTHER SUBJECT TEACHING",
    "MEDIUM OF TEACHING",
    "DATE OF BIRTH",
    "DATE OF APPOINTMENT IN THE PRESENT POST",
    "DATE OF RETIREMENT",
    "APPOINTMENT NATURE (FOR AIDED SCHOOLS ONLY)",
    "ADDRESS with PINCODE",
    "AREA",
    "E-Mail ID",
    "MOBILE NO",
    "Remarks"
  ];

  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

  records.forEach(r => {
    const row = [
      r.sl_no,
      `\t${r.udise_code}`, // Preserve leading zeros in Excel
      r.school_name,
      r.school_type,
      r.teacher_name,
      r.sex,
      r.designation,
      r.qualification,
      r.main_subject,
      r.other_subject,
      r.medium_of_teaching,
      r.dob,
      r.date_of_appointment,
      r.date_of_retirement,
      r.appointment_nature || "",
      (r.address || "").replace(/\r?\n|\r/g, " "),
      r.area,
      r.email_id,
      r.mobile_no,
      (r.remarks || "").replace(/\r?\n|\r/g, " ")
    ];
    csvRows.push(row.map(val => `"${String(val || "").replace(/"/g, '""')}"`).join(","));
  });

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
  showToast(`Exported ${records.length} record(s) to CSV!`, "success");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openConfirmModal(title, msg, onConfirm) {
  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalMessage").textContent = msg;
  confirmCallback = onConfirm;

  const modal = document.getElementById("confirmModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeConfirmModal() {
  const modal = document.getElementById("confirmModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  confirmCallback = null;
}

document.getElementById("confirmCancelBtn").addEventListener("click", closeConfirmModal);
document.getElementById("confirmProceedBtn").addEventListener("click", () => {
  if (typeof confirmCallback === "function") confirmCallback();
  closeConfirmModal();
});

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");

  let bgClass = "bg-slate-800 text-white";
  let iconClass = "fa-circle-info text-indigo-400";

  if (type === "success") {
    bgClass = "bg-emerald-900 text-white border border-emerald-700";
    iconClass = "fa-circle-check text-emerald-400";
  } else if (type === "error") {
    bgClass = "bg-rose-900 text-white border border-rose-700";
    iconClass = "fa-circle-exclamation text-rose-400";
  }

  toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 text-xs sm:text-sm font-medium transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto max-w-sm`;
  toast.innerHTML = `
    <i class="fa-solid ${iconClass} text-base shrink-0"></i>
    <span class="leading-snug">${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// Official EBS 2026-27 Export Handlers
// ==========================================

function openEbsExportModal() {
  const modal = document.getElementById("ebsExportModal");
  if (!modal) return;

  populateSchoolSelects();

  // If admin already has a school filtered in the toolbar, sync it as initial default
  const currentFilterSchool = document.getElementById("adminFilterSchool")?.value;
  const exportSchoolSelect = document.getElementById("exportSchoolSelect");
  if (exportSchoolSelect) {
    exportSchoolSelect.value = (currentFilterSchool && currentFilterSchool !== 'ALL') ? currentFilterSchool : 'ALL';
  }

  modal.classList.remove("hidden");
}

function closeEbsExportModal() {
  const modal = document.getElementById("ebsExportModal");
  if (modal) modal.classList.add("hidden");
}

async function handleEbsExportSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const btn = document.getElementById("exportDownloadSubmitBtn");
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Generating Export...';

  try {
    const school = document.getElementById("exportSchoolSelect")?.value || 'ALL';
    const sheet = document.getElementById("exportSheetSelect")?.value || 'ALL';
    const schoolType = document.getElementById("exportSchoolType")?.value || '';
    const designation = document.getElementById("exportDesignation")?.value || '';
    const mainSubject = document.getElementById("exportMainSubject")?.value || '';
    const search = document.getElementById("exportSearch")?.value || '';
    const format = document.querySelector('input[name="exportFormatRadio"]:checked')?.value || 'xlsx';

    const params = new URLSearchParams();
    if (school) params.append('udise', school);
    if (sheet) params.append('sheet', sheet);
    if (schoolType) params.append('schoolType', schoolType);
    if (designation) params.append('designation', designation);
    if (mainSubject) params.append('mainSubject', mainSubject);
    if (search) params.append('search', search);
    if (format) params.append('format', format);

    const res = await apiFetch(`/api/export?${params.toString()}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned status ${res.status}`);
    }

    let filename = `EBS_2026-2027_${sheet}_${school}_${new Date().toISOString().split('T')[0]}.${format}`;
    const disposition = res.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    showToast(`Successfully exported: ${filename}`, "success");
    closeEbsExportModal();
  } catch (err) {
    showToast(`Export failed: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

async function exportCurrentSchoolEbs() {
  if (!currentUser || !currentUser.schoolUdise) {
    showToast("School session not found.", "error");
    return;
  }

  showToast("Generating official EBS 2026-27 Workbook...", "info");

  try {
    const res = await apiFetch(`/api/export?sheet=ALL&udise=${currentUser.schoolUdise}&format=xlsx`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned ${res.status}`);
    }

    let filename = `EBS_2026-2027_${currentUser.schoolUdise}.xlsx`;
    const disposition = res.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    showToast(`Downloaded: ${filename}`, "success");
  } catch (err) {
    showToast(`Export failed: ${err.message}`, "error");
  }
}
