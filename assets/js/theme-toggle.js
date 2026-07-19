(function () {
    var STORAGE_KEY = 'theme';
    var root = document.documentElement;

    function applyState(isDark) {
        root.classList.toggle('dark-mode', isDark);

        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        btn.setAttribute('aria-pressed', String(isDark));

        var label = btn.querySelector('.theme-toggle-label');
        if (label) label.textContent = isDark ? 'Lights on' : 'Lights off';

        var icon = btn.querySelector('.theme-toggle-icon');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        applyState(root.classList.contains('dark-mode'));

        btn.addEventListener('click', function () {
            var isDark = !root.classList.contains('dark-mode');
            applyState(isDark);
            try {
                localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
            } catch (e) {}
        });
    });
})();
