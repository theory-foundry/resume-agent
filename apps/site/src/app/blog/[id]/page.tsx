"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import Carousel from "@/components/common/Carousel";
import Articles from "@/example-data/Articles";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export default function BlogArticle() {
  const params = useParams<{ id: string }>();
  const article = Object.values(Articles).find((a) => a.id === params.id);

  return (
    <main className={`flex min-h-screen flex-col items-center justify-around ${tw.BG_PRIMARY} p-8 py-10 md:px-24`}>
      <Link href="/blog" className={`cursor-pointer self-start text-lg ${tw.TEXT_TERTIARY}`}>
        &lt; Back
      </Link>
      <div className="mt-5 h-72 w-full">
        {article?.detailImages && <Carousel images={article?.detailImages} />}
        {!article?.detailImages?.length && article?.imageSrc && (
          <div className="relative h-72 w-full">
            <Image src={article.imageSrc} alt="" fill className="object-contain" />
          </div>
        )}
      </div>
      <div className="mt-10 max-w-screen-md">
        <h2 className={`${tw.TEXT_TERTIARY} mb-5 text-2xl font-bold`}>{article?.title}</h2>
        <div className={`${tw.TEXT_PRIMARY} whitespace-pre-line leading-loose`}>
          <Markdown remarkPlugins={[remarkGfm]} className="markdown">
            {decodeURIComponent(article?.articleText ?? "")}
          </Markdown>
        </div>
      </div>
    </main>
  );
}
