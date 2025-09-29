document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v3.8';

  const DEFAULT_FUNCTIONAL_COLOURS = {
    'colour-success': '#28a745', 'colour-status-0': '#DC143C', 'colour-status-1': '#FF8C00',
    'colour-status-2': '#FFD700', 'colour-status-3': '#32CD32', 'colour-status-4': '#DA70D6',
    'colour-status-5': '#ffc107'
  };

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
    for (const id in DEFAULT_FUNCTIONAL_COLOURS) {
      const colourPicker = document.getElementById(id);
      const hexInput = document.querySelector(`.colour-hex-input[data-picker="${id}"]`);
      if (colourPicker) colourPicker.value = DEFAULT_FUNCTIONAL_COLOURS[id];
      if (hexInput) hexInput.value = DEFAULT_FUNCTIONAL_COLOURS[id];
    }

    try {
      const response = await fetch(`styles.css?v=${new Date().getTime()}`);
      if (!response.ok) throw new Error('styles.css could not be loaded.');
      const cssText = await response.text();
      
      const versionMatch = /CSS Version:\s*([\d.]+)/.exec(cssText);
      if (versionMatch) {
        loadedCssVersion = parseFloat(versionMatch[1]);
        cssVersionDisplay.textContent = `CSS: v${loadedCssVersion.toFixed(1)}`;
      } else { cssVersionDisplay.textContent = 'CSS: v?'; }

      const rootMatch = /:root\s*\{([^}]+)\}/.exec(cssText);
      if (rootMatch) {
        const rootProperties = rootMatch[1];
        for (const id in DEFAULT_FUNCTIONAL_COLOURS) {
          const variableName = `--${id.replace('colour-', '')}`;
          const match = new RegExp(`${variableName}:\\s*([^;]+);`).exec(rootProperties);
          if (match) {
            const colourValue = match[1].trim();
            document.getElementById(id).value = colourValue;
            const hexInput = document.querySelector(`.colour-hex-input[data-picker="${id}"]`);
            if (hexInput) hexInput.value = colourValue;
          }
        }
      }
      
      const themeRegex = /\/\*\s*(.*?)\s*\*\/\s*\.([\w-]+)\s*\{([^}]+)\}/g;
      allThemes = {}; 
      let themeMatch;
      while ((themeMatch = themeRegex.exec(cssText)) !== null) {
        const [, name, className, properties] = themeMatch;
        const colours = [
          /--primary-bg-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          /--primary-text-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          /--accent-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          /--secondary-bg-color:\s*([^;]+);/.exec(properties)?.[1].trim()
        ];
        if (colours.every(c => c)) {
          allThemes[className] = { name, class: className, colors: colours };
        }
      }
    } catch (error) {
      console.error("Initialization failed:", error);
      alert("Error: Could not load styles.css. Using default functional colours.");
    }
  }

  /**
   * Calculates the perceived brightness of a hex colour and returns
   * either black or white for the best contrast.
   */
  function getContrastingTextColor(hex) {
    if (!hex || hex.length < 7) return '#000000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Standard luminance calculation
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 128 ? '#000000' : '#FFFFFF';
  }

  function applyDashboardTheme(themeKey) {
    const theme = allThemes[themeKey];
    if (!theme) return;

    const bgColour = theme.colors[0];
    const textColour = getContrastingTextColor(bgColour);

    dashboardContainer.style.setProperty('--primary-bg-color', bgColour);
    dashboardContainer.style.setProperty('--primary-text-color', textColour); // DYNAMIC TEXT COLOUR
    dashboardContainer.style.setProperty('--accent-color', theme.colors[2]);
    dashboardContainer.style.setProperty('--secondary-bg-color', theme.colors[3]);
    dashboardContainer.style.setProperty('--border-color', theme.colors[3]);
  }

  function createThemeRowHTML(themeKey, theme) {
    const isNew = !themeKey;
    const name = isNew ? '' : theme.name;
    const colours = isNew ? ['#f0f0f0', '#333333', '#007bff', '#cccccc'] : theme.colors;
    const isSelected = themeKey === state.selectedTheme;
    
    return `
      <div class="theme-row ${isNew ? 'editing' : ''}" data-key="${themeKey || ''}">
        <div class="view-mode">
          <span class="theme-name">${name}</span>
          <div class="colour-swatch-group">
            <div class="colour-swatch" style="background-color: ${colours[0]}"></div>
            <div class="colour-swatch" style="background-color: ${colours[1]}"></div>
            <div class="colour-swatch" style="background-color: ${colours[2]}"></div>
            <div class="colour-swatch" style="background-color: ${colours[3]}"></div>
          </div>
          <button class="btn btn-select ${isSelected ? 'selected' : ''}">${isSelected ? '✓ Selected' : 'Select'}</button>
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-danger btn-delete">Delete</button>
        </div>
        <div class="edit-mode">
          <div class="colour-inputs-grid">
            <input type="text" class="theme-name-input" placeholder="Theme Name" value="${name}">
            <div class="colour-input-group"><label>Primary BG</label><input type="color" value="${colours[0]}"><input type="text" class="colour-hex-input" value="${colours[0]}"></div>
            <div class="colour-input-group"><label>Primary Text</label><input type="color" value="${colours[1]}"><input type="text" class="colour-hex-input" value="${colours[1]}"></div>
            <div class="colour-input-group"><label>Accent</label><input type="color" value="${colours[2]}"><input type="text" class="colour-hex-input" value="${colours[2]}"></div>
            <div class="colour-input-group"><label>Secondary BG</label><input type="color" value="${colours[3]}"><input type="text" class="colour-hex-input" value="${colours[3]}"></div>
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
  
  themeListContainer.addEventListener('input', (e) => {
    const row = e.target.closest('.theme-row.editing');
    if (!row) return;
    if (e.target.matches('input[type="color"]')) { e.target.nextElementSibling.value = e.target.value; }
    if (e.target.matches('.colour-hex-input')) { e.target.previousElementSibling.value = e.target.value; }
  });

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
    if (e.target.classList.contains('btn-edit')) { row.classList.add('editing'); }
    if (e.target.classList.contains('btn-cancel')) {
      if (!key) { row.remove(); } 
      else { renderThemes(); }
    }
    if (e.target.classList.contains('btn-delete')) {
      if (confirm(`Are you sure you want to delete "${allThemes[key].name}"?`)) {
        delete allThemes[key];
        if (state.selectedTheme === key) {
            state.selectedTheme = Object.keys(allThemes)[0] || '';
            if (state.selectedTheme) applyDashboardTheme(state.selectedTheme);
        }
        renderThemes();
        showSaveAndUploadElements();
      }
    }
    if (e.target.classList.contains('btn-save')) {
      const nameInput = row.querySelector('.theme-name-input');
      const colourInputs = row.querySelectorAll('input[type="color"]');
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
        colors: Array.from(colourInputs).map(input => input.value)
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
    downloadConfigBtn.classList.remove('clicked');
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
    downloadConfigBtn.classList.add('clicked');
}

  function downloadStylesFile() {
    triggerDownload(generateCssContent(), 'styles.css');
    downloadStylesBtn.classList.add('clicked');
  }

  function generateCssContent() {
    const newCssVersion = (loadedCssVersion + 0.1).toFixed(1);
    let cssString = `/* Widget Styles - CSS Version: ${newCssVersion} - Generated by Dashboard ${DASHBOARD_VERSION} */\n\n:root {\n`;
    cssString += `  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n`;
    for (const id in DEFAULT_FUNCTIONAL_COLOURS) {
        const value = document.getElementById(id).value;
        const variableName = `--${id.replace('colour-', '')}`;
        cssString += `  ${variableName}: ${value};\n`;
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
    
    document.querySelectorAll('.colour-hex-input, input[type="color"]').forEach(input => {
        input.addEventListener('input', (e) => {
            if(e.target.matches('input[type="color"]')) {
                const hexInput = e.target.parentElement.querySelector('.colour-hex-input');
                if(hexInput) hexInput.value = e.target.value;
            }
            if(e.target.matches('.colour-hex-input')) {
                const picker = e.target.parentElement.querySelector('input[type="color"]');
                if(picker) picker.value = e.target.value;
            }
            showSaveAndUploadElements();
        });
    });
  }

  main();
});