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
  // Set a default state. This will be overwritten by loadConfig if it succeeds.
  let state = { selectedTheme: '', selectedAlignment: 'center' };
  let loadedCssVersion = 1.0;

  /**
   * Dynamically loads the config.js file to retrieve the last saved state.
   */
  function loadConfig() {
    // Attempt to load the dynamically created config.js file to get the last saved state
    const script = document.createElement('script');
    script.src = 'config.js?t=' + new Date().getTime(); // Prevent caching
    script.onload = () => {
      if (typeof widgetConfig !== 'undefined') {
        state.selectedTheme = widgetConfig.theme;
        state.selectedAlignment = widgetConfig.alignment || 'center';
        
        // NEW: Load links configuration back into the dashboard if it exists
        if (widgetConfig.linksConfig && window.loadLinksConfig) {
            window.loadLinksConfig(widgetConfig.linksConfig);
        }
      }
      initializeDashboard();
    };
    script.onerror = () => {
      // If config.js fails to load, proceed with defaults
      console.warn('config.js not found, proceeding with default settings.');
      initializeDashboard();
    };
    document.head.appendChild(script);
  }

  /**
   * Creates the config.js file containing the current theme, alignment, and links configuration.
   */
  function createConfigFile() {
    // NEW: Retrieve link data from the global function added in index.html
    const linksConfigData = window.getLinksConfig ? window.getLinksConfig() : { title: "Quick Links", links: [] };

    const configData = {
      theme: state.selectedTheme,
      alignment: state.selectedAlignment,
      // CRITICAL UPDATE: Add the links configuration to the output object
      linksConfig: linksConfigData 
    };

    // Format the content as a JavaScript object string
    const linksConfigString = JSON.stringify(configData.linksConfig, null, 2).replace(/"/g, '\"');

    const fileContent = `const widgetConfig = {\n  theme: '${configData.theme}',\n  alignment: '${configData.alignment}',\n  linksConfig: ${linksConfigString}\n};`;
    
    // Create and download the file
    downloadFile('config.js', fileContent, 'text/javascript');
    showSaveAndUploadElements(false);
  }

  /**
   * Generates the styles.css content and triggers a download.
   */
  function downloadStylesFile() {
    const customStyles = generateCustomStyles();
    downloadFile('styles.css', customStyles, 'text/css');
    showSaveAndUploadElements(false);
  }

  /**
   * Utility function to download a file.
   */
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Reads existing styles.css to extract themes and functional colours.
   */
  function parseExistingStyles() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'styles.css?t=' + new Date().getTime(), true); // Bypass cache
    xhr.onload = function() {
      if (xhr.status === 200) {
        const content = xhr.responseText;
        
        // 1. Extract CSS Version
        const versionMatch = content.match(/\/\* Widget Styles - CSS Version: ([\d.]+)/);
        if(versionMatch) loadedCssVersion = parseFloat(versionMatch[1]);
        
        // 2. Extract Functional Colours from :root
        const rootMatch = content.match(/:root\s*\{([\s\S]*?)\}/);
        if (rootMatch) {
          const rootContent = rootMatch[1];
          Object.keys(DEFAULT_FUNCTIONAL_COLOURS).forEach(key => {
            const varName = `--${key.replace('colour-', '')}`;
            const colourMatch = rootContent.match(new RegExp(`\\s*${varName}:\\s*([^;]+);`));
            if (colourMatch) {
              DEFAULT_FUNCTIONAL_COLOURS[key] = colourMatch[1].trim();
            }
          });
        }

        // 3. Extract Themes
        const themeBlocks = content.match(/\/\* ([^\*]+) \*\/[\s\S]*?\.(.+?)-theme\s*\{([\s\S]*?)\}/g);
        if (themeBlocks) {
          themeBlocks.forEach(block => {
            const nameMatch = block.match(/\/\* ([^\*]+) \*\//);
            const classNameMatch = block.match(/\.(.+?)-theme/);
            const contentMatch = block.match(/\{([\s\S]*?)\}/);

            if (nameMatch && classNameMatch && contentMatch) {
              const themeName = nameMatch[1].trim();
              const themeClass = classNameMatch[1].trim() + '-theme';
              const themeContent = contentMatch[0];
              
              const theme = {
                name: themeName,
                className: themeClass,
                colours: {}
              };

              const varMatches = themeContent.match(/--(.+?):\s*(.+?);/g);
              if (varMatches) {
                varMatches.forEach(varMatch => {
                  const parts = varMatch.match(/--(.+?):\s*(.+?);/);
                  if (parts && parts[1] && parts[2]) {
                    theme.colours[parts[1].trim()] = parts[2].trim();
                  }
                });
              }
              allThemes[themeClass] = theme;
            }
          });
        }
      }
      // Continue to the next step: load config and initialize dashboard
      loadConfig();
    };
    xhr.onerror = () => {
      console.warn('styles.css not found, proceeding with default theme definitions.');
      loadConfig();
    };
    xhr.send();
  }
  
  /**
   * Constructs the final styles.css content based on the current state.
   */
  function generateCustomStyles() {
    let css = `/* Widget Styles - CSS Version: ${loadedCssVersion.toFixed(1)} - Generated by Dashboard ${DASHBOARD_VERSION} */\n\n`;
    
    // Root Variables (Functional Colours)
    css += ':root {\n';
    css += `  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n`;
    const functionalColoursContainer = document.getElementById('functional-colours-container');
    if (functionalColoursContainer) {
        Object.keys(DEFAULT_FUNCTIONAL_COLOURS).forEach(key => {
            const varName = `--${key.replace('colour-', '')}`;
            const hexInput = functionalColoursContainer.querySelector(`#${key}`).value.trim();
            css += `  ${varName}: ${hexInput};\n`;
        });
    }
    css += '}\n\n';

    // Theme Blocks
    Object.values(allThemes).forEach(theme => {
      css += `/* ${theme.name} */\n`;
      css += `.${theme.className} {\n`;
      Object.keys(theme.colours).forEach(varName => {
        css += `  --${varName}: ${theme.colours[varName]};\n`;
      });
      css += '}\n\n';
    });

    return css;
  }
  
  // Renders the list of themes in the dashboard
  function renderThemes() {
    themeListContainer.innerHTML = '';
    Object.values(allThemes).forEach(theme => themeListContainer.appendChild(createThemeRow(theme)));
  }

  // Creates the HTML element for a single theme in the dashboard
  function createThemeRow(theme) {
    const row = document.createElement('div');
    row.classList.add('theme-row', theme.className);
    if (theme.className === state.selectedTheme) row.classList.add('selected');
    row.dataset.theme = theme.className;

    // View Mode
    const viewMode = document.createElement('div');
    viewMode.classList.add('view-mode');
    
    const themeName = document.createElement('span');
    themeName.classList.add('theme-name');
    themeName.textContent = theme.name;
    
    const swatches = document.createElement('div');
    swatches.classList.add('colour-swatch-group');
    ['primary-bg-color', 'primary-text-color', 'accent-color'].forEach(colorVar => {
      const swatch = document.createElement('span');
      swatch.classList.add('colour-swatch');
      swatch.style.backgroundColor = theme.colours[colorVar] || '#ccc';
      swatches.appendChild(swatch);
    });

    const selectBtn = document.createElement('button');
    selectBtn.classList.add('btn', 'select-btn');
    selectBtn.textContent = 'Select Theme';
    selectBtn.onclick = () => {
      state.selectedTheme = theme.className;
      applyDashboardTheme(theme.className);
      showSaveAndUploadElements();
      updateActiveControls();
    };
    
    const editBtn = document.createElement('button');
    editBtn.classList.add('btn', 'secondary', 'edit-btn');
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => {
      row.classList.add('editing');
      // Set colour pickers to current theme values
      Object.keys(theme.colours).forEach(varName => {
        const picker = row.querySelector(`input[data-var="${varName}"][type="color"]`);
        const hexInput = row.querySelector(`input[data-var="${varName}"].colour-hex-input`);
        if (picker && hexInput) {
          picker.value = theme.colours[varName];
          hexInput.value = theme.colours[varName];
        }
      });
      row.querySelector('.theme-name-input').value = theme.name;
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn', 'danger', 'delete-btn');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      if (confirm(`Are you sure you want to delete the theme "${theme.name}"?`)) {
        delete allThemes[theme.className];
        if (state.selectedTheme === theme.className) {
            state.selectedTheme = Object.keys(allThemes).length > 0 ? Object.keys(allThemes)[0] : '';
            applyDashboardTheme(state.selectedTheme);
        }
        renderThemes();
        showSaveAndUploadElements();
      }
    };
    
    viewMode.append(themeName, swatches, selectBtn, editBtn, deleteBtn);
    
    // Edit Mode
    const editMode = document.createElement('div');
    editMode.classList.add('edit-mode');
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.classList.add('theme-name-input');
    nameInput.placeholder = 'Theme Name';

    const colourInputsGrid = document.createElement('div');
    colourInputsGrid.classList.add('colour-inputs-grid');

    ['primary-bg-color', 'secondary-bg-color', 'primary-text-color', 'accent-color'].forEach(varName => {
        const group = document.createElement('div');
        group.classList.add('colour-input-group');
        const label = document.createElement('label');
        label.textContent = varName.replace(/-/g, ' ').replace('color', 'Colour').replace(/\b\w/g, l => l.toUpperCase());
        
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.dataset.var = varName;
        
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.classList.add('colour-hex-input');
        hexInput.dataset.var = varName;
        
        picker.oninput = (e) => {
            hexInput.value = e.target.value;
            theme.colours[varName] = e.target.value;
            row.querySelector('.theme-name-input').dispatchEvent(new Event('input')); // Trigger update
        };
        hexInput.oninput = (e) => {
            picker.value = e.target.value;
            theme.colours[varName] = e.target.value;
            row.querySelector('.theme-name-input').dispatchEvent(new Event('input')); // Trigger update
        };

        group.append(label, picker, hexInput);
        colourInputsGrid.appendChild(group);
    });

    const editModeControls = document.createElement('div');
    editModeControls.classList.add('edit-mode-controls');
    
    const saveBtn = document.createElement('button');
    saveBtn.classList.add('btn', 'select-btn');
    saveBtn.textContent = 'Save Theme';
    saveBtn.onclick = () => {
        theme.name = nameInput.value.trim();
        if (!theme.name) { alert('Theme name cannot be empty.'); return; }
        
        // Finalize colours from inputs (already updated by oninput handlers)
        
        // Update the theme class name based on the final name for uniqueness
        const newClassName = theme.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-theme';
        if (newClassName !== theme.className) {
            // Check for collision with existing themes (excluding itself)
            if (allThemes[newClassName] && allThemes[newClassName] !== theme) {
                alert(`A theme with the name "${theme.name}" already exists.`);
                return;
            }
            delete allThemes[theme.className]; // Remove old entry
            theme.className = newClassName;
            allThemes[newClassName] = theme; // Add new entry
            row.dataset.theme = newClassName;
        }

        row.classList.remove('editing');
        renderThemes(); // Re-render the list to update names and classes
        showSaveAndUploadElements();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('btn', 'secondary');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      row.classList.remove('editing');
      renderThemes(); // Re-render to discard unsaved changes
    };

    editModeControls.append(saveBtn, cancelBtn);
    
    editMode.append(nameInput, colourInputsGrid, editModeControls);

    row.append(viewMode, editMode);
    return row;
  }
  
  // Applies the theme to the dashboard preview
  function applyDashboardTheme(themeClass) {
    if (themeClass) {
        dashboardContainer.className = 'container'; // Remove previous theme class
        dashboardContainer.classList.add(themeClass);
    }
  }

  // Updates the visual state of buttons
  function updateActiveControls() {
    // Theme buttons
    document.querySelectorAll('.theme-row').forEach(row => {
      row.classList.remove('selected');
      if (row.dataset.theme === state.selectedTheme) {
        row.classList.add('selected');
      }
    });

    // Alignment buttons
    document.querySelectorAll('.alignment-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.alignment === state.selectedAlignment) {
            option.classList.add('active');
        }
    });

    // Apply alignment to dashboard preview
    dashboardContainer.style.textAlign = state.selectedAlignment;
  }

  // Shows or hides the save/upload elements based on changes
  function showSaveAndUploadElements(show = true) {
      document.getElementById('download-config-btn').style.display = show ? 'block' : 'none';
      document.getElementById('download-styles-btn').style.display = show ? 'block' : 'none';
      document.getElementById('upload-instructions').style.display = show ? 'block' : 'none';
  }

  // Initializes the dashboard with event listeners and data
  function initializeDashboard() {
    versionDisplay.textContent = DASHBOARD_VERSION;
    cssVersionDisplay.textContent = `CSS: v${loadedCssVersion.toFixed(1)}`;
    
    // Set functional colour inputs
    const functionalColoursContainer = document.getElementById('functional-colours-container');
    if (functionalColoursContainer) {
        Object.keys(DEFAULT_FUNCTIONAL_COLOURS).forEach(key => {
            const picker = functionalColoursContainer.querySelector(`#${key}`);
            const hexInput = functionalColoursContainer.querySelector(`.colour-hex-input[data-picker="${key}"]`);
            if (picker) picker.value = DEFAULT_FUNCTIONAL_COLOURS[key];
            if (hexInput) hexInput.value = DEFAULT_FUNCTIONAL_COLOURS[key];
        });
        
        functionalColoursContainer.querySelectorAll('.colour-hex-input, input[type="color"]').forEach(input => {
            input.addEventListener('input', () => showSaveAndUploadElements());
        });
    }

    // 1. If a theme was successfully loaded from config.js, apply it.
    if (state.selectedTheme && allThemes[state.selectedTheme]) {
        applyDashboardTheme(state.selectedTheme);
    } 
    // 2. If not, or if no theme was set, fall back to the first theme in the list.
    else if (Object.keys(allThemes).length > 0) {
        state.selectedTheme = Object.keys(allThemes)[0];
        applyDashboardTheme(state.selectedTheme);
    }
    
    // Finally, render the UI with the correct theme selected.
    renderThemes();
    updateActiveControls();

    downloadConfigBtn.addEventListener('click', createConfigFile);
    downloadStylesBtn.addEventListener('click', downloadStylesFile);
    
    alignmentControls.querySelectorAll('.alignment-option').forEach(option => {
      option.addEventListener('click', () => { 
          state.selectedAlignment = option.dataset.alignment; 
          showSaveAndUploadElements(); 
          updateActiveControls(); 
      });
    });
    
    // Listener for functional colour changes (already added during functional colour setup)
    
    // Add New Theme button
    addNewThemeBtn.addEventListener('click', () => {
        const newThemeName = prompt("Enter a unique name for the new theme:");
        if (newThemeName && newThemeName.trim()) {
            const trimmedName = newThemeName.trim();
            const newClassName = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-theme';

            if (allThemes[newClassName]) {
                alert(`A theme with the name "${trimmedName}" already exists.`);
                return;
            }

            allThemes[newClassName] = {
                name: trimmedName,
                className: newClassName,
                colours: {
                    'primary-bg-color': '#ffffff',
                    'secondary-bg-color': '#f8f9fa',
                    'primary-text-color': '#333333',
                    'accent-color': '#6a9a8d'
                }
            };
            renderThemes();
            showSaveAndUploadElements();
            
            // Immediately put the new row into edit mode
            const newRow = document.querySelector(`[data-theme="${newClassName}"]`);
            if (newRow) newRow.classList.add('editing');
        }
    });

    // Initial check to hide save buttons if nothing has been loaded/changed yet
    showSaveAndUploadElements(false);
  }

  // --- Link Configuration Logic for Dashboard ---
  
  // Expose function to settings.js to load the saved link configuration on dashboard load
  window.loadLinksConfig = function(config) {
    const linksTitleInput = document.getElementById('links-title-input');
    const linksContainer = document.getElementById('hyperlinks-container');
    const addLinkBtn = document.getElementById('add-new-link-btn');

    // Clear existing dynamic link rows first (only those added by the script)
    linksContainer.querySelectorAll('.link-entry-grid').forEach(row => row.remove());
    
    if (config.title) {
        linksTitleInput.value = config.title;
    }

    if (Array.isArray(config.links)) {
        config.links.forEach(link => createLinkRow(link));
    }
  };

  // Expose function to settings.js to read link configuration
  window.getLinksConfig = function() {
    const linksContainer = document.getElementById('hyperlinks-container');
    const linksTitleInput = document.getElementById('links-title-input');
    const rows = linksContainer.querySelectorAll('.link-entry-grid');
    const links = [];
    rows.forEach(row => {
        const label = row.querySelector('.link-label-input').value.trim();
        let url = row.querySelector('.link-url-input').value.trim();
        
        if (label && url) {
            // Simple URL validation: prepend http:// if no protocol is found
            if (!url.match(/^(f|ht)tps?:\/\//i)) {
                url = 'http://' + url;
            }
            links.push({ label, url });
        }
    });
    
    return {
        title: linksTitleInput.value.trim() || "Quick Links",
        links: links
    };
  };

  // Function to create a link input row (replicated for self-containment/ease of use)
  function createLinkRow(link = { label: '', url: '' }) {
    const linksContainer = document.getElementById('hyperlinks-container');
    const linkRow = document.createElement('div');
    linkRow.classList.add('link-entry-grid');
    
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.classList.add('link-label-input');
    labelInput.placeholder = 'Link Label';
    labelInput.value = link.label;
    labelInput.addEventListener('input', () => showSaveAndUploadElements());
    
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.classList.add('link-url-input');
    urlInput.placeholder = 'https://example.com';
    urlInput.value = link.url;
    urlInput.addEventListener('input', () => showSaveAndUploadElements());
    
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn', 'danger', 'link-delete-btn');
    deleteBtn.textContent = '✖';
    deleteBtn.onclick = () => { linkRow.remove(); showSaveAndUploadElements(); };
    
    linkRow.append(labelInput, urlInput, deleteBtn);
    
    // Find the 'Add New Link' button to insert the new row before it
    const addLinkBtn = document.getElementById('add-new-link-btn');
    linksContainer.insertBefore(linkRow, addLinkBtn);
    
    return linkRow;
  }
  
  // Initial setup: Load styles first to get themes, then load config
  parseExistingStyles();
});