import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";
import { RESUME } from "@/example-data/Resume";

function renderHighlight(highlight: string) {
  return highlight.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${highlight}-bold-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <span key={`${highlight}-text-${index}`}>{part}</span>;
  });
}

export default function ResumeTimeline() {
  return (
    <section className={`${tw.BG_PRIMARY}`}>
      <div className="container mx-auto max-w-5xl py-5 md:px-4">
        <div className="mx-4 grid gap-4 sm:grid-cols-12">
          <div className="col-span-12 sm:col-span-3">
            <div className="mb-14 text-center before:mx-auto before:mb-5 before:block before:h-3 before:w-24 before:rounded-md sm:text-left sm:before:mx-0 before:dark:bg-violet-600">
              <h3 className="text-3xl font-semibold">{RESUME.name}</h3>
              <span className={`text-sm font-bold uppercase tracking-wider ${tw.TEXT_SECONDARY}`}>{RESUME.title}</span>
            </div>
          </div>
          <div className="relative col-span-12 space-y-6 sm:col-span-9 md:px-4">
            <div className="relative col-span-12 space-y-12 sm:col-span-8 sm:space-y-8 sm:before:absolute sm:before:-left-3 sm:before:bottom-0 sm:before:top-2 sm:before:w-0.5 md:px-4 before:dark:bg-gray-300">
              {RESUME.experience.map(({ company, title, period, highlights }) => (
                <div
                  key={`${company}-${title}-${period}`}
                  className="flex flex-col sm:relative sm:before:absolute sm:before:left-[-35px] sm:before:top-2 sm:before:z-[1] sm:before:h-4 sm:before:w-4 sm:before:rounded-full before:dark:bg-violet-600"
                >
                  <h3 className="text-xl font-semibold tracking-wide">
                    {company} - {title}
                  </h3>
                  <time className={`text-xs uppercase tracking-wide ${tw.TEXT_SECONDARY}`}>{period}</time>
                  <ul className="mt-3 list-disc">
                    {highlights.map((highlight) => (
                      <li key={highlight} className="mt-3">
                        {renderHighlight(highlight)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
