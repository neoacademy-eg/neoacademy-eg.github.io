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

  initLeadForm();
});

/* ============================================
   Lead / Contact form handler
   ------------------------------------------------
   Connected to the real Neo Academy Bitrix24 CRM via an
   inbound webhook. Every submission creates a new Lead
   in Bitrix24 (Applications > Developer resources > CRM scope only).
   If the CRM call fails for any reason (offline, typo, etc.),
   we fall back to opening a pre-filled WhatsApp message so no
   lead is ever lost.
   ============================================ */

const BITRIX24_WEBHOOK_URL = "https://b24-umaaa0.bitrix24.ae/rest/1/300h6iirxlydxeq8/";

function initLeadForm() {
  const form = document.getElementById("lead-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const lead = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      course: form.course.value,
      message: form.message.value.trim(),
      source: "Website",
    };

    if (!lead.name || !lead.phone || !lead.course) {
      alert("من فضلك املي الاسم ورقم الموبايل والكورس على الأقل.");
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري الإرسال...";

    try {
      await sendLeadToCrm(lead);
      alert("تم إرسال طلبك بنجاح! هنتواصل معاك قريب جدًا.");
      form.reset();
    } catch (err) {
      console.error("CRM submission failed, falling back to WhatsApp:", err);
      sendLeadViaWhatsApp(lead);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "إرسال الطلب";
    }
  });
}

async function sendLeadToCrm(lead) {
  const url = `${BITRIX24_WEBHOOK_URL}crm.lead.add.json`;
  const body = {
    fields: {
      TITLE: `طلب من الموقع - ${lead.course}`,
      NAME: lead.name,
      PHONE: [{ VALUE: lead.phone, VALUE_TYPE: "WORK" }],
      EMAIL: lead.email ? [{ VALUE: lead.email, VALUE_TYPE: "WORK" }] : [],
      COMMENTS: lead.message || "",
      SOURCE_DESCRIPTION: "Website",
      UF_CRM_COURSE: lead.course, // custom field, optional — safe to ignore if not set up in Bitrix24
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data;
}

function sendLeadViaWhatsApp(lead) {
  const lines = [
    `الاسم: ${lead.name}`,
    `رقم الموبايل: ${lead.phone}`,
    lead.email ? `الإيميل: ${lead.email}` : null,
    `الكورس: ${lead.course}`,
    lead.message ? `رسالة: ${lead.message}` : null,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/201042413201?text=${text}`, "_blank", "noopener");
}
