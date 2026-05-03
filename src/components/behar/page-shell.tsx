import type { ReactNode } from "react";

import Image from "next/image";

import { Bell } from "lucide-react";

import { SearchBox } from "@/components/behar/primitives";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  subtitle,
  searchPlaceholder = "Rechercher...",
  searchValue,
  onSearchChange,
  actions,
  toolbar,
  children,
  fitScreen,
}: Readonly<{
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  fitScreen?: boolean;
}>) {
  const hasMobileControls = (toolbar ?? actions) != null;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1500px] px-4 py-5 pb-28 md:px-7 md:py-7 md:pb-8",
        fitScreen && "md:flex md:h-[calc(100svh-64px)] md:min-h-0 md:flex-col md:overflow-hidden md:py-6 md:pb-6",
      )}
    >
      <header className={cn("mb-6 shrink-0", fitScreen && "md:mb-4")}>
        <div className="mb-5 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <Image
              alt="Behar Tech"
              className="size-12 rounded-2xl border border-black/[0.06] bg-white object-cover shadow-[0_10px_30px_rgba(26,25,22,0.08)]"
              height={48}
              src="/assets/logos/app-icon.jpeg"
              width={48}
            />
            <span className="font-semibold text-[#1A1916] text-lg">Behar Tech</span>
          </div>
          <button
            aria-label="Notifications"
            className="relative grid size-11 place-items-center rounded-full border border-[#E7E4DC] bg-white text-[#1A1916] shadow-[0_8px_24px_rgba(26,25,22,0.04)]"
            type="button"
          >
            <Bell className="size-5" />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#2A9D8F]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-semibold text-[#1A1916] text-[30px] leading-tight tracking-tight md:text-[34px]">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-[#6B6B6B] text-sm md:text-[14px]">{subtitle}</p>}
          </div>
          {actions && <div className="hidden items-center gap-2 md:flex">{actions}</div>}
        </div>

        {hasMobileControls && (
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            <SearchBox
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
            />
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            {toolbar && <div className="flex flex-wrap gap-2">{toolbar}</div>}
          </div>
        )}
        {toolbar && <div className="mt-5 hidden flex-wrap gap-3 md:flex">{toolbar}</div>}
      </header>

      <div className={cn(fitScreen && "md:min-h-0 md:flex-1")}>{children}</div>
    </div>
  );
}
