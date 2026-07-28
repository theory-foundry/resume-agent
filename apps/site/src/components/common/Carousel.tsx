import Image from "next/image";

export interface ICarouselImage {
  src: string;
}
export interface ICarouselProps {
  images?: ICarouselImage[] | undefined;
}
export default function Carousel(props: ICarouselProps) {
  return (
    <div className="relative flex w-full items-center justify-center dark:text-gray-900">
      <button
        aria-label="Slide back"
        type="button"
        className="absolute left-0 z-30 ml-10 rounded-full bg-opacity-50 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-50 focus:dark:bg-gray-600 focus:dark:ring-gray-600"
      >
        <svg
          width="8"
          height="14"
          fill="none"
          viewBox="0 0 8 14"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
        >
          <path
            d="M7 1L1 7L7 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </button>
      <div className="mx-auto flex h-full w-full items-center justify-start gap-6 overflow-auto py-4 lg:gap-8">
        {props?.images?.length &&
          props.images.map((image, i) => (
            <div key={"carousel-image-" + i} className="relative flex w-full flex-shrink-0 sm:w-auto">
              <div className="relative aspect-square h-96">
                <Image
                  fill
                  className="object-cover object-center dark:bg-gray-500"
                  src={image.src}
                  alt="Image 1"
                />
              </div>
            </div>
          ))}
      </div>
      <button
        aria-label="Slide forward"
        id="next"
        className="absolute right-0 z-30 mr-10 rounded-full bg-opacity-50 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-50 focus:dark:bg-gray-600 focus:dark:ring-gray-600"
      >
        <svg
          width="8"
          height="14"
          viewBox="0 0 8 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
        >
          <path
            d="M1 1L7 7L1 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </button>
    </div>
  );
}
