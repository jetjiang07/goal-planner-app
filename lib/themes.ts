export const ACCENT_THEME_STORAGE_KEY = "goal-planner:accent-theme";

export type AccentThemeId = "blossom" | "mist" | "sage" | "dawn" | "lavender" | "peach";

export type AccentTheme = {
  id: AccentThemeId;
  name: string;
  hex: string;
};

export const accentThemes: AccentTheme[] = [
  { id: "blossom", name: "Blossom", hex: "#F8C8DC" },
  { id: "mist", name: "Mist", hex: "#AEDFF7" },
  { id: "sage", name: "Sage", hex: "#B8E6C1" },
  { id: "dawn", name: "Dawn", hex: "#FFF2B2" },
  { id: "lavender", name: "Lavender", hex: "#D7C6F5" },
  { id: "peach", name: "Peach", hex: "#FFD6A5" },
];

export const defaultAccentThemeId: AccentThemeId = "blossom";

export function isAccentThemeId(value: string | null): value is AccentThemeId {
  return accentThemes.some((theme) => theme.id === value);
}
