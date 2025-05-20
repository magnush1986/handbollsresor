
document.addEventListener("DOMContentLoaded", () => {
  const data = [
    {
      "Namn": "USM Steg 1",
      "Plats": "Ej klart",
      "Typ": "USM",
      "DatumFrån": "2025-10-18",
      "DatumTill": "2025-10-19",
      "SamlingHärnösand": "2025-10-18 07.00.00",
      "Ledig": "Nej",
      "Kostnad": "1 000 kr",
      "Färdsätt": "Egen bil",
      "Länk": ""
    }
  ];

  const container = document.getElementById("event-container");

  data.forEach(d => {
    const div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML = `
      <strong>${d.Namn}</strong><br>
      📍 ${d.Plats} | 🏷️ ${d.Typ}<br>
      📅 ${d.DatumFrån} – ${d.DatumTill}<br>
      ⏰ ${d.SamlingHärnösand || ''}<br>
      🏫 Ledig från skolan: ${d.Ledig}<br>
      💰 Kostnad: ${d.Kostnad}<br>
      🚗 Färdsätt: ${d.Färdsätt || ''}<br>
      ${d.Länk ? `🔗 <a href='#'>Mer info</a>` : ''}
    `;
    container.appendChild(div);
  });
});

function togglePastEvents() {
  alert("Här kan du bygga in funktionalitet för att dölja/visa tidigare händelser.");
}
