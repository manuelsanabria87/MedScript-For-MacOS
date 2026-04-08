const STORAGE_KEYS = {
  recipes: "recetaExpress.recipes",
  doctor: "recetaExpress.doctor",
  theme: "recetaExpress.theme",
  logo: "recetaExpress.logo",
};

const THEMES = [
  { id: "azul", name: "Azul clinico", color: "#215db3" },
  { id: "verde", name: "Verde salud", color: "#2f8b68" },
  { id: "naranja", name: "Naranja calido", color: "#be6a23" },
  { id: "grafito", name: "Grafito", color: "#434b57" },
  { id: "turquesa", name: "Turquesa", color: "#138992" },
  { id: "rojo", name: "Rojo", color: "#b2393f" },
  { id: "vino", name: "Vino", color: "#7f2c44" },
  { id: "arena", name: "Arena", color: "#8f7242" },
];

const defaultDoctor = {
  prefix: "Dr/Dra",
  fullName: "",
  license: "",
  specialty: "",
  address: "",
  phone: "",
  email: "",
};

const state = {
  recipes: loadJSON(STORAGE_KEYS.recipes, []),
  doctor: { ...defaultDoctor, ...loadJSON(STORAGE_KEYS.doctor, {}) },
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "azul",
  logo: localStorage.getItem(STORAGE_KEYS.logo) || "",
  editingRecipeId: null,
  doctorEditing: false,
};

const nav = document.getElementById("mainNav");
const menuBtn = document.getElementById("menuBtn");
const views = {
  home: document.getElementById("view-home"),
  editor: document.getElementById("view-editor"),
  recipes: document.getElementById("view-recipes"),
  settings: document.getElementById("view-settings"),
};

const recipeForm = document.getElementById("recipeForm");
const editorTitle = document.getElementById("editorTitle");
const medicationsContainer = document.getElementById("medicationsContainer");
const medicationTemplate = document.getElementById("medicationTemplate");
const addMedicationBtn = document.getElementById("addMedicationBtn");
const shareRecipeBtn = document.getElementById("shareRecipeBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const recipesList = document.getElementById("recipesList");

const doctorForm = document.getElementById("doctorForm");
const toggleDoctorEditBtn = document.getElementById("toggleDoctorEditBtn");
const doctorActions = document.getElementById("doctorActions");
const saveDoctorBtn = document.getElementById("saveDoctorBtn");
const cancelDoctorBtn = document.getElementById("cancelDoctorBtn");

const logoInput = document.getElementById("logoInput");
const logoPreview = document.getElementById("logoPreview");
const removeLogoBtn = document.getElementById("removeLogoBtn");
const themeSelect = document.getElementById("themeSelect");
const previewModal = document.getElementById("previewModal");
const previewFrame = document.getElementById("previewFrame");
const previewPrintBtn = document.getElementById("previewPrintBtn");
const previewCloseBtn = document.getElementById("previewCloseBtn");
let previewHtml = "";

init();

function init() {
  setDefaultDate();
  setupNavigation();
  setupEditor();
  setupSettings();
  renderThemeOptions();
  renderDoctorForm();
  renderLogoPreview();
  renderRecipes();
  resetRecipeForm();
  setupPreviewModal();
}

function setupNavigation() {
  nav.addEventListener("click", (event) => {
    const btn = event.target.closest(".nav-btn");
    if (!btn) return;
    activateView(btn.dataset.view);
  });

  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => activateView(btn.dataset.go));
  });

  menuBtn.addEventListener("click", () => nav.classList.toggle("open"));
}

function activateView(viewKey) {
  Object.entries(views).forEach(([key, section]) => {
    section.classList.toggle("active", key === viewKey);
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewKey);
  });

  nav.classList.remove("open");

  if (viewKey === "recipes") renderRecipes();
  if (viewKey === "settings") {
    renderDoctorForm();
    renderLogoPreview();
  }
}

function setupEditor() {
  addMedicationBtn.addEventListener("click", () => addMedicationCard());
  cancelEditBtn.addEventListener("click", () => {
    resetRecipeForm();
    activateView("home");
  });

  document.getElementById("age").addEventListener("input", numericOnly);
  document.getElementById("weight").addEventListener("input", numericOnly);

  recipeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveRecipe(false);
  });

  shareRecipeBtn.addEventListener("click", () => saveRecipe(true));
}

function setupSettings() {
  toggleDoctorEditBtn.addEventListener("click", () => {
    state.doctorEditing = true;
    renderDoctorForm();
  });

  saveDoctorBtn.addEventListener("click", () => {
    const data = collectDoctorForm();
    state.doctor = data;
    saveDoctor();
    state.doctorEditing = false;
    renderDoctorForm();
    alert("Datos del medico guardados.");
  });

  cancelDoctorBtn.addEventListener("click", () => {
    state.doctorEditing = false;
    renderDoctorForm();
  });

  themeSelect.addEventListener("change", () => {
    state.theme = themeSelect.value;
    localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  });

  logoInput.addEventListener("change", handleLogoImport);
  removeLogoBtn.addEventListener("click", () => {
    state.logo = "";
    localStorage.removeItem(STORAGE_KEYS.logo);
    logoInput.value = "";
    renderLogoPreview();
  });
}

function setupPreviewModal() {
  previewCloseBtn.addEventListener("click", closePreviewModal);
  previewPrintBtn.addEventListener("click", () => {
    const frameWindow = previewFrame.contentWindow;
    if (frameWindow) {
      frameWindow.focus();
      frameWindow.print();
      return;
    }
    window.print();
  });
}

function renderThemeOptions() {
  themeSelect.innerHTML = THEMES.map(
    (t) => `<option value="${t.id}">${t.name}</option>`
  ).join("");
  themeSelect.value = state.theme;
}

function renderDoctorForm() {
  const f = state.doctor;
  doctorForm.innerHTML = `
    ${renderDoctorField("Prefijo", "prefix", f.prefix)}
    ${renderDoctorField("Nombre completo", "fullName", f.fullName, true)}
    ${renderDoctorField("Cedula profesional", "license", f.license, true)}
    ${renderDoctorField("Especialidad", "specialty", f.specialty)}
    ${renderDoctorField("Direccion", "address", f.address)}
    ${renderDoctorField("Telefono", "phone", f.phone)}
    ${renderDoctorField("Correo electronico", "email", f.email)}
  `;

  doctorForm.classList.toggle("readonly", !state.doctorEditing);
  doctorActions.classList.toggle("hidden", !state.doctorEditing);
  toggleDoctorEditBtn.classList.toggle("hidden", state.doctorEditing);
}

function renderDoctorField(label, key, value, required = false) {
  const req = required ? "required" : "";
  const escaped = escapeHtml(value || "");
  return `<label>${label}<input name="${key}" value="${escaped}" ${req}></label>`;
}

function collectDoctorForm() {
  const data = new FormData(doctorForm);
  return {
    prefix: (data.get("prefix") || "Dr/Dra").toString().trim(),
    fullName: (data.get("fullName") || "").toString().trim(),
    license: (data.get("license") || "").toString().trim(),
    specialty: (data.get("specialty") || "").toString().trim(),
    address: (data.get("address") || "").toString().trim(),
    phone: (data.get("phone") || "").toString().trim(),
    email: (data.get("email") || "").toString().trim(),
  };
}

function saveDoctor() {
  localStorage.setItem(STORAGE_KEYS.doctor, JSON.stringify(state.doctor));
}

function handleLogoImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Selecciona una imagen valida.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.logo = String(reader.result || "");
    localStorage.setItem(STORAGE_KEYS.logo, state.logo);
    renderLogoPreview();
  };
  reader.readAsDataURL(file);
}

function renderLogoPreview() {
  if (!state.logo) {
    logoPreview.textContent = "Sin logotipo";
    return;
  }
  logoPreview.innerHTML = `<img src="${state.logo}" alt="Logotipo" />`;
}

function setDefaultDate() {
  const issueDate = document.getElementById("issueDate");
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  issueDate.value = `${y}-${m}-${d}`;
}

function addMedicationCard(values = null) {
  const clone = medicationTemplate.content.cloneNode(true);
  const card = clone.querySelector(".medication-card");

  card.querySelectorAll("[data-field]").forEach((input) => {
    if (values && values[input.dataset.field]) {
      input.value = values[input.dataset.field];
    }
  });

  card.querySelector(".remove-med-btn").addEventListener("click", () => {
    if (medicationsContainer.children.length <= 1) return;
    card.remove();
    refreshMedicationIndexes();
  });

  medicationsContainer.appendChild(card);
  refreshMedicationIndexes();
}

function refreshMedicationIndexes() {
  [...medicationsContainer.children].forEach((card, index) => {
    const label = card.querySelector(".med-index");
    if (label) label.textContent = String(index + 1);

    const removeBtn = card.querySelector(".remove-med-btn");
    if (removeBtn) {
      removeBtn.classList.toggle("hidden", medicationsContainer.children.length === 1);
    }
  });
}

function collectMedications() {
  return [...medicationsContainer.children].map((card) => ({
    id: crypto.randomUUID(),
    name: card.querySelector('[data-field="name"]').value.trim(),
    presentation: card.querySelector('[data-field="presentation"]').value.trim(),
    dose: card.querySelector('[data-field="dose"]').value.trim(),
    route: card.querySelector('[data-field="route"]').value.trim(),
    frequency: card.querySelector('[data-field="frequency"]').value.trim(),
    duration: card.querySelector('[data-field="duration"]').value.trim(),
  }));
}

function collectRecipeForm() {
  return {
    patientName: document.getElementById("patientName").value.trim(),
    age: document.getElementById("age").value.trim(),
    sex: document.getElementById("sex").value,
    weight: document.getElementById("weight").value.trim(),
    medications: collectMedications(),
    indications: document.getElementById("indications").value.trim(),
    date: document.getElementById("issueDate").value,
    place: document.getElementById("place").value.trim(),
  };
}

function validateRecipe(form) {
  if (!form.patientName) return "Debes capturar el nombre del paciente.";
  if (!form.age) return "Debes capturar la edad.";

  const hasValidMedication = form.medications.some(
    (m) => m.name && m.dose && m.route && m.frequency
  );

  if (!hasValidMedication) {
    return "Debes capturar al menos un medicamento con nombre, dosis, via y frecuencia.";
  }

  return null;
}

function saveRecipe(shareAfterSave) {
  const form = collectRecipeForm();
  const error = validateRecipe(form);

  if (error) {
    alert(error);
    return;
  }

  const nowIso = new Date().toISOString();
  const recipe = {
    id: state.editingRecipeId || crypto.randomUUID(),
    createdAt:
      state.recipes.find((r) => r.id === state.editingRecipeId)?.createdAt || nowIso,
    updatedAt: nowIso,
    ...form,
  };

  const existingIndex = state.recipes.findIndex((r) => r.id === recipe.id);
  if (existingIndex >= 0) {
    state.recipes[existingIndex] = recipe;
  } else {
    state.recipes.push(recipe);
  }

  state.recipes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(state.recipes));

  if (shareAfterSave) {
    shareRecipe(recipe);
  } else {
    openPrintPreview(recipe, false);
    alert("Receta guardada correctamente.");
  }

  resetRecipeForm();
  renderRecipes();
  activateView("recipes");
}

function renderRecipes() {
  if (!state.recipes.length) {
    recipesList.innerHTML = `<article class="panel"><p>Sin recetas guardadas. Las recetas que generes apareceran aqui.</p></article>`;
    return;
  }

  recipesList.innerHTML = state.recipes
    .map((recipe) => {
      const meds = recipe.medications
        .map((m) => m.name)
        .filter(Boolean)
        .slice(0, 4)
        .join(", ");
      const patient = recipe.patientName || "Paciente sin nombre";
      const date = formatDate(recipe.date);
      return `
        <article class="recipe-item">
          <div class="recipe-item-top">
            <div>
              <h4>${escapeHtml(patient)}</h4>
              <div class="recipe-meta">${escapeHtml(date)}</div>
            </div>
            <div class="recipe-actions">
              <button class="btn tiny" data-action="edit" data-id="${recipe.id}">Editar</button>
              <button class="btn tiny" data-action="print" data-id="${recipe.id}">PDF</button>
              <button class="btn tiny danger" data-action="delete" data-id="${recipe.id}">Eliminar</button>
            </div>
          </div>
          <p class="recipe-meds"><strong>Medicamentos:</strong> ${escapeHtml(meds || "Sin capturar")}</p>
        </article>
      `;
    })
    .join("");

  recipesList.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const recipe = state.recipes.find((r) => r.id === id);
      if (!recipe) return;

      if (action === "edit") {
        loadRecipeForEdit(recipe);
      }

      if (action === "print") {
        openPrintPreview(recipe, true);
      }

      if (action === "delete") {
        const ok = confirm("Seguro que quieres eliminar esta receta?");
        if (!ok) return;
        state.recipes = state.recipes.filter((r) => r.id !== id);
        localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(state.recipes));
        renderRecipes();
      }
    });
  });
}

function loadRecipeForEdit(recipe) {
  state.editingRecipeId = recipe.id;
  editorTitle.textContent = "Editar receta";
  cancelEditBtn.classList.remove("hidden");

  document.getElementById("patientName").value = recipe.patientName;
  document.getElementById("age").value = recipe.age;
  document.getElementById("sex").value = recipe.sex;
  document.getElementById("weight").value = recipe.weight;
  document.getElementById("indications").value = recipe.indications;
  document.getElementById("issueDate").value = recipe.date;
  document.getElementById("place").value = recipe.place;

  medicationsContainer.innerHTML = "";
  if (recipe.medications.length) {
    recipe.medications.forEach((m) => addMedicationCard(m));
  } else {
    addMedicationCard();
  }

  activateView("editor");
}

function resetRecipeForm() {
  state.editingRecipeId = null;
  editorTitle.textContent = "Nueva receta";
  cancelEditBtn.classList.add("hidden");

  recipeForm.reset();
  setDefaultDate();
  medicationsContainer.innerHTML = "";
  addMedicationCard();
}

function numericOnly(event) {
  event.target.value = event.target.value.replace(/\D+/g, "");
}

function shareRecipe(recipe) {
  const text = buildShareText(recipe);

  if (navigator.share) {
    navigator
      .share({
        title: `Receta - ${recipe.patientName}`,
        text,
      })
      .catch(() => {
        openPrintPreview(recipe, true);
      });
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Resumen copiado al portapapeles. Se abrira vista para PDF.");
        openPrintPreview(recipe, true);
      })
      .catch(() => openPrintPreview(recipe, true));
    return;
  }

  openPrintPreview(recipe, true);
}

function buildShareText(recipe) {
  const meds = recipe.medications
    .filter((m) => m.name || m.dose || m.route || m.frequency)
    .map((m, i) => `${i + 1}. ${m.name || "Medicamento"} - Dosis: ${m.dose || "N/A"}`)
    .join("\n");

  return [
    `Receta medica`,
    `Paciente: ${recipe.patientName}`,
    `Edad: ${recipe.age}`,
    `Fecha: ${formatDate(recipe.date)}`,
    ``,
    `Medicamentos:`,
    meds || "Sin medicamentos",
  ].join("\n");
}

function openPrintPreview(recipe, promptPrint) {
  const theme = THEMES.find((t) => t.id === state.theme) || THEMES[0];
  const html = buildPrintableHtml(recipe, state.doctor, state.logo, theme.color);

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
  if (!printWindow || printWindow.closed || typeof printWindow.closed === "undefined") {
    openPreviewModal(html, promptPrint);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  if (promptPrint) {
    printWindow.onload = () => printWindow.print();
  }
}

function openPreviewModal(html, autoPrint) {
  previewHtml = html;
  previewFrame.srcdoc = previewHtml;
  previewModal.classList.remove("hidden");
  previewModal.setAttribute("aria-hidden", "false");

  if (autoPrint) {
    previewFrame.onload = () => {
      const frameWindow = previewFrame.contentWindow;
      if (frameWindow) {
        frameWindow.focus();
        frameWindow.print();
      }
    };
  }
}

function closePreviewModal() {
  previewModal.classList.add("hidden");
  previewModal.setAttribute("aria-hidden", "true");
  previewFrame.srcdoc = "";
}

function buildPrintableHtml(recipe, doctor, logo, themeColor) {
  const doctorName = formatDoctorName(doctor);
  const meds = recipe.medications
    .filter((m) => m.name || m.dose || m.route || m.frequency)
    .map((m, i) => {
      const duration = m.duration ? ` · Duracion: ${escapeHtml(m.duration)}` : "";
      return `
        <div class="print-med">
          <strong>${i + 1}. ${escapeHtml(m.name || "Medicamento")}</strong><br>
          Presentacion: ${escapeHtml(m.presentation || "N/A")}<br>
          Dosis: ${escapeHtml(m.dose || "N/A")} · Via: ${escapeHtml(m.route || "N/A")} · Frecuencia: ${escapeHtml(m.frequency || "N/A")}${duration}
        </div>
      `;
    })
    .join("");

  const logoHtml = logo
    ? `<img src="${logo}" class="print-logo" alt="Logotipo" />`
    : "";

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Receta - ${escapeHtml(recipe.patientName)}</title>
        <style>
          :root { --print-theme: ${themeColor}; }
          body { margin: 0; background: #fff; }
          .print-page { font-family: Arial, sans-serif; color: #111; padding: 24px; }
          .print-header { border: 2px solid var(--print-theme); border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; }
          .print-logo { width: 86px; height: 86px; object-fit: contain; }
          .print-section { margin-top: 14px; border-top: 2px solid var(--print-theme); padding-top: 8px; }
          .print-section h3 { margin: 0 0 8px; color: var(--print-theme); }
          .print-med { margin-bottom: 9px; }
          .meta { color: #444; }
          .signature { margin-top: 30px; text-align: right; }
          .signature-line { display: inline-block; width: 190px; border-top: 2px solid var(--print-theme); padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="print-page">
          <section class="print-header">
            <div>
              <h2 style="margin:0">${escapeHtml(doctorName || "Medico")}</h2>
              <div class="meta">Cedula profesional: ${escapeHtml(doctor.license || "N/A")}</div>
              <div class="meta">Especialidad: ${escapeHtml(doctor.specialty || "No especificada")}</div>
              <div class="meta">Direccion: ${escapeHtml(doctor.address || "No especificada")}</div>
              <div class="meta">Tel: ${escapeHtml(doctor.phone || "N/A")} · Correo: ${escapeHtml(doctor.email || "N/A")}</div>
            </div>
            ${logoHtml}
          </section>

          <section class="print-section">
            <h3>Datos del paciente</h3>
            <div>Nombre: ${escapeHtml(recipe.patientName)}</div>
            <div>Edad: ${escapeHtml(recipe.age)} · Sexo: ${escapeHtml(recipe.sex || "No especificado")} · Peso: ${escapeHtml(recipe.weight || "No especificado")}</div>
            <div>Fecha: ${escapeHtml(formatDate(recipe.date))} · Lugar: ${escapeHtml(recipe.place || "No especificado")}</div>
          </section>

          <section class="print-section">
            <h3>Prescripcion</h3>
            ${meds || "<div>Sin medicamentos capturados.</div>"}
          </section>

          <section class="print-section">
            <h3>Indicaciones</h3>
            <div>${escapeHtml(recipe.indications || "Sin indicaciones adicionales")}</div>
          </section>

          <section class="signature">
            <span class="signature-line">Firma</span>
          </section>
        </div>
      </body>
    </html>
  `;
}

function formatDate(dateRaw) {
  if (!dateRaw) return "Sin fecha";
  const date = new Date(`${dateRaw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateRaw;
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDoctorName(doctor) {
  const prefix = (doctor.prefix || "").trim();
  const name = (doctor.fullName || "").trim();
  if (!name) return "Medico";
  if (!prefix || prefix === "Dr/Dra") return name;
  return `${prefix} ${name}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
