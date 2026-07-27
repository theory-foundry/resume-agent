export interface ITailWindColorThemeClasses {
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_TERTIARY: string;
  BG_PRIMARY: string;
  BG_SECONDARY: string;
  BG_TERTIARY: string;
  BTN_PRIMARY: string;
  BTN_SECONDARY: string;
  BTN_DANGER: string;
  BTN_WARN: string;
  BTN_NONE: string;
}

export const _TailWindColorThemeClasses: {
  light: ITailWindColorThemeClasses;
  dark: ITailWindColorThemeClasses;
} = {
  light: {
    TEXT_PRIMARY: "text-slate-950",
    TEXT_SECONDARY: "text-cyan-800",
    TEXT_TERTIARY: "text-violet-800",
    BG_PRIMARY: "bg-slate-300",
    BG_SECONDARY: "bg-slate-100",
    BG_TERTIARY: "bg-violet-600",
    BTN_PRIMARY: "bg-violet-600 text-white",
    BTN_SECONDARY: "bg-cyan-900 text-white",
    BTN_DANGER: "bg-cyan-900 text-white",
    BTN_WARN: "bg-slate-100 text-white",
    BTN_NONE: "bg-transparent text-slate-950",
  },
  dark: {
    TEXT_PRIMARY: "text-white",
    TEXT_SECONDARY: "text-cyan-600",
    TEXT_TERTIARY: "text-violet-500",
    BG_PRIMARY: "bg-slate-800",
    BG_SECONDARY: "bg-gray-900",
    BG_TERTIARY: "bg-violet-600",
    BTN_PRIMARY: "bg-violet-600 text-white hover:bg-cyan-700",
    BTN_SECONDARY: "bg-cyan-900 text-white hover:bg-violet-500",
    BTN_DANGER: "bg-cyan-900 text-white",
    BTN_WARN: "bg-slate-100 text-white",
    BTN_NONE: "bg-transparent text-white",
  },
};

export const TailWindColorThemeClasses: ITailWindColorThemeClasses = {
  TEXT_PRIMARY: "text-slate-950 dark:text-white",
  TEXT_SECONDARY: "text-cyan-800 dark:text-cyan-600",
  TEXT_TERTIARY: "text-violet-800 dark:text-violet-500",
  BG_PRIMARY: "bg-slate-300 dark:bg-slate-800",
  BG_SECONDARY: "bg-slate-100 dark:bg-gray-900",
  BG_TERTIARY: "bg-violet-600 dark:bg-violet-600",
  BTN_PRIMARY: "bg-violet-600 text-white dark:bg-violet-600 dark:text-white dark:hover:bg-cyan-700",
  BTN_SECONDARY: "bg-cyan-900 text-white dark:bg-cyan-900 dark:text-white dark:hover:bg-violet-500",
  BTN_DANGER: "bg-cyan-900 text-white dark:bg-cyan-900 dark:text-white",
  BTN_WARN: "bg-slate-100 text-white dark:bg-slate-100 dark:text-white",
  BTN_NONE: "bg-transparent text-slate-950 dark:bg-transparent dark:text-white",
};
