"use client";

import { cloneElement, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  GripVertical,
  Layers,
  Mail,
  MoreHorizontal,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TableShell,
  tableClassName,
  tableHeadClassName,
} from "@/components/behar/primitives";
import {
  buildInvoiceLinesFromRepair,
  formatEuro,
  formatIsoToDisplay,
  getInvoiceTotal,
  type InvoiceStatus,
  linesForInvoiceFromQuote,
  type PaymentMethod,
  type QuoteLine,
  useBeharStore,
} from "@/lib/behar-store";
import { displayCustomerName, isCounterCustomer } from "@/lib/customer-display";

import { useDocument } from "./print-provider";

const invoiceStatuses: InvoiceStatus[] = ["Brouillon", "Envoyée", "Payée", "Annulée"];
const paymentMethods: PaymentMethod[] = ["Espèces", "Carte", "Virement", "Paiement en ligne simulé"];

function invoicePaymentBadge(invoice: { status: string }): string {
  if (invoice.status === "Payée") return "Payée";
  if (invoice.status === "Annulée") return "Annulée";
  return "Non payée";
}

function safeLineEuro(quantity: number, unitPrice: number, total?: number) {
  if (typeof total === "number" && Number.isFinite(total)) return total;
  const q = Number.isFinite(quantity) ? quantity : 0;
  const u = Number.isFinite(unitPrice) ? unitPrice : 0;
  return q * u;
}

export function InvoicesWorkspace() {
  const router = useRouter();
  const store = useBeharStore();
  const { print, download } = useDocument();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Carte");
  const [paymentNote, setPaymentNote] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linesEditing, setLinesEditing] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceFilterTab, setInvoiceFilterTab] = useState<"all" | "unpaid" | "paid" | "counter" | "month">("all");

  const visibleInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return store.invoices.filter((invoice) => {
      const total = getInvoiceTotal(invoice);
      if (total <= 0) return false;
      const entryCustomer = store.customers.find((entry) => entry.id === invoice.customerId);

      if (invoiceFilterTab === "unpaid" && invoice.status === "Payée") return false;
      if (invoiceFilterTab === "paid" && invoice.status !== "Payée") return false;
      if (invoiceFilterTab === "counter" && !isCounterCustomer(entryCustomer)) return false;
      if (invoiceFilterTab === "month") {
        const head = invoice.date.replace(/\//g, "-").slice(0, 7);
        if (head !== monthPrefix) return false;
      }

      if (!q) return true;
      const needle =
        `${invoice.number} ${displayCustomerName(entryCustomer)} ${invoice.sourceNumber ?? ""}`.toLowerCase();
      return needle.includes(q);
    });
  }, [store.invoices, store.customers, invoiceFilterTab, invoiceSearch]);
  const selected = store.invoices.find((invoice) => invoice.id === store.selectedInvoiceId) ?? store.invoices[0];
  const customer = selected ? store.customers.find((entry) => entry.id === selected.customerId) : undefined;

  useEffect(() => {
    setLinesEditing(false);
  }, [store.selectedInvoiceId]);
  const repair = selected ? store.repairs.find((entry) => entry.id === selected.repairId) : undefined;
  const quote = selected ? store.quotes.find((entry) => entry.id === selected.quoteId) : undefined;
  const invoicePayments = selected ? store.payments.filter((payment) => payment.invoiceId === selected.id) : [];
  const activePayments = invoicePayments.filter((payment) => payment.status === "Payé");
  const invoiceGrandTotal = selected ? getInvoiceTotal(selected) : 0;
  const paidAmountComputed = activePayments.reduce((total, payment) => total + payment.amount, 0);
  const paidAmount =
    selected && selected.status === "Payée"
      ? Math.max(selected.paidAmount ?? 0, paidAmountComputed, invoiceGrandTotal)
      : Math.max(selected?.paidAmount ?? 0, paidAmountComputed);
  const remainingAmount = Math.max(0, invoiceGrandTotal - paidAmount);
  const existingPaidPayment = activePayments[0];
  const isQuoteBasedInvoice = Boolean(selected?.quoteId);
  const paidLocked = Boolean(selected?.status === "Payée");
  const quoteLinesLocked = isQuoteBasedInvoice;
  const lineInputsLocked = paidLocked || quoteLinesLocked || !linesEditing;
  const locked = paidLocked || quoteLinesLocked;
  const fieldClass =
    "h-10 w-full rounded-[12px] border border-[#E7E4DC] bg-white px-3 text-sm text-[#1A1916] outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10 disabled:bg-[#F3F3F0] disabled:text-[#6B6B6B]";
  const updateInvoiceLine = (lineId: string, patch: Partial<QuoteLine>) => {
    if (!selected || lineInputsLocked) return;
    store.updateInvoice(selected.id, {
      lines: selected.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
    });
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <label className="relative block w-full max-w-[360px] min-w-[200px]">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              className="h-11 w-full rounded-[14px] border border-[#E7E4DC] bg-white pr-4 pl-10 text-sm outline-none transition placeholder:text-[#8A8984] focus:border-[#2A9D8F]/55 focus:ring-4 focus:ring-[#2A9D8F]/10"
              placeholder="Facture, client, réparation liée…"
              type="search"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-11 cursor-pointer rounded-[14px] border border-[#E7E4DC] bg-white px-3 text-sm outline-none transition focus:border-[#2A9D8F]"
              onChange={(e) => setInvoiceFilterTab(e.target.value as typeof invoiceFilterTab)}
              value={invoiceFilterTab}
            >
              <option value="all">Toutes</option>
              <option value="unpaid">Non payées</option>
              <option value="paid">Payées</option>
              <option value="counter">Client comptoir</option>
              <option value="month">Ce mois</option>
            </select>
            <PrimaryButton className="h-11 px-5" onClick={() => setCreateModalOpen(true)}>
              <Plus className="size-4" />
              Nouvelle facture
            </PrimaryButton>
          </div>
        </div>

        {createModalOpen && <CreateInvoiceModal onClose={() => setCreateModalOpen(false)} />}

        <TableShell className="min-h-[650px]">
          <table className={tableClassName}>
            <thead className={tableHeadClassName}>
              <tr>
                <th className="px-5 py-3">N°</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Origine</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Montant</th>
                <th className="px-5 py-3">Paiement</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => {
                const entryCustomer = store.customers.find((entry) => entry.id === invoice.customerId);
                const active = invoice.id === selected?.id;
                return (
                  <tr
                    className={`cursor-pointer transition hover:bg-[#FAFAF8] ${
                      active ? "border-[#2A9D8F]/30 border-y bg-[#E7F5F1] text-[#167B70]" : ""
                    }`}
                    key={invoice.id}
                    onClick={() => store.setSelected("invoice", invoice.id)}
                  >
                    <td className="border-[#E7E4DC] border-b px-5 py-4 font-medium">{invoice.number}</td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4">
                      {displayCustomerName(entryCustomer)}
                      {isCounterCustomer(entryCustomer) ? (
                        <span className="mt-1 block w-fit rounded-full bg-[#EEF7FF] px-2 py-0.5 font-semibold text-[#426996] text-[10px]">
                          Comptoir
                        </span>
                      ) : null}
                    </td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[#6B6B6B] text-[10px] font-bold uppercase tracking-tight">
                          {invoice.sourceType === "quote" && "Devis"}
                          {invoice.sourceType === "repair" && "Réparation"}
                          {invoice.sourceType === "client" && "Vente"}
                          {invoice.sourceType === "manual" && "Libre"}
                        </span>
                        <span className="text-[#1A1916] text-xs font-medium">{invoice.sourceNumber ?? "—"}</span>
                      </div>
                    </td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4">{formatIsoToDisplay(invoice.date)}</td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4">
                      <span
                        className={
                          invoice.status === "Payée"
                            ? "rounded-full bg-[#E7F5F1] px-3 py-1 font-semibold text-[#147065] text-xs"
                            : invoice.status === "Annulée"
                              ? "rounded-full bg-[#F1F1EF] px-3 py-1 font-semibold text-[#6B6B6B] text-xs"
                              : "rounded-full bg-[#FCF1DF] px-3 py-1 font-semibold text-[#9A6A17] text-xs"
                        }
                      >
                        {invoicePaymentBadge(invoice)}
                      </span>
                    </td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4 font-semibold">
                      {formatEuro(getInvoiceTotal(invoice))}
                    </td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4 text-[#6B6B6B] text-sm">
                      {invoice.status === "Payée" ? "Payé" : "Non payé"}
                    </td>
                    <td className="border-[#E7E4DC] border-b px-5 py-4">
                      <MoreHorizontal className="size-4" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-[#E7E4DC] border-t px-5 py-4 text-[#6B6B6B] text-sm">
            <span>
              {visibleInvoices.length} affichée{visibleInvoices.length !== 1 ? "s" : ""} ({store.invoices.length} au
              total)
            </span>
            <span className="text-[#B0AEA8] text-xs">Liste mise à jour en direct</span>
          </div>
        </TableShell>
      </div>

      {selected && (
        <Panel className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-[#1A1916] text-xl">Facture #{selected.number}</h2>
            </div>
            {locked ? (
              <StatusBadge status={selected.status} />
            ) : (
              <select
                className="h-9 rounded-[12px] border border-[#E7E4DC] bg-white px-3 font-semibold text-[#1A1916] text-sm outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10"
                onChange={(event) => {
                  const nextStatus = event.target.value as InvoiceStatus;
                  if (nextStatus === "Payée") {
                    store.markInvoicePaid(selected.id);
                    toast.success("Paiement simulé enregistré");
                    return;
                  }
                  store.updateInvoice(selected.id, { status: nextStatus });
                }}
                value={selected.status}
              >
                {invoiceStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            )}
          </div>

          {!customer && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#F2DFA7] bg-[#FFF8EB] px-4 py-2.5 text-sm text-[#9A6A17]">
              <AlertCircle size={16} />
              <span>Client introuvable pour cette facture : vérifiez l’identifiant client en base.</span>
            </div>
          )}

          {selected.status === "Envoyée" && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FFF8EB] px-4 py-2.5 text-sm text-[#9A6A17] border border-[#F2DFA7]">
              <AlertCircle size={16} />
              <span>Facture envoyée au client. Les modifications de lignes sont déconseillées.</span>
            </div>
          )}
          {isQuoteBasedInvoice && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#F2DFA7] bg-[#FFF8EB] px-4 py-2.5 text-[#9A6A17] text-sm">
              <AlertCircle size={16} />
              <span>
                Facture créée depuis un devis accepté : lignes verrouillées. En cas d'ajustement, passer par un avoir (à
                prévoir).
              </span>
            </div>
          )}

          <div className="rounded-[14px] border border-[#E7E4DC] bg-white p-5">
            <p className="font-semibold text-2xl text-[#1A1916]">{store.workshopInfo.brand}</p>
            <div className="mt-4 text-[#1A1916] text-sm leading-6">
              <p className="font-semibold">{store.workshopInfo.name}</p>
              <p>{store.workshopInfo.address}</p>
              <p>
                {store.workshopInfo.postalCity}, {store.workshopInfo.country}
              </p>
              <p>SIRET : {store.workshopInfo.siret}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-[#E7E4DC] border-y py-5 text-sm">
              <div>
                <p className="text-[#6B6B6B]">Client</p>
                <Link
                  href={`/dashboard/clients?id=${customer?.id}`}
                  className="mt-1 block font-semibold text-[#1A1916] hover:text-[#2A9D8F] transition-colors"
                >
                  {customer?.name ?? "—"}
                </Link>
                <p className="mt-4 text-[#6B6B6B]">Appareil</p>
                <Link
                  href="/dashboard/reparations"
                  onClick={() => {
                    if (repair?.id) store.setSelected("repair", repair.id);
                  }}
                  className="mt-1 block font-semibold text-[#1A1916] hover:text-[#2A9D8F] transition-colors"
                >
                  {repair?.device ?? customer?.device ?? "—"}
                </Link>
                <p className="mt-4 text-[#6B6B6B]">Modèle</p>
                <p className="mt-1 font-semibold text-[#1A1916]">{repair?.model ?? customer?.device ?? "—"}</p>
              </div>
              <div className="border-[#E7E4DC] border-l pl-4">
                <p className="text-[#6B6B6B]">Facture n°</p>
                <p className="mt-1 font-semibold text-[#1A1916]">{selected.number}</p>
                <p className="mt-4 text-[#6B6B6B]">Date</p>
                <p className="mt-1 font-semibold text-[#1A1916]">{formatIsoToDisplay(selected.date)}</p>
                <p className="mt-4 text-[#6B6B6B]">Panne</p>
                <p className="mt-1 font-semibold text-[#1A1916]">{repair?.issue ?? customer?.lastRepair ?? "—"}</p>
                <p className="mt-4 text-[#6B6B6B]">Origine</p>
                <p className="mt-1 font-semibold text-[#1A1916]">
                  {selected.sourceType === "quote" && (
                    <button
                      className="text-[#2A9D8F] hover:underline"
                      onClick={() => {
                        if (selected.quoteId) {
                          store.setSelected("quote", selected.quoteId);
                          router.push("/dashboard/devis");
                        }
                      }}
                    >
                      Devis {selected.sourceNumber}
                    </button>
                  )}
                  {selected.sourceType === "repair" && (
                    <button
                      className="text-[#2A9D8F] hover:underline"
                      onClick={() => {
                        if (selected.repairId) {
                          store.setSelected("repair", selected.repairId);
                          router.push("/dashboard/atelier");
                        }
                      }}
                    >
                      Réparation {selected.sourceNumber}
                    </button>
                  )}
                  {selected.sourceType === "client" && "Vente directe"}
                  {selected.sourceType === "manual" && "Facture libre"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              {!paidLocked && !quoteLinesLocked && (
                <div className="flex flex-wrap justify-end gap-2 px-2">
                  {!linesEditing ? (
                    <SecondaryButton className="h-9 px-3 text-xs" onClick={() => setLinesEditing(true)} type="button">
                      Modifier les lignes
                    </SecondaryButton>
                  ) : (
                    <PrimaryButton className="h-9 px-3 text-xs" onClick={() => setLinesEditing(false)} type="button">
                      Terminer la modification
                    </PrimaryButton>
                  )}
                </div>
              )}
              <div className="grid grid-cols-[1fr_40px_80px_80px_32px] gap-2 px-2 font-semibold text-[#6B6B6B] uppercase tracking-wider">
                <span>Description</span>
                <span className="text-center">Qté</span>
                <span className="text-right">Prix U.</span>
                <span className="text-right">Total</span>
                <span />
              </div>
              {selected.lines.map((line) => (
                <div
                  className="grid grid-cols-[1fr_40px_80px_80px_32px] items-center gap-2 rounded-xl border border-[#E7E4DC] bg-white p-2 text-[#1A1916] transition-shadow hover:shadow-sm"
                  key={line.id}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    {!lineInputsLocked && <GripVertical className="size-3.5 shrink-0 text-[#B0AEA8]" />}
                    {lineInputsLocked ? (
                      <span className="truncate px-1 text-sm">{line.description}</span>
                    ) : (
                      <textarea
                        className="h-9 min-h-[36px] w-full resize-none rounded-lg border border-[#E7E4DC] bg-white px-2 py-1 text-sm leading-tight outline-none placeholder:text-[#B0AEA8] focus:border-[#2A9D8F]/55 focus:ring-2 focus:ring-[#2A9D8F]/15"
                        onChange={(event) => updateInvoiceLine(line.id, { description: event.target.value })}
                        placeholder="Description..."
                        rows={1}
                        value={line.description}
                      />
                    )}
                  </div>
                  {lineInputsLocked ? (
                    <span className="text-center text-sm">{line.quantity}</span>
                  ) : (
                    <input
                      className="h-8 w-full rounded-lg border border-[#E7E4DC] bg-white px-1 text-center text-sm outline-none focus:border-[#2A9D8F]/55 focus:ring-2 focus:ring-[#2A9D8F]/15"
                      min={1}
                      onChange={(event) => updateInvoiceLine(line.id, { quantity: Number(event.target.value) })}
                      type="number"
                      value={Number.isFinite(line.quantity) ? line.quantity : 1}
                    />
                  )}
                  <div className="flex items-center justify-end pr-2">
                    {lineInputsLocked ? (
                      <span className="text-right text-sm">{formatEuro(line.unitPrice)}</span>
                    ) : (
                      <input
                        className="h-8 w-full rounded-lg border border-[#E7E4DC] bg-white px-1 text-right text-sm outline-none focus:border-[#2A9D8F]/55 focus:ring-2 focus:ring-[#2A9D8F]/15"
                        min={0}
                        onChange={(event) => updateInvoiceLine(line.id, { unitPrice: Number(event.target.value) })}
                        step="0.01"
                        type="number"
                        value={Number.isFinite(line.unitPrice) ? line.unitPrice : 0}
                      />
                    )}
                  </div>
                  <span className="text-right font-semibold text-sm">
                    {formatEuro(safeLineEuro(line.quantity, line.unitPrice, line.total))}
                  </span>
                  {!lineInputsLocked ? (
                    <button
                      aria-label="Supprimer la ligne"
                      className="grid size-8 place-items-center rounded-lg text-[#B0AEA8] transition hover:bg-[#FFF1F0] hover:text-[#B42318]"
                      disabled={selected.lines.length <= 1}
                      onClick={() => {
                        if (selected.lines.length <= 1) return;
                        store.updateInvoice(selected.id, {
                          lines: selected.lines.filter((entry) => entry.id !== line.id),
                        });
                        toast.success("Ligne supprimée");
                      }}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : (
                    <div className="size-8" />
                  )}
                </div>
              ))}
              {!lineInputsLocked && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#2A9D8F]/40 py-2.5 text-[#167B70] text-sm transition hover:bg-[#F1FAF8] hover:border-[#2A9D8F]"
                  onClick={() => {
                    store.updateInvoice(selected.id, {
                      lines: [
                        ...selected.lines,
                        {
                          id: `line_invoice_${Date.now()}`,
                          description: "",
                          quantity: 1,
                          unitPrice: 0,
                          total: 0,
                        },
                      ],
                    });
                    toast.success("Ligne ajoutée");
                  }}
                >
                  <Plus className="size-4" />
                  Ajouter une prestation
                </button>
              )}
            </div>

            <div className="mt-5 border-[#E7E4DC] border-t pt-5">
              <PreviewTotal label="Sous-total HT" value={formatEuro(invoiceGrandTotal)} />
              {selected.status !== "Payée" && selected.status !== "Annulée" && (
                <>
                  <div className="mt-2">
                    <PreviewTotal label="Montant payé" value={formatEuro(paidAmount)} />
                  </div>
                  <div className="mt-2">
                    <PreviewTotal label="Reste à payer" value={formatEuro(remainingAmount)} />
                  </div>
                </>
              )}
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="font-semibold text-[#1A1916] text-lg">Total TTC</span>
                <span className="font-semibold text-[#167B70] text-xl">{formatEuro(invoiceGrandTotal)}</span>
              </div>
              {store.workshopInfo?.isMicroEnterprise && (
                <p className="mt-2 text-right text-[#6B6B6B] text-[10px]">TVA non applicable — article 293 B du CGI</p>
              )}
            </div>

            {selected.status === "Payée" && (
              <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-[#E7F5F1] p-3 text-[#167B70] text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-[#20A77D] font-semibold text-white">
                  ✓
                </span>
                <div>
                  <p className="font-semibold">Paiement reçu</p>
                  <p className="text-[#167B70]/70">
                    Facture verrouillée · {formatEuro(paidAmount)} payé
                    {selected.paidAt ? ` le ${selected.paidAt}` : ""} · {selected.paymentMethod}
                  </p>
                </div>
              </div>
            )}

            {invoicePayments.length > 0 && (
              <div className="mt-5 rounded-[14px] border border-[#E7E4DC] bg-[#FAFAF8] p-3 text-sm">
                <p className="mb-2 font-semibold text-[#1A1916]">Paiements liés</p>
                <div className="grid gap-2">
                  {invoicePayments.map((payment) => (
                    <button
                      className="flex items-center justify-between gap-3 rounded-[10px] bg-white px-3 py-2 text-left transition hover:bg-[#E7F5F1]"
                      key={payment.id}
                      onClick={() => {
                        store.setSelected("payment", payment.id);
                        router.push("/dashboard/paiements");
                      }}
                      type="button"
                    >
                      <span>
                        <span className="block font-semibold text-[#1A1916]">{payment.paymentNumber}</span>
                        <span className="text-[#6B6B6B]">
                          {payment.method} · {payment.date}
                        </span>
                      </span>
                      <span className="text-right">
                        <StatusBadge status={payment.status} />
                        <span className="mt-1 block font-semibold text-[#167B70]">{formatEuro(payment.amount)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <SecondaryButton
              className="w-full"
              onClick={() => {
                if (selected) {
                  download("invoice", selected.id);
                }
              }}
            >
              <Download className="size-4" />
              Télécharger PDF facture
            </SecondaryButton>
            <SecondaryButton
              className="w-full"
              onClick={() => {
                if (selected) {
                  print("invoice", selected.id);
                }
              }}
            >
              <Printer className="size-4" />
              Imprimer facture
            </SecondaryButton>
            {!isQuoteBasedInvoice && (
              <PrimaryButton className="w-full" onClick={() => toast.success("Email simulé envoyé")}>
                <Mail className="size-4" />
                Envoyer
              </PrimaryButton>
            )}
            {!locked && !isQuoteBasedInvoice && (
              <SecondaryButton className="col-span-2 w-full" onClick={() => toast.success("Facture enregistrée")}>
                <Save className="size-4" />
                Enregistrer
              </SecondaryButton>
            )}
            {selected.status === "Payée" ? (
              <SecondaryButton
                className="col-span-2 w-full border-[#2A9D8F] text-[#167B70]"
                onClick={() => {
                  if (existingPaidPayment) {
                    store.setSelected("payment", existingPaidPayment.id);
                    router.push("/dashboard/paiements");
                    return;
                  }
                  toast.info("Facture déjà payée");
                }}
              >
                <CheckCircle2 className="size-4" />
                {existingPaidPayment ? "Voir paiement" : "Facture déjà payée"}
              </SecondaryButton>
            ) : paymentOpen ? (
              <div className="col-span-2 rounded-[14px] border border-[#E7E4DC] bg-[#FAFAF8] p-3">
                <label className="block text-[#6B6B6B] text-sm">
                  Mode de paiement
                  <select
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#E7E4DC] bg-white px-3 font-semibold text-[#1A1916] text-sm outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10"
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    value={paymentMethod}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block text-[#6B6B6B] text-sm">
                  Note optionnelle
                  <textarea
                    className="mt-1 min-h-20 w-full resize-y rounded-[12px] border border-[#E7E4DC] bg-white px-3 py-2 text-[#1A1916] text-sm outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10"
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="Référence terminal, commentaire interne..."
                    value={paymentNote}
                  />
                </label>
                <div className="mt-3 flex gap-2">
                  <SecondaryButton className="flex-1" onClick={() => setPaymentOpen(false)}>
                    Annuler
                  </SecondaryButton>
                  <PrimaryButton
                    className="flex-1"
                    onClick={() => {
                      const paymentId = store.markInvoicePaid(selected.id, paymentMethod, paymentNote);
                      if (!paymentId) {
                        toast.error("Paiement impossible pour cette facture");
                        return;
                      }
                      setPaymentOpen(false);
                      setPaymentNote("");
                      store.setSelected("payment", paymentId);
                      toast.success("Paiement simulé enregistré");
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                    Valider
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <PrimaryButton className="col-span-2 w-full" onClick={() => setPaymentOpen(true)}>
                <CheckCircle2 className="size-4" />
                Ajouter un paiement
              </PrimaryButton>
            )}
          </div>
        </Panel>
      )}
    </section>
  );
}

function CreateInvoiceModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const store = useBeharStore();
  const [sourceType, setSourceType] = useState<"quote" | "repair" | "client" | "manual">("manual");
  const [selectedId, setSelectedId] = useState<string>("");
  const [lines, setLines] = useState<
    { id: string; description: string; quantity: number; unitPrice: number; total: number }[]
  >([{ id: `line_${Date.now()}`, description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  const [note, setNote] = useState("");
  const [dates, setDates] = useState({
    invoice: new Date().toISOString().split("T")[0],
    due: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  });
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", device: "", issue: "" });

  const availableQuotes = store.quotes.filter((q) => q.status === "Accepté" && !q.invoiceId);
  const availableRepairs = store.repairs.filter((r) => !r.invoiceId);

  // Synchronisation des données selon la source
  useEffect(() => {
    if (sourceType === "quote" && selectedId) {
      const q = store.quotes.find((item) => item.id === selectedId);
      const c = store.customers.find((item) => item.id === q?.customerId);
      const r = q?.repairId ? store.repairs.find((item) => item.id === q.repairId) : undefined;
      if (q && c) {
        setLines(q.lines.map((l) => ({ ...l })));
        setCustomerInfo({ name: c.name, phone: c.phone, device: r?.device || "", issue: r?.issue || "" });
      }
    } else if (sourceType === "repair" && selectedId) {
      const r = store.repairs.find((item) => item.id === selectedId);
      const c = store.customers.find((item) => item.id === r?.customerId);
      if (r && c) {
        const built = buildInvoiceLinesFromRepair(r);
        if (built.ok) {
          setLines(built.lines.map((l) => ({ ...l, total: l.quantity * l.unitPrice })));
        } else {
          setLines([{ id: `line_${Date.now()}`, description: "", quantity: 1, unitPrice: 0, total: 0 }]);
        }
        setCustomerInfo({ name: c.name, phone: c.phone, device: r.device, issue: r.issue });
      }
    } else if (sourceType === "client" && selectedId) {
      const c = store.customers.find((item) => item.id === selectedId);
      if (c) {
        setCustomerInfo({ name: c.name, phone: c.phone, device: "", issue: "" });
        setLines([{ id: `line_${Date.now()}`, description: "", quantity: 1, unitPrice: 0, total: 0 }]);
      }
    } else if (sourceType === "manual") {
      setCustomerInfo({ name: "", phone: "", device: "", issue: "" });
      setLines([{ id: `line_${Date.now()}`, description: "", quantity: 1, unitPrice: 0, total: 0 }]);
      setSelectedId("");
    }
  }, [sourceType, selectedId, store.quotes, store.repairs, store.customers]);

  const subtotal = lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  const isMicro = store.workshopInfo?.isMicroEnterprise === true;
  const tva = isMicro ? 0 : subtotal * 0.2;
  const total = subtotal + tva;

  const { download } = useDocument();

  const handleCreate = (status: InvoiceStatus, shouldDownload = false) => {
    if (!customerInfo.name) {
      toast.error("Veuillez renseigner le nom du client avant de créer une facture");
      return;
    }

    if (total <= 0 && status !== "Brouillon") {
      const confirmZero = window.confirm("Cette facture est à 0 €. Voulez-vous vraiment la créer ?");
      if (!confirmZero) return;
    }

    let finalCustomerId = "";
    if (sourceType !== "manual" && selectedId) {
      if (sourceType === "client") finalCustomerId = selectedId;
      else {
        const item =
          sourceType === "quote"
            ? store.quotes.find((q) => q.id === selectedId)
            : store.repairs.find((r) => r.id === selectedId);
        finalCustomerId = item?.customerId || "";
      }
    } else {
      const existing = store.customers.find((c) => c.name.toLowerCase() === customerInfo.name.toLowerCase());
      if (existing) finalCustomerId = existing.id;
      else {
        finalCustomerId = store.addCustomer({
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: "Non renseigné",
        });
      }
    }

    const filteredLines =
      sourceType === "quote" && selectedId
        ? linesForInvoiceFromQuote(lines)
        : lines.filter((l) => l.description.trim() !== "");

    const id = store.addInvoice({
      customerId: finalCustomerId,
      repairId:
        sourceType === "repair"
          ? selectedId
          : sourceType === "quote"
            ? store.quotes.find((q) => q.id === selectedId)?.repairId
            : undefined,
      quoteId: sourceType === "quote" ? selectedId : undefined,
      lines: filteredLines,
      sourceType,
      sourceNumber:
        sourceType === "quote"
          ? store.quotes.find((q) => q.id === selectedId)?.number
          : sourceType === "repair"
            ? store.repairs.find((r) => r.id === selectedId)?.number
            : undefined,
      status,
    });

    if (!id) {
      toast.error("Création impossible : vérifiez les lignes, le montant (> 0) et les informations client.");
      return;
    }

    store.setSelected("invoice", id);
    toast.success(status === "Brouillon" ? "Brouillon enregistré" : "Facture créée");

    if (shouldDownload) {
      toast.info("Génération du PDF...");
      setTimeout(() => download("invoice", id), 800);
    }
    onClose();
  };

  const isFormValid = customerInfo.name && lines.length > 0 && lines.some((l) => l.description.trim() !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative flex h-[90vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-[16px] border border-[#E7E4DC] bg-[#FAFAF8] shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#F1F1EF] bg-white">
          <div>
            <h2 className="text-[22px] font-bold text-[#1A1916]">Créer une facture</h2>
            <p className="mt-1 text-sm text-[#6B6B6B]">Préparez la facture avant sa création.</p>
          </div>
          <button onClick={onClose} className="text-[#B0AEA8] transition hover:text-[#1A1916]">
            <X className="size-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Column - Configuration */}
          <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar pb-32">
            {/* 1. Origine */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#1A1916]">Origine de la facture</label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: "quote", label: "Depuis un devis accepté", icon: <FileText /> },
                  { id: "repair", label: "Depuis une réparation", icon: <Wrench /> },
                  { id: "client", label: "Client existant", icon: <User /> },
                  { id: "manual", label: "Facture libre", icon: <Plus /> },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSourceType(opt.id as any);
                      setSelectedId("");
                    }}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-[12px] border h-[110px] transition-all ${
                      sourceType === opt.id
                        ? "border-[#2A9D8F] bg-[#F1FAF8] shadow-sm"
                        : "border-[#E7E4DC] bg-white hover:border-[#2A9D8F]/30"
                    }`}
                  >
                    <div className={`${sourceType === opt.id ? "text-[#2A9D8F]" : "text-[#6B6B6B]"}`}>
                      {cloneElement(opt.icon as React.ReactElement<{ className?: string }>, { className: "size-6" })}
                    </div>
                    <p
                      className={`text-xs font-semibold text-center px-2 ${sourceType === opt.id ? "text-[#167B70]" : "text-[#1A1916]"}`}
                    >
                      {opt.label}
                    </p>
                    {sourceType === opt.id && (
                      <div className="absolute top-2 right-2 size-5 rounded-full bg-[#2A9D8F] flex items-center justify-center">
                        <Check className="size-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Informations */}
            <div className="mt-10 space-y-4">
              <label className="text-sm font-bold text-[#1A1916]">Informations principales</label>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B6B6B]">Client</p>
                  {sourceType === "manual" ? (
                    <input
                      className="h-11 w-full rounded-[10px] border border-[#E7E4DC] bg-white px-4 text-sm outline-none focus:border-[#2A9D8F] transition-all"
                      placeholder="Nom du client..."
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        className="h-11 w-full appearance-none rounded-[10px] border border-[#E7E4DC] bg-white px-4 text-sm outline-none focus:border-[#2A9D8F] transition-all"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        <option value="">-- Sélectionner --</option>
                        {sourceType === "quote" &&
                          availableQuotes.map((q) => (
                            <option key={q.id} value={q.id}>
                              {q.number} — {store.customers.find((c) => c.id === q.customerId)?.name}
                            </option>
                          ))}
                        {sourceType === "repair" &&
                          availableRepairs.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.number} — {store.customers.find((c) => c.id === r.customerId)?.name} ({r.device})
                            </option>
                          ))}
                        {sourceType === "client" &&
                          store.customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#B0AEA8]" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B6B6B]">Téléphone</p>
                  <input
                    className="h-11 w-full rounded-[10px] border border-[#E7E4DC] bg-white px-4 text-sm outline-none focus:border-[#2A9D8F] transition-all"
                    placeholder="Numéro de téléphone..."
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B6B6B]">Date de facture</p>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#B0AEA8]" />
                    <input
                      type="date"
                      className="h-11 w-full rounded-[10px] border border-[#E7E4DC] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#2A9D8F]"
                      value={dates.invoice}
                      onChange={(e) => setDates({ ...dates, invoice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B6B6B]">Date d'échéance</p>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#B0AEA8]" />
                    <input
                      type="date"
                      className="h-11 w-full rounded-[10px] border border-[#E7E4DC] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#2A9D8F]"
                      value={dates.due}
                      onChange={(e) => setDates({ ...dates, due: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B6B6B]">Appareil</p>
                  <input
                    className="h-11 w-full rounded-[10px] border border-[#E7E4DC] bg-white px-4 text-sm outline-none focus:border-[#2A9D8F] transition-all"
                    placeholder="Ex. iPhone 14 Pro Max"
                    value={customerInfo.device}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, device: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B6B6B]">Panne / description</p>
                  <input
                    className="h-11 w-full rounded-[10px] border border-[#E7E4DC] bg-white px-4 text-sm outline-none focus:border-[#2A9D8F] transition-all"
                    placeholder="Écran cassé, Batterie..."
                    value={customerInfo.issue}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, issue: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 3. Lignes */}
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1A1916]">Lignes de facture</label>
                <button
                  onClick={() =>
                    setLines([
                      ...lines,
                      { id: `line_${Date.now()}`, description: "", quantity: 1, unitPrice: 0, total: 0 },
                    ])
                  }
                  className="flex items-center gap-2 text-xs font-bold text-[#2A9D8F] hover:underline"
                >
                  <Plus className="size-4" />
                  Ajouter une ligne
                </button>
              </div>
              <div className="rounded-[12px] border border-[#E7E4DC] overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] text-[#6B6B6B] border-b border-[#E7E4DC] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 w-16 text-center">Qté</th>
                      <th className="px-4 py-3 w-28 text-right">Prix U. HT</th>
                      <th className="px-4 py-3 w-20 text-center">TVA</th>
                      <th className="px-4 py-3 w-28 text-right">Total HT</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E4DC]">
                    {lines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-[#FAFAF8]/50 transition-colors">
                        <td className="p-2">
                          <input
                            className="w-full h-9 px-2 rounded-lg border border-transparent focus:border-[#E7E4DC] bg-transparent outline-none text-[#1A1916]"
                            value={line.description}
                            onChange={(e) => {
                              const newLines = [...lines];
                              newLines[idx].description = e.target.value;
                              setLines(newLines);
                            }}
                            placeholder="Prestation ou article..."
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full h-9 text-center rounded-lg border border-transparent focus:border-[#E7E4DC] bg-transparent outline-none text-[#1A1916]"
                            value={line.quantity}
                            onChange={(e) => {
                              const newLines = [...lines];
                              newLines[idx].quantity = Number(e.target.value);
                              setLines(newLines);
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="w-full h-9 text-right pr-2 rounded-lg border border-transparent focus:border-[#E7E4DC] bg-transparent outline-none text-[#1A1916]"
                            value={line.unitPrice}
                            onChange={(e) => {
                              const newLines = [...lines];
                              newLines[idx].unitPrice = Number(e.target.value);
                              setLines(newLines);
                            }}
                          />
                        </td>
                        <td className="p-2 text-center text-[#6B6B6B]">{isMicro ? "N/A" : "20 %"}</td>
                        <td className="p-2 text-right font-semibold text-[#1A1916]">
                          {formatEuro(line.quantity * line.unitPrice)}
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => setLines(lines.filter((l) => l.id !== line.id))}
                            className="text-[#B0AEA8] hover:text-[#B42318] transition-colors p-2"
                            disabled={lines.length <= 1}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Commentaires */}
            <div className="mt-10 space-y-4 pb-10">
              <label className="text-sm font-bold text-[#1A1916]">Commentaires internes</label>
              <textarea
                className="w-full min-h-[120px] p-4 rounded-[12px] border border-[#E7E4DC] bg-white text-sm outline-none focus:border-[#2A9D8F] transition-all resize-none"
                placeholder="Notes visibles uniquement par l'équipe (réf paiement, historique...)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column (Aperçu) */}
          <div className="w-[400px] border-l border-[#F1F1EF] bg-white p-8 overflow-y-auto custom-scrollbar pb-32">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1916]">Aperçu du document</h3>
                <div className="flex items-center gap-2 rounded-full bg-[#FEF6E7] px-3 py-1 text-[10px] font-bold text-[#D97706]">
                  <div className="size-1.5 rounded-full bg-[#D97706]" />
                  BROUILLON
                </div>
              </div>

              <div className="space-y-6">
                {/* Infos Client/Doc */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Client</p>
                    <p className="font-bold text-[#1A1916] truncate">{customerInfo.name || "— Client non défini —"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Origine</p>
                    <p className="font-bold text-[#1A1916]">
                      {sourceType === "quote"
                        ? "Devis accepté"
                        : sourceType === "repair"
                          ? "Réparation liée"
                          : sourceType === "client"
                            ? "Client existant"
                            : "Facture libre"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Date de facture</p>
                    <p className="font-bold text-[#1A1916]">
                      {new Date(dates.invoice).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Appareil</p>
                    <p className="font-bold text-[#1A1916] truncate">{customerInfo.device || "— Non spécifié —"}</p>
                  </div>
                </div>

                {/* Panne */}
                <div className="rounded-xl border border-[#F1F1EF] bg-[#FAFAF8] p-4 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">
                    Description / Panne
                  </p>
                  <p className="text-[#1A1916] leading-relaxed italic">
                    {customerInfo.issue || "Aucune description saisie"}
                  </p>
                </div>

                {/* Lignes */}
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Prestations</p>
                  <div className="space-y-2">
                    {lines
                      .filter((l) => l.description.trim() !== "")
                      .map((l) => (
                        <div
                          key={l.id}
                          className="flex justify-between items-start text-xs border-b border-[#F1F1EF] pb-2"
                        >
                          <div className="flex-1 pr-4">
                            <p className="font-medium text-[#1A1916]">{l.description}</p>
                            <p className="text-[10px] text-[#6B6B6B]">
                              Qté : {l.quantity} x {formatEuro(l.unitPrice)} HT
                            </p>
                          </div>
                          <p className="font-bold text-[#1A1916]">{formatEuro(l.quantity * l.unitPrice)}</p>
                        </div>
                      ))}
                    {lines.filter((l) => l.description.trim() !== "").length === 0 && (
                      <p className="text-[11px] italic text-[#B0AEA8]">Aucune prestation ajoutée</p>
                    )}
                  </div>
                </div>

                {/* Totaux */}
                <div className="border-t border-[#F1F1EF] pt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>Total HT</span>
                    <span className="font-bold text-[#1A1916]">{formatEuro(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B6B]">
                    <span>{isMicro ? "TVA non applicable (art. 293 B CGI)" : "TVA (20 %)"}</span>
                    <span className="font-bold text-[#1A1916]">{isMicro ? "—" : formatEuro(tva)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-3">
                    <span className="font-bold text-[#1A1916]">Total TTC</span>
                    <span className="text-[24px] font-bold text-[#2A9D8F] tracking-tight">{formatEuro(total)}</span>
                  </div>
                </div>

                {/* Notes Internes */}
                <div className="space-y-2 pt-6 border-t border-[#F1F1EF]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Commentaires internes</p>
                  <p className="text-[11px] text-[#6B6B6B] leading-relaxed bg-[#FAFAF8] p-3 rounded-lg border border-[#F1F1EF]">
                    {note || "Aucun commentaire interne."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Sticky */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-[#F1F1EF] bg-white px-8 py-5 flex items-center justify-between z-20">
            <button
              onClick={() => handleCreate("Brouillon")}
              className="flex items-center gap-2 text-sm font-bold text-[#6B6B6B] hover:text-[#1A1916] transition-colors"
            >
              <Save className="size-4" />
              Enregistrer en brouillon
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="h-11 px-6 rounded-[12px] border border-[#E7E4DC] text-sm font-bold text-[#1A1916] hover:bg-[#FAFAF8] transition-all active:scale-[0.98]"
              >
                Annuler
              </button>
              <button
                onClick={() => handleCreate("Envoyée", false)}
                disabled={!isFormValid}
                className="h-11 px-8 rounded-[12px] bg-[#E7F5F1] text-sm font-bold text-[#167B70] border border-[#2A9D8F]/20 hover:bg-[#D8EDE7] transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                Créer la facture
              </button>
              <button
                onClick={() => handleCreate("Envoyée", true)}
                disabled={!isFormValid}
                className="h-11 px-8 rounded-[12px] bg-[#2A9D8F] text-sm font-bold text-white shadow-lg shadow-[#2A9D8F]/20 hover:bg-[#238b7e] transition-all disabled:opacity-50 active:scale-[0.98] flex items-center gap-2"
              >
                <Download className="size-4" />
                Créer et télécharger le PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChoiceCard({
  title,
  subtitle,
  description,
  icon,
  onClick,
}: Readonly<{ title: string; subtitle?: string; description: string; icon: React.ReactNode; onClick: () => void }>) {
  return (
    <button
      className="group flex flex-col items-start gap-4 rounded-xl border border-[#E7E4DC] bg-white p-6 text-left transition-all hover:bg-[#F1FAF8] hover:border-[#2A9D8F]/40 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="rounded-xl bg-[#F1FAF8] p-4 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-[#1A1916] tracking-tight">{title}</h3>
        {subtitle && (
          <div className="mt-1 inline-flex items-center rounded-full bg-[#E7F5F1] px-2 py-0.5 text-[#167B70] text-[10px] font-bold uppercase">
            {subtitle}
          </div>
        )}
        <p className="mt-3 text-[#6B6B6B] text-xs leading-relaxed opacity-80">{description}</p>
      </div>
    </button>
  );
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertCircle className="mb-3 size-10 text-[#B0AEA8]" />
      <p className="text-[#6B6B6B] text-sm">{message}</p>
    </div>
  );
}

function PreviewTotal({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-[#6B6B6B]">{label}</span>
      <span className="font-medium text-[#1A1916]">{value}</span>
    </div>
  );
}
