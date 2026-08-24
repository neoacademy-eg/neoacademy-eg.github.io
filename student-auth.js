import { app, auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginWrap = document.getElementById("login-wrap");
const profileWrap = document.getElementById("profile-wrap");
const coursesList = document.getElementById("courses-list");
const studentNameEl = document.getElementById("student-name");
const logoutBtn = document.getElementById("logout-btn");

// ---- Login ----
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    loginError.textContent = "";

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError.textContent = "الإيميل أو الباسورد غلط. لو نسيتي بياناتك كلمينا على واتساب.";
      console.error(err);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => signOut(auth));
}

// ---- Auth state → load profile ----
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (loginWrap) loginWrap.style.display = "block";
    if (profileWrap) profileWrap.style.display = "none";
    return;
  }

  if (loginWrap) loginWrap.style.display = "none";
  if (profileWrap) profileWrap.style.display = "block";

  await loadStudentProfile(user.uid);
});

async function loadStudentProfile(uid) {
  coursesList.innerHTML = "<p>جاري تحميل الكورسات...</p>";

  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) {
    coursesList.innerHTML = "<p>حسابك مش متربط بأي كورس لسه. كلمينا على واتساب لو ده غلط.</p>";
    return;
  }

  const userData = userSnap.data();
  studentNameEl.textContent = userData.name || "";

  const enrolledCourseIds = userData.enrolledCourses || [];
  if (enrolledCourseIds.length === 0) {
    coursesList.innerHTML = "<p>مفيش كورسات مربوطة بحسابك لسه.</p>";
    return;
  }

  coursesList.innerHTML = "";

  for (const courseId of enrolledCourseIds) {
    const courseSnap = await getDoc(doc(db, "courses", courseId));
    if (!courseSnap.exists()) continue;
    const course = courseSnap.data();

    const lecturesSnap = await getDocs(collection(db, "courses", courseId, "lectures"));
    const lectures = [];
    lecturesSnap.forEach((d) => lectures.push({ id: d.id, ...d.data() }));
    lectures.sort((a, b) => (a.order || 0) - (b.order || 0));

    renderCourse(course, lectures);
  }
}

// A lecture unlocks at midnight (00:00) the day AFTER its scheduled date,
// unless the admin has manually force-unlocked it, or manually force-locked it.
function isLectureUnlocked(lecture) {
  if (lecture.manualUnlock === true) return true;
  if (lecture.manualLock === true) return false;
  if (!lecture.scheduledAt) return false;

  const scheduledDate = lecture.scheduledAt.toDate
    ? lecture.scheduledAt.toDate()
    : new Date(lecture.scheduledAt);

  const unlockAt = new Date(scheduledDate);
  unlockAt.setHours(24, 0, 0, 0); // midnight after the lecture's date

  return new Date() >= unlockAt;
}

function renderCourse(course, lectures) {
  const section = document.createElement("section");
  section.className = "course-block";

  const heading = document.createElement("h3");
  heading.textContent = course.title || "كورس";
  section.appendChild(heading);

  lectures.forEach((lecture) => {
    const card = document.createElement("article");
    card.className = "lesson-card";

    if (isLectureUnlocked(lecture)) {
      card.innerHTML = `
        <h4>${lecture.title || "محاضرة"}</h4>
        <div class="video-frame">
          <iframe src="https://player.vimeo.com/video/${lecture.vimeoId}?title=0&byline=0&portrait=0"
                  title="${lecture.title || "محاضرة"}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
    } else {
      card.innerHTML = `
        <h4>${lecture.title || "محاضرة"} 🔒</h4>
        <p class="lesson-note">هتتفتح بعد ميعاد المحاضرة.</p>
      `;
    }

    section.appendChild(card);
  });

  coursesList.appendChild(section);
}
