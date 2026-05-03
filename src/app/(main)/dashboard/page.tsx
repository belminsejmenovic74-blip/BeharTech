"use client";

import { Bell, CalendarDays, MoreHorizontal } from "lucide-react";

import Link from "next/link";
import { DashboardPremium } from "@/components/behar/dashboard-premium";
import { PageShell } from "@/components/behar/page-shell";
import { DeviceThumb, Panel, PrimaryButton, StatusBadge } from "@/components/behar/primitives";
import { formatEuro, useBeharStore } from "@/lib/behar-store";

export default function Page() {
  return (
    <PageShell
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre activité en temps réel."
      actions={
        <div className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#E7E4DC] bg-white px-3.5 font-medium text-[#1A1916] text-sm">
          <CalendarDays className="size-4 text-[#6B6B6B]" />
          {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      }
    >
      <div className="md:hidden">
        <MobileDashboard />
      </div>
      <div className="hidden md:block">
        <DashboardPremium />
      </div>
    </PageShell>
  );
}

function MobileDashboard() {
  const store = useBeharStore();
  const repairsInProgress = store.repairs.filter(
    (r) => r.status !== "Prêt" && r.status !== "Restitué" && r.status !== "Annulé",
  ).length;
  const monthRevenue = store.payments.filter((p) => p.status === "Payé").reduce((sum, p) => sum + p.amount, 0);
  const today = new Date().toLocaleDateString("fr-FR");
  const todaysAppointments = store.appointments.filter((a) => a.date === today || a.date === "Aujourd'hui").length;

  const featured = store.repairs.find((r) => r.status === "Préparation / Réparation") ?? store.repairs[0];
  const featuredCustomer = featured ? store.customers.find((c) => c.id === featured.customerId) : undefined;
  const pendingInvoice = store.invoices.find((i) => i.status !== "Payée" && i.status !== "Annulée");
  const pendingTotal = pendingInvoice ? pendingInvoice.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) : 0;

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-3xl text-[#1A1916]">Aujourd'hui</h2>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Réparations en cours", String(repairsInProgress), "/dashboard/reparations"],
          ["CA encaissé", formatEuro(monthRevenue), "/dashboard/paiements"],
          ["RDV du jour", String(todaysAppointments), "/dashboard/rendez-vous"],
        ].map(([label, value, href]) => (
          <Link href={href} key={label} className="block transition active:scale-95">
            <Panel className="p-3">
              <p className="text-[#6B6B6B] text-xs">{label}</p>
              <p className="mt-3 font-semibold text-2xl text-[#1A1916]">{value}</p>
            </Panel>
          </Link>
        ))}
      </div>

      {featured && (
        <Link href={`/dashboard/reparations?selectedId=${featured.id}`} className="block transition active:scale-98">
          <Panel className="p-4">
            <div className="flex items-start gap-4">
              <DeviceThumb />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1A1916] text-lg">{featuredCustomer?.name ?? "Client"}</p>
                    <p className="text-[#1A1916]">{featured.device}</p>
                    <p className="text-[#6B6B6B]">{featured.issue}</p>
                  </div>
                  <MoreHorizontal className="size-5 text-[#6B6B6B]" />
                </div>
                <div className="mt-4">
                  <StatusBadge status={featured.status} />
                </div>
              </div>
            </div>
          </Panel>
        </Link>
      )}

      {pendingInvoice && (
        <Link href={`/dashboard/factures?id=${pendingInvoice.id}`} className="block transition active:scale-98">
          <Panel className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-[#6B6B6B] text-sm">Montant à encaisser</p>
              <p className="font-semibold text-2xl text-[#1A1916]">{formatEuro(pendingTotal)}</p>
            </div>
            <PrimaryButton className="h-12 px-8">Encaisser</PrimaryButton>
          </Panel>
        </Link>
      )}

      {featured && featuredCustomer && (
        <Panel className="flex items-center gap-3 p-4">
          <div className="grid size-11 place-items-center rounded-xl bg-[#E8F7F3] text-[#2A9D8F]">
            <Bell className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-[#1A1916]">Notification client</p>
            <p className="text-[#1A1916] text-sm">
              Bonjour {featuredCustomer.name}, votre appareil est{" "}
              {featured.status === "Prêt" ? "prêt" : "en cours de traitement"}.
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}
