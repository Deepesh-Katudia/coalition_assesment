// assets/js/app.js

const API_URL = "https://fedskillstest.coalitiontechnologies.workers.dev";
const USERNAME = "coalition";
const PASSWORD = "skills-test";

let bpChart = null;

function toBasicAuthHeader(username, password) {
  const token = btoa(`${username}:${password}`);
  return `Basic ${token}`;
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function monthShort(monthName) {
  const map = {
    January: "Jan", February: "Feb", March: "Mar", April: "Apr",
    May: "May", June: "Jun", July: "Jul", August: "Aug",
    September: "Sep", October: "Oct", November: "Nov", December: "Dec"
  };
  return map[monthName] || monthName;
}

function monthIndex(monthName) {
  const map = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
  };
  return map[monthName] ?? 0;
}

function sortHistoryChronologically(history) {
  return [...history].sort((a, b) => {
    const aTime = new Date(a.year, monthIndex(a.month), 1).getTime();
    const bTime = new Date(b.year, monthIndex(b.month), 1).getTime();
    return aTime - bTime;
  });
}

function getLatest(history) {
  if (!history || history.length === 0) return null;
  const sorted = sortHistoryChronologically(history);
  return sorted[sorted.length - 1];
}

function renderPatientsList(jessica) {
  const wrap = document.getElementById("patientsList");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="patient patient--active" aria-current="true">
      <img class="patient__avatar" src="${jessica.profile_picture}" alt="${jessica.name}" />
      <div class="patient__info">
        <div class="patient__name">${jessica.name}</div>
        <div class="patient__meta">${jessica.gender}, ${jessica.age}</div>
      </div>
      <button class="patient__more" type="button" aria-label="Patient options">⋯</button>
    </div>
  `;
}

function renderProfile(jessica) {
  const photo = document.getElementById("profilePhoto");
  const name = document.getElementById("profileName");
  const dob = document.getElementById("dob");
  const gender = document.getElementById("gender");
  const phone = document.getElementById("phone");
  const emergency = document.getElementById("emergency");
  const insurance = document.getElementById("insurance");

  if (photo) photo.src = jessica.profile_picture;
  if (name) name.textContent = jessica.name;
  if (dob) dob.textContent = formatDate(jessica.date_of_birth);
  if (gender) gender.textContent = jessica.gender;
  if (phone) phone.textContent = jessica.phone_number;
  if (emergency) emergency.textContent = jessica.emergency_contact;
  if (insurance) insurance.textContent = jessica.insurance_type;
}

function renderVitalsFromLatest(latest) {
  if (!latest) return;

  const respValue = document.getElementById("respValue");
  const respLevel = document.getElementById("respLevel");
  const tempValue = document.getElementById("tempValue");
  const tempLevel = document.getElementById("tempLevel");
  const hrValue = document.getElementById("hrValue");
  const hrLevel = document.getElementById("hrLevel");

  if (respValue) respValue.textContent = latest.respiratory_rate?.value ?? "--";
  if (respLevel) respLevel.textContent = latest.respiratory_rate?.levels ?? "--";

  if (tempValue) tempValue.textContent = latest.temperature?.value ?? "--";
  if (tempLevel) tempLevel.textContent = latest.temperature?.levels ?? "--";

  if (hrValue) hrValue.textContent = latest.heart_rate?.value ?? "--";
  if (hrLevel) hrLevel.textContent = latest.heart_rate?.levels ?? "--";
}

function renderBPStatsFromLatest(latest) {
  if (!latest) return;

  const systolicValue = document.getElementById("bpSystolicValue");
  const systolicLevel = document.getElementById("bpSystolicLevel");
  const diastolicValue = document.getElementById("bpDiastolicValue");
  const diastolicLevel = document.getElementById("bpDiastolicLevel");

  const bp = latest.blood_pressure;

  if (systolicValue) systolicValue.textContent = bp?.systolic?.value ?? "--";
  if (systolicLevel) systolicLevel.textContent = bp?.systolic?.levels ?? "--";

  if (diastolicValue) diastolicValue.textContent = bp?.diastolic?.value ?? "--";
  if (diastolicLevel) diastolicLevel.textContent = bp?.diastolic?.levels ?? "--";
}

function renderDiagnosticTable(diagnosticList) {
  const tbody = document.getElementById("diagnosticTable");
  if (!tbody) return;

  if (!diagnosticList || diagnosticList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No records</td></tr>`;
    return;
  }

  tbody.innerHTML = diagnosticList.map(item => {
    const name = item.name ?? "-";
    const desc = item.description ?? "-";
    const status = item.status ?? "-";
    return `
      <tr>
        <td>${name}</td>
        <td>${desc}</td>
        <td>${status}</td>
      </tr>
    `;
  }).join("");
}

function renderLabResults(labResults) {
  const ul = document.getElementById("labsList");
  if (!ul) return;

  if (!labResults || labResults.length === 0) {
    ul.innerHTML = `<li class="lab"><span class="lab__name">No lab results</span></li>`;
    return;
  }

  ul.innerHTML = labResults.map((name) => {
    return `
      <li class="lab">
        <span class="lab__name">${name}</span>
        <button class="lab__btn" type="button" aria-label="Download ${name}">
          <img class="lab__icon" src="assets/img/download.svg" alt="" aria-hidden="true" />
        </button>
      </li>
    `;
  }).join("");
}

//  chart 
function buildChartData(history) {
  const sorted = sortHistoryChronologically(history);
  const last6 = sorted.slice(-6);

  const labels = last6.map(h => `${monthShort(h.month)} ${h.year}`);
  const systolic = last6.map(h => h.blood_pressure?.systolic?.value ?? null);
  const diastolic = last6.map(h => h.blood_pressure?.diastolic?.value ?? null);

  return { labels, systolic, diastolic };
}

function renderBPChart(history) {
  const canvas = document.getElementById("bpChart");
  if (!canvas || !window.Chart) return;

  const { labels, systolic, diastolic } = buildChartData(history);

  if (bpChart) {
    bpChart.destroy();
    bpChart = null;
  }

  bpChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Systolic",
          data: systolic,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5
        },
        {
          label: "Diastolic",
          data: diastolic,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#707070", font: { size: 12, family: "Manrope" } }
        },
        y: {
          ticks: { color: "#707070", font: { size: 12, family: "Manrope" } }
        }
      }
    }
  });
}

// API 
async function fetchPatients() {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: toBasicAuthHeader(USERNAME, PASSWORD)
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

function findJessica(patients) {
  return patients.find(p => p.name === "Jessica Taylor");
}

async function init() {
  try {
    const patients = await fetchPatients();
    const jessica = findJessica(patients);

    if (!jessica) {
      throw new Error("Jessica Taylor not found in API response.");
    }
    renderPatientsList(jessica);
    renderProfile(jessica);

    const latest = getLatest(jessica.diagnosis_history);
    renderVitalsFromLatest(latest);
    renderBPStatsFromLatest(latest);

    renderDiagnosticTable(jessica.diagnostic_list);
    renderLabResults(jessica.lab_results);

    renderBPChart(jessica.diagnosis_history);

  } catch (err) {
    console.error(err);
  }
}

init();