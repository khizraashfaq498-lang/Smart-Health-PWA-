document.addEventListener("DOMContentLoaded", () => {
  const medForm = document.getElementById("medForm");
  const medList = document.getElementById("medList");
  const alarmSound = document.getElementById("alarmSound");
  const currentRole = typeof getCurrentRole === "function" ? getCurrentRole() : null;
  const isDoctor = currentRole === "doctor";
  const isEditable = (typeof canEditMedsVitals === "function"
    ? canEditMedsVitals()
    : (typeof canEdit === "function" ? canEdit() : true)) || isDoctor;
  const isFamily = typeof isFamilyRole === "function" ? isFamilyRole() : false;
  const pageContainer = document.querySelector(".page-container");
  const medName = document.getElementById("medName");
  const medDosage = document.getElementById("medDosage");
  const medTime = document.getElementById("medTime");
  const submitButton = medForm ? medForm.querySelector("button[type='submit']") : null;
  const formTitle = medForm ? medForm.querySelector("h2") : null;

  let medicines = JSON.parse(localStorage.getItem("medicines")) || [];
  let editingMedId = null;

  function saveData() {
    localStorage.setItem("medicines", JSON.stringify(medicines));
  }

  function renderReadOnlyNotice() {
    if (!pageContainer) return;
    const notice = document.createElement("div");
    notice.className = "read-only-banner";
    notice.textContent = "Medications are read-only for this role.";
    pageContainer.prepend(notice);
  }

  function isPastTime(time) {
    if (!time) return false;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return time < currentTime;
  }

  function setFormState(med) {
    if (!medForm || !submitButton) return;
    if (med) {
      submitButton.textContent = isDoctor ? "Update Prescription" : "Update Medicine";
    } else {
      submitButton.textContent = isDoctor ? "Add Prescription" : "Add Medicine";
    }
  }

  function getSourceMeta(entry) {
    if (entry.enteredBy === "doctor") {
      return { label: "Doctor Prescribed", className: "source-doctor" };
    }
    if (entry.enteredBy === "family") {
      return { label: "Family Assisted", className: "source-family" };
    }
    return { label: "Patient Entered", className: "source-patient" };
  }

  function renderMeds() {
    if (!medList) return; // Exit if the list element isn't found
    medList.innerHTML = "";
    
    medicines.sort((a, b) => a.time.localeCompare(b.time));

    medicines.forEach(med => {
      const li = document.createElement("li");
      li.className = "med-item";
      const isLocked = (isFamily || isDoctor) && isPastTime(med.time);
      if (isLocked) {
        li.classList.add("locked-entry");
      }
      const sourceMeta = getSourceMeta(med);
      const sourceBadge = `<span class="source-badge ${sourceMeta.className}">${sourceMeta.label}</span>`;

      // Determine if we are on the dashboard or medications page
      const isDashboard = document.body.dataset.page === "dashboard";

      if (isDashboard || !isEditable) {
        // Simpler layout for the Dashboard
        li.innerHTML = `
          <div style="display:flex; justify-content:space-between; width:100%; padding: 5px 0;">
            <span><strong>${med.time}</strong> - ${med.name} ${sourceBadge}</span>
            <span>${med.taken ? "✅" : "⏳"}</span>
          </div>
        `;
      } else {
        const dosageText = med.dosage ? `Dose: ${med.dosage}` : "Dose: --";
        const lockBadge = isLocked ? `<span class="lock-badge">🔒 Locked</span>` : "";
        const editButton = !isLocked ? `<button class="action-button" onclick="editMed(${med.id})">Edit</button>` : "";
        const deleteButton = (!isFamily && !isDoctor)
          ? `<button onclick="deleteMed(${med.id})" class="action-button" style="background:#ffe6e6;">Delete</button>`
          : "";
        const takenControl = isDoctor
          ? `<span class="lock-badge">Plan Only</span>`
          : `
            <label>
              <input type="checkbox" ${med.taken ? "checked" : ""} onchange="toggleTaken(${med.id})" ${isLocked ? "disabled" : ""}>
              Taken
            </label>
          `;
        // Full layout with buttons for the Medications page
        li.innerHTML = `
          <div class="med-details">
            <div class="med-main"><strong>${med.time}</strong> — ${med.name}</div>
            <div class="med-sub">${dosageText}</div>
            <div class="med-sub">${sourceBadge}</div>
          </div>
          <div class="med-actions">
            ${lockBadge}
            ${takenControl}
            ${editButton}
            ${deleteButton}
          </div>
        `;
      }
      medList.appendChild(li);
    });
  }

  // Only attach form listener if the form exists (Prevents errors on dashboard)
  if (medForm && isEditable) {
    if (isDoctor && formTitle) {
      formTitle.textContent = "Prescribed by Doctor";
    }
    medForm.addEventListener("submit", e => {
      e.preventDefault();
      
      const medNameValue = medName.value.trim();
      const medDosageValue = medDosage.value.trim();
      const medTimeValue = medTime.value;

      if (editingMedId) {
        const med = medicines.find(item => item.id === editingMedId);
        if (med) {
          med.name = medNameValue;
          med.dosage = medDosageValue;
          med.time = medTimeValue;
          if (isFamily || isDoctor) {
            med.enteredBy = isDoctor ? "doctor" : "family";
          }
        }
      } else {
        const newMed = {
          id: Date.now(),
          name: medNameValue,
          dosage: medDosageValue,
          time: medTimeValue,
          taken: false,
          notified: false,
          enteredBy: isDoctor ? "doctor" : (isFamily ? "family" : undefined)
        };

        medicines.push(newMed);
      }
      saveData();
      renderMeds();
      medForm.reset();
      editingMedId = null;
      setFormState(null);
    });
  } else if (medForm && !isEditable) {
    medForm.classList.add("hidden");
    renderReadOnlyNotice();
  }

  // Global functions for the buttons
  window.toggleTaken = (id) => {
    if (!isEditable || isDoctor) return;
    const med = medicines.find(m => m.id === id);
    if (med && !(isFamily && isPastTime(med.time))) {
      med.taken = !med.taken;
      saveData();
      renderMeds(); // Re-render to show updated status
    }
  };

  window.deleteMed = (id) => {
    if (!isEditable || isFamily || isDoctor) return;
    medicines = medicines.filter(m => m.id !== id);
    saveData();
    renderMeds();
  };

  window.editMed = (id) => {
    if (!isEditable) return;
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    if ((isFamily || isDoctor) && isPastTime(med.time)) return;
    editingMedId = id;
    medName.value = med.name || "";
    medDosage.value = med.dosage || "";
    medTime.value = med.time || "";
    setFormState(med);
  };

  // Run the initial render
  renderMeds();

  // Alarm Interval (Only play sound if alarmSound exists on the current page)
  setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    medicines.forEach(med => {
      if (med.time === currentTime && !med.notified) {
        if (alarmSound) alarmSound.play();
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Medication Reminder", { body: `Time to take: ${med.name}` });
        }
        med.notified = true;
        saveData();
      }
    });
  }, 30000);
});
