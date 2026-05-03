import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/behar/dashboard-sidebar";
import { InstallationGate } from "@/components/behar/installation-gate";
import { MobileBottomNav } from "@/components/behar/mobile-bottom-nav";
import { PrintProvider } from "@/components/behar/print-provider";
import { Topbar } from "@/components/behar/topbar";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <PrintProvider>
      <div className="min-h-svh bg-[#FAFAF8] text-[#1A1916]">
        <DashboardSidebar />
        <div className="flex min-h-svh flex-col md:pl-[230px]">
          <div className="hidden md:block">
            <Topbar />
          </div>
          <main className="flex-1">{children}</main>
        </div>
        <MobileBottomNav />
        <InstallationGate />
      </div>
    </PrintProvider>
  );
}
