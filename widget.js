function initializeWidget(renderCallback) {
  // Default configuration
  let config = {
    theme: 'soft-evergreen-theme',
    alignment: 'center'
  };

  // Check if the widgetConfig object exists and apply settings
  if (typeof widgetConfig !== 'undefined') {
    config = { ...config, ...widgetConfig };
  }

  // Find the widget element
  const widgetElement = document.querySelector('.widget');

  // Apply configuration directly to the widget element
  if (widgetElement) {
    // This adds the theme class (e.g., 'soft-evergreen-theme') to the widget div
    widgetElement.classList.add(config.theme);
  }

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