document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v2.6';

  // DOM Element References
  const versionDisplay = document.getElementById('version-display');
  const cssVersionDisplay = document.getElementById('css-version-display');
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeControls = document.getElementById('theme-controls');
  const alignmentControls = document.getElementById('alignment-controls');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  const addThemeBtn = document.getElementById('add-theme-btn');
  const newThemeBtn = document.getElementById('new-theme-btn');
  const newThemeNameInput = document.getElementById('new-theme-name');
  
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
          if (match) {
            const colorValue = match[1].trim();
            document.getElementById(id).value = colorValue;
            document.querySelector(`.color-hex-input[data-picker="${id}"]`).value = colorValue;
          }
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

  function renderThemes() {
    themeControls.innerHTML = '';
    for (const themeKey in allThemes) {
      const theme = allThemes[themeKey];
      const option = document.createElement('div');
      option.className = 'theme-option';
      option.dataset.theme = theme.class;
      option.dataset.key = themeKey;
      option.innerHTML = `<div class="color-swatch" style="background-color: ${theme.colors[0]};"></div><span>${theme.name}</span><button class="delete-btn" data-theme-key="${themeKey}">×</button>`;
      
      option.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        state.selectedTheme = e.currentTarget.dataset.theme;
        applyDashboardTheme(e.currentTarget.dataset.key);
        editTheme(e.currentTarget.dataset.key);
        updateActiveControls();
      });
      themeControls.appendChild(option);
    }
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', deleteTheme));
    updateActiveControls();
  }
  
  function editTheme(themeKey) {
    const theme = allThemes[themeKey];
    if (!theme) return;
    newThemeNameInput.value = theme.name;
    const colorIds = ['color-primary-bg', 'color-primary-text', 'color-accent', 'color-secondary-bg'];
    colorIds.forEach((id, index) => {
        document.getElementById(id).value = theme.colors[index];
        document.querySelector(`.color-hex-input[data-picker="${id}"]`).value = theme.colors[index];
    });
    addThemeBtn.textContent = 'Update Theme';
    addThemeBtn.dataset.editingKey = themeKey;
  }
  
  function clearEditForm() {
    newThemeNameInput.value = '';
    addThemeBtn.textContent = 'Add New Theme';
    delete addThemeBtn.dataset.editingKey;
    state.selectedTheme = null;
    updateActiveControls();
  }
  
  /**
   * This function's name is now more accurate. It "commits" changes
   * from the editor to the in-memory `allThemes` object.
   */
  function commitThemeChanges() {
    const themeName = newThemeNameInput.value.trim();
    if (!themeName) { alert('Please enter a theme name.'); return; }
    const editingKey = addThemeBtn.dataset.editingKey;
    const colors = [
        document.getElementById('color-primary-bg').value,
        document.getElementById('color-primary-text').value,
        document.getElementById('color-accent').value,
        document.getElementById('color-secondary-bg').value
    ];

    if (editingKey && allThemes[editingKey]) {
      allThemes[editingKey].name = themeName;
      allThemes[editingKey].colors = colors;
    } else {
      const themeKey = themeName.toLowerCase().replace(/\s+/g, '-') + '-theme';
      if (allThemes[themeKey]) { alert('A theme with this name already exists.'); return; }
      allThemes[themeKey] = { name: themeName, class: themeKey, colors: colors };
    }
    renderThemes();
    showSaveAndUploadElements();
  }

  function deleteTheme(event) {
    event.stopPropagation();
    const themeKey = event.target.dataset.themeKey;
    if (allThemes[themeKey] && confirm(`Are you sure you want to delete "${allThemes[themeKey].name}"?`)) {
        delete allThemes[themeKey];
        if (state.selectedTheme === themeKey) {
            const firstTheme = Object.keys(allThemes)[0] || '';
            state.selectedTheme = firstTheme;
            if (firstTheme) {
              applyDashboardTheme(firstTheme);
              editTheme(firstTheme);
            } else {
              clearEditForm();
            }
        }
        renderThemes();
        showSaveAndUploadElements();
    }
  }

  function updateActiveControls() {
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.toggle('active', opt.dataset.theme === state.selectedTheme));
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

  /**
   * THE FIX: This function now automatically syncs any changes
   * from the editor before generating the file.
   */
  function downloadStylesFile() {
    // First, run the same logic as the "Commit" button to ensure current edits are staged
    const editingKey = addThemeBtn.dataset.editingKey;
    if (editingKey) {
        commitThemeChanges();
    }
    // Then, generate the file from the updated 'allThemes' object
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
        editTheme(state.selectedTheme);
    } else if (Object.keys(allThemes).length > 0) {
        const firstTheme = Object.keys(allThemes)[0];
        state.selectedTheme = firstTheme;
        applyDashboardTheme(firstTheme);
        editTheme(firstTheme);
    }
    
    downloadConfigBtn.addEventListener('click', createConfigFile);
    downloadStylesBtn.addEventListener('click', downloadStylesFile);
    addThemeBtn.addEventListener('click', commitThemeChanges);
    newThemeBtn.addEventListener('click', clearEditForm); 
    
    alignmentControls.querySelectorAll('.alignment-option').forEach(option => {
      option.addEventListener('click', () => { 
          state.selectedAlignment = option.dataset.alignment; 
          showSaveAndUploadElements(); 
          updateActiveControls(); 
      });
    });
    document.querySelectorAll('.color-hex-input, input[type="color"]').forEach(input => {
        input.addEventListener('input', showSaveAndUploadElements);
    });
  }

  main();
});