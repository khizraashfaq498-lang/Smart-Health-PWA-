document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("vitalsForm");
  const statusMsg = document.getElementById("statusMsg");
  const currentRole = typeof getCurrentRole === "function" ? getCurrentRole() : null;
  const isDoctor = currentRole === "doctor";
  const canEditBase = typeof canEditMedsVitals === "function"
    ? canEditMedsVitals()
    : (typeof canEdit === "function" ? canEdit() : true);
  const isEditable = canEditBase || isDoctor;
  const isFamily = typeof isFamilyRole === "function" ? isFamilyRole() : false;
  const pageContainer = document.querySelector(".page-container");
  const vitalsList = document.getElementById("vitalsList");
  const vitalsEmpty = document.getElementById("vitalsEmpty");
  const submitButton = form.querySelector("button[type='submit']");
  const formTitle = form.querySelector("h2");
  const vitalsTargetsContainer = document.getElementById("vitalsTargets");
  const vitalsTargetsEmpty = document.getElementById("vitalsTargetsEmpty");
  const vitalsTargetsGrid = document.getElementById("vitalsTargetsGrid");
  const bpField = document.getElementById("bp");
  const hrField = document.getElementById("hr");
  const tempField = document.getElementById("temp");
  const slField = document.getElementById("sl");

  let editingVitalId = null;

  if (!form) return;

  const getVitalsHistory = () => {
    try {
      const storedData = localStorage.getItem("vitals");
      const parsed = storedData ? JSON.parse(storedData) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  };

  const saveVitalsHistory = (vitalsHistory) => {
    localStorage.setItem("vitals", JSON.stringify(vitalsHistory));
  };

  const getVitalIdentifier = (entry) => entry.id || entry.timestamp;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown time";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString();
  };

  const getSourceMeta = (entry) => {
    if (entry.enteredBy === "doctor") {
      return { label: "Doctor Prescribed", className: "source-doctor" };
    }
    if (entry.enteredBy === "family") {
      return { label: "Family Assisted", className: "source-family" };
    }
    return { label: "Patient Entered", className: "source-patient" };
  };

  const getVitalsTargets = () => {
    try {
      const stored = localStorage.getItem("vitalsTargets");
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (err) {
      return null;
    }
  };

  const setFormState = (entry) => {
    if (isDoctor) {
      submitButton.textContent = entry ? "Update Target" : "Save Target";
      return;
    }
    submitButton.textContent = entry ? "Update Vitals" : "Save Vitals";
  };

  const fillForm = (entry) => {
    bpField.value = entry.bp || "";
    hrField.value = entry.hr || "";
    tempField.value = entry.temp || "";
    slField.value = entry.sl || "";
  };

  const renderVitalsTargets = () => {
    if (!vitalsTargetsContainer || !vitalsTargetsGrid) return;
    const targets = getVitalsTargets();
    vitalsTargetsGrid.innerHTML = "";

    if (!targets) {
      if (vitalsTargetsEmpty) vitalsTargetsEmpty.classList.remove("hidden");
      return;
    }

    if (vitalsTargetsEmpty) vitalsTargetsEmpty.classList.add("hidden");

    const sourceMeta = getSourceMeta(targets);
    const header = document.createElement("div");
    header.className = "vitals-targets-header";
    header.innerHTML = `
      <span class="source-badge ${sourceMeta.className}">${sourceMeta.label}</span>
      <span class="vitals-targets-time">Updated ${formatTimestamp(targets.updatedAt)}</span>
    `;
    vitalsTargetsGrid.appendChild(header);

    const fields = [
      { label: "Blood Pressure", value: targets.bp || "--" },
      { label: "Heart Rate", value: targets.hr ? `${targets.hr} bpm` : "--" },
      { label: "Temperature", value: targets.temp ? `${targets.temp} °C` : "--" },
      { label: "Sugar Level", value: targets.sl ? `${targets.sl} mg/dl` : "--" }
    ];

    fields.forEach((field) => {
      const item = document.createElement("div");
      item.className = "vitals-value";

      const label = document.createElement("span");
      label.className = "vitals-label";
      label.textContent = field.label;

      const value = document.createElement("span");
      value.className = "vitals-number";
      value.textContent = field.value;

      item.appendChild(label);
      item.appendChild(value);
      vitalsTargetsGrid.appendChild(item);
    });
  };

  const renderVitals = () => {
    if (!vitalsList) return;
    const vitalsHistory = getVitalsHistory();
    vitalsList.innerHTML = "";

    if (vitalsEmpty) {
      vitalsEmpty.classList.toggle("hidden", vitalsHistory.length > 0);
    }

    const sortedHistory = vitalsHistory.slice().sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });

    const latestVital = sortedHistory[0];
    const latestId = latestVital ? getVitalIdentifier(latestVital) : null;

    sortedHistory.forEach((entry) => {
      const listItem = document.createElement("li");
      listItem.className = "vitals-item";
      const entryId = getVitalIdentifier(entry);
      const isLatest = entryId === latestId;
      const isLocked = (isFamily && !isLatest) || isDoctor;
      if (isLocked) {
        listItem.classList.add("locked-entry");
      }

      const header = document.createElement("div");
      header.className = "vitals-item-header";

      const timeStamp = document.createElement("span");
      timeStamp.className = "vitals-time";
      timeStamp.textContent = formatTimestamp(entry.timestamp);
      header.appendChild(timeStamp);

      if (isEditable && !isDoctor) {
        const actionWrapper = document.createElement("div");
        actionWrapper.className = "vitals-actions";

        if (isLocked) {
          const lockBadge = document.createElement("span");
          lockBadge.className = "lock-badge";
          lockBadge.textContent = "🔒 Locked";
          actionWrapper.appendChild(lockBadge);
        } else {
          const editButton = document.createElement("button");
          editButton.type = "button";
          editButton.className = "action-button";
          editButton.textContent = "Edit";
          editButton.addEventListener("click", () => window.editVital(entryId));

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "action-button delete-button";
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => window.deleteVital(entryId));

          actionWrapper.appendChild(editButton);
          actionWrapper.appendChild(deleteButton);
        }
        header.appendChild(actionWrapper);
      }

      const sourceMeta = getSourceMeta(entry);
      const sourceBadge = document.createElement("span");
      sourceBadge.className = `source-badge ${sourceMeta.className}`;
      sourceBadge.textContent = sourceMeta.label;
      header.appendChild(sourceBadge);

      const grid = document.createElement("div");
      grid.className = "vitals-item-grid";

      const fields = [
        { label: "Blood Pressure", value: entry.bp || "--" },
        { label: "Heart Rate", value: entry.hr ? `${entry.hr} bpm` : "--" },
        { label: "Temperature", value: entry.temp ? `${entry.temp} °C` : "--" },
        { label: "Sugar Level", value: entry.sl ? `${entry.sl} mg/dl` : "--" }
      ];

      fields.forEach((field) => {
        const item = document.createElement("div");
        item.className = "vitals-value";

        const label = document.createElement("span");
        label.className = "vitals-label";
        label.textContent = field.label;

        const value = document.createElement("span");
        value.className = "vitals-number";
        value.textContent = field.value;

        item.appendChild(label);
        item.appendChild(value);
        grid.appendChild(item);
      });

      listItem.appendChild(header);
      listItem.appendChild(grid);
      vitalsList.appendChild(listItem);
    });
  };

  if (!isEditable) {
    form.classList.add("hidden");
    if (pageContainer) {
      const notice = document.createElement("div");
      notice.className = "read-only-banner";
      notice.textContent = "Vitals are read-only for this role.";
      pageContainer.prepend(notice);
    }
  }

  if (isDoctor && formTitle) {
    formTitle.textContent = "Recommended Target";
  }

  window.editVital = (id) => {
    if (!isEditable || isDoctor) return;
    const vitalsHistory = getVitalsHistory();
    const entry = vitalsHistory.find((item) => getVitalIdentifier(item) === id);
    if (!entry) return;

    const sortedHistory = vitalsHistory.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestId = sortedHistory[0] ? getVitalIdentifier(sortedHistory[0]) : null;
    if (isFamily && id !== latestId) return;

    editingVitalId = id;
    fillForm(entry);
    setFormState(entry);
  };

  window.deleteVital = (id) => {
    if (!isEditable || isFamily || isDoctor) return;
    const vitalsHistory = getVitalsHistory();
    const updatedHistory = vitalsHistory.filter((item) => getVitalIdentifier(item) !== id);
    saveVitalsHistory(updatedHistory);

    if (editingVitalId === id) {
      form.reset();
      editingVitalId = null;
      setFormState(null);
    }

    renderVitals();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const bp = bpField.value.trim();
    const hr = hrField.value.trim();
    const temp = tempField.value.trim();
    const sl = slField.value.trim();

    if (!bp || !hr || !temp || !sl) {
      statusMsg.textContent = "Please fill all fields!";
      statusMsg.className = "error";
      statusMsg.style.color = "red";
      return;
    }

    const vitalsHistory = getVitalsHistory();
    const entryPayload = {
      bp: bp,
      hr: Number(hr),
      temp: Number(temp),
      sl: Number(sl)
    };

    if (isDoctor) {
      const targetPayload = {
        ...entryPayload,
        updatedAt: new Date().toISOString(),
        enteredBy: "doctor"
      };
      localStorage.setItem("vitalsTargets", JSON.stringify(targetPayload));
      statusMsg.textContent = "Recommended targets saved!";
    } else {
      if (editingVitalId) {
        const entry = vitalsHistory.find((item) => getVitalIdentifier(item) === editingVitalId);
        if (entry) {
          entry.bp = entryPayload.bp;
          entry.hr = entryPayload.hr;
          entry.temp = entryPayload.temp;
          entry.sl = entryPayload.sl;
          if (isFamily) {
            entry.enteredBy = "family";
          }
        }
      } else {
        const vitalsEntry = {
          ...entryPayload,
          id: Date.now(),
          timestamp: new Date().toISOString(),
          enteredBy: isFamily ? "family" : undefined
        };
        vitalsHistory.push(vitalsEntry);
      }

      saveVitalsHistory(vitalsHistory);
      statusMsg.textContent = "Vitals saved successfully!";
    }
    statusMsg.style.color = "green";

    form.reset();
    editingVitalId = null;
    setFormState(null);
    renderVitals();
    renderVitalsTargets();
  });

  renderVitals();
  renderVitalsTargets();

  if (isDoctor) {
    const targets = getVitalsTargets();
    if (targets) {
      fillForm(targets);
      setFormState(targets);
    } else {
      setFormState(null);
    }
  }
});
