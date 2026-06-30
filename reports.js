document.addEventListener('DOMContentLoaded', () => {
    // 1. Ensure the data-page check is correct
    const currentPage = document.body.getAttribute('data-page');
    console.log("Current Page detected:", currentPage);
    const isEditable = typeof canEdit === "function" ? canEdit() : true;
    const pageContainer = document.querySelector(".page-container");
    const currentRole = typeof getCurrentRole === "function" ? getCurrentRole() : null;
    const isDoctor = currentRole === "doctor";

    if (currentPage === 'reports') {
        if (!isEditable && pageContainer) {
            const notice = document.createElement("div");
            notice.className = "read-only-banner";
            notice.textContent = isDoctor
                ? "Doctor View"
                : "Family View";
            pageContainer.prepend(notice);
        }
        renderReports();
        renderVitalsHistory();
    }

    function getSourceMeta(entry) {
        if (entry?.enteredBy === "doctor") {
            return { label: "Doctor Prescribed", className: "source-doctor" };
        }
        if (entry?.enteredBy === "family") {
            return { label: "Family Assisted", className: "source-family" };
        }
        return { label: "Patient Entered", className: "source-patient" };
    }

    function renderReports() {
        // Try to get data - check your 'key' names in localStorage!
        const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
        const stepsToday = parseInt(localStorage.getItem('stepsToday')) || 0;
        const stepGoal = parseInt(localStorage.getItem('stepGoal')) || 5000;
        const stepGoalMeta = (() => {
            try {
                const stored = localStorage.getItem("stepGoalMeta");
                return stored ? JSON.parse(stored) : null;
            } catch (err) {
                return null;
            }
        })();
        const vitalsTargets = (() => {
            try {
                const stored = localStorage.getItem("vitalsTargets");
                return stored ? JSON.parse(stored) : null;
            } catch (err) {
                return null;
            }
        })();

        console.log("Medicines found:", medicines);

        // Update Summary Stats
        const weeklyStepsEl = document.getElementById('weeklySteps');
        if (weeklyStepsEl) weeklyStepsEl.textContent = stepsToday.toLocaleString();
        
        const missedMedsEl = document.getElementById('missedMeds');
        if (missedMedsEl) {
            missedMedsEl.textContent = medicines.length > 0 ? "0" : "None set";
        }
        
        const alertsCountEl = document.getElementById('alertsCount');
        if (alertsCountEl) {
            alertsCountEl.textContent = stepsToday < (stepGoal / 2) ? "1" : "0";
        }

        const clinicalTargets = document.getElementById("clinicalTargets");
        if (clinicalTargets) {
            const stepSource = getSourceMeta(stepGoalMeta);
            const stepLabel = stepGoalMeta?.value || stepGoal;
            const vitalsSource = vitalsTargets ? getSourceMeta(vitalsTargets) : { label: "Not Set", className: "source-neutral" };
            clinicalTargets.innerHTML = `
                <div class="report-row">
                    <p>Step Goal</p>
                    <div class="report-meta">
                        <span>${stepLabel.toLocaleString()} steps</span>
                        <span class="source-badge ${stepSource.className}">${stepSource.label}</span>
                    </div>
                </div>
                <div class="report-row">
                    <p>Vitals Targets</p>
                    <div class="report-meta">
                        <span>${vitalsTargets ? `BP ${vitalsTargets.bp || "--"}, HR ${vitalsTargets.hr || "--"} bpm` : "Not set"}</span>
                        <span class="source-badge ${vitalsSource.className}">${vitalsSource.label}</span>
                    </div>
                </div>
            `;
        }

        // Update Medication List
        const medTable = document.getElementById('medTable');
        if (medTable) {
            if (medicines.length > 0) {
                medTable.innerHTML = medicines.map(med => {
                    const sourceMeta = getSourceMeta(med);
                    return `
                        <div class="report-row">
                            <p>${med.name} <small>(${med.time || 'No Time'})</small></p>
                            <div class="report-meta">
                                <span class="status-pill">Scheduled</span>
                                <span class="source-badge ${sourceMeta.className}">${sourceMeta.label}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                medTable.innerHTML = '<div class="report-row"><p>No medications found.</p></div>';
            }
        }
    }

    function renderVitalsHistory() {
        const vitals = (JSON.parse(localStorage.getItem("vitals")) || [])
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const vitalsContainer = document.getElementById("vitalsTable");

        console.log("Vitals found:", vitals);

        if (!vitalsContainer) return;

        vitalsContainer.innerHTML = "";

        if (vitals.length > 0) {
            vitals.forEach(v => {
                // Ensure date is valid
                const dateStr = v.timestamp ? new Date(v.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "N/A";
                const sourceMeta = getSourceMeta(v);
                
                const row = document.createElement("div");
                row.className = "report-row";
                row.innerHTML = `
                    <div style="display:flex; flex-direction:column; width:100%;">
                        <div style="display:flex; justify-content:space-between; width:100%; border-bottom:1px solid #eee; margin-bottom:5px;">
                            <p style="color:var(--color-red-maroon)">${dateStr}</p>
                            <div class="report-meta">
                                <span class="status-pill">Log</span>
                                <span class="source-badge ${sourceMeta.className}">${sourceMeta.label}</span>
                            </div>
                        </div>
                        <div class="vitals-data-points">
                            <span>BP: ${v.bp || '--'}</span>
                            <span>SL: ${v.sl || v.sugar || '--'}</span> 
                            <span>HR: ${v.hr || '--'} bpm</span>
                            <span>Temp: ${v.temp || '--'}°C</span>
                        </div>
                    </div>
                `;
                vitalsContainer.appendChild(row);
            });
        } else {
            vitalsContainer.innerHTML = '<div class="report-row"><p>No history found.</p></div>';
        }
    }
});
