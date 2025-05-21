// Bygger vidare exakt på v4-koden – med:
// - filtrering för USM/Cup/Ledig per URL
// - korrekt sortering och gruppering per År–Månad (numeriskt)
// - tidigare händelser längst ner, dolda från början med rubrik & linje
// - korrekt länk via Hemsida_URL

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';

function loadEvents() {
  const href = window.location.href.toLowerCase();
  const isUSM = href.includes("usm.html");
  const isCup = href.includes("cup.html");
  const isLedigt = href.includes("ledig.html");
  const today = new Date().toISOString().split("T")[0];

  fetch(SHEET_URL)
    .then(response => response.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const events = results.data;

          const upcomingGrouped = {};
          const pastGrouped = {};

          events.forEach(e => {
            const typ = e['Typ av händelse']?.toLowerCase() || '';
            const ledighet = e['Ledig från skolan?']?.toLowerCase() || '';
            if (isUSM && typ !== 'usm') return;
            if (isCup && typ !== 'cup') return;
            if (isLedigt && !ledighet.includes('ja')) return;

            const year = e['År'];
            const monthNum = e['Månadsnummer'].padStart(2, '0');
            const monthName = e['Månadsnamn'];
            const key = `${year}-${monthNum}`;
            const groupEntry = { namn: monthName, år: year, data: [] };

            const slutdatumRaw = e['Datum till'] || e['Datum från'];
            const slutdatum = slutdatumRaw?.substring(0, 10) || "0000-00-00";
            const isPast = slutdatum < today;
            e._isPast = isPast;

            const target = isPast ? pastGrouped : upcomingGrouped;
            if (!target[key]) target[key] = { ...groupEntry, data: [] };
            target[key].data.push(e);
          });

          const container = document.getElementById('event-container');

          function renderGrouped(grouped, isPast = false) {
            Object.keys(grouped)
              .sort((a, b) => {
                const [ay, am] = a.split('-').map(Number);
                const [by, bm] = b.split('-').map(Number);
                return ay !== by ? ay - by : am - bm;
              })
              .forEach(key => {
                const { namn, år, data } = grouped[key];
                const groupDiv = document.createElement('div');
                groupDiv.className = isPast ? 'event-group past-group' : 'event-group';
                if (isPast) groupDiv.style.display = 'none';
                groupDiv.innerHTML = `<h2>📅 ${år} – ${namn}</h2>`;

                data.forEach(e => {
                  const card = document.createElement('div');
                  card.className = 'event-card';

                  const länk = e["Länk till hemsida"]?.trim();
                  const hemsidaUrl = (länk && länk.startsWith("http"))
                    ? `<br>🔗 <a href="${länk}" target="_blank">${new URL(länk).hostname.replace("www.", "")}</a>`
                    : "";

                  card.innerHTML = `
                    <strong>${e['Namn på händelse']}</strong><br>
                    📍 ${e['Plats']} | 🏷 ${e['Typ av händelse']}<br>
                    📅 ${e['Datum från']} – ${e['Datum till']}<br>
                    ⏰ ${e['Samling Härnösand'] || ''} ${e['Samling på plats'] || ''}<br>
                    🏫 Ledig från skolan: ${e['Ledig från skolan?']}<br>
                    💰 Kostnad: ${e['Kostnad per spelare']}<br>
                    🚗 Färdsätt: ${e['Färdsätt'] || ''}${hemsidaUrl}
                  `;
                  groupDiv.appendChild(card);
                });

                container.appendChild(groupDiv);
              });
          }

          renderGrouped(upcomingGrouped);

          if (Object.keys(pastGrouped).length > 0) {
            const toggleBtn = document.createElement("button");
            toggleBtn.textContent = "Visa tidigare händelser";
            toggleBtn.className = "toggle-past-button";
            toggleBtn.onclick = togglePast;
            container.appendChild(toggleBtn);

            const pastContainer = document.createElement("div");
            pastContainer.id = "past-container";
            pastContainer.style.display = "none";
            pastContainer.innerHTML = `
              <hr style="margin-top: 3rem;">
              <h2 style="margin-top: 1rem;">Tidigare händelser</h2>
            `;
            container.appendChild(pastContainer);

            renderGrouped(pastGrouped, true);

            // Flytta alla .past-group till pastContainer efter rendering
            const pastGroups = document.querySelectorAll(".past-group");
            pastGroups.forEach(group => pastContainer.appendChild(group));
          }
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", loadEvents);

function togglePast() {
  const pastContainer = document.getElementById("past-container");
  if (pastContainer) {
    pastContainer.style.display = pastContainer.style.display === "none" ? "block" : "none";
  }
}
