const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';
let allEvents = [];
let colorMap = {};
let currentViewMode = 'Month';

const colorPalette = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#8BC34A', '#FFC107', '#3F51B5', '#009688'];

document.addEventListener("DOMContentLoaded", () => {
  setupMenuToggle();
  loadEvents();
});

function setupMenuToggle() {
  const toggleBtn = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  toggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
    });
  });
}

function getCurrentSeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  if (year === 2025 && month >= 5) return '2025-2026';
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function adjustEndDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

function assignColors() {
  const types = [...new Set(allEvents.map(e => e['Typ av händelse']))].filter(Boolean);
  types.forEach((type, index) => {
    colorMap[type] = colorPalette[index % colorPalette.length];
  });
}

function loadEvents() {
  fetch(SHEET_URL)
    .then(res => res.text())
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          allEvents = results.data.filter(e => e['Datum från']);
          assignColors();
          setupFilters();
          setupViewButtons();
          renderGantt();
        }
      });
    });
}

function setupFilters() {
  const filtersDiv = document.getElementById('filters');
  filtersDiv.innerHTML = '';

  const seasonSelect = document.createElement('select');
  seasonSelect.id = 'season-filter';
  const seasonOptionAll = document.createElement('option');
  seasonOptionAll.value = '';
  seasonOptionAll.textContent = 'Alla säsonger';
  seasonSelect.appendChild(seasonOptionAll);
  [...new Set(allEvents.map(e => e['Säsong']))].sort().reverse().forEach(season => {
    const option = document.createElement('option');
    option.value = season;
    option.textContent = season;
    seasonSelect.appendChild(option);
  });
  seasonSelect.value = getCurrentSeason();

  const typeSelect = document.createElement('select');
  typeSelect.id = 'type-filter';
  const typeOptionAll = document.createElement('option');
  typeOptionAll.value = '';
  typeOptionAll.textContent = 'Alla typer';
  typeSelect.appendChild(typeOptionAll);
  [...new Set(allEvents.map(e => e['Typ av händelse']))].sort().forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });

  filtersDiv.appendChild(seasonSelect);
  filtersDiv.appendChild(typeSelect);

  seasonSelect.addEventListener('change', renderGantt);
  typeSelect.addEventListener('change', renderGantt);
}

function setupViewButtons() {
  const filtersDiv = document.getElementById('filters');
  const viewButtonsDiv = document.createElement('div');
  viewButtonsDiv.classList.add('view-buttons');

  [['Day', 'Dag'], ['Week', 'Vecka'], ['Month', 'Månad']].forEach(([mode, label]) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.mode = mode;
    btn.classList.toggle('active', mode === currentViewMode);
    btn.addEventListener('click', () => {
      currentViewMode = mode;
      document.querySelectorAll('.view-buttons button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGantt();
    });
    viewButtonsDiv.appendChild(btn);
  });

  filtersDiv.appendChild(viewButtonsDiv);
}

function renderGantt() {
  const season = document.getElementById('season-filter').value;
  const type = document.getElementById('type-filter').value;

  const filtered = allEvents
    .filter(e => (!season || e['Säsong'] === season))
    .filter(e => (!type || e['Typ av händelse'] === type))
    .sort((a, b) => new Date(a['Datum från']) - new Date(b['Datum från']));

  const tasks = filtered.map(e => ({
    id: e['Namn på händelse'],
    name: e['Namn på händelse'],
    start: e['Datum från'],
    end: adjustEndDate(e['Datum till'] || e['Datum från']),
    progress: 0,
    type: e['Typ av händelse'],
    color: colorMap[e['Typ av händelse']] || '#CCCCCC' // Ny rad: tilldela färg direkt
  }));

if (tasks.length > 0) {
    tasks.push({
      id: 'padding-row',
      name: '',
      start: tasks[tasks.length - 1].end,
      end: tasks[tasks.length - 1].end,
      progress: 0
    });
  }



  const container = document.getElementById('gantt-container');
  container.innerHTML = '';

  if (tasks.length > 0) {
    const minDate = new Date(Math.min(...tasks.map(t => new Date(t.start))));
    const maxDate = new Date(Math.max(...tasks.map(t => new Date(t.end))));
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    const gantt = new Gantt('#gantt-container', tasks, {
      view_mode: currentViewMode,
      bar_height: 40,
      lines: 'vertical',
      start: minDate,
      end: maxDate,
      padding: 0,
      infinite_padding: false,
      on_render: () => {
        const lastBar = container.querySelector('.bar:last-child');
        if (lastBar) {
          const barBBox = lastBar.getBBox();
          const totalHeight = barBBox.y + barBBox.height + 60; // 60 = luft

          //container.style.height = `${totalHeight}px`;
        }
      }
    });

    // Tar bort tidigare workaround för färgerna
    // tasks.forEach(task => {
    //   const bars = document.querySelectorAll(`.bar-${CSS.escape(task.id)} rect`);
    //   bars.forEach(rect => {
    //     rect.style.fill = colorMap[task.type] || '#CCCCCC';
    //   });
    // });
  } else {
    container.innerHTML = '<p style="text-align:center; padding:2rem;">Inga händelser att visa</p>';
  }
}



