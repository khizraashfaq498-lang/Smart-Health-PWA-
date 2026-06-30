document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".bottom-nav button");
  const currentPage = document.body.dataset.page;
  const currentRole = typeof getCurrentRole === "function" ? getCurrentRole() : null;

  buttons.forEach((btn) => {
    if (btn.dataset.page === currentPage) {
      btn.classList.add("active");
    }

    if (btn.dataset.page === "voice" && currentRole !== "senior") {
      btn.remove();
      return;
    }

    btn.addEventListener("click", () => {
      const page = btn.dataset.page;

      if (page === "voice" && currentRole !== "senior") {
        window.location.href = "dashboard.html";
        return;
      }

      switch (page) {
        case "dashboard":
          window.location.href = "dashboard.html";
          break;
        case "medications":
          window.location.href = "medications.html";
          break;
        case "reports":
          window.location.href = "reports.html";
          break;
        case "vitals":
          window.location.href = "vitals.html";
          break;
        case "steps":
          window.location.href = "pedometer.html";
          break;
        case "voice":
          window.location.href = "voice.html";
          break;
      }
    });
  });
});
