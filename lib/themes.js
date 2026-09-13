/**
 * Built-in card themes. Add more by extending this map.
 */

const THEMES = {
  catppuccin: {
    bg: "#1e1e2e",
    border: "#45475a",
    title: "#cdd6f4",
    label: "#a6adc8",
    text: "#cdd6f4",
    number: "#f5c2e7",
    accent: "#89b4fa",
    prColor: "#a6e3a1",
    issueColor: "#f38ba8",
    headerBg: "#313244",
    divider: "#45475a",
  },
  "tokyo-night": {
    bg: "#1a1b26",
    border: "#3b4261",
    title: "#c0caf5",
    label: "#565f89",
    text: "#c0caf5",
    number: "#bb9af7",
    accent: "#7aa2f7",
    prColor: "#9ece6a",
    issueColor: "#f7768e",
    headerBg: "#24283b",
    divider: "#3b4261",
  },
  "github-dark": {
    bg: "#0d1117",
    border: "#30363d",
    title: "#c9d1d9",
    label: "#8b949e",
    text: "#c9d1d9",
    number: "#79c0ff",
    accent: "#58a6ff",
    prColor: "#3fb950",
    issueColor: "#f85149",
    headerBg: "#161b22",
    divider: "#30363d",
  },
};

/**
 * Resolve a theme by name, falling back to catppuccin.
 * @param {string} name
 */
export function getTheme(name) {
  return THEMES[name] || THEMES.catppuccin;
}

export const THEME_NAMES = Object.keys(THEMES);
