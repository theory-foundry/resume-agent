import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import { exampleProfile } from "@resume-agent/profile";
import { siteConfig } from "@/config/product-config";

export default function Contact() {
  const email = exampleProfile.contact.email;

  return (
    <main className={`${tw.BG_PRIMARY} min-h-screen py-14`}>
      <div className="mx-auto max-w-screen-md px-8 py-16 text-center">
        <h1 className={`mb-4 text-4xl font-extrabold tracking-tight ${tw.TEXT_PRIMARY}`}>
          {siteConfig.contactHeading}
        </h1>
        <p className={`mb-8 text-xl font-light ${tw.TEXT_SECONDARY}`}>
          {siteConfig.contactDescription}
        </p>
        {email ? (
          <a
            className={`inline-flex rounded-md border px-5 py-3 font-semibold ${siteConfig.theme.accentBorderClass} ${tw.TEXT_TERTIARY}`}
            href={`mailto:${email}`}
          >
            {email}
          </a>
        ) : (
          <p className={tw.TEXT_SECONDARY}>Contact details are not published in this profile.</p>
        )}
      </div>
    </main>
  );
}
