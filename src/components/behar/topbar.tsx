"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { Bell, FileText, Menu, Plus, Search, X } from "lucide-react";

import { PrimaryButton } from "@/components/behar/primitives";
import { useBeharStore } from "@/lib/behar-store";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  hint: string;
  href: string;
  tone: "info" | "warn" | "ok";
};

export function Topbar({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const invoices = useBeharStore((s) => s.invoices);
  const repairs = useBeharStore((s) => s.repairs);
  const quotes = useBeharStore((s) => s.quotes);
  const appointments = useBeharStore((s) => s.appointments);
  const customers = useBeharStore((s) => s.customers);

  const notifications = useMemo<NotificationItem[]>(() => {
    const out: NotificationItem[] = [];

    for (const inv of invoices) {
      if (inv.status !== "Payée" && inv.status !== "Annulée") {
        const customer = customers.find((c) => c.id === inv.customerId);
        out.push({
          id: `inv-${inv.id}`,
          title: `Facture ${inv.number} non payée`,
          hint: customer?.name ?? "Client",
          href: "/dashboard/factures",
          tone: "warn",
        });
      }
    }
    for (const repair of repairs) {
      if (repair.status === "Prêt") {
        const customer = customers.find((c) => c.id === repair.customerId);
        out.push({
          id: `rep-${repair.id}`,
          title: `Réparation ${repair.number} prête`,
          hint: `${customer?.name ?? "Client"} · ${repair.brandName ?? ""} ${repair.deviceModel ?? repair.model ?? ""}`.trim(),
          href: "/dashboard/reparations",
          tone: "ok",
        });
      }
    }
    for (const quote of quotes) {
      if (quote.status === "Accepté") {
        out.push({
          id: `quo-${quote.id}`,
          title: `Devis ${quote.number} accepté`,
          hint: "À facturer",
          href: "/dashboard/devis",
          tone: "info",
        });
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    for (const apt of appointments) {
      if (apt.date === today) {
        out.push({
          id: `apt-${apt.id}`,
          title: `Rendez-vous aujourd'hui à ${apt.time}`,
          hint: apt.issue || apt.device,
          href: "/dashboard/rendez-vous",
          tone: "info",
        });
      }
    }
    return out.slice(0, 12);
  }, [invoices, repairs, quotes, appointments, customers]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const out: Array<{ id: string; title: string; subtitle: string; href: string; type: string }> = [];

    // Repairs
    for (const r of repairs) {
      if (r.number.toLowerCase().includes(q) || r.device.toLowerCase().includes(q) || r.issue.toLowerCase().includes(q)) {
        out.push({
          id: r.id,
          title: `Réparation ${r.number}`,
          subtitle: `${r.device} — ${r.issue}`,
          href: `/dashboard/reparations?selectedId=${r.id}`,
          type: "repair",
        });
      }
    }

    // Customers
    for (const c of customers) {
      if (c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)) {
        out.push({
          id: c.id,
          title: c.name,
          subtitle: "Fiche Client",
          href: `/dashboard/clients?id=${c.id}`,
          type: "customer",
        });
      }
    }

    // Invoices
    for (const i of invoices) {
      if (i.number.toLowerCase().includes(q)) {
        out.push({
          id: i.id,
          title: `Facture ${i.number}`,
          subtitle: "Document financier",
          href: `/dashboard/factures?id=${i.id}`,
          type: "invoice",
        });
      }
    }

    return out.slice(0, 8);
  }, [searchQuery, repairs, customers, invoices]);

  const hasUnread = notifications.length > 0;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-[64px] items-center gap-3 border-[#E7E4DC] border-b bg-white/85 px-4 backdrop-blur-xl md:px-6">
      <button
        type="button"
        aria-label="Menu"
        onClick={onMenuClick}
        className="grid size-10 place-items-center rounded-[10px] text-[#6B6B6B] transition hover:bg-[#F1F1EF] hover:text-[#1A1916] md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <label className="relative max-w-[440px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[16px] -translate-y-1/2 text-[#8A8984]" />
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Rechercher (client, réparation, facture…)"
          className="h-10 w-full rounded-[12px] border border-[#E7E4DC] bg-white pr-14 pl-10 text-[#1A1916] text-sm outline-none placeholder:text-[#8A8984] focus:border-[#2A9D8F]/55 focus:ring-4 focus:ring-[#2A9D8F]/10"
        />
        <kbd className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 hidden h-6 items-center gap-0.5 rounded-md border border-[#E7E4DC] bg-[#FAFAF8] px-1.5 font-medium text-[#6B6B6B] text-[10px] sm:flex">
          ⌘ K
        </kbd>

        {searchOpen && searchQuery.length >= 2 && (
          <>
            <button
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setSearchOpen(false)}
              type="button"
            />
            <div className="absolute top-12 left-0 z-20 w-full overflow-hidden rounded-[14px] border border-[#E7E4DC] bg-white shadow-[0_20px_44px_rgba(26,25,22,0.12)]">
              {searchResults.length === 0 ? (
                <p className="px-4 py-6 text-center text-[#6B6B6B] text-sm">
                  Aucun résultat pour "{searchQuery}"
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {searchResults.map((res) => (
                    <Link
                      key={res.id}
                      href={res.href}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        if (res.type === "repair") useBeharStore.getState().setSelected("repair", res.id);
                        if (res.type === "customer") useBeharStore.getState().setSelected("customer", res.id);
                        if (res.type === "invoice") useBeharStore.getState().setSelected("invoice", res.id);
                      }}
                      className="flex items-center gap-3 border-[#EFEDE6] border-b px-4 py-3 transition hover:bg-[#FAFAF8] last:border-0"
                    >
                      <div className="grid size-8 place-items-center rounded-lg bg-[#FAFAF8] text-[#6B6B6B]">
                        <Search className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block font-medium text-[#1A1916] text-sm">{res.title}</span>
                        <span className="block truncate text-[#6B6B6B] text-xs">{res.subtitle}</span>
                      </div>
                      <span className="rounded-md bg-[#F1F1EF] px-1.5 py-0.5 font-medium text-[#8A8984] text-[10px] uppercase">
                        {res.type}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </label>

      <div className="ml-auto flex items-center gap-2">
        <Link className="hidden lg:block" href="/dashboard/reparations?create=1" prefetch={false}>
          <PrimaryButton className="h-10 gap-2 px-4 shadow-[0_8px_20px_rgba(42,157,143,0.18)]">
            <Plus className="size-4" />
            Nouvelle réparation
          </PrimaryButton>
        </Link>
        <div className="relative">
          <button
            aria-label="Notifications"
            className={cn(
              "relative grid size-10 place-items-center rounded-[10px] text-[#6B6B6B] transition hover:bg-[#F1F1EF] hover:text-[#1A1916]",
              notifOpen && "bg-[#F1F1EF] text-[#1A1916]",
            )}
            onClick={() => setNotifOpen((v) => !v)}
            type="button"
          >
            <Bell className="size-[18px]" />
            {hasUnread && <span className="absolute top-2 right-2 size-2 rounded-full bg-[#2A9D8F]" />}
          </button>
          {notifOpen && (
            <>
              <button
                aria-label="Fermer"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setNotifOpen(false)}
                type="button"
              />
              <div className="absolute top-12 right-0 z-20 w-[340px] overflow-hidden rounded-[14px] border border-[#E7E4DC] bg-white shadow-[0_20px_44px_rgba(26,25,22,0.12)]">
                <div className="flex items-center justify-between border-[#E7E4DC] border-b px-4 py-3">
                  <span className="font-semibold text-[#1A1916] text-sm">Notifications</span>
                  <button
                    aria-label="Fermer"
                    className="grid size-7 place-items-center rounded-full text-[#6B6B6B] hover:bg-[#FAFAF8]"
                    onClick={() => setNotifOpen(false)}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-[#6B6B6B] text-sm">
                      Aucune notification pour le moment.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <Link
                        className="flex items-start gap-3 border-[#EFEDE6] border-b px-4 py-3 transition hover:bg-[#FAFAF8]"
                        href={notif.href}
                        key={notif.id}
                        onClick={() => setNotifOpen(false)}
                        prefetch={false}
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            notif.tone === "warn" && "bg-[#E2A336]",
                            notif.tone === "ok" && "bg-[#2A9D8F]",
                            notif.tone === "info" && "bg-[#6B6B6B]",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-[#1A1916] text-sm">{notif.title}</span>
                          <span className="block truncate text-[#6B6B6B] text-xs">{notif.hint}</span>
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Documents"
            onClick={() => setDocOpen((v) => !v)}
            className={cn(
              "flex h-10 items-center gap-1 rounded-[10px] px-2 text-[#6B6B6B] transition hover:bg-[#F1F1EF] hover:text-[#1A1916]",
              docOpen && "bg-[#F1F1EF] text-[#1A1916]",
            )}
          >
            <FileText className="size-[18px]" />
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 4l3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {docOpen && (
            <>
              <button
                type="button"
                aria-label="Fermer"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setDocOpen(false)}
              />
              <div className="absolute top-12 right-0 z-20 w-[220px] rounded-[14px] border border-[#E7E4DC] bg-white p-1 shadow-[0_20px_40px_rgba(26,25,22,0.10)]">
                <Link
                  href="/dashboard/documents"
                  prefetch={false}
                  onClick={() => setDocOpen(false)}
                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[#1A1916] text-sm hover:bg-[#FAFAF8]"
                >
                  <FileText className="size-4 text-[#6B6B6B]" /> Tous les documents
                </Link>
                <Link
                  href="/dashboard/devis"
                  prefetch={false}
                  onClick={() => setDocOpen(false)}
                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[#1A1916] text-sm hover:bg-[#FAFAF8]"
                >
                  <FileText className="size-4 text-[#6B6B6B]" /> Devis
                </Link>
                <Link
                  href="/dashboard/factures"
                  prefetch={false}
                  onClick={() => setDocOpen(false)}
                  className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[#1A1916] text-sm hover:bg-[#FAFAF8]"
                >
                  <FileText className="size-4 text-[#6B6B6B]" /> Factures
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function CloseButton({ onClick, className }: Readonly<{ onClick?: () => void; className?: string }>) {
  return (
    <button
      type="button"
      aria-label="Fermer"
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-[10px] text-[#6B6B6B] transition hover:bg-[#F1F1EF] hover:text-[#1A1916]",
        className,
      )}
    >
      <X className="size-5" />
    </button>
  );
}
