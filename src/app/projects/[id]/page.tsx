"use client";
import Image from "next/image";
import Projects from "@/example-data/Projects";
import { useParams } from "next/navigation";
import Link from "next/link";
import Carousel from "@/components/common/Carousel";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const project = Object.values(Projects).find((p) => p.id === params.id);

  return (
    <main className={`flex min-h-screen flex-col items-center justify-around ${tw.BG_PRIMARY} p-8 py-10 md:px-24`}>
      <Link href="/projects" className={`cursor-pointer self-start text-lg ${tw.TEXT_TERTIARY}`}>
        &lt; Back
      </Link>
      <div className="mt-5">
        {project?.detailImages && <Carousel images={project?.detailImages} />}
        {!project?.detailImages?.length && project?.imageSrc && (
          <div className="relative h-52 w-full">
            <Image src={project.imageSrc} alt="" fill className="object-cover dark:bg-gray-500" />
          </div>
        )}
      </div>
      <div className="max-w-screen-md md:mt-10">
        <h2 className={`${tw.TEXT_TERTIARY} text-2xl font-bold`}>{project?.title}</h2>
        <p className={`mb-4 ${tw.TEXT_SECONDARY}`}>{project?.company}</p>
        <p className={`${tw.TEXT_PRIMARY} whitespace-pre-line leading-loose`}>{project?.description}</p>
      </div>
    </main>
  );
}
