"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeSwitchButton from "./ThemeSwitchButton";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export default function NavBar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLocalEnvironment = process.env.NODE_ENV === "development";

  const activeLinkClasses = `rounded-md bg-black/50 px-3 py-2 text-sm font-medium text-white`;
  const nonActiveLinkClasses = `rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white`;
  const mobileActiveLinkClasses = `block rounded-md bg-gray-900 px-3 py-2 text-base font-medium ${tw.TEXT_PRIMARY}`;
  const mobileNonActiveLinkClasse = `block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white`;

  const links = [
    {
      href: "/resume",
      title: "Resume",
    },
    {
      href: "/projects",
      title: "Projects",
    },
    {
      href: "/blog",
      title: "Blog",
    },
    {
      href: "/contact",
      title: "Contact",
    },
  ];

  if (isLocalEnvironment) {
    links.push({
      href: "/chat-test",
      title: "Chat Test",
    });
  }

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="absolute -inset-0.5"></span>
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. Menu open: "hidden", Menu closed: "block"*/}
              <svg
                className={`block h-6 w-6 ${isMobileMenuOpen ? "hidden" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              {/* Icon when menu is open. Menu open: "block", Menu closed: "hidden" */}
              <svg
                className={`block h-6 w-6 ${!isMobileMenuOpen ? "hidden" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <Link
              className={`border-primary-500 flex flex-shrink-0 items-center overflow-hidden rounded-full`}
              href="/"
            >
              <Image
                className="h-10 w-auto"
                src="/images/LUKAS_HEADSHOT_SMALL.png"
                alt="Lukas Sorensen"
                width={40}
                height={40}
              />
            </Link>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white"  */}
                {links.map((link) => (
                  <Link
                    key={"desktop-" + link.href}
                    href={link.href}
                    aria-current="page"
                    className={pathname.includes(link.href) ? activeLinkClasses : nonActiveLinkClasses}
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
            <div className="absolute right-0">
              <ThemeSwitchButton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state.  */}
      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white"  */}
            {links.map((link) => (
              <Link
                key={"desktop-" + link.href}
                href={link.href}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className={pathname.includes(link.href) ? mobileActiveLinkClasses : mobileNonActiveLinkClasse}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
