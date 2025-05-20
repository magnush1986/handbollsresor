document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const href = window.location.href.toLowerCase();

  const isUSM = href.includes("usm.html");
  const isCup = href.includes("cup.html");
  const isLedigt = href.includes("ledig.html");

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
            const typ = e['Typ av händelse']?.toLowerCase() || "";
            const ledighet = e['Ledig från skolan?']?.toLowerCase() || "";
            const slutdatum = (e['Datum till'] || e['Datum från'])?.substring(0, 10);

            // filtrera typ
            if (isUSM && typ !== "usm") return;
            if (isCup && typ !== "cup") return;
            if (isLedigt && !ledighet.includes("ja")) return;

            // skapa kort
            const card = document.createElement("div");
            card.classList.add("event-card");

            // markera gamla
            if (slutdatum < today) {
              card.classList.add("past");
              card.style.display = "none";
            }

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
  const cards = document.querySelectorAll(".event-card.past");
  cards.forEach(card => {
    card.style.display = card.style.display === "none" ? "block" : "none";
  });
}
