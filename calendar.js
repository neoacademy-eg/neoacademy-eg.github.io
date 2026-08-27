import { db } from "./firebase-config.js";
import {
  collectionGroup,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const listEl = document.getElementById("calendar-list");

function formatArabicDate(date) {
  return date.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatArabicTime(date) {
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

async function loadCalendar() {
  listEl.innerHTML = "<p>جاري تحميل المواعيد...</p>";

  // collectionGroup reads the "lectures" sub-collection across ALL courses at once.
  const lecturesSnap = await getDocs(collectionGroup(db, "lectures"));
  const sessions = [];

  for (const lectureDoc of lecturesSnap.docs) {
    const lecture = lectureDoc.data();
    if (!lecture.scheduledAt) continue;

    const courseRef = lectureDoc.ref.parent.parent; // .../courses/{courseId}
    const courseSnap = await getDoc(courseRef);
    const courseTitle = courseSnap.exists() ? courseSnap.data().title : "كورس";

    const date = lecture.scheduledAt.toDate ? lecture.scheduledAt.toDate() : new Date(lecture.scheduledAt);

    sessions.push({
      courseTitle,
      lectureTitle: lecture.title || "محاضرة",
      date,
    });
  }

  sessions.sort((a, b) => a.date - b.date);

  if (sessions.length === 0) {
    listEl.innerHTML = "<p>مفيش مواعيد متاحة دلوقتي.</p>";
    return;
  }

  const now = new Date();
  listEl.innerHTML = "";

  sessions.forEach((session) => {
    const isPast = session.date < now;
    const card = document.createElement("article");
    card.className = "calendar-session-card" + (isPast ? " is-past" : "");
    card.innerHTML = `
      <div class="calendar-session-date">${formatArabicDate(session.date)} — ${formatArabicTime(session.date)}</div>
      <div class="calendar-session-title"><strong>${session.courseTitle}</strong>: ${session.lectureTitle}</div>
    `;
    listEl.appendChild(card);
  });
}

loadCalendar();
