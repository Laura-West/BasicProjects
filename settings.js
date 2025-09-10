document.addEventListener('DOMContentLoaded', () => {
    const themeControls = document.getElementById('theme-controls');
    const alignmentControls = document.getElementById('alignment-controls');
  
    // Theme data
    const allThemes = {
      'light-mode': { class: 'light-mode', name: 'Light Mode', colors: ['#ffffff', '#2c3e50', '#3498db', '#bdc3c7'] },
      'dark-mode': { class: 'dark-mode', name: 'Dark Mode', colors: ['#2c3e50', '#ecf0f1', '#3498db', '#bdc3c7'] },
      'forest-green': { class: 'forest-green', name: 'Forest Green', colors: ['#ecf0e6', '#264639', '#558269', '#558269'] },
      'gilded-iris-theme': { class: 'gilded-iris-theme', name: 'Gilded Iris', colors: ['#4b0082', '#fce883', '#ffc94b', '#3b0066'] },
      'cosmic-dust-theme': { class: 'cosmic-dust-theme', name: 'Cosmic Dust', colors: ['#0c1c38', '#e0e6f2', '#f0a07c', '#172a4e'] },
      'twilight-garden-theme': { class: 'twilight-garden-theme', name: 'Twilight Garden', colors: ['#2b004a', '#f0e6f7', '#ff4500', '#43126f'] },
      'sapphire-night-theme': { class: 'sapphire-night-theme', name: 'Sapphire Night', colors: ['#191970', '#e1efff', '#00ffff', '#2d2d86'] },
      'midnight-bloom-theme': { class: 'midnight-bloom-theme', name: 'Midnight Bloom', colors: ['#0d0f19', '#e6e6fa', '#ff69b4', '#1a1e2f'] },
      'deep-sea-pearl-theme': { class: 'deep-sea-pearl-theme', name: 'Deep Sea Pearl', colors: ['#1c3144', '#f0f8ff', '#c0fefe', '#2c445c'] },
      'amethyst-mist-theme': { class: 'amethyst-mist-theme', name: 'Amethyst Mist', colors: ['#6a5acd', '#f0f0ff', '#1e1e1e', '#8a7cde'] },
      'starlight-theme': { class: 'starlight-theme', name: 'Starlight', colors: ['#0c1223', '#f8f8ff', '#d1b281', '#1a243e'] },
      'ruby-radiance-theme': { class: 'ruby-radiance-theme', name: 'Ruby Radiance', colors: ['#3f1e1e', '#f5f5f5', '#e74c3c', '#5d3333'] },
      'azure-dream-theme': { class: 'azure-dream-theme', name: 'Azure Dream', colors: ['#87cefa', '#1e2a3a', '#34495e', '#b0e0e6'] },
    };
  
    let selectedTheme = 'gilded-iris-theme';
    let selectedAlignment = 'center';
  
    // Function to save and download the config.js file
    const saveConfig = () => {
      const configContent = `const widgetConfig = {
    theme: '${selectedTheme}',
    alignment: '${selectedAlignment}'
  };
  `;
  
      const blob = new Blob([configContent], {
        type: 'text/javascript'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'config.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Config file downloaded successfully. Please upload this file to your GitHub repository.');
    };
  
  
    // Render themes
    for (const themeKey in allThemes) {
      const theme = allThemes[themeKey];
      const option = document.createElement('div');
      option.className = `theme-option ${theme.class === selectedTheme ? 'active' : ''}`;
      option.dataset.theme = theme.class;
      option.innerHTML = `
        <span class="color-swatch" style="background-color: ${theme.colors[0]};"></span>
        <span>${theme.name}</span>
      `;
      option.addEventListener('click', () => {
        selectedTheme = theme.class;
        document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active'));
        option.classList.add('active');
        saveConfig();
      });
      themeControls.appendChild(option);
    }
  
    // Handle alignment controls
    document.querySelectorAll('.alignment-option').forEach(option => {
      if (option.dataset.alignment === selectedAlignment) {
        option.classList.add('active');
      }
      option.addEventListener('click', () => {
        const alignment = option.dataset.alignment;
        selectedAlignment = alignment;
        document.querySelectorAll('.alignment-option').forEach(el => el.classList.remove('active'));
        option.classList.add('active');
        saveConfig();
      });
    });
  });
  