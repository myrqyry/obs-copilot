export var AppTab;
(function (AppTab) {
    AppTab["CONNECTIONS"] = "Connections";
    AppTab["OBS_STUDIO"] = "OBS Studio";
    AppTab["SETTINGS"] = "Settings";
    AppTab["GEMINI"] = "Gemini";
    AppTab["STREAMING_ASSETS"] = "Streaming Assets";
    AppTab["CREATE"] = "Create";
    AppTab["ADVANCED"] = "Advanced";
})(AppTab || (AppTab = {}));
// Catppuccin Theming
export const catppuccinMochaColors = {
    rosewater: '#f5e0dc',
    flamingo: '#f2cdcd',
    pink: '#f5c2e7',
    mauve: '#cba6f7',
    red: '#f38ba8',
    maroon: '#eba0ac',
    peach: '#fab387',
    yellow: '#f9e2af',
    green: '#a6e3a1',
    teal: '#94e2d5',
    sky: '#89dceb',
    sapphire: '#74c7ec',
    blue: '#89b4fa',
    lavender: '#b4befe',
    text: '#cdd6f4',
    subtext1: '#bac2de',
    subtext0: '#a6adc8',
    overlay2: '#9399b2',
    overlay1: '#7f849c',
    overlay0: '#6c7086',
    surface2: '#585b70',
    surface1: '#45475a',
    surface0: '#313244',
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
};
export const catppuccinAccentColorsHexMap = {
    sky: catppuccinMochaColors.sky,
    mauve: catppuccinMochaColors.mauve,
    pink: catppuccinMochaColors.pink,
    green: catppuccinMochaColors.green,
    teal: catppuccinMochaColors.teal,
    peach: catppuccinMochaColors.peach,
    yellow: catppuccinMochaColors.yellow,
    red: catppuccinMochaColors.red,
    flamingo: catppuccinMochaColors.flamingo,
    rosewater: catppuccinMochaColors.rosewater,
    sapphire: catppuccinMochaColors.sapphire,
    blue: catppuccinMochaColors.blue,
    lavender: catppuccinMochaColors.lavender,
};
export const catppuccinSecondaryAccentColorsHexMap = catppuccinAccentColorsHexMap;
export const catppuccinChatBubbleColorsHexMap = catppuccinAccentColorsHexMap;
