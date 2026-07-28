import type { Metadata } from "next";
import "./globals.css";
import "../styles/index.scss";
import { ThemeProvider } from "@/providers/ThemeProvider";
import NavBar from "@/components/NavBar";
import { Body } from "@/components/Body";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/product-config";

export const metadata: Metadata = {
  title: siteConfig.metadataTitle,
  description: siteConfig.metadataDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans")}>
      <body className="bg-slate-300 font-sans dark:bg-slate-800">
        <ThemeProvider>
          <Body>
            <NavBar />
            {children}
          </Body>
        </ThemeProvider>
      </body>
    </html>
  );
}
