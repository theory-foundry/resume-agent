"use client";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import Image from "next/image";
import { exampleProfile } from "@resume-agent/profile";
import { ResumeAgent } from "@resume-agent/widget/react";
import { assistantConfig, siteConfig } from "@/config/product-config";

export default function Home() {
  return (
    <main className={`flex min-h-screen flex-col items-center ${tw.BG_PRIMARY} px-6 pb-6 pt-12`}>
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src={siteConfig.profileImage}
            alt={`${exampleProfile.name} profile placeholder`}
            width={120}
            height={120}
            className={`rounded-full border-2 ${siteConfig.theme.accentBorderClass}`}
          />
        </div>
        <h1 className={`mb-2 text-5xl font-bold ${tw.TEXT_SECONDARY}`}>{exampleProfile.name}</h1>
        <h2 className={`text-lg uppercase tracking-widest ${tw.TEXT_TERTIARY}`}>{exampleProfile.headline}</h2>
      </div>

      <div className="flex w-full max-w-4xl flex-1 justify-center pt-8" style={{ minHeight: "60vh" }}>
        <ResumeAgent
          gatewayUrl={assistantConfig.gatewayUrl}
          title={assistantConfig.title}
          placeholder={assistantConfig.placeholder}
          suggestions={assistantConfig.suggestions}
          theme={assistantConfig.theme}
          style={{ width: "100%", maxWidth: 680 }}
        />
      </div>
    </main>
  );
}
