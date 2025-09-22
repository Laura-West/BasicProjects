document.addEventListener('DOMContentLoaded', () => {
    const themeControls = document.getElementById('theme-controls');
    const alignmentControls = document.getElementById('alignment-controls');
    const downloadBtn = document.getElementById('download-btn');

    // Define the themes and their colors
    const allThemes = {
        'soft-evergreen-theme': {
            name: 'Soft Evergreen',
            class: 'soft-evergreen-theme',
            colors: ['#e8f0ef', '#3f514b', '#6a9a8d', '#cedbd9']
        },
        'desert-bloom-theme': {
            name: 'Desert Bloom',
            class: 'desert-bloom-theme',
            colors: ['#fcf8f3', '#5d4037', '#d17a7a', '#e5d5c9']
        },
        'muted-clay-theme': {
            name: 'Muted Clay',
            class: 'muted-clay-theme',
            colors: ['#e7e0d9', '#4a4a4a', '#a38c82', '#d1c7c0']
        },
        'stormy-sky-theme': {
            name: 'Stormy Sky',
            class: 'stormy-sky-theme',
            colors: ['#e9ecef', '#2c3e50', '#7b9ebc', '#c7d2da']
        },
        'stone-grey-theme': {
            name: 'Stone Grey',
            class: 'stone-grey-theme',
            colors: ['#f5f5f5', '#424242', '#9e9e9e', '#e0e0e0']
        },
        'soft-lavender-theme': {
            name: 'Soft Lavender',
            class: 'soft-lavender-theme',
            colors: ['#f7f3f9', '#544458', '#a08da6', '#e1dbe2']
        },
        'gilded-iris-theme': {
            name: 'Gilded Iris',
            class: 'gilded-iris-theme',
            colors: ['#f8f6f2', '#4d443b', '#c9b19e', '#e3ddd3']
        }
    };

    let state = {
        selectedTheme: 'soft-evergreen-theme',
        selectedAlignment: 'center'
    };

    // Initialize state from potential previous selections
    function initializeState() {
        const urlParams = new URLSearchParams(window.location.search);
        state.selectedTheme = urlParams.get('theme') || state.selectedTheme;
        state.selectedAlignment = urlParams.get('alignment') || state.selectedAlignment;
    }

    // Update active classes and background color based on state
    function updateActiveControls() {
        // Update Theme
        document.querySelectorAll('.theme-option').forEach(option => {
            if (option.dataset.theme === state.selectedTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        // Update Alignment
        document.querySelectorAll('.alignment-option').forEach(option => {
            if (option.dataset.alignment === state.selectedAlignment) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        // Update the dashboard's background color
        const selectedThemeData = allThemes[state.selectedTheme];
        document.body.style.backgroundColor = selectedThemeData.colors[0];
    }

    // Function to generate and download config.js
    function createConfigFile() {
        const configContent = `const widgetConfig = {
  theme: '${state.selectedTheme}',
  alignment: '${state.selectedAlignment}'
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
    }

    // Dynamically render theme options
    function renderThemes() {
        themeControls.innerHTML = '';
        for (const themeKey in allThemes) {
            const theme = allThemes[themeKey];
            const option = document.createElement('div');
            option.className = 'theme-option';
            option.dataset.theme = theme.class;
            option.innerHTML = `
                <div class="color-swatch" style="background-color: ${theme.colors[0]};"></div>
                <span>${theme.name}</span>
            `;
            option.addEventListener('click', () => {
                state.selectedTheme = option.dataset.theme;
                updateActiveControls();
            });
            themeControls.appendChild(option);
        }
    }

    // Event listeners
    downloadBtn.addEventListener('click', createConfigFile);
    document.querySelectorAll('.alignment-option').forEach(option => {
        option.addEventListener('click', () => {
            state.selectedAlignment = option.dataset.alignment;
            updateActiveControls();
        });
    });

    // Initial setup
    initializeState();
    renderThemes();
    updateActiveControls();
});