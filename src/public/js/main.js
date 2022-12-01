const preferedColorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const switchTheme = document.getElementById('themeApp');

function setTheme (theme) {
    document.documentElement.setAttribute('data-theme', theme);
}