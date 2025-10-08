// Shared widget initialization script
function initializeWidget(callback) {
  try {
    if (typeof widgetConfig !== 'undefined') {
      document.body.classList.add(widgetConfig.theme);
      callback(widgetConfig);
    } else {
      // Fallback default config if config.js missing
      const defaultConfig = { theme: 'midnight-sapphire-theme', alignment: 'center' };
      document.body.classList.add(defaultConfig.theme);
      callback(defaultConfig);
    }
  } catch (err) {
    console.error('Widget initialization failed:', err);
    const fallback = { theme: 'midnight-sapphire-theme', alignment: 'center' };
    document.body.classList.add(fallback.theme);
    callback(fallback);
  }
}
