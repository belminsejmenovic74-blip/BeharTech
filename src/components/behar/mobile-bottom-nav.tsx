"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CreditCard, Home, MoreHorizontal, Users, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";

const mobileItems = [
  { label: "Accueil", href: "/dashboard", icon: Home },
  { label: "Réparations", href: "/dashboard/reparations", icon: Wrench },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Paiements", href: "/dashboard/paiements", icon: CreditCard },
  { label: "Plus", href: "/dashboard/parametres", icon: MoreHorizontal },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-black/[0.07] border-t bg-white/92 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 font-medium text-[#6B6B6B] text-[11px]",
                active && "text-[#159A8D]",
              )}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <Icon className="size-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
