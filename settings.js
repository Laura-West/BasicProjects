document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v1.5';

  // DOM Element References
  const versionDisplay = document.getElementById('version-display');
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeControls = document.getElementById('theme-controls');
  const alignmentControls = document.getElementById('alignment-controls');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  const addThemeBtn = document.getElementById('add-theme-btn');
  const newThemeBtn = document.getElementById('new-theme-btn'); // New button
  const newThemeNameInput = document.getElementById('new-theme-name');
  
  let allThemes = {};
  let state = { selectedTheme: 'soft-evergreen-theme', selectedAlignment: 'center' };

  async function initializeThemes() {
    try {
      const response = await fetch(`styles.css?v=${new Date().getTime()}`);
      if (!response.ok) throw new Error('styles.css could not be loaded.');
      const cssText = await response.text();
      
      const themeRegex = /\/\*\s*(.*?)\s*\*\/\s*\.([\w-]+)\s*\{([^}]+)\}/g;
      let match;
      
      while ((match = themeRegex.exec(cssText)) !== null) {
        const [, name, className, properties] = match;
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
      console.error("Theme initialization failed:", error);
      alert("Error: Could not load styles.css. Please ensure it's in the same directory.");
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
        const clickedThemeKey = e.currentTarget.dataset.key;
        state.selectedTheme = e.currentTarget.dataset.theme;
        applyDashboardTheme(clickedThemeKey);
        editTheme(clickedThemeKey);
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
    const defaultColors = {
      'color-primary-bg': '#f0f0f0', 'color-primary-text': '#333333',
      'color-accent': '#007bff', 'color-secondary-bg': '#dddddd'
    };
     for (const id in defaultColors) {
        document.getElementById(id).value = defaultColors[id];
        document.querySelector(`.color-hex-input[data-picker="${id}"]`).value = defaultColors[id];
    }
    addThemeBtn.textContent = 'Add New Theme';
    delete addThemeBtn.dataset.editingKey;
    // Also deselect any active theme in the top list
    state.selectedTheme = null;
    updateActiveControls();
  }

  function addNewTheme() {
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
            state.selectedTheme = Object.keys(allThemes)[0] || '';
            if (state.selectedTheme) {
              applyDashboardTheme(state.selectedTheme);
              editTheme(state.selectedTheme);
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
    downloadConfigBtn.classList.remove('clicked');
    downloadStylesBtn.classList.remove('clicked');
  }

  function triggerDownload(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function createConfigFile() {
    const content = `const widgetConfig = {\n  theme: '${state.selectedTheme}',\n  alignment: '${state.selectedAlignment}'\n};`;
    triggerDownload(content, 'config.js', 'text/javascript');
  }

  function downloadStylesFile() {
    const content = generateCssContent();
    triggerDownload(content, 'styles.css', 'text/css');
  }

  function generateCssContent() {
    let cssString = `/* Widget Styles - Generated by Dashboard ${DASHBOARD_VERSION} */\n\n`;
    for (const themeKey in allThemes) {
        const theme = allThemes[themeKey];
        cssString += `/* ${theme.name} */\n.${theme.class} {\n  --primary-bg-color: ${theme.colors[0]};\n  --primary-text-color: ${theme.colors[1]};\n  --accent-color: ${theme.colors[2]};\n  --secondary-bg-color: ${theme.colors[3]};\n}\n\n`;
    }
    return cssString;
  }

  async function main() {
    if (versionDisplay) versionDisplay.textContent = DASHBOARD_VERSION;
    await initializeThemes();
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
    addThemeBtn.addEventListener('click', addNewTheme);
    newThemeBtn.addEventListener('click', clearEditForm); // Listener for the new button
    
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