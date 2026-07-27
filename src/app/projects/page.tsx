"use client";
import { ProjectListing } from "@/components/projects/ProjectListing";
import Projects from "@/example-data/Projects";
import { useRouter } from "next/navigation";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export default function Portfolio() {
   
  const router = useRouter();

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-around ${tw.BG_PRIMARY} px-8 py-14 md:px-24`}
    >
      <h1 className={`mb-10 text-center text-4xl font-bold ${tw.TEXT_SECONDARY}`}>Projects</h1>
      <div className="max-w-screen-lg space-y-6">
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2">
          {Projects.map((project) => (
            <ProjectListing
              key={"project-listing-" + project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              project={project}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
