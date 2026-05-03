"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  ChevronsUpDown,
  CreditCard,
  FileStack,
  FileText,
  Home,
  Package,
  Receipt,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

import { useBeharStore } from "@/lib/behar-store";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tableau de bord", href: "/dashboard", icon: Home },
  { label: "Réparations", href: "/dashboard/reparations", icon: Wrench },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Devis", href: "/dashboard/devis", icon: FileText },
  { label: "Factures", href: "/dashboard/factures", icon: Receipt },
  { label: "Paiements", href: "/dashboard/paiements", icon: CreditCard },
  { label: "Rendez-vous", href: "/dashboard/rendez-vous", icon: CalendarDays },
  { label: "Stock", href: "/dashboard/stock", icon: Package },
  { label: "Documents", href: "/dashboard/documents", icon: FileStack },
  { label: "Paramètres", href: "/dashboard/parametres", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const workshopName = useBeharStore((s) => s.workshopSettings.name || s.workshopInfo.name);
  const workshopInitials = workshopName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[230px] border-[#E7E4DC] border-r bg-white px-3.5 py-6 md:flex md:flex-col">
      <Link
        className="flex h-10 items-baseline gap-1.5 px-2 font-semibold text-[#1A1916] tracking-tight"
        href="/dashboard"
        prefetch={false}
      >
        <span className="text-[15px] tracking-[-0.02em]">BEHAR</span>
        <span className="-mt-px text-[10px] text-[#2A9D8F] opacity-95">●</span>
        <span className="text-[15px] tracking-[-0.02em]">TECH</span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              className={cn(
                "flex h-[42px] items-center gap-3 rounded-[12px] px-3 font-medium text-[#6B6B6B] text-[13.5px] transition",
                "hover:bg-[#F6F7F4] hover:text-[#1A1916]",
                active && "bg-[#E7F5F1] font-semibold text-[#167B70]",
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <Icon className={cn("size-[18px]", active && "text-[#2A9D8F]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/dashboard/parametres"
        className="flex items-center gap-3 rounded-[12px] border border-[#E7E4DC] bg-white px-3 py-2.5 text-left transition hover:border-[#2A9D8F]/30 hover:bg-[#FAFAF8]"
      >
        <span className="grid size-9 place-items-center rounded-[9px] bg-[#1A1916] font-semibold text-white text-xs">
          {workshopInitials || "AT"}
        </span>
        <div className="flex-1 leading-tight">
          <div className="font-semibold text-[#1A1916] text-[13px]">{workshopName}</div>
          <div className="text-[#6B6B6B] text-[11px]">Atelier principal</div>
        </div>
        <ChevronsUpDown className="size-4 text-[#6B6B6B]" />
      </Link>
    </aside>
  );
}
