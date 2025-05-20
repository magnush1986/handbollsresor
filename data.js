
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];

  // Filtrering beroende på sida
  const page = window.location.pathname.toLowerCase();
  const isUSM = page.includes("usm");
  const isCup = page.includes("cup");
  const isLedigt = page.includes("ledig");

  fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv")
    .then(response => response.text())
    .then(csv => {
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const data = results.data;
          const container = document.getElementById("event-container");

          const future = [];
          const past = [];

          data.forEach(e => {
            if (isUSM && e['Typ av händelse'].toLowerCase() !== "usm") return;
            if (isCup && e['Typ av händelse'].toLowerCase() !== "cup") return;
            if (isLedigt && !e['Ledig från skolan?'].toLowerCase().includes("ja")) return;

            const end = (e["Datum till"] || e["Datum från"]).substring(0,10);
            const isFuture = end >= today;

            const card = document.createElement("div");
            card.className = "event-card";
            card.innerHTML = `
              <strong>${e['Namn på händelse']}</strong><br>
              📍 ${e['Plats']} | 🏷 ${e['Typ av händelse']}<br>
              📅 ${e['Datum från']} – ${e['Datum till']}<br>
              ⏰ ${e['Samling Härnösand'] || ''} ${e['Samling på plats'] || ''}<br>
              🏫 Ledig från skolan: ${e['Ledig från skolan?']}<br>
              💰 Kostnad: ${e['Kostnad per spelare']}<br>
              🚗 Färdsätt: ${e['Färdsätt'] || ''}<br>
              ${e["Länk till hemsida"] ? `🔗 <a href="${e["Länk till hemsida"]}" target="_blank">Mer info</a>` : ""}
            `;

            if (isFuture) {
              container.appendChild(card);
            } else {
              card.classList.add("past");
              card.style.display = "none";
              container.appendChild(card);
            }
          });
        }
      });
    });
});

function togglePast() {
  const past = document.querySelectorAll(".event-card.past");
  past.forEach(el => {
    el.style.display = el.style.display === "none" ? "block" : "none";
  });
}
