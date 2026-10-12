// Design tokens for "Madre: Árvore da Vida" (Hand-Drawn / Journal LIGHT).
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F5F2EB",
  onSurface: "#2C2F29",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#2C2F29",
  surfaceTertiary: "#EAE5D9",
  onSurfaceTertiary: "#4A5D45",
  surfaceInverse: "#2C2F29",
  onSurfaceInverse: "#F5F2EB",
  muted: "#75746E",

  brand: "#4A5D45",
  onBrand: "#FFFFFF",
  brandPrimary: "#4A5D45",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#798E70",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#DCE3D6",
  onBrandTertiary: "#2C2F29",

  success: "#798E70",
  onSuccess: "#FFFFFF",
  warning: "#D19C4C",
  onWarning: "#2C2F29",
  error: "#A86552",
  onError: "#FFFFFF",
  info: "#6E8994",
  onInfo: "#FFFFFF",

  border: "#D5D0C5",
  borderStrong: "#A6A196",
  divider: "#E8E4DB",

  // Map/vegetation accents
  forest: "#2F5A34",
  mangrove: "#5E8C55",
  lost: "#A86552",
  scrim: "rgba(44,47,41,0.7)",
};

export type ThemeColors = typeof light;

export const fonts = {
  display: "Fraunces",
  text: "Nunito",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export const colors = light;

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
