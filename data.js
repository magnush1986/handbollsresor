
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  const data = [
    {
      Namn: "Örebrocupen",
      Plats: "Örebro",
      Typ: "Cup",
      DatumFrån: "2025-09-12",
      DatumTill: "2025-09-14",
      Färdsätt: "Egen bil",
      SamlingHärnösand: "2025-09-12 10:00",
      SamlingPlats: "2025-09-12 16:15",
      Ledig: "Ja hela fredagen",
      Kostnad: "1500 kr",
      Länk: ""
    },
    {
      Namn: "USM Steg 1",
      Plats: "Ej klart",
      Typ: "USM",
      DatumFrån: "2025-10-18",
      DatumTill: "2025-10-19",
      Färdsätt: "",
      SamlingHärnösand: "2025-10-18 07:00",
      SamlingPlats: "",
      Ledig: "Nej",
      Kostnad: "1000 kr",
      Länk: ""
    }
  ];

  const container = document.getElementById("event-container");

  data.forEach(e => {
    const end = e.DatumTill || e.DatumFrån;
    const isPast = end < today;
    const div = document.createElement("div");
    div.className = "event-card";
    div.style.display = isPast ? "none" : "block";
    div.innerHTML = `
      <strong>${e.Namn}</strong><br>
      📍 ${e.Plats} | 🏷 ${e.Typ}<br>
      📅 ${e.DatumFrån} – ${e.DatumTill}<br>
      ⏰ ${e.SamlingHärnösand} ${e.SamlingPlats || ''}<br>
      🏫 Ledig från skolan: ${e.Ledig}<br>
      💰 Kostnad: ${e.Kostnad}<br>
      🚗 Färdsätt: ${e.Färdsätt}<br>
      ${e.Länk ? `🔗 <a href="${e.Länk}" target="_blank">Mer info</a>` : ""}
    `;
    container.appendChild(div);
  });
});

function togglePast() {
  const all = document.querySelectorAll(".event-card");
  all.forEach(card => {
    card.style.display = card.style.display === "none" ? "block" : "none";
  });
}
