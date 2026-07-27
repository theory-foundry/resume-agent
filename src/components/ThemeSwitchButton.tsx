"use client";
import { ButtonHTMLAttributes, useCallback, useEffect, useState } from "react";
import ThemeService from "@/services/ThemeService";
import { useThemeContext } from "@/providers/ThemeProvider";
const themeService = new ThemeService();

export default function ThemeSwitchButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { theme, setTheme } = useThemeContext();
  const onThemeToggleClick = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    changeTheme(nextTheme);
  };

  const changeTheme = useCallback(
    (newTheme: string) => {
      setTheme(newTheme);
      themeService.setTheme(newTheme);
    },
    [setTheme],
  );

  useEffect(() => {
    const localStorageTheme = themeService.getThemeFromLocalStorage();
    changeTheme(localStorageTheme);
  }, [changeTheme]);

  return (
    <label className="mt-1 inline-flex cursor-pointer items-center">
      <input type="checkbox" onChange={onThemeToggleClick} checked={theme === "dark"} className="peer sr-only" />
      <div
        className={`peer-focus:ring-voilet-300 dark:peer-focus:ring-voilet-800 peer relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700`}
      ></div>
      {theme === "light" ? (
        <span className={`ms-3 text-lg font-medium text-white`}>☀️</span>
      ) : (
        <span className={`ms-3 text-lg font-medium text-white`}>🌘</span>
      )}
    </label>
  );
}
