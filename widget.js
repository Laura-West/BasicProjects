function initializeWidget(renderCallback) {
  // Default configuration
  let config = {
    theme: 'soft-evergreen-theme',
    alignment: 'center'
  };

  // Check if the widgetConfig object exists and apply settings
  if (typeof widgetConfig !== 'undefined') {
    config = { ...config,
      ...widgetConfig
    };
  }

  // Apply configuration
  document.body.className = config.theme;

  if (renderCallback) {
    renderCallback(config);
  }
}

// Handle config.js loading errors
window.addEventListener('error', function(e) {
  if (e.target && e.target.src && e.target.src.includes('config.js')) {
    console.warn('Config file not found, using defaults');
    window.widgetConfig = {
      theme: 'soft-evergreen-theme',
      alignment: 'center'
    };
    initializeWidget();
  }
}, true);