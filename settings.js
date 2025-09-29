document.addEventListener('DOMContentLoaded', () => {
  // DOM Element References
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeControls = document.getElementById('theme-controls');
  const alignmentControls = document.getElementById('alignment-controls');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  // The 'update-interface-btn' is no longer needed and can be removed from index.html if you wish.
  const updateInterfaceBtn = document.getElementById('update-interface-btn');
  const addThemeBtn = document.getElementById('add-theme-btn');
  const newThemeNameInput = document.getElementById('new-theme-name');
  const uploadInstructions = document.getElementById('upload-instructions');

  // This will be populated by parsing styles.css
  let allThemes = {};

  // Default state
  let state = {
    selectedTheme: 'soft-evergreen-theme',
    selectedAlignment: 'center'
  };

  /**
   * NEW: This function fetches and parses the styles.css file to build the theme object.
   * This makes styles.css the single source of truth.
   */
  async function initializeThemes() {
    try {
      const response = await fetch('styles.css');
      if (!response.ok) {
        throw new Error('styles.css could not be loaded.');
      }
      const cssText = await response.text();
      
      const themeRegex = /\/\*\s*(.*?)\s*\*\/\s*\.([\w-]+)\s*\{([^}]+)\}/g;
      let match;
      
      while ((match = themeRegex.exec(cssText)) !== null) {
        const [, name, className, properties] = match;
        
        const colors = {
          '--primary-bg-color': /--primary-bg-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          '--primary-text-color': /--primary-text-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          '--accent-color': /--accent-color:\s*([^;]+);/.exec(properties)?.[1].trim(),
          '--secondary-bg-color': /--secondary-bg-color:\s*([^;]+);/.exec(properties)?.[1].trim()
        };
        
        allThemes[className] = {
          name: name,
          class: className,
          colors: [
            colors['--primary-bg-color'],
            colors['--primary-text-color'],
            colors['--accent-color'],
            colors['--secondary-bg-color']
          ],
          // A simple way to determine if a theme is default is by its presence in the initial file.
          // For now, we'll assume dynamically added ones are not default.
          isDefault: true 
        };
      }
    } catch (error) {
      console.error("Theme initialization failed:", error);
      alert("Error: Could not load and parse styles.css. Please ensure the file is present and correctly formatted.");
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
        editTheme(clickedThemeKey); // Always load the clicked theme into the editor
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
        const colorValue = theme.colors[index];
        colorPicker.value = colorValue;
        hexInput.value = colorValue;
    });

    addThemeBtn.textContent = 'Update Theme';
    addThemeBtn.dataset.editingKey = themeKey;
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
      allThemes[themeKey] = { name: themeName, class: themeKey, colors: colors, isDefault: false };
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
            state.selectedTheme = Object.keys(allThemes)[0];
            applyDashboardTheme(state.selectedTheme);
        }
        renderThemes();
        showSaveAndUploadElements();
    }
  }

  function showSaveAndUploadElements() {
    downloadStylesBtn.style.display = 'inline-block';
    // Hide the 'Update Interface' button as it's no longer needed
    if (updateInterfaceBtn) updateInterfaceBtn.style.display = 'none'; 
    uploadInstructions.style.display = 'block';
    downloadConfigBtn.classList.remove('clicked');
    downloadStylesBtn.classList.remove('clicked');
  }

  // (Other functions like triggerDownload, createConfigFile, etc. remain here)
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
    let cssString = `/* Generated by Widget Dashboard */\n\n`;
    // Note: This simplified generator doesn't include the :root functional colors.
    // That can be added back if needed.
    
    for (const themeKey in allThemes) {
        const theme = allThemes[themeKey];
        cssString += `/* ${theme.name} */\n.${theme.class} {\n  --primary-bg-color: ${theme.colors[0]};\n  --primary-text-color: ${theme.colors[1]};\n  --accent-color: ${theme.colors[2]};\n  --secondary-bg-color: ${theme.colors[3]};\n}\n\n`;
    }
    return cssString;
  }

  // --- Main Execution ---
  async function main() {
    await initializeThemes();
    renderThemes();
    updateActiveControls();
    if (state.selectedTheme && allThemes[state.selectedTheme]) {
        applyDashboardTheme(state.selectedTheme);
    } else if (Object.keys(allThemes).length > 0) {
        // Fallback to the first theme if the default isn't found
        state.selectedTheme = Object.keys(allThemes)[0];
        applyDashboardTheme(state.selectedTheme);
    }
    
    // Setup event listeners
    downloadConfigBtn.addEventListener('click', createConfigFile);
    downloadStylesBtn.addEventListener('click', downloadStylesFile);
    addThemeBtn.addEventListener('click', addNewTheme);
    alignmentControls.querySelectorAll('.alignment-option').forEach(option => {
      option.addEventListener('click', () => { 
          state.selectedAlignment = option.dataset.alignment; 
          showSaveAndUploadElements(); 
          updateActiveControls(); 
      });
    });
  }

  main(); // Run the initialization process
});