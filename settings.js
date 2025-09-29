document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v3.0';

  // DOM Element References
  const versionDisplay = document.getElementById('version-display');
  const cssVersionDisplay = document.getElementById('css-version-display');
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeListContainer = document.getElementById('theme-list-container');
  const addNewThemeBtn = document.getElementById('add-new-theme-btn');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  
  let allThemes = {};
  let state = { selectedTheme: 'soft-evergreen-theme', selectedAlignment: 'center' };
  let loadedCssVersion = 1.0;

  // --- Core Functions ---
  async function initializeStateFromCSS() { /* ... unchanged from v2.7 ... */ }
  function applyDashboardTheme(themeKey) { /* ... unchanged from v2.7 ... */ }
  function showSaveAndUploadElements() { /* ... unchanged from v2.7 ... */ }
  function triggerDownload(content, fileName) { /* ... unchanged from v2.7 ... */ }

  /**
   * Generates the HTML for a single theme row.
   * This is the template for both view and edit modes.
   */
  function createThemeRowHTML(themeKey, theme) {
    const isNew = !themeKey;
    const name = isNew ? '' : theme.name;
    const colors = isNew ? ['#ffffff', '#333333', '#007bff', '#e9ecef'] : theme.colors;
    
    return `
      <div class="theme-row ${isNew ? 'editing' : ''}" data-key="${themeKey || ''}">
        <div class="view-mode">
          <span class="theme-name">${name}</span>
          <div class="color-swatch-group">
            <div class="color-swatch" style="background-color: ${colors[0]}"></div>
            <div class="color-swatch" style="background-color: ${colors[1]}"></div>
            <div class="color-swatch" style="background-color: ${colors[2]}"></div>
            <div class="color-swatch" style="background-color: ${colors[3]}"></div>
          </div>
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-danger btn-delete">Delete</button>
        </div>
        
        <div class="edit-mode">
          <input type="text" class="new-theme-name-input" placeholder="Theme Name" value="${name}">
          <div class="color-inputs-grid">
            <div class="color-input-group"><label>Primary BG</label><input type="color" value="${colors[0]}"></div>
            <div class="color-input-group"><label>Primary Text</label><input type="color" value="${colors[1]}"></div>
            <div class="color-input-group"><label>Accent</label><input type="color" value="${colors[2]}"></div>
            <div class="color-input-group"><label>Secondary BG</label><input type="color" value="${colors[3]}"></div>
          </div>
          <div class="edit-mode-controls">
            <button class="btn btn-save">Save</button>
            <button class="btn secondary btn-cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renders all themes from the 'allThemes' object into the container.
   */
  function renderThemes() {
    themeListContainer.innerHTML = '';
    for (const themeKey in allThemes) {
      themeListContainer.innerHTML += createThemeRowHTML(themeKey, allThemes[themeKey]);
    }
  }

  /**
   * Main event handler for all actions within the theme list (edit, save, delete, etc.).
   * This uses event delegation for efficiency and maintainability.
   */
  themeListContainer.addEventListener('click', (e) => {
    const row = e.target.closest('.theme-row');
    if (!row) return;

    const key = row.dataset.key;

    // --- Edit Button ---
    if (e.target.classList.contains('btn-edit')) {
      row.classList.add('editing');
    }

    // --- Cancel Button ---
    if (e.target.classList.contains('btn-cancel')) {
      if (!key) { // If it was a new, unsaved row
        row.remove();
      } else {
        row.classList.remove('editing');
        // Optional: reset fields to original values if needed
        renderThemes(); // Easiest way to reset
      }
    }
    
    // --- Delete Button ---
    if (e.target.classList.contains('btn-delete')) {
      if (confirm(`Are you sure you want to delete "${allThemes[key].name}"?`)) {
        delete allThemes[key];
        renderThemes();
        showSaveAndUploadElements();
      }
    }

    // --- Save Button ---
    if (e.target.classList.contains('btn-save')) {
      const nameInput = row.querySelector('.new-theme-name-input');
      const colorInputs = row.querySelectorAll('input[type="color"]');
      
      const name = nameInput.value.trim();
      if (!name) return alert('Theme name cannot be empty.');
      
      const newKey = key || name.toLowerCase().replace(/\s+/g, '-') + '-theme';
      if (!key && allThemes[newKey]) return alert('A theme with this name already exists.');

      if(key && key !== newKey) {
        delete allThemes[key];
      }
      
      allThemes[newKey] = {
        name: name,
        class: newKey,
        colors: Array.from(colorInputs).map(input => input.value)
      };
      
      renderThemes();
      showSaveAndUploadElements();
    }
  });

  // --- Top-level button to add a new theme row ---
  addNewThemeBtn.addEventListener('click', () => {
    // Check if a new-unsaved row already exists
    if(document.querySelector('.theme-row[data-key=""]')) return;
    themeListContainer.insertAdjacentHTML('beforeend', createThemeRowHTML(null, null));
  });

  function generateCssContent() { /* ... unchanged from v2.7 ... */ }

  // --- Main Execution ---
  async function main() {
    if (versionDisplay) versionDisplay.textContent = DASHBOARD_VERSION;
    await initializeStateFromCSS();
    renderThemes();
    // (Other initial setup like listeners for alignment, downloads, etc.)
  }

  main();
});