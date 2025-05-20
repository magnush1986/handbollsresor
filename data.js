
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const path = window.location.pathname.toLowerCase();
  const filterUSM = path.includes("usm");
  const filterCup = path.includes("cup");
  const filterLedigt = path.includes("ledig");

  fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv")
    .then(r => r.text())
    .then(csv => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const rows = results.data;
          const container = document.getElementById("event-container");

          rows.forEach(e => {
            const type = e['Typ av händelse']?.toLowerCase();
            if (filterUSM && type !== 'usm') return;
            if (filterCup && type !== 'cup') return;
            if (filterLedigt && !e['Ledig från skolan?']?.toLowerCase().includes('ja')) return;

            const endDate = (e['Datum till'] || e['Datum från'])?.substring(0, 10);
            const isFuture = endDate >= today;

            const card = document.createElement("div");
            card.className = "event-card";
            if (!isFuture) card.classList.add("past");
            card.style.display = isFuture ? "block" : "none";

            card.innerHTML = `
              <strong>${e['Namn på händelse']}</strong><br>
              📍 ${e['Plats']} | 🏷 ${e['Typ av händelse']}<br>
              📅 ${e['Datum från']} – ${e['Datum till']}<br>
              ⏰ ${e['Samling Härnösand'] || ''} ${e['Samling på plats'] || ''}<br>
              🏫 Ledig från skolan: ${e['Ledig från skolan?']}<br>
              💰 Kostnad: ${e['Kostnad per spelare']}<br>
              🚗 Färdsätt: ${e['Färdsätt'] || ''}<br>
              ${e["Hemsida_URL"] ? `🔗 <a href="${e["Hemsida_URL"]}" target="_blank">Mer info</a>` : ""}
            `;
            container.appendChild(card);
          });
        }
      });
    });
});

function togglePast() {
  const past = document.querySelectorAll(".event-card.past");
  past.forEach(card => {
    card.style.display = (card.style.display === "none") ? "block" : "none";
  });
}
