import { FaPlus } from "react-icons/fa";
import { ReactNode } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export function PopoverList({ children }: { children: ReactNode }) {
   
  return (
    <Popover className="relative">
      <PopoverButton className={`rounded-full p-2 ${tw.BTN_PRIMARY}`}>
        <FaPlus />
      </PopoverButton>
      <PopoverPanel
        anchor="bottom"
        className={`divide-y divide-white/5 rounded-xl ${tw.BG_PRIMARY} ${tw.TEXT_PRIMARY} min-w-56 text-sm/6 drop-shadow-lg`}
      >
        {children}
      </PopoverPanel>
    </Popover>
  );
}

export function PopoverListItemButton({ text, onClick }: { text: string; onClick?: () => void }) {
   

  return (
    <div className="p-3">
      <button className="block w-full rounded-lg px-3 py-2 transition hover:bg-white/5">
        <p className={`font-semibold ${tw.TEXT_PRIMARY} w-full text-center`} onClick={onClick}>
          {text}
        </p>
      </button>
    </div>
  );
}
