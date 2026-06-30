function loadLatestVitals() {
  const vitals = JSON.parse(localStorage.getItem("vitals")) || [];

  if (vitals.length === 0) return;

  const latest = vitals
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!latest) return;

  document.getElementById("dash-bp").textContent = latest.bp || "--";
  document.getElementById("dash-hr").textContent = latest.hr || "--";
  document.getElementById("dash-temp").textContent = latest.temp ? `${latest.temp}°C` : "--";
}
document.addEventListener("DOMContentLoaded", loadLatestVitals);
