document.addEventListener("DOMContentLoaded", () => {
    const currentRole = typeof getCurrentRole === "function" ? getCurrentRole() : null;
    const isDoctor = currentRole === "doctor";
    const isEditable = typeof canEditSteps === "function"
        ? canEditSteps()
        : (typeof canEdit === "function" ? canEdit() : true);
    const canEditGoals = isEditable || isDoctor;
    const pageContainer = document.querySelector(".page-container");

    // --- Common Data ---
    let stepsToday = parseInt(localStorage.getItem("stepsToday")) || 0;
    let stepGoal = parseInt(localStorage.getItem("stepGoal")) || 5000;
    let stepGoalMeta = (() => {
        try {
            const stored = localStorage.getItem("stepGoalMeta");
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            return null;
        }
    })();

    // --- Dashboard Elements ---
    const dashSteps = document.getElementById("stepsToday");
    const dashGoal = document.getElementById("stepGoal");

    // --- Pedometer Elements ---
    const stepsCountEl = document.getElementById("stepsCount");
    const goalTextEl = document.getElementById("stepGoalText");
    const goalSourceEl = document.getElementById("stepGoalSource");
    const progressCircle = document.getElementById("progressCircle");
    const stepsInput = document.getElementById("stepsInput");
    const goalInput = document.getElementById("goalInput");
    const addStepsBtn = document.getElementById("addStepsBtn");
    const updateGoalBtn = document.getElementById("updateGoalBtn");
    const startWalkBtn = document.getElementById("startWalkBtn");
    const stopWalkBtn = document.getElementById("stopWalkBtn");
    const addStepsCard = document.getElementById("addStepsCard");
    const recordStepsCard = document.getElementById("recordStepsCard");
    const goalTitle = document.getElementById("goalCardTitle");

    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    function getTodayDateKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function resetDailyStepsIfNeeded() {
        const today = getTodayDateKey();
        const lastStepResetDate = localStorage.getItem("lastStepResetDate");

        if (lastStepResetDate !== today) {
            stepsToday = 0;
            localStorage.setItem("stepsToday", "0");
            localStorage.setItem("lastStepResetDate", today);
        }
    }

    function updateUI() {
        // Update Dashboard Page
        if (dashSteps) dashSteps.textContent = stepsToday.toLocaleString();
        if (dashGoal) dashGoal.textContent = stepGoal.toLocaleString();

        // Update Pedometer Page
        if (stepsCountEl) stepsCountEl.textContent = stepsToday.toLocaleString();
        if (goalTextEl) goalTextEl.textContent = stepGoal.toLocaleString();
        if (goalSourceEl) {
            const enteredBy = stepGoalMeta?.enteredBy || "patient";
            let label = "Patient Entered";
            let className = "source-patient";
            if (enteredBy === "doctor") {
                label = "Doctor Prescribed";
                className = "source-doctor";
            } else if (enteredBy === "family") {
                label = "Family Assisted";
                className = "source-family";
            }
            goalSourceEl.textContent = label;
            goalSourceEl.className = `source-badge ${className}`;
        }
        
        if (progressCircle) {
            progressCircle.style.strokeDasharray = circumference;
            const progress = Math.min(stepsToday / stepGoal, 1);
            const offset = circumference - (progress * circumference);
            progressCircle.style.strokeDashoffset = offset;
        }
    }

    resetDailyStepsIfNeeded();

    if (!canEditGoals) {
        if (pageContainer) {
            const notice = document.createElement("div");
            notice.className = "read-only-banner";
            notice.textContent = "Family view: steps are read-only.";
            pageContainer.prepend(notice);
        }

        document.querySelectorAll(".edit-only").forEach(card => {
            card.classList.add("hidden");
        });

        updateUI();
        return;
    }

    if (isDoctor) {
        if (pageContainer) {
            const notice = document.createElement("div");
            notice.className = "read-only-banner";
            notice.textContent = "Doctor view: update goals only.";
            pageContainer.prepend(notice);
        }
        if (addStepsCard) addStepsCard.classList.add("hidden");
        if (recordStepsCard) recordStepsCard.classList.add("hidden");
        if (goalTitle) goalTitle.textContent = "Recommended Target";
    }

    // --- Event Listeners (Only if elements exist) ---
    if (addStepsBtn) {
        addStepsBtn.addEventListener("click", () => {
            if (isDoctor) return;
            resetDailyStepsIfNeeded();
            const val = parseInt(stepsInput.value);
            if (!val || val <= 0) return;
            stepsToday += val;
            localStorage.setItem("stepsToday", stepsToday);
            stepsInput.value = "";
            updateUI();
        });
    }

    if (updateGoalBtn) {
        updateGoalBtn.addEventListener("click", () => {
            const val = parseInt(goalInput.value);
            if (!val || val <= 0) return;
            stepGoal = val;
            localStorage.setItem("stepGoal", stepGoal);
            if (isDoctor) {
                stepGoalMeta = {
                    value: stepGoal,
                    enteredBy: "doctor",
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem("stepGoalMeta", JSON.stringify(stepGoalMeta));
            } else {
                stepGoalMeta = null;
            }
            goalInput.value = "";
            updateUI();
        });
    }

    let walkInterval = null;
    if (startWalkBtn) {
        startWalkBtn.addEventListener("click", () => {
            if (isDoctor) return;
            if (walkInterval) return;
            walkInterval = setInterval(() => {
                resetDailyStepsIfNeeded();
                stepsToday += 1;
                localStorage.setItem("stepsToday", stepsToday);
                updateUI();
            }, 2000);
        });
    }

    if (stopWalkBtn) {
        stopWalkBtn.addEventListener("click", () => {
            if (isDoctor) return;
            clearInterval(walkInterval);
            walkInterval = null;
        });
    }

    // Initial Load
    updateUI();
});
