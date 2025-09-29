document.addEventListener('DOMContentLoaded', () => {
  // DOM Element References
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeControls = document.getElementById('theme-controls');
  const alignmentControls = document.getElementById('alignment-controls');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  const updateInterfaceBtn = document.getElementById('update-interface-btn');
  const addThemeBtn = document.getElementById('add-theme-btn');
  const newThemeNameInput = document.getElementById('new-theme-name');
  const colorHexInputs = document.querySelectorAll('.color-hex-input');
  const colorPickers = document.querySelectorAll('input[type="color"]');
  const uploadInstructions = document.getElementById('upload-instructions');

  const allThemes = {
    "soft-evergreen-theme": { "name": "Soft Evergreen", "class": "soft-evergreen-theme", "colors": ["#e8f0ef", "#3f514b", "#6a9a8d", "#cedbd9"], "isDefault": true },
    "desert-bloom-theme": { "name": "Desert Bloom", "class": "desert-bloom-theme", "colors": ["#fcf8f3", "#5d4037", "#d17a7a", "#f0e4d7"], "isDefault": true },
    "ocean-breeze-theme": { "name": "Ocean Breeze", "class": "ocean-breeze-theme", "colors": ["#eef7f9", "#2c4a52", "#6ab8c8", "#b3e5fc"], "isDefault": true },
    "charcoal-ember-theme": { "name": "Charcoal & Ember", "class": "charcoal-ember-theme", "colors": ["#363636", "#f5f5f5", "#ff5722", "#4a4a4a"], "isDefault": true },
    "simple-mono-theme": { "name": "Simple Mono", "class": "simple-mono-theme", "colors": ["#f5f5f5", "#424242", "#9e9e9e", "#e0e0e0"], "isDefault": true },
    "soft-lavender-theme": { "name": "Soft Lavender", "class": "soft-lavender-theme", "colors": ["#f7f3f9", "#544458", "#a08da6", "#e1dbe4"], "isDefault": true }
  };

  let state = {
    selectedTheme: 'soft-evergreen-theme',
    selectedAlignment: 'center'
  };

  // --- FUNCTIONS --- //

  function applyDashboardTheme(themeKey) {
    const theme = allThemes[themeKey];
    if (!theme) return;
    
    dashboardContainer.style.setProperty('--primary-bg-color', theme.colors[0]);
    dashboardContainer.style.setProperty('--primary-text-color', theme.colors[1]);
    dashboardContainer.style.setProperty('--accent-color', theme.colors[2]);
    dashboardContainer.style.setProperty('--secondary-bg-color', theme.colors[3]);
    dashboardContainer.style.setProperty('--border-color', theme.colors[3]);
  }

  function updateActiveControls() {
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.toggle('active', opt.dataset.theme === state.selectedTheme));
    document.querySelectorAll('.alignment-option').forEach(opt => opt.classList.toggle('active', opt.dataset.alignment === state.selectedAlignment));
  }

  function renderThemes() {
    themeControls.innerHTML = '';
    for (const themeKey in allThemes) {
      const theme = allThemes[themeKey];
      const option = document.createElement('div');
      option.className = 'theme-option';
      option.dataset.theme = theme.class;
      option.dataset.key = themeKey;
      option.innerHTML = `<div class="color-swatch" style="background-color: ${theme.colors[0]};"></div><span>${theme.name}</span>${!theme.isDefault ? `<button class="delete-btn" data-theme-key="${themeKey}">×</button>` : ''}`;
      
      option.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;

        const clickedThemeKey = e.currentTarget.dataset.key;
        state.selectedTheme = e.currentTarget.dataset.theme;
        
        applyDashboardTheme(clickedThemeKey);
        downloadConfigBtn.classList.remove('clicked');

        if (allThemes[clickedThemeKey].isDefault) {
          clearEditForm();
        } else {
          editTheme(clickedThemeKey);
        }
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

  function clearEditForm() {
    newThemeNameInput.value = '';
    const defaultColors = {
      'color-primary-bg': '#e8f0ef',
      'color-primary-text': '#3f514b',
      'color-accent': '#6a9a8d',
      'color-secondary-bg': '#cedbd9'
    };
    for (const id in defaultColors) {
      const colorPicker = document.getElementById(id);
      const hexInput = document.querySelector(`.color-hex-input[data-picker="${id}"]`);
      colorPicker.value = defaultColors[id];
      hexInput.value = defaultColors[id];
    }
    addThemeBtn.textContent = 'Add New Theme';
    delete addThemeBtn.dataset.editingKey;
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
    
    clearEditForm();
    renderThemes();
    showSaveAndUploadElements();
  }

  function deleteTheme(event) {
    event.stopPropagation();
    const themeKey = event.target.dataset.themeKey;
    if (allThemes[themeKey] && confirm(`Are you sure you want to delete "${allThemes[themeKey].name}" theme?`)) {
        delete allThemes[themeKey];
        if (state.selectedTheme === themeKey) {
            state.selectedTheme = Object.keys(allThemes)[0];
            applyDashboardTheme(state.selectedTheme);
        }
        renderThemes();
        clearEditForm();
        showSaveAndUploadElements();
    }
  }
  
  function showSaveAndUploadElements() {
    downloadStylesBtn.style.display = 'inline-block';
    updateInterfaceBtn.style.display = 'inline-block';
    uploadInstructions.style.display = 'block';
    downloadConfigBtn.classList.remove('clicked');
    downloadStylesBtn.classList.remove('clicked');
    updateInterfaceBtn.classList.remove('clicked');
  }

  function triggerDownload(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function createConfigFile() {
    const configContent = `// Widget configuration file...\nconst widgetConfig = {\n  theme: '${state.selectedTheme}',\n  alignment: '${state.selectedAlignment}'\n};`;
    triggerDownload(configContent, 'config.js', 'text/javascript');
    downloadConfigBtn.classList.add('clicked');
  }

  function downloadStylesFile() {
    const cssContent = generateCssContent();
    triggerDownload(cssContent, 'styles.css', 'text/css');
    downloadStylesBtn.classList.add('clicked');
  }

  function downloadSettingsJsFile() {
    const settingsJsContent = generateSettingsJsContent();
    triggerDownload(settingsJsContent, 'settings.js', 'text/javascript');
    updateInterfaceBtn.classList.add('clicked');
  }

  downloadConfigBtn.addEventListener('click', createConfigFile);
  downloadStylesBtn.addEventListener('click', downloadStylesFile);
  updateInterfaceBtn.addEventListener('click', downloadSettingsJsFile);
  addThemeBtn.addEventListener('click', addNewTheme);
  
  alignmentControls.querySelectorAll('.alignment-option').forEach(option => {
    option.addEventListener('click', () => { 
        state.selectedAlignment = option.dataset.alignment; 
        showSaveAndUploadElements();
        updateActiveControls(); 
    });
  });
  
  colorPickers.forEach(picker => picker.addEventListener('input', (e) => { 
      document.querySelector(`.color-hex-input[data-picker="${e.target.id}"]`).value = e.target.value; 
      showSaveAndUploadElements();
  }));
  colorHexInputs.forEach(input => input.addEventListener('input', (e) => { 
      document.getElementById(e.target.dataset.picker).value = e.target.value; 
      showSaveAndUploadElements();
  }));
  
  renderThemes();
  updateActiveControls();
  applyDashboardTheme(state.selectedTheme);

  // --- FILE GENERATION FUNCTIONS --- //
  function generateCssContent() {
    const successColor = document.getElementById('color-success').value;
    const statusColor0 = document.getElementById('color-status-0').value;
    const statusColor1 = document.getElementById('color-status-1').value;
    const statusColor2 = document.getElementById('color-status-2').value;
    const statusColor3 = document.getElementById('color-status-3').value;
    const statusColor4 = document.getElementById('color-status-4').value;
    const statusColor5 = document.getElementById('color-status-5').value;

    let cssString = `/* Generated by Widget Dashboard */\n\n:root {\n  --primary-bg-color: #f4f7f6;\n  --primary-text-color: #333333;\n  --accent-color: #6a9a8d;\n  --secondary-bg-color: #e0e6e4;\n  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n  --success-color: ${successColor};\n  --status-color-0: ${statusColor0};\n  --status-color-1: ${statusColor1};\n  --status-color-2: ${statusColor2};\n  --status-color-3: ${statusColor3};\n  --status-color-4: ${statusColor4};\n  --status-color-5: ${statusColor5};\n}\n\n.widget[data-count-level="0"] #count-display { color: var(--status-color-0); }\n.widget[data-count-level="1"] #count-display { color: var(--status-color-1); }\n.widget[data-count-level="2"] #count-display { color: var(--status-color-2); }\n.widget[data-count-level="3"] #count-display { color: var(--status-color-3); }\n.widget[data-count-level="4"] #count-display { color: var(--status-color-4); }\n.widget[data-count-level="5"] #count-display { color: var(--status-color-5); }\n\n`;

    for (const themeKey in allThemes) {
        const theme = allThemes[themeKey];
        cssString += `/* ${theme.name} */\n.${theme.class} {\n  --primary-bg-color: ${theme.colors[0]};\n  --primary-text-color: ${theme.colors[1]};\n  --accent-color: ${theme.colors[2]};\n  --secondary-bg-color: ${theme.colors[3]};\n}\n\n`;
    }
    return cssString;
  }

  function generateSettingsJsContent() {
    const themesObjectString = JSON.stringify(allThemes, null, 2);
    // This function regenerates itself by embedding the current theme data into a template string.
    // NOTE: For simplicity, this template contains the JS functions as strings.
    return `document.addEventListener('DOMContentLoaded', () => {
  const dashboardContainer = document.getElementById('dashboard-container');
  const themeControls = document.getElementById('theme-controls');
  const alignmentControls = document.getElementById('alignment-controls');
  const downloadConfigBtn = document.getElementById('download-config-btn');
  const downloadStylesBtn = document.getElementById('download-styles-btn');
  const updateInterfaceBtn = document.getElementById('update-interface-btn');
  const addThemeBtn = document.getElementById('add-theme-btn');
  const newThemeNameInput = document.getElementById('new-theme-name');
  const colorHexInputs = document.querySelectorAll('.color-hex-input');
  const colorPickers = document.querySelectorAll('input[type="color"]');
  const uploadInstructions = document.getElementById('upload-instructions');

  const allThemes = ${themesObjectString};

  let state = {
    selectedTheme: '${state.selectedTheme}',
    selectedAlignment: '${state.selectedAlignment}'
  };

  // --- All functions are embedded below ---

  function applyDashboardTheme(themeKey) {
    const theme = allThemes[themeKey];
    if (!theme) return;
    dashboardContainer.style.setProperty('--primary-bg-color', theme.colors[0]);
    dashboardContainer.style.setProperty('--primary-text-color', theme.colors[1]);
    dashboardContainer.style.setProperty('--accent-color', theme.colors[2]);
    dashboardContainer.style.setProperty('--secondary-bg-color', theme.colors[3]);
    dashboardContainer.style.setProperty('--border-color', theme.colors[3]);
  }

  function updateActiveControls() {
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.toggle('active', opt.dataset.theme === state.selectedTheme));
    document.querySelectorAll('.alignment-option').forEach(opt => opt.classList.toggle('active', opt.dataset.alignment === state.selectedAlignment));
  }

  function renderThemes() {
    themeControls.innerHTML = '';
    for (const themeKey in allThemes) {
      const theme = allThemes[themeKey];
      const option = document.createElement('div');
      option.className = 'theme-option';
      option.dataset.theme = theme.class;
      option.dataset.key = themeKey;
      option.innerHTML = \`<div class="color-swatch" style="background-color: \${theme.colors[0]};"></div><span>\${theme.name}</span>\${!theme.isDefault ? \`<button class="delete-btn" data-theme-key="\${themeKey}">×</button>\` : ''}\`;
      
      option.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        const clickedThemeKey = e.currentTarget.dataset.key;
        state.selectedTheme = e.currentTarget.dataset.theme;
        applyDashboardTheme(clickedThemeKey);
        downloadConfigBtn.classList.remove('clicked');
        if (allThemes[clickedThemeKey].isDefault) {
          clearEditForm();
        } else {
          editTheme(clickedThemeKey);
        }
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
        const hexInput = document.querySelector(\`.color-hex-input[data-picker="\${id}"]\`);
        const colorValue = theme.colors[index];
        colorPicker.value = colorValue;
        hexInput.value = colorValue;
    });
    addThemeBtn.textContent = 'Update Theme';
    addThemeBtn.dataset.editingKey = themeKey;
  }

  function clearEditForm() {
    newThemeNameInput.value = '';
    const defaultColors = {
      'color-primary-bg': '#e8f0ef',
      'color-primary-text': '#3f514b',
      'color-accent': '#6a9a8d',
      'color-secondary-bg': '#cedbd9'
    };
    for (const id in defaultColors) {
      const colorPicker = document.getElementById(id);
      const hexInput = document.querySelector(\`.color-hex-input[data-picker="\${id}"]\`);
      colorPicker.value = defaultColors[id];
      hexInput.value = defaultColors[id];
    }
    addThemeBtn.textContent = 'Add New Theme';
    delete addThemeBtn.dataset.editingKey;
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
      const themeKey = themeName.toLowerCase().replace(/\\s+/g, '-') + '-theme';
      if (allThemes[themeKey]) { alert('A theme with this name already exists.'); return; }
      allThemes[themeKey] = { name: themeName, class: themeKey, colors: colors, isDefault: false };
    }
    clearEditForm();
    renderThemes();
    showSaveAndUploadElements();
  }

  function deleteTheme(event) {
    event.stopPropagation();
    const themeKey = event.target.dataset.themeKey;
    if (allThemes[themeKey] && confirm(\`Are you sure you want to delete "\${allThemes[themeKey].name}" theme?\`)) {
        delete allThemes[themeKey];
        if (state.selectedTheme === themeKey) {
            state.selectedTheme = Object.keys(allThemes)[0];
            applyDashboardTheme(state.selectedTheme);
        }
        renderThemes();
        clearEditForm();
        showSaveAndUploadElements();
    }
  }

  function showSaveAndUploadElements() {
    downloadStylesBtn.style.display = 'inline-block';
    updateInterfaceBtn.style.display = 'inline-block';
    uploadInstructions.style.display = 'block';
    downloadConfigBtn.classList.remove('clicked');
    downloadStylesBtn.classList.remove('clicked');
    updateInterfaceBtn.classList.remove('clicked');
  }

  function triggerDownload(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Initialize Page ---
  renderThemes();
  updateActiveControls();
  applyDashboardTheme(state.selectedTheme);
});`;
  }
});