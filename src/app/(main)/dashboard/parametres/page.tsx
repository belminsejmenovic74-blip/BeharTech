"use client";

import { useMemo, useRef, useState } from "react";

import Link from "next/link";

import { AlertTriangle, Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/behar/page-shell";
import { Panel, PrimaryButton, SecondaryButton } from "@/components/behar/primitives";
import { useBeharStore, type WorkshopSettings } from "@/lib/behar-store";

export default function SettingsPage() {
  const store = useBeharStore();
  const importRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<WorkshopSettings>(store.workshopSettings);

  const dataSnapshot = useMemo(
    () => ({
      workshopSettings: store.workshopSettings,
      workshopInfo: store.workshopInfo,
      onboardingCompleted: store.onboardingCompleted,
      configuredAt: store.configuredAt,
      updatedAt: store.updatedAt,
      customers: store.customers,
      repairs: store.repairs,
      quotes: store.quotes,
      invoices: store.invoices,
      payments: store.payments,
      appointments: store.appointments,
      stockItems: store.stockItems,
      documents: store.documents,
      messageLogs: store.messageLogs,
      selectedCustomerId: store.selectedCustomerId,
      selectedRepairId: store.selectedRepairId,
      selectedQuoteId: store.selectedQuoteId,
      selectedInvoiceId: store.selectedInvoiceId,
      selectedPaymentId: store.selectedPaymentId,
      selectedAppointmentId: store.selectedAppointmentId,
      selectedStockItemId: store.selectedStockItemId,
      selectedDocumentId: store.selectedDocumentId,
    }),
    [store],
  );

  const setField = <K extends keyof WorkshopSettings>(key: K, value: WorkshopSettings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const saveAtelier = () => {
    if (!String(draft.name || "").trim()) {
      toast.error("Le nom de l’atelier est obligatoire.");
      return;
    }
    if (!String(draft.phone || "").trim() && !String(draft.email || "").trim()) {
      toast.error("Ajoutez au moins un téléphone ou un email.");
      return;
    }
    if (!String(draft.city || "").trim()) {
      toast.error("La ville est obligatoire.");
      return;
    }
    const city = String(draft.city || "").trim();
    const postalCode = String(draft.postalCode || "").trim();
    store.saveWorkshopSettings({
      ...draft,
      postalCity: [postalCode, city].filter(Boolean).join(" ").trim(),
      isMicroEnterprise: !draft.vatApplicable,
      tvaMention: draft.vatApplicable ? "" : draft.tvaMention,
    });
    toast.success("Atelier mis à jour.");
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      state: dataSnapshot,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `behar-tech-donnees-locales-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const importedState = parsed.state ?? parsed;
      localStorage.setItem("behar-tech-local-demo-v3", JSON.stringify({ state: importedState, version: 1 }));
      toast.success("Import terminé. Rechargement...");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible.");
    }
  };

  return (
    <PageShell title="Paramètres" subtitle="Atelier et sauvegarde locale">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[#1A1916] text-xl">Atelier</h2>
                <p className="mt-1 text-[#6B6B6B] text-sm">
                  Source unique utilisée dans les devis, factures, reçus et documents.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  className="text-[#2A9D8F] text-sm hover:underline"
                  href={"/dashboard/parametres/appareils" as any}
                >
                  Catalogue appareils
                </Link>
                <Link className="text-[#2A9D8F] text-sm hover:underline" href="/dashboard/parametres/catalogue">
                  Prix
                </Link>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Nom atelier" value={draft.name || ""} onChange={(v) => setField("name", v)} />
              <Input label="Logo URL / data URI" value={draft.logoUrl || ""} onChange={(v) => setField("logoUrl", v)} />
              <Input label="Téléphone" value={draft.phone || ""} onChange={(v) => setField("phone", v)} />
              <Input label="Email" value={draft.email || ""} onChange={(v) => setField("email", v)} />
              <Input label="Site web" value={draft.website || ""} onChange={(v) => setField("website", v)} />
              <Input label="Adresse" value={draft.address || ""} onChange={(v) => setField("address", v)} />
              <Input label="Code postal" value={draft.postalCode || ""} onChange={(v) => setField("postalCode", v)} />
              <Input label="Ville" value={draft.city || ""} onChange={(v) => setField("city", v)} />
              <Input label="Pays" value={draft.country || ""} onChange={(v) => setField("country", v)} />
              <Input label="SIRET" value={draft.siret || ""} onChange={(v) => setField("siret", v)} />
              <Input label="TVA intra" value={draft.tvaNumber || ""} onChange={(v) => setField("tvaNumber", v)} />
              <Input label="Mention TVA" value={draft.tvaMention || ""} onChange={(v) => setField("tvaMention", v)} />
              <Input
                label="Préfixe réparation"
                value={draft.repairPrefix || "REP"}
                onChange={(v) => setField("repairPrefix", v)}
              />
              <Input
                label="Préfixe devis"
                value={draft.quotePrefix || "DEV"}
                onChange={(v) => setField("quotePrefix", v)}
              />
              <Input
                label="Préfixe facture"
                value={draft.invoicePrefix || "FAC"}
                onChange={(v) => setField("invoicePrefix", v)}
              />
              <Input
                label="Préfixe reçu"
                value={draft.receiptPrefix || "REC"}
                onChange={(v) => setField("receiptPrefix", v)}
              />
              <Input
                label="Prochain n° réparation"
                value={String(draft.nextRepairNumber || 1)}
                onChange={(v) => setField("nextRepairNumber", Number(v) || 1)}
              />
              <Input
                label="Prochain n° devis"
                value={String(draft.nextQuoteNumber || 1)}
                onChange={(v) => setField("nextQuoteNumber", Number(v) || 1)}
              />
              <Input
                label="Prochain n° facture"
                value={String(draft.nextInvoiceNumber || 1)}
                onChange={(v) => setField("nextInvoiceNumber", Number(v) || 1)}
              />
              <Input
                label="Prochain n° reçu"
                value={String(draft.nextReceiptNumber || 1)}
                onChange={(v) => setField("nextReceiptNumber", Number(v) || 1)}
              />
              <Text
                label="Conditions devis"
                value={draft.quoteTerms || ""}
                onChange={(v) => setField("quoteTerms", v)}
              />
              <Text
                label="Conditions facture"
                value={draft.invoiceTerms || ""}
                onChange={(v) => setField("invoiceTerms", v)}
              />
              <Text
                label="Pied de page document"
                value={draft.documentFooter || ""}
                onChange={(v) => setField("documentFooter", v)}
              />
              <Input
                label="Horaires affichés"
                value={draft.businessHours || ""}
                onChange={(v) => setField("businessHours", v)}
              />
            </div>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(draft.vatApplicable)}
                  onChange={(e) => setField("vatApplicable", e.target.checked)}
                />
                TVA applicable
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(draft.allowCounterClient)}
                  onChange={(e) => setField("allowCounterClient", e.target.checked)}
                />
                Client comptoir actif
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <PrimaryButton onClick={saveAtelier}>Enregistrer</PrimaryButton>
              <SecondaryButton onClick={() => setDraft(store.workshopSettings)}>Annuler</SecondaryButton>
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <h2 className="font-semibold text-[#1A1916] text-lg">Sauvegarde</h2>
          <p className="mt-1 text-[#6B6B6B] text-sm">Exporter, importer et réinitialiser les données locales.</p>
          <div className="mt-4 grid gap-2">
            <PrimaryButton onClick={exportJson}>
              <Download className="size-4" /> Exporter les données locales
            </PrimaryButton>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
            <SecondaryButton onClick={() => importRef.current?.click()}>
              <Upload className="size-4" /> Importer les données locales
            </SecondaryButton>
            <SecondaryButton
              className="mt-4 border-[#F1D4D0] text-[#B42318] hover:bg-[#FFF7F6]"
              onClick={() => {
                if (window.confirm("Cette action efface les données locales de cet atelier. Elle est irréversible.")) {
                  store.resetDemo();
                  store.setOnboardingCompleted(false);
                  toast.success("Données locales réinitialisées.");
                }
              }}
            >
              <AlertTriangle className="size-4" />
              Réinitialiser les données locales
            </SecondaryButton>
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}

function Input({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  return (
    <label className="text-[#6B6B6B] text-sm">
      {label}
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Text({ label, value, onChange }: Readonly<{ label: string; value: string; onChange: (v: string) => void }>) {
  return (
    <label className="text-[#6B6B6B] text-sm">
      {label}
      <textarea className={areaCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const inputCls =
  "mt-1 h-10 w-full rounded-[12px] border border-[#E7E4DC] bg-white px-3 text-[#1A1916] outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10";
const areaCls =
  "mt-1 min-h-[80px] w-full rounded-[12px] border border-[#E7E4DC] bg-white px-3 py-2 text-[#1A1916] outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10";
