import { exampleProfile } from "@resume-agent/profile";
import type { ICarouselImage } from "./Projects";

export interface IArticle {
  id: string;
  title: string;
  articleText: string;
  articleDescription?: string;
  imageSrc: string;
  detailImages?: ICarouselImage[];
  createdDate: Date;
}

const Articles: IArticle[] = exampleProfile.articles.map((article) => ({
  id: article.id,
  title: article.title,
  articleText: encodeURIComponent(article.body),
  articleDescription: article.description,
  imageSrc: "/images/article-placeholder.svg",
  detailImages: [{ src: "/images/article-placeholder.svg", alt: `${article.title} placeholder` }],
  createdDate: new Date(article.publishedAt ?? "2025-01-01"),
}));

export default Articles;
