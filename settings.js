// Settings Dashboard Logic (no localStorage, file downloads only)
document.addEventListener('DOMContentLoaded', () => {
  const DASHBOARD_VERSION = 'v4.0';

  const FUNCTIONAL = [
    ['colour-success', '--success', '#28a745'],
    ['colour-status-0', '--status-0', '#dc143c'],
    ['colour-status-1', '--status-1', '#ff8c00'],
    ['colour-status-2', '--status-2', '#ffd700'],
    ['colour-status-3', '--status-3', '#32cd32'],
    ['colour-status-4', '--status-4', '#6babff'],
    ['colour-status-5', '--status-5', '#00ccff']
  ];

  const els = {
    version: document.getElementById('version-display'),
    cssVersion: document.getElementById('css-version-display'),
    themeList: document.getElementById('theme-list-container'),
    alignControls: document.getElementById('alignment-controls'),
    linksGrid: document.getElementById('links-grid'),
    addLinkBtn: document.getElementById('add-link-btn'),
    funcGrid: document.getElementById('func-grid'),
    downloadStyles: document.getElementById('download-styles-btn'),
    downloadConfig: document.getElementById('download-config-btn'),
    previewAlignBox: document.getElementById('preview-align'),
    previewRoot: document.getElementById('preview')
  };

  els.version.textContent = `Dashboard ${DASHBOARD_VERSION}`;

  let cssVersion = 'unknown';
  let themes = {};
  let selectedTheme = '';
  let selectedAlignment = 'center';
  let links = [];
  let functional = {};

  function loadConfigJS() {
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = `config.js?cb=${Date.now()}`;
      s.onload = () => {
        if (typeof widgetConfig !== 'undefined') {
          selectedTheme = widgetConfig.theme || selectedTheme;
          selectedAlignment = widgetConfig.alignment || selectedAlignment;
          if (widgetConfig.linksConfig && Array.isArray(widgetConfig.linksConfig.links)) {
            links = widgetConfig.linksConfig.links.slice(0);
          }
        }
        resolve();
      };
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }

  async function loadStylesCSS() {
    try {
      const res = await fetch(`styles.css?cb=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch styles.css');
      const css = await res.text();

      const verMatch = css.match(/CSS Version:\s*([0-9.]+)/i);
      cssVersion = verMatch ? verMatch[1] : 'n/a';
      els.cssVersion.textContent = `styles.css v${cssVersion}`;

      const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/);
      const rootVars = rootBlock ? rootBlock[1] : '';
      FUNCTIONAL.forEach(([id, varName, fallback]) => {
        const m = rootVars.match(new RegExp(varName.replace(/[-]/g, '\\$&') + '\\s*:\\s*([^;]+);', 'i'));
        functional[varName] = m ? m[1].trim() : fallback;
      });

      // --- FIXED THEME PARSER ---
      themes = {};
      // Match comments like /* Theme Name */ followed by .theme-class { ... }
      const re = /\/\*\s*([^*][^\/]*?)\s*\*\/\s*\.(?:[\w-]+-theme)\s*\{([\s\S]*?)\}/g;
      let match;
      while ((match = re.exec(css)) !== null) {
        const name = match[1].trim();
        if (name.toLowerCase().includes('widget styles')) continue; // skip header
        const props = match[2];
        const klass = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-theme';

        const get = k => (props.match(new RegExp(k.replace(/[-]/g, '\\$&') + '\\s*:\\s*([^;]+);', 'i')) || [,''])[1].trim();
        const bg = get('--primary-bg-color');
        const text = get('--primary-text-color');
        const accent = get('--accent-color');
        const secondary = get('--secondary-bg-color');

        if (bg && text && accent && secondary) {
          themes[klass] = { name, class: klass, colors: [bg, text, accent, secondary] };
        }
      }
      // --- END FIX ---

    } catch (e) {
      alert('Could not load styles.css. You can still generate a fresh one below.');
      themes['midnight-sapphire-theme'] = {
        name: 'Midnight Sapphire',
        class: 'midnight-sapphire-theme',
        colors: ['#0b132b', '#f2f6ff', '#4cc9f0', '#1c2541']
      };
    }
  }

  function renderFunctional() {
    els.funcGrid.innerHTML = '';
    FUNCTIONAL.forEach(([id, varName, fallback]) => {
      const value = functional[varName] || fallback;
      const row = document.createElement('div');
      row.className = 'func-item';
      row.innerHTML = `
        <code>${varName}</code>
        <div style="display:grid;grid-auto-flow:column;gap:8px;justify-content:end;">
          <input type="color" id="${id}" value="${value}">
          <input type="text" data-for="${id}" value="${value}">
        </div>`;
      els.funcGrid.appendChild(row);
    });
  }

  function themeRowHTML(key, t) {
    const [bg, txt, acc, sec] = t.colors;
    const checked = key === selectedTheme ? 'checked' : '';
    return `
      <div class="theme-row" data-key="${key}">
        <div class="theme-name">
          <label>
            <input type="radio" name="theme" value="${key}" ${checked} />
            ${t.name} <span class="tiny pill" style="margin-left:6px;">.${t.class}</span>
          </label>
        </div>
        <div class="swatch">
          <input type="color" data-k="0" value="${bg}"><input type="text" class="hex" data-k="0" value="${bg}">
          <input type="color" data-k="1" value="${txt}"><input type="text" class="hex" data-k="1" value="${txt}">
          <input type="color" data-k="2" value="${acc}"><input type="text" class="hex" data-k="2" value="${acc}">
          <input type="color" data-k="3" value="${sec}"><input type="text" class="hex" data-k="3" value="${sec}">
        </div>
        <div class="theme-actions">
          <button class="btn" data-act="rename">Rename</button>
          <button class="btn" data-act="duplicate">Duplicate</button>
          <button class="btn" data-act="delete">Delete</button>
        </div>
      </div>`;
  }

  function renderThemes() {
    els.themeList.innerHTML = '';
    Object.keys(themes).forEach(k => {
      els.themeList.insertAdjacentHTML('beforeend', themeRowHTML(k, themes[k]));
    });
    applyPreview();
  }

  function renderLinks() {
    els.linksGrid.innerHTML = '';
    if (!links.length) links = [{ label: 'Inbox', url: 'https://mail.example' }];
    links.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'link-row';
      row.dataset.i = idx;
      row.innerHTML = `
        <input type="text" class="link-label" placeholder="Label" value="${item.label || ''}">
        <input type="text" class="link-url" placeholder="https://example.com" value="${item.url || ''}">
        <button class="btn" data-act="remove-link">Remove</button>`;
      els.linksGrid.appendChild(row);
    });
  }

  function hydrateAlignment() {
    const radios = els.alignControls.querySelectorAll('input[name="align"]');
    radios.forEach(r => r.checked = r.value === selectedAlignment);
  }

  function applyPreview() {
    Object.keys(themes).forEach(k => els.previewRoot.classList.remove(k));
    if (selectedTheme) els.previewRoot.classList.add(selectedTheme);

    const t = themes[selectedTheme] || Object.values(themes)[0];
    if (!t) return;
    const [bg, txt, acc, sec] = t.colors;
    els.previewRoot.style.setProperty('--primary-bg-color', bg);
    els.previewRoot.style.setProperty('--primary-text-color', txt);
    els.previewRoot.style.setProperty('--accent-color', acc);
    els.previewRoot.style.setProperty('--secondary-bg-color', sec);

    els.previewAlignBox.style.textAlign = selectedAlignment;
  }

  // Remaining event handlers and download logic unchanged …
  // (You can keep your existing sections below here exactly as they are)

  // --- INITIALIZE ---
  (async function init() {
    await loadConfigJS();
    await loadStylesCSS();
    if (!selectedTheme || !themes[selectedTheme]) {
      selectedTheme = Object.keys(themes)[0] || selectedTheme;
    }
    renderFunctional();
    renderThemes();
    renderLinks();
    hydrateAlignment();
    applyPreview();
  })();
});
