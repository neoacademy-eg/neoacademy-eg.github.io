import { db } from "./firebase-config.js";
import {
  collectionGroup,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const gridEl = document.getElementById("calendar-grid");
const monthLabelEl = document.getElementById("calendar-month-label");
const prevBtn = document.getElementById("calendar-prev-btn");
const nextBtn = document.getElementById("calendar-next-btn");
const detailsEl = document.getElementById("calendar-day-details");

const WEEKDAY_LABELS = ["أحد", "اتنين", "تلات", "أربع", "خميس", "جمعة", "سبت"];
const MONTH_LABELS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

let sessionsByDay = {}; // "YYYY-M-D" -> [ { courseTitle, lectureTitle, date } ]
let currentMonthDate = new Date();
currentMonthDate.setDate(1);

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

async function loadAllSessions() {
  const lecturesSnap = await getDocs(collectionGroup(db, "lectures"));
  const map = {};

  for (const lectureDoc of lecturesSnap.docs) {
    const lecture = lectureDoc.data();
    if (!lecture.scheduledAt) continue;

    const courseRef = lectureDoc.ref.parent.parent;
    const courseSnap = await getDoc(courseRef);
    const courseTitle = courseSnap.exists() ? courseSnap.data().title : "كورس";

    const date = lecture.scheduledAt.toDate ? lecture.scheduledAt.toDate() : new Date(lecture.scheduledAt);
    const key = dayKey(date);
    if (!map[key]) map[key] = [];
    map[key].push({ courseTitle, lectureTitle: lecture.title || "محاضرة", date });
  }

  for (const key in map) {
    map[key].sort((a, b) => a.date - b.date);
  }

  sessionsByDay = map;
}

function renderMonth() {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  monthLabelEl.textContent = `${MONTH_LABELS[month]} ${year}`;

  gridEl.innerHTML = "";

  WEEKDAY_LABELS.forEach((label) => {
    const head = document.createElement("div");
    head.className = "calendar-weekday-head";
    head.textContent = label;
    gridEl.appendChild(head);
  });

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayKey = dayKey(today);

  for (let i = 0; i < startOffset; i++) {
    const blank = document.createElement("div");
    blank.className = "calendar-day-cell is-empty";
    gridEl.appendChild(blank);
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const cellDate = new Date(year, month, dayNum);
    const key = dayKey(cellDate);
    const daySessions = sessionsByDay[key] || [];

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-day-cell" + (key === todayKey ? " is-today" : "") + (daySessions.length ? " has-sessions" : "");
    cell.innerHTML = `
      <span class="calendar-day-num">${dayNum}</span>
      ${daySessions.length ? `<span class="calendar-day-dot"></span>` : ""}
    `;
    cell.addEventListener("click", () => showDayDetails(cellDate, daySessions));
    gridEl.appendChild(cell);
  }
}

function showDayDetails(date, sessions) {
  const dateLabel = date.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (sessions.length === 0) {
    detailsEl.innerHTML = `<h4>${dateLabel}</h4><p>مفيش محاضرات في اليوم ده.</p>`;
    return;
  }

  const rows = sessions.map((s) => {
    const time = s.date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    return `<div class="calendar-session-row"><strong>${time}</strong> — ${s.courseTitle}: ${s.lectureTitle}</div>`;
  }).join("");

  detailsEl.innerHTML = `<h4>${dateLabel}</h4>${rows}`;
}

prevBtn.addEventListener("click", () => {
  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
  renderMonth();
  detailsEl.innerHTML = "";
});

nextBtn.addEventListener("click", () => {
  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
  renderMonth();
  detailsEl.innerHTML = "";
});

async function init() {
  gridEl.innerHTML = "<p>جاري تحميل المواعيد...</p>";
  await loadAllSessions();
  renderMonth();
}

init();
