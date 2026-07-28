import { ITailWindColorThemeClasses, TailWindColorThemeClasses } from "./src/constants/ColorTheme";
import type { Config } from "tailwindcss";

const reduceClasses = (obj: ITailWindColorThemeClasses) => {
  return Object.values(obj).reduce((acc: string[], curr: string) => {
    acc.push(...curr.split(" "));
    return acc;
  }, []);
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  safelist: [...reduceClasses(TailWindColorThemeClasses)],
  plugins: [],
  darkMode: "selector",
};
export default config;
