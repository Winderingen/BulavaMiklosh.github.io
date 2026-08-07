// ================================================================
// УПРАВЛЕНИЕ ТЕМОЙ
// ================================================================

let currentTheme = 'light';

function toggleTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('themeToggle');
    
    if (currentTheme === 'light') {
        html.setAttribute('data-theme', 'dark');
        currentTheme = 'dark';
        btn.innerHTML = '☀️ <span>Светлая</span>';
    } else {
        html.removeAttribute('data-theme');
        currentTheme = 'light';
        btn.innerHTML = '🌙 <span>Тёмная</span>';
    }
    
    localStorage.setItem('theme', currentTheme);
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        currentTheme = 'dark';
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.innerHTML = '☀️ <span>Светлая</span>';
        }
    }
}

// Экспортируем для использования в app.js
window.themeManager = {
    toggleTheme,
    loadTheme,
    getCurrentTheme: () => currentTheme
};