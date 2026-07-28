import { FaPlus } from "react-icons/fa";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export function CirclePlusButton({ onClick }: { onClick: () => void }) {
   

  return (
    <button
      onClick={onClick}
      className={`rounded-full p-2 ${tw.BTN_PRIMARY}`}
    >
      <FaPlus />
    </button>
  );
}
