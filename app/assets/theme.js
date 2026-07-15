import { DeviceEventEmitter } from "react-native";

const themes = {
    light: {
        bg: "#f5f5f5",
        cardBg: "#eaeaea",
        text: "#1a1a1a",
        textMuted: "#5a5a5a",
        primary: "#0eb377",
        border: "#cccccc",
        inputBg: "#e0e0e0",
        danger: "#ff4444",
        warning: "#ffbb33"
    },
    dark: {
        bg: "#222222",
        cardBg: "#333333",
        text: "#eeeeee",
        textMuted: "#888888",
        primary: "#10f5a2",
        border: "#444444",
        inputBg: "#2a2a2a",
        danger: "#ff4444",
        warning: "#ffbb33"
    },
    intense_dark: {
        bg: "#000000",
        cardBg: "#111111",
        text: "#eeeeee",
        textMuted: "#777777",
        primary: "#10f5a2",
        border: "#222222",
        inputBg: "#1a1a1a",
        danger: "#ff4444",
        warning: "#ffbb33"
    },
    sunset: {
        bg: "#c59d68",
        cardBg: "#a87e4c",
        text: "#4a2c1f",
        textMuted: "#804a2d",
        primary: "#b05929",
        border: "#936a3d",
        inputBg: "#946b3e",
        danger: "#6b3222",
        warning: "#b09e25"
    },
    sunrise: {
        bg: "#54877e",
        cardBg: "#3e6960",
        text: "#0b1c1a",
        textMuted: "#1b3834",
        primary: "#2e5c66",
        border: "#2f524a",
        inputBg: "#2f524a",
        danger: "#a88540",
        warning: "#ad9e28"
    }
};

let currentTheme = "dark";

export const theme = () => themes[currentTheme] || themes.dark;
export const getThemeId = () => currentTheme;

export const setTheme = (themeId) => {
    if (themes[themeId] && currentTheme !== themeId) {
        currentTheme = themeId;
        DeviceEventEmitter.emit("theme_changed", themeId);
    }
};
