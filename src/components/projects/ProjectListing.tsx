import Image from "next/image";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export interface IProjectListingProps {
  project: {
    title?: string;
    createdDate?: Date;
    shortDescription?: string;
    imageSrc?: string;
  };
  onClick?: () => void;
}

export function ProjectListing(props: IProjectListingProps) {
  return (
    <div className={`cursor-pointer rounded-lg p-4 hover:bg-white/10 md:p-8`} onClick={() => props?.onClick?.()}>
      <div
        rel="noopener noreferrer"
        aria-label="Te nulla oportere reprimique his dolorum"
        className="flex flex-col dark:bg-gray-50"
      >
        <div className="relative h-52 w-full">
          <Image alt="" fill className="object-cover dark:bg-gray-500" src={props.project?.imageSrc ?? ""} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <a
          rel="noopener noreferrer"
          aria-label="Te nulla oportere reprimique his dolorum"
          className="flex flex-col dark:bg-gray-50"
        ></a>
        <a
          rel="noopener noreferrer"
          href="#"
          className={`text-lg uppercase tracking-wider hover:underline ${tw.TEXT_TERTIARY}`}
        >
          {props.project?.title}
        </a>
        <h3 className="text-md flex-1 py-2 font-semibold leading-snug">{props.project?.shortDescription}</h3>
        <div className="flex flex-wrap justify-between space-x-2 pt-3 text-xs dark:text-gray-600">
          <span>{props.project?.createdDate?.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
