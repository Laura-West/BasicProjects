document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v3.2';

  // DOM Element References
  const versionDisplay = document.getElementById('version-display');
  const cssVersionDisplay = document.getElementById('css-version-display');
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeListContainer = document.getElementById('theme-list-container');
  const addNewThemeBtn = document.getElementById('add-new-theme-btn');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  const alignmentControls = document.getElementById('alignment-controls');
  
  let allThemes = {};
  let state = { selectedTheme: 'soft-evergreen-theme', selectedAlignment: 'center' };
  let loadedCssVersion = 1.0;

  async function initializeStateFromCSS() {
    try {
      const response = await fetch(`styles.css?v=${new Date().getTime()}`);
      if (!response.ok) throw new Error('styles.css could not be loaded.');
      const cssText = await response.text();
      
      const versionMatch = /CSS Version:\s*([\d.]+)/.exec(cssText);
      if (versionMatch) {
        loadedCssVersion = parseFloat(versionMatch[1]);
        cssVersionDisplay.textContent = `CSS: v${loadedCssVersion.toFixed(1)}`;
      } else {
        cssVersionDisplay.textContent = 'CSS: v?';
      }

      const rootMatch = /:root\s*\{([^}]+)\}/.exec(cssText);
      if (rootMatch) {
        const rootProperties = rootMatch[1];
        const functionalColorIds = ['color-success', ...Array.from({length: 6}, (_, i) => `color-status-${i}`)];
        functionalColorIds.forEach(id => {
          const variableName = `--${id.replace('color-', '')}`;
          const match = new RegExp(`${variableName}:\\s*([^;]+);`).exec(rootProperties);
          if (match) document.getElementById(id).value = match[1].trim();
        });
      }
      
      const themeRegex = /\/\*\s*(.*?)\s*\*\/\s*\.([\w-]+)\s*\{([^}]+)\}/g;
      allThemes = {}; 
      let themeMatch;
      while ((themeMatch = themeRegex.exec(cssText)) !== null) {
        const [, name, className, properties] = themeMatch;
        const colors = [
          /--primary-bg-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          /--primary-text-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          /--accent-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          /--secondary-bg-color:\s*([^;]+);/.exec(properties)?.[1].trim()
        ];
        if (colors.every(c => c)) {
          allThemes[className] = { name, class: className, colors };
        }
      }
    } catch (error) {
      console.error("Initialization failed:", error);
      alert("Error: Could not load styles.css.");
    }
  }

  function applyDashboardTheme(themeKey) {
    const theme = allThemes[themeKey];
    if (!theme) return;
    dashboardContainer.style.setProperty('--primary-bg-color', theme.colors[0]);
    dashboardContainer.style.setProperty('--primary-text-color', theme.colors[1]);
    dashboardContainer.style.setProperty('--accent-color', theme.colors[2]);
    dashboardContainer.style.setProperty('--secondary-bg-color', theme.colors[3]);
    dashboardContainer.style.setProperty('--border-color', theme.colors[3]);
  }

  function createThemeRowHTML(themeKey, theme) {
    const isNew = !themeKey;
    const name = isNew ? '' : theme.name;
    const colors = isNew ? ['#f0f0f0', '#333333', '#007bff', '#cccccc'] : theme.colors;
    const isSelected = themeKey === state.selectedTheme;
    
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
          <button class="btn btn-select ${isSelected ? 'selected' : ''}">${isSelected ? '✓ Selected' : 'Select'}</button>
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-danger btn-delete">Delete</button>
        </div>
        <div class="edit-mode">
          <div class="color-inputs-grid">
            <input type="text" class="theme-name-input" placeholder="Theme Name" value="${name}">
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

  function renderThemes() {
    themeListContainer.innerHTML = '';
    for (const themeKey in allThemes) {
      themeListContainer.innerHTML += createThemeRowHTML(themeKey, allThemes[themeKey]);
    }
  }
  
  themeListContainer.addEventListener('click', (e) => {
    const row = e.target.closest('.theme-row');
    if (!row) return;

    const key = row.dataset.key;
    
    if (e.target.classList.contains('btn-select')) {
        state.selectedTheme = key;
        applyDashboardTheme(key);
        renderThemes();
        showSaveAndUploadElements();
    }

    if (e.target.classList.contains('btn-edit')) {
      row.classList.add('editing');
    }

    if (e.target.classList.contains('btn-cancel')) {
      if (!key) { row.remove(); } 
      else { renderThemes(); }
    }
    
    if (e.target.classList.contains('btn-delete')) {
      if (confirm(`Are you sure you want to delete "${allThemes[key].name}"?`)) {
        delete allThemes[key];
        if (state.selectedTheme === key) {
            const firstTheme = Object.keys(allThemes)[0] || '';
            state.selectedTheme = firstTheme;
            if (firstTheme) applyDashboardTheme(firstTheme);
        }
        renderThemes();
        showSaveAndUploadElements();
      }
    }

    if (e.target.classList.contains('btn-save')) {
      const nameInput = row.querySelector('.theme-name-input');
      const colorInputs = row.querySelectorAll('input[type="color"]');
      const name = nameInput.value.trim();
      if (!name) return alert('Theme name cannot be empty.');
      
      const newKey = key || name.toLowerCase().replace(/\s+/g, '-') + '-theme';
      if (!key && allThemes[newKey]) return alert('A theme with this name already exists.');

      if (key && key !== newKey) {
        if (state.selectedTheme === key) state.selectedTheme = newKey;
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

  addNewThemeBtn.addEventListener('click', () => {
    if (document.querySelector('.theme-row[data-key=""]')) return;
    themeListContainer.insertAdjacentHTML('beforeend', createThemeRowHTML(null, null));
  });

  function updateActiveControls() {
    document.querySelectorAll('.alignment-option').forEach(opt => opt.classList.toggle('active', opt.dataset.alignment === state.selectedAlignment));
  }

  function showSaveAndUploadElements() {
    downloadStylesBtn.style.display = 'inline-block';
  }

  function triggerDownload(content, fileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function createConfigFile() {
    triggerDownload(`const widgetConfig = {\n  theme: '${state.selectedTheme || ''}',\n  alignment: '${state.selectedAlignment}'\n};`, 'config.js');
  }

  function downloadStylesFile() {
    triggerDownload(generateCssContent(), 'styles.css');
  }

  function generateCssContent() {
    const newCssVersion = (loadedCssVersion + 0.1).toFixed(1);
    let cssString = `/* Widget Styles - CSS Version: ${newCssVersion} - Generated by Dashboard ${DASHBOARD_VERSION} */\n\n:root {\n`;
    cssString += `  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n`;
    const successColor = document.getElementById('color-success').value;
    cssString += `  --success-color: ${successColor};\n`;
    for (let i = 0; i < 6; i++) {
        const statusColor = document.getElementById(`color-status-${i}`).value;
        cssString += `  --status-color-${i}: ${statusColor};\n`;
    }
    cssString += '}\n\n';

    for (const themeKey in allThemes) {
        const theme = allThemes[themeKey];
        cssString += `/* ${theme.name} */\n.${theme.class} {\n  --primary-bg-color: ${theme.colors[0]};\n  --primary-text-color: ${theme.colors[1]};\n  --accent-color: ${theme.colors[2]};\n  --secondary-bg-color: ${theme.colors[3]};\n}\n\n`;
    }
    return cssString;
  }

  async function main() {
    if (versionDisplay) versionDisplay.textContent = DASHBOARD_VERSION;
    await initializeStateFromCSS();
    renderThemes();
    updateActiveControls();

    if (state.selectedTheme && allThemes[state.selectedTheme]) {
        applyDashboardTheme(state.selectedTheme);
    } else if (Object.keys(allThemes).length > 0) {
        const firstTheme = Object.keys(allThemes)[0];
        state.selectedTheme = firstTheme;
        applyDashboardTheme(firstTheme);
        renderThemes();
    }
    
    downloadConfigBtn.addEventListener('click', createConfigFile);
    downloadStylesBtn.addEventListener('click', downloadStylesFile);
    
    alignmentControls.querySelectorAll('.alignment-option').forEach(option => {
      option.addEventListener('click', () => { 
          state.selectedAlignment = option.dataset.alignment; 
          showSaveAndUploadElements(); 
          updateActiveControls(); 
      });
    });
    document.querySelectorAll('#functional-colors-container input[type="color"]').forEach(input => {
        input.addEventListener('input', showSaveAndUploadElements);
    });
  }

  main();
});