const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQwy0b0RMcUXo3xguOtukMryHNlYnebQdskaIWHXr3POx7fg9NfUHsMTGjOlDnkOJZybrWZ7r36NfB1/pub?output=csv';
let allEvents = [];
let colorMap = {};
let currentViewMode = 'Month';
const selectedTypes = new Set();

const colorPalette = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4', '#8BC34A', '#FFC107', '#3F51B5', '#009688'];

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
});

function getCurrentSeason() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  if (year === 2025 && month >= 5) return '2025-2026';
  return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

// ===== Datumhjälpare (lokal tid, alltid kl 12:00) =====
function parseLocalDate(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return null;
  const [y, m, d] = yyyy_mm_dd.trim().split('-').map(Number);
  // lägg tiden mitt på dagen för att undvika DST/UTC-glidning
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
function addDaysLocal(date, days) {
  // bevara kl 12:00 när vi flyttar datumet
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}
function adjustEndDate(dateString) {
  if (!dateString) return null;
  return addDaysLocal(parseLocalDate(dateString), 1); // exklusivt slut → +1 dag
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

  const typeWrapper = document.createElement('div');
  typeWrapper.id = 'type-filter';
  typeWrapper.className = 'type-multiselect';

  const typeButton = document.createElement('button');
  typeButton.type = 'button';
  typeButton.className = 'type-ms-button';
  typeButton.textContent = 'Typ (välj flera)';
  typeButton.setAttribute('aria-expanded', 'false');

  const typePanel = document.createElement('div');
  typePanel.className = 'type-ms-panel';
  typePanel.hidden = true;

  const typeList = document.createElement('div');
  typeList.className = 'type-ms-list';
  typePanel.appendChild(typeList);

  const actions = document.createElement('div');
  actions.className = 'type-ms-actions';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = 'Rensa val';
  actions.appendChild(clearBtn);
  typePanel.appendChild(actions);

  typeWrapper.appendChild(typeButton);
  typeWrapper.appendChild(typePanel);

  function rebuildTypeOptions() {
    const selectedSeason = seasonSelect.value;
    const filteredTypes = allEvents
      .filter(e => !selectedSeason || e['Säsong'] === selectedSeason)
      .map(e => e['Typ av händelse'])
      .filter(Boolean);
    const uniqueTypes = [...new Set(filteredTypes)].sort();

    for (const t of Array.from(selectedTypes)) {
      if (!uniqueTypes.includes(t)) selectedTypes.delete(t);
    }

    typeList.innerHTML = '';
    uniqueTypes.forEach(type => {
      const id = `type-${type.replace(/\s+/g, '_')}`;
      const row = document.createElement('label');
      row.className = 'type-ms-row';
      row.htmlFor = id;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.value = type;
      cb.checked = selectedTypes.has(type);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTypes.add(type);
        else selectedTypes.delete(type);
        renderGantt();
        updateTypeButtonText();
      });

      const span = document.createElement('span');
      span.textContent = type;

      row.appendChild(cb);
      row.appendChild(span);
      typeList.appendChild(row);
    });

    updateTypeButtonText();
  }

  function updateTypeButtonText() {
    if (selectedTypes.size === 0) {
      typeButton.textContent = 'Typ (alla)';
    } else if (selectedTypes.size === 1) {
      typeButton.textContent = `Typ (${Array.from(selectedTypes)[0]})`;
    } else {
      typeButton.textContent = `Typ (${selectedTypes.size} val)`;
    }
  }

  typeButton.addEventListener('click', () => {
    const open = typePanel.hidden;
    typePanel.hidden = !open;
    typeButton.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!typeWrapper.contains(e.target)) {
      typePanel.hidden = true;
      typeButton.setAttribute('aria-expanded', 'false');
    }
  });

  clearBtn.addEventListener('click', () => {
    selectedTypes.clear();
    rebuildTypeOptions();
    renderGantt();
  });

  rebuildTypeOptions();

  filtersDiv.appendChild(seasonSelect);
  filtersDiv.appendChild(typeWrapper);

  seasonSelect.addEventListener('change', () => {
    rebuildTypeOptions();
    renderGantt();
  });
}

function setupViewButtons() {
  const filtersDiv = document.getElementById('filters');
  const viewButtonsDiv = document.createElement('div');
  viewButtonsDiv.classList.add('view-buttons');

  [['Day', 'Dag'], ['Week', 'Vecka'], ['Month', 'Månad'], ['Year', 'År']].forEach(([mode, label]) => {
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
  const typesSelected = Array.from(selectedTypes);

  const filtered = allEvents
    .filter(e => (!season || e['Säsong'] === season))
    .filter(e => (typesSelected.length === 0 || typesSelected.includes(e['Typ av händelse'])))
    .sort((a, b) => parseLocalDate(a['Datum från']) - parseLocalDate(b['Datum från']));

  const tasks = filtered.map(e => {
    const start = parseLocalDate(e['Datum från']);
    const end = adjustEndDate(e['Datum till'] || e['Datum från']);
    return {
      id: e['Namn på händelse'],
      name: e['Namn på händelse'],
      start,
      end,
      progress: 0,
      type: e['Typ av händelse'],
      plats: e['Plats'] || '',
      samling: e['Samling Härnösand'] || '',
      info: e['Övrig information'] || '',
      color: colorMap[e['Typ av händelse']] || '#CCCCCC'
    };
  });

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
    const minDateRaw = new Date(Math.min(...tasks.map(t => t.start.getTime())));
    const maxDateRaw = new Date(Math.max(...tasks.map(t => t.end.getTime())));
    const viewStart = new Date(minDateRaw.getFullYear(), minDateRaw.getMonth(), 1);
    const viewEnd = new Date(maxDateRaw.getFullYear(), maxDateRaw.getMonth() + 1, 1);

    const gantt = new Gantt('#gantt-container', tasks, {
      view_mode: currentViewMode,
      bar_height: 40,
      lines: 'vertical',
      start: viewStart,
      end: viewEnd,
      padding: 0,
      infinite_padding: false,
      popup: ({ task }) => `
        <div class="custom-popup">
          <strong>Namn på händelse:</strong> ${task.id}<br/>
          <strong>Datum från:</strong> ${task.start.toLocaleDateString('sv-SE')}<br/>
          <strong>Datum till:</strong> ${task.end.toLocaleDateString('sv-SE')}<br/>
          <strong>Typ:</strong> ${task.type || ''}<br/>
          <strong>Plats:</strong> ${task.plats || ''}<br/>
          <strong>Samling Härnösand:</strong> ${task.samling || ''}<br/>
          <strong>Övrig information:</strong> ${task.info || ''}
        </div>
      `,
      on_render: () => {
        const lastBar = container.querySelector('.bar:last-child');
        if (lastBar) {
          const barBBox = lastBar.getBBox();
          const totalHeight = barBBox.y + barBBox.height + 60;
          // container.style.height = `${totalHeight}px`;
        }
      }
    });
  } else {
    container.innerHTML = '<p style="text-align:center; padding:2rem;">Inga händelser att visa</p>';
  }
}