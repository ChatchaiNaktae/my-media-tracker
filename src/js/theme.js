// Theme Toggle System
export function toggleTheme(mediaChart, allItems, updateCharts) {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeIcon');
    icon.textContent = isDark ? '🌙' : '☀️';
    
    const btn = document.querySelector('.theme-toggle');
    if(btn) {
        btn.classList.add('rotate-anim');
        setTimeout(() => { btn.classList.remove('rotate-anim'); }, 500);
    }

    if (mediaChart) {
        mediaChart.options.plugins.legend.labels.color = isDark ? '#ffffff' : '#333333';
        mediaChart.update();
    } else if (typeof updateCharts === 'function') {
        updateCharts(allItems);     
    }
}

(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        if (savedTheme === 'dark') { icon.textContent = '🌙'; } 
        else { icon.textContent = '☀️'; }
    }
})();