document.addEventListener("DOMContentLoaded", () => {

  const chatbotBtn = document.getElementById("chatbot-button");
  const chatbotCard = document.getElementById("chatbot-card");
  const closeBtn = document.getElementById("closeChatbot");
  const content = document.getElementById("chatbot-content");

  chatbotBtn.onclick = () => chatbotCard.classList.toggle("hidden");
  closeBtn.onclick = () => chatbotCard.classList.add("hidden");

  document.querySelectorAll(".chatbot-actions button").forEach(btn => {
    btn.addEventListener("click", () => handleAction(btn.dataset.action));
  });

  function handleAction(action) {
    const steps = parseInt(localStorage.getItem("stepsToday")) || 0;
    const goal = parseInt(localStorage.getItem("stepGoal")) || 5000;
    const vitals = JSON.parse(localStorage.getItem("vitals")) || [];
    const meds = JSON.parse(localStorage.getItem("medicines")) || [];

    let message = "";

    switch (action) {

      case "todaySummary":
        message = `
        📊 <b>Today's Summary</b><br>
        Steps: ${steps} / ${goal}<br>
        Medications scheduled: ${meds.length}<br>
        Vitals records: ${vitals.length}
        `;
        break;

      case "stepsAdvice":
        message = steps >= goal
          ? `🎉 Great job! You completed ${steps} steps today. Keep moving!`
          : `👣 You walked ${steps} steps today. Try a short walk to reach ${goal}.`;
        break;

      case "vitalsCheck":
        message = vitals.length > 0
          ? `❤️ Your vitals are recorded today. Everything looks stable.`
          : `⚠️ No vitals recorded today. Please enter them for better tracking.`;
        break;

      case "medicationCheck":
        message = meds.length > 0
          ? `💊 You have ${meds.length} medicines scheduled today. Don’t forget them!`
          : `ℹ️ No medications scheduled.`;
        break;

      case "motivation":
        message = `🌟 You're doing great! Small steps every day lead to big health improvements.`;
        break;
    }

    content.innerHTML = `<p>${message}</p>`;
  }
});
