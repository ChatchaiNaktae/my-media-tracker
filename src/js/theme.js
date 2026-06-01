// ── Theme state ──────────────────────────────────────────────
// Cycle order: light (0) → dark (1) → system (2) → light (0) ...
var THEME_LIGHT = 0;
var THEME_DARK = 1;
var THEME_SYSTEM = 2;

var themeLabels = [
    '<i class="fa-solid fa-sun" aria-hidden="true"></i>',
    '<i class="fa-solid fa-moon" aria-hidden="true"></i>',
    '<i class="fa-solid fa-desktop" aria-hidden="true"></i>'
];
var themeClasses = ['light', 'dark', 'system'];

// These are set by main.js after all modules are loaded
var _getMediaChart = null;
var _updateCharts = null;

// Read saved preference from localStorage on load
function getSavedTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') return THEME_DARK;
    if (saved === 'light') return THEME_LIGHT;
    return THEME_SYSTEM;
}

var currentTheme = getSavedTheme();
var systemListenerInitialized = false;

// ── Determine effective dark state ───────────────────────────
function isSystemDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getEffectiveDark(theme) {
    if (theme === THEME_DARK) return true;
    if (theme === THEME_LIGHT) return false;
    return isSystemDark(); // THEME_SYSTEM
}

// ── Apply theme to DOM ───────────────────────────────────────
function applyTheme(theme) {
    var isDark = getEffectiveDark(theme);
    var html = document.documentElement;
    if (isDark) {
        html.classList.add('dark-mode');
    } else {
        html.classList.remove('dark-mode');
    }
    updateThemeIcon(theme);
}

// ── Update icon and spin the button ─────────────────────────
function updateThemeIcon(theme) {
    var icon = document.getElementById('themeIcon');
    if (icon) {
        icon.innerHTML = themeLabels[theme];
    }
}

function spinThemeButton() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.classList.remove('rotate-anim');
    // Force reflow so the animation restarts on re-add
    void btn.offsetWidth;
    btn.classList.add('rotate-anim');
    setTimeout(function () {
        btn.classList.remove('rotate-anim');
    }, 500);
}

// ── Update the chart colours ─────────────────────────────────
function refreshChart(theme) {
    var isDark = getEffectiveDark(theme);
    var textColor = isDark ? '#ffffff' : '#333333';
    var chart = _getMediaChart ? _getMediaChart() : null;
    if (chart) {
        chart.options.plugins.legend.labels.color = textColor;
        chart.update();
    } else if (typeof _updateCharts === 'function') {
        var items = (typeof window.getAllItems === 'function') ? window.getAllItems() : [];
        _updateCharts(items);
    }
}

// ── Toggle theme (called on button click) ────────────────────
export function toggleTheme() {
    // Advance to next state in cycle: light → dark → system → light ...
    currentTheme = (currentTheme + 1) % 3;

    applyTheme(currentTheme);
    spinThemeButton();

    // Persist: 'system' is stored as null (clears localStorage) so
    // on next load we default to system detection
    if (currentTheme === THEME_SYSTEM) {
        localStorage.removeItem('theme');
    } else {
        localStorage.setItem('theme', themeClasses[currentTheme]);
    }

    refreshChart(currentTheme);
}

// ── System preference listener ───────────────────────────────
function initSystemThemeListener() {
    if (systemListenerInitialized) return;
    systemListenerInitialized = true;

    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function () {
        // Only auto-follow system when in system mode
        if (currentTheme !== THEME_SYSTEM) return;

        applyTheme(THEME_SYSTEM);
        refreshChart(THEME_SYSTEM);
    });
}

// ── Called by main.js to wire up chart dependencies ──────────
export function initTheme(getMediaChart, updateCharts) {
    _getMediaChart = getMediaChart;
    _updateCharts = updateCharts;
}

// ── Initialise on load ───────────────────────────────────────
(function initTheme() {
    applyTheme(currentTheme);
    initSystemThemeListener();
})();
