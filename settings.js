document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v4.0';

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
  const stylesSaveSection = document.getElementById('styles-save-section');

  let allThemes = {};
  let state = { selectedTheme: 'soft-evergreen-theme', selectedAlignment: 'center' };
  let loadedCssVersion = 1.0;
  
  // --- Functions to control SECTION visibility ---
  function showStylesSaveSection() {
    // This function makes the save section for styles.css visible.
    if (stylesSaveSection) {
      stylesSaveSection.style.display = 'flex';
    }
  }

  function hideStylesSaveSection() {
    // This function hides the save section for styles.css.
    if (stylesSaveSection) {
      stylesSaveSection.style.display = 'none';
    }
  }
  
  function indicateConfigChange() {
      const configSaveSection = downloadConfigBtn.closest('.save-section');
      configSaveSection.style.borderColor = 'var(--accent-color)';
      configSaveSection.style.borderWidth = '2px';
  }

  function createKebabCase(name) {
      return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function parseThemesFromCSS(cssText) {
      const themes = {};
      const themeRegex = /\/\* (.*?)\s\*\/([\s\S]*?)\}/g;
      let match;
      while ((match = themeRegex.exec(cssText)) !== null) {
          const themeName = match[1].trim();
          const themeId = createKebabCase(themeName) + '-theme';
          const rules = match[2];
          const colours = {};
          const colourRegex = /(--[\w-]+)\s*:\s*(.*?);/g;
          let colourMatch;
          while ((colourMatch = colourRegex.exec(rules)) !== null) {
              colours[colourMatch[1].trim()] = colourMatch[2].trim();
          }
          if (Object.keys(colours).length > 0) {
              themes[themeId] = { name: themeName, colours };
          }
      }
      allThemes = themes;
      return themes;
  }

  function parseFunctionalColoursFromCSS(cssText) {
      const colours = {};
      const rootRegex = /:root\s*{([\s\S]*?)}/;
      const rootMatch = cssText.match(rootRegex);
      if (rootMatch) {
          const rootVars = rootMatch[1];
          const colourRegex = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6});/g;
          let match;
          while ((match = colourRegex.exec(rootVars)) !== null) {
              const varName = match[1].trim();
              if (varName.startsWith('colour-')) {
                  colours[varName] = match[2].trim();
              }
          }
      }
      return colours;
  }

  async function initializeStateFromCSS() {
      try {
          const response = await fetch('styles.css?cachebust=' + new Date().getTime());
          if (!response.ok) {
              console.error(`Failed to load styles.css. Status: ${response.status}`);
              allThemes = {};
              renderFunctionalColours(DEFAULT_FUNCTIONAL_COLOURS);
              return;
          }
          const cssText = await response.text();
          const versionMatch = cssText.match(/CSS Version: ([\d.]+)/);
          loadedCssVersion = versionMatch ? parseFloat(versionMatch[1]) : 1.0;
          if(cssVersionDisplay) cssVersionDisplay.textContent = `(CSS v${loadedCssVersion.toFixed(1)})`;

          allThemes = parseThemesFromCSS(cssText);
          const functionalColours = parseFunctionalColoursFromCSS(cssText);
          renderFunctionalColours(functionalColours);

      } catch (error) {
          console.error("Error loading or parsing styles.css:", error);
          allThemes = {};
          renderFunctionalColours(DEFAULT_FUNCTIONAL_COLOURS);
      }
  }

  function applyDashboardTheme(themeId) {
      const theme = allThemes[themeId];
      if (theme && theme.colours) {
          dashboardContainer.style.setProperty('--primary-bg-color', theme.colours['--primary-bg-color'] || '#ffffff');
          dashboardContainer.style.setProperty('--secondary-bg-color', theme.colours['--secondary-bg-color'] || '#f8f9fa');
          dashboardContainer.style.setProperty('--primary-text-color', theme.colours['--primary-text-color'] || '#333333');
          dashboardContainer.style.setProperty('--accent-color', theme.colours['--accent-color'] || '#6a9a8d');
      }
  }

  function createColourEditor(id, label, value) {
      const group = document.createElement('div');
      group.className = 'colour-input-group';
      group.innerHTML = `
          <input type="color" id="${id}" value="${value}">
          <label for="${id}">${label}</label>
          <input type="text" class="colour-hex-input" value="${value}" maxlength="7">
      `;
      const colorPicker = group.querySelector('input[type="color"]');
      const hexInput = group.querySelector('.colour-hex-input');

      colorPicker.addEventListener('input', () => {
          hexInput.value = colorPicker.value;
          showStylesSaveSection();
      });
      hexInput.addEventListener('input', () => {
          if (/^#[0-9a-fA-F]{7}$/.test(hexInput.value) || /^#[0-9a-fA-F]{4}$/.test(hexInput.value)) {
             colorPicker.value = hexInput.value;
             showStylesSaveSection();
          }
      });
      return group;
  }
  
  function renderFunctionalColours(colours) {
      const container = document.getElementById('functional-colours-container');
      container.innerHTML = '';
      Object.entries(colours).forEach(([varName, value]) => {
          const group = document.createElement('div');
          group.className = 'functional-colour-group';
          const label = document.createElement('label');
          label.textContent = varName.replace('--colour-', '').replace('-', ' ');
          label.style.textTransform = 'capitalize';
          const colorPicker = document.createElement('input');
          colorPicker.type = 'color';
          colorPicker.value = value;
          colorPicker.dataset.varName = varName;
          
          const hexInput = document.createElement('input');
          hexInput.type = 'text';
          hexInput.className = 'colour-hex-input';
          hexInput.value = value;
          
          colorPicker.addEventListener('input', () => {
              hexInput.value = colorPicker.value;
              showStylesSaveSection();
          });
          
          hexInput.addEventListener('input', () => {
              if(/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
                  colorPicker.value = hexInput.value;
                  showStylesSaveSection();
              }
          });

          group.append(label, colorPicker, hexInput);
          container.appendChild(group);
      });
  }

  function renderThemes() {
      themeListContainer.innerHTML = '';
      Object.entries(allThemes).forEach(([id, theme]) => {
          const card = document.createElement('div');
          card.className = 'theme-card';
          card.dataset.themeId = id;
          if (id === state.selectedTheme) {
              card.classList.add('active');
          }
          
          card.innerHTML = `
              <span class="theme-name">${theme.name}</span>
              <div class="theme-colours">
                  ${Object.values(theme.colours).map(c => `<div class="colour-preview" style="background-color: ${c};"></div>`).join('')}
              </div>
              <div class="colour-editor" style="display:none;"></div>
              <button class="delete-theme-btn" title="Delete Theme">&times;</button>
          `;
          
          themeListContainer.appendChild(card);
      });
      updateActiveControls();
  }

  function updateActiveControls() {
      document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      document.querySelector(`.theme-card[data-theme-id="${state.selectedTheme}"]`)?.classList.add('active');
      
      document.querySelectorAll('.alignment-option').forEach(o => o.classList.remove('active'));
      document.querySelector(`.alignment-option[data-alignment="${state.selectedAlignment}"]`)?.classList.add('active');
  }

  function createConfigFile() {
      const configObject = {
          theme: state.selectedTheme,
          alignment: state.selectedAlignment,
      };
      const fileContent = `const widgetConfig = {\n  theme: '${configObject.theme}',\n  alignment: '${configObject.alignment}'\n};`;
      const blob = new Blob([fileContent], { type: 'text/javascript' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'config.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      const configSaveSection = downloadConfigBtn.closest('.save-section');
      configSaveSection.style.borderColor = '#eee';
      configSaveSection.style.borderWidth = '1px';
  }

  function downloadStylesFile() {
      let cssContent = `/* Widget Styles - CSS Version: ${(loadedCssVersion + 0.1).toFixed(1)} - Generated by Dashboard ${DASHBOARD_VERSION} */\n\n`;
      
      cssContent += `:root {\n`;
      cssContent += `  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n`;
      document.querySelectorAll('#functional-colours-container .functional-colour-group').forEach(group => {
          const picker = group.querySelector('input[type="color"]');
          const varName = picker.dataset.varName;
          cssContent += `  ${varName}: ${picker.value};\n`;
      });
      cssContent += `}\n\n`;

      Object.entries(allThemes).forEach(([id, theme]) => {
          cssContent += `/* ${theme.name} */\n`;
          cssContent += `.${id} {\n`;
          Object.entries(theme.colours).forEach(([varName, value]) => {
              cssContent += `  ${varName}: ${value};\n`;
          });
          cssContent += `}\n\n`;
      });

      const blob = new Blob([cssContent], { type: 'text/css' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'styles.css';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // After saving, hide the section again.
      hideStylesSaveSection();
  }

  themeListContainer.addEventListener('click', e => {
      const card = e.target.closest('.theme-card');
      if (!card) return;

      const themeId = card.dataset.themeId;

      if (e.target.classList.contains('delete-theme-btn')) {
          e.stopPropagation();
          if (confirm(`Are you sure you want to delete the theme "${allThemes[themeId].name}"?`)) {
              delete allThemes[themeId];
              renderThemes();
              showStylesSaveSection();
          }
          return;
      }

      if (card.classList.contains('active')) {
          const editor = card.querySelector('.colour-editor');
          const isVisible = editor.style.display !== 'none';
          editor.style.display = isVisible ? 'none' : 'grid';
          if (!isVisible) {
              editor.innerHTML = '';
              Object.entries(allThemes[themeId].colours).forEach(([varName, value]) => {
                  const label = varName.replace('--', '').replace(/-/g, ' ');
                  const inputId = `${themeId}-${varName}`;
                  const editorGroup = createColourEditor(inputId, label, value);
                  editor.appendChild(editorGroup);
                  
                  editorGroup.querySelector('input').addEventListener('input', (event) => {
                      allThemes[themeId].colours[varName] = event.target.value;
                      renderThemes();
                      document.querySelector(`.theme-card[data-theme-id="${themeId}"]`).classList.add('active');
                      applyDashboardTheme(themeId);
                      showStylesSaveSection();
                  });
              });
          }
      } else {
          state.selectedTheme = themeId;
          applyDashboardTheme(themeId);
          updateActiveControls();
          indicateConfigChange();
      }
  });

  addNewThemeBtn.addEventListener('click', () => {
      const name = prompt("Enter a name for the new theme:", "New Custom Theme");
      if (name) {
          const themeId = createKebabCase(name) + '-theme';
          allThemes[themeId] = {
              name: name,
              colours: {
                  '--primary-bg-color': '#eeeeee',
                  '--primary-text-color': '#333333',
                  '--accent-color': '#4a90e2',
                  '--secondary-bg-color': '#dddddd',
              }
          };
          renderThemes();
          showStylesSaveSection();
      }
  });
  
  async function main() {
    if (versionDisplay) versionDisplay.textContent = DASHBOARD_VERSION;
    await initializeStateFromCSS();
    renderThemes();
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
          updateActiveControls();
          indicateConfigChange();
      });
    });
    
    document.querySelectorAll('#functional-colours-container input').forEach(input => {
        input.addEventListener('input', () => {
            showStylesSaveSection();
        });
    });
  }

  main();
});