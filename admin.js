import { app, auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const ADMIN_UID = "2OI4lkmSGRSyKPk4rZiYEstksIC3";

const loginForm = document.getElementById("admin-login-form");
const loginError = document.getElementById("admin-login-error");
const loginWrap = document.getElementById("admin-login-wrap");
const panelWrap = document.getElementById("admin-panel-wrap");
const deniedWrap = document.getElementById("admin-denied-wrap");
const coursesArea = document.getElementById("admin-courses-area");
const logoutBtn = document.getElementById("admin-logout-btn");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    try {
      await signInWithEmailAndPassword(auth, loginForm.email.value.trim(), loginForm.password.value);
    } catch (err) {
      loginError.textContent = "الإيميل أو الباسورد غلط.";
      console.error(err);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => signOut(auth));
}

onAuthStateChanged(auth, async (user) => {
  loginWrap.style.display = "none";
  panelWrap.style.display = "none";
  deniedWrap.style.display = "none";

  if (!user) {
    loginWrap.style.display = "block";
    return;
  }

  if (user.uid !== ADMIN_UID) {
    deniedWrap.style.display = "block";
    return;
  }

  panelWrap.style.display = "block";
  await loadCourses();
});

// Hardcoded list of known course IDs. Add a new ID here when you create a new course.
const COURSE_IDS = ["english1"];

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function loadCourses() {
  coursesArea.innerHTML = "جاري التحميل...";
  coursesArea.innerHTML = "";

  for (const courseId of COURSE_IDS) {
    const courseSnap = await getDoc(doc(db, "courses", courseId));
    if (!courseSnap.exists()) continue;
    const course = courseSnap.data();

    const lecturesSnap = await getDocs(collection(db, "courses", courseId, "lectures"));
    const lectures = [];
    lecturesSnap.forEach((d) => lectures.push({ id: d.id, ...d.data() }));
    lectures.sort((a, b) => (a.order || 0) - (b.order || 0));

    renderCourseAdmin(courseId, course, lectures);
  }
}

function renderCourseAdmin(courseId, course, lectures) {
  const section = document.createElement("section");
  section.className = "course-block";

  const heading = document.createElement("h3");
  heading.textContent = course.title || courseId;
  section.appendChild(heading);

  lectures.forEach((lecture) => {
    const row = document.createElement("div");
    row.className = "admin-lecture-row";

    const scheduledDate = lecture.scheduledAt
      ? (lecture.scheduledAt.toDate ? lecture.scheduledAt.toDate() : new Date(lecture.scheduledAt))
      : new Date();

    row.innerHTML = `
      <strong>${lecture.title || "محاضرة"}</strong>
      <label>الميعاد الحالي:
        <input type="datetime-local" class="lecture-date-input" value="${toDatetimeLocalValue(scheduledDate)}">
      </label>
      <label><input type="checkbox" class="lecture-force-open" ${lecture.manualUnlock ? "checked" : ""}> فتح يدوي فوري (تجاوز التاريخ)</label>
      <button type="button" class="btn btn-primary save-lecture-btn">حفظ</button>
      <span class="save-status"></span>
    `;

    row.querySelector(".save-lecture-btn").addEventListener("click", async () => {
      const status = row.querySelector(".save-status");
      status.textContent = "جاري الحفظ...";
      try {
        const newDateValue = row.querySelector(".lecture-date-input").value;
        const forceOpen = row.querySelector(".lecture-force-open").checked;
        await setDoc(
          doc(db, "courses", courseId, "lectures", lecture.id),
          {
            scheduledAt: Timestamp.fromDate(new Date(newDateValue)),
            manualUnlock: forceOpen,
          },
          { merge: true }
        );
        status.textContent = "✅ اتحفظ";
      } catch (err) {
        status.textContent = "❌ حصل خطأ";
        console.error(err);
      }
    });

    section.appendChild(row);
  });

  // Add-new-lecture form
  const addForm = document.createElement("form");
  addForm.className = "admin-add-lecture-form";
  addForm.innerHTML = `
    <h4>إضافة محاضرة جديدة</h4>
    <input type="text" name="title" placeholder="اسم المحاضرة" required>
    <input type="text" name="vimeoId" placeholder="رقم فيديو Vimeo" required>
    <input type="number" name="order" placeholder="ترتيبها (رقم)" required>
    <input type="datetime-local" name="scheduledAt" required>
    <button type="submit" class="btn btn-primary">إضافة</button>
    <span class="save-status"></span>
  `;

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = addForm.querySelector(".save-status");
    status.textContent = "جاري الإضافة...";
    try {
      await addDoc(collection(db, "courses", courseId, "lectures"), {
        title: addForm.title.value.trim(),
        vimeoId: addForm.vimeoId.value.trim(),
        order: Number(addForm.order.value),
        scheduledAt: Timestamp.fromDate(new Date(addForm.scheduledAt.value)),
        manualUnlock: false,
      });
      status.textContent = "✅ اتضافت — اعملي Refresh للصفحة عشان تظهر في اللستة";
      addForm.reset();
    } catch (err) {
      status.textContent = "❌ حصل خطأ";
      console.error(err);
    }
  });

  section.appendChild(addForm);
  coursesArea.appendChild(section);
}
