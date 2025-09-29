document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v2.1';

  // DOM Element References
  const versionDisplay = document.getElementById('version-display');
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeControls = document.getElementById('theme-controls');
  const alignmentControls = document.getElementById('alignment-controls');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  const addThemeBtn = document.getElementById('add-theme-btn');
  const newThemeNameInput = document.getElementById('new-theme-name');
  const uploadInstructions = document.getElementById('upload-instructions');

  let allThemes = {};
  let state = { selectedTheme: 'soft-evergreen-theme', selectedAlignment: 'center' };

  async function initializeThemes() {
    try {
      // Fetch and parse the CSS file to build the theme object
      const response = await fetch('styles.css');
      if (!response.ok) throw new Error('styles.css could not be loaded.');
      const cssText = await response.text();
      
      // Regex to find theme blocks: /* Theme Name */ .theme-class { ... }
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
        
        if (colors.every(c => c)) { // Ensure all 4 colors were found
          allThemes[className] = { name, class: className, colors, isDefault: true };
        }
      }
    } catch (error) {
      console.error("Theme initialization failed:", error);
      alert("Error: Could not load and parse styles.css. Please ensure the file exists and is correctly formatted.");
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
        editTheme(clickedThemeKey); // Load clicked theme into the editor
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
        const colorPicker = document.getElementById(id);
        const hexInput = document.querySelector(`.color-hex-input[data-picker="${id}"]`);
        colorPicker.value = theme.colors[index];
        hexInput.value = theme.colors[index];
    });
    addThemeBtn.textContent = 'Update Theme';
    addThemeBtn.dataset.editingKey = themeKey;
  }

  function updateActiveControls() {
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.toggle('active', opt.dataset.theme === state.selectedTheme));
    document.querySelectorAll('.alignment-option').forEach(opt => opt.classList.toggle('active', opt.dataset.alignment === state.selectedAlignment));
  }

  function showSaveAndUploadElements() {
    downloadStylesBtn.style.display = 'inline-block';
    uploadInstructions.style.display = 'block';
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
    downloadConfigBtn.classList.add('clicked');
  }

  function downloadStylesFile() {
    const content = generateCssContent();
    triggerDownload(content, 'styles.css', 'text/css');
    downloadStylesBtn.classList.add('clicked');
  }

  function generateCssContent() {
    // This function now rebuilds the entire styles.css file from the allThemes object
    let cssString = `/* Widget Styles - Generated by Dashboard v${DASHBOARD_VERSION} */\n\n`;
    for (const themeKey in allThemes) {
        const theme = allThemes[themeKey];
        cssString += `/* ${theme.name} */\n.${theme.class} {\n  --primary-bg-color: ${theme.colors[0]};\n  --primary-text-color: ${theme.colors[1]};\n  --accent-color: ${theme.colors[2]};\n  --secondary-bg-color: ${theme.colors[3]};\n}\n\n`;
    }
    return cssString;
  }

  // --- Main Execution ---
  async function main() {
    if (versionDisplay) versionDisplay.textContent = DASHBOARD_VERSION;

    await initializeThemes();
    renderThemes();
    updateActiveControls();

    // Set initial theme for the dashboard
    if (state.selectedTheme && allThemes[state.selectedTheme]) {
        applyDashboardTheme(state.selectedTheme);
    } else if (Object.keys(allThemes).length > 0) {
        state.selectedTheme = Object.keys(allThemes)[0];
        applyDashboardTheme(state.selectedTheme);
    }
    
    // Setup event listeners
    downloadConfigBtn.addEventListener('click', createConfigFile);
    downloadStylesBtn.addEventListener('click', downloadStylesFile);
    // addThemeBtn.addEventListener('click', addNewTheme); // We will re-add this next
    alignmentControls.querySelectorAll('.alignment-option').forEach(option => {
      option.addEventListener('click', () => { 
          state.selectedAlignment = option.dataset.alignment; 
          showSaveAndUploadElements(); 
          updateActiveControls(); 
      });
    });
  }

  main();
});