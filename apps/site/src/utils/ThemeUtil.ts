import { ITailWindColorThemeClasses } from "@/constants/ColorTheme";

export function getButtonThemeClasses(
  colorTheme: "primary" | "secondary" | "warn" | "danger" | "none",
  twColorClasses: ITailWindColorThemeClasses,
) {
  switch (colorTheme) {
    case "primary":
      return twColorClasses.BTN_PRIMARY;
    case "secondary":
      return twColorClasses.BTN_SECONDARY;
    case "warn":
      return twColorClasses.BTN_WARN;
    case "danger":
      return twColorClasses.BTN_DANGER;
    case "none":
    default:
      return twColorClasses.BTN_NONE;
  }
}
