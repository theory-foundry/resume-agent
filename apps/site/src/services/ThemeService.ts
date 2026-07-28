export default class ThemeService {
  setTheme(theme: string) {
    if (theme === "light") {
      localStorage.theme = "light";
      document.documentElement.classList.remove("dark");
    } else {
      localStorage.theme = "dark";
      document.documentElement.classList.add("dark");
    }
  }

  getThemeFromLocalStorage() {
    return localStorage?.theme === "light" ? "light" : "dark"
  }
}
