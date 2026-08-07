// Simple client-side access gate for the student area.
// NOTE: This is a light deterrent for a free MVP stage, not real authentication.
// Anyone who reads this file could find the code — it stops casual sharing,
// not a determined person. Upgrade to real per-student login once budget allows.

const STUDENT_ACCESS_CODE = "neo2026"; // غيّري الكود ده لأي كود سرّي تحبيه

function checkStudentAccess() {
  const input = document.getElementById("access-code");
  const error = document.getElementById("gate-error");
  const gate = document.getElementById("gate-wrap");
  const content = document.getElementById("student-content");

  if (input.value.trim() === STUDENT_ACCESS_CODE) {
    sessionStorage.setItem("neoAcademyAccess", "granted");
    gate.style.display = "none";
    content.classList.add("is-visible");
    error.textContent = "";
  } else {
    error.textContent = "الكود مش صح، جرّب تاني أو كلمنا على واتساب.";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("gate-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      checkStudentAccess();
    });
  }

  // Keep the student unlocked if they already entered the code this session
  if (sessionStorage.getItem("neoAcademyAccess") === "granted") {
    const gate = document.getElementById("gate-wrap");
    const content = document.getElementById("student-content");
    if (gate && content) {
      gate.style.display = "none";
      content.classList.add("is-visible");
    }
  }
});
