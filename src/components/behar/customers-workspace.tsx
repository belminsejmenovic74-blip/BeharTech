"use client";

import Link from "next/link";
import { useState } from "react";

import {
  CalendarDays,
  ChevronRight,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { type Customer, formatEuro, formatIsoToDisplay, getNowIso, toLocalIso, useBeharStore } from "@/lib/behar-store";
import { displayCustomerName } from "@/lib/customer-display";
import { sendRealSms } from "@/lib/send-sms";

import { DeviceSelector } from "../DeviceSelector";
import { PageShell } from "./page-shell";
import {
  DetailRow,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TableShell,
  ToolbarSelect,
  tableClassName,
  tableHeadClassName,
} from "./primitives";

export function CustomersWorkspace() {
  const store = useBeharStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [appointmentCustomerId, setAppointmentCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterVip, setFilterVip] = useState(false);

  const filteredCustomers = store.customers.filter((customer) => {
    const q = search.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(q) ||
      (customer.email ?? "").toLowerCase().includes(q) ||
      (customer.phone ?? "").toLowerCase().includes(q);
    
    if (filterVip && customer.status !== "Client fidèle") return false;
    return matchesSearch;
  });

  const today = getNowIso().split("T")[0];
  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === store.selectedCustomerId) ?? filteredCustomers[0];

  type HistoryItem = {
    title: string;
    detail: string;
    time: string;
    icon: any;
    type?: "repair" | "quote" | "invoice" | "payment";
    id?: string;
  };

  const historyItems: HistoryItem[] = selectedCustomer
    ? ([
        ...store.repairs
          .filter((repair) => repair.customerId === selectedCustomer.id)
          .map((repair) => ({
            detail: `${repair.device} - ${repair.issue}`,
            icon: Wrench,
            time: repair.droppedAt,
            title: `Réparation ${repair.status}`,
            type: "repair" as const,
            id: repair.id,
          })),
        ...store.appointments
          .filter((appointment) => appointment.customerId === selectedCustomer.id)
          .map((appointment) => ({
            detail: `${appointment.device} - ${appointment.issue}`,
            icon: CalendarDays,
            time: `${appointment.date}, ${appointment.time}`,
            title: appointment.confirmed ? "Rendez-vous confirmé" : "Rendez-vous créé",
            type: undefined,
            id: appointment.id,
          })),
        ...store.quotes
          .filter((quote) => quote.customerId === selectedCustomer.id)
          .map((quote) => ({
            detail: `Devis ${quote.number} - ${formatEuro(quote.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0))}`,
            icon: ReceiptText,
            time: quote.date,
            title: `Devis ${quote.status}`,
            type: "quote" as const,
            id: quote.id,
          })),
        ...store.invoices
          .filter((invoice) => invoice.customerId === selectedCustomer.id)
          .map((invoice) => ({
            detail: `Facture ${invoice.number}`,
            icon: ReceiptText,
            time: invoice.date,
            title: `Facture ${invoice.status}`,
            type: "invoice" as const,
            id: invoice.id,
          })),
        ...store.payments
          .filter((payment) => payment.customerId === selectedCustomer.id)
          .map((payment) => ({
            detail: `${payment.reference} - ${formatEuro(payment.amount)}`,
            icon: ReceiptText,
            time: payment.date,
            title: `Paiement ${payment.status}`,
            type: "payment" as const,
            id: payment.id,
          })),
        ...store.messageLogs
          .filter((message) => message.customerId === selectedCustomer.id)
          .map((message) => ({
            detail: message.subject,
            icon: MessageCircle,
            time: message.createdAt,
            title: message.channel,
            type: undefined,
            id: undefined,
          })),
      ] as HistoryItem[])
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, 8)
    : [];

  const actions = (
    <PrimaryButton onClick={() => setOpen(true)}>
      Nouveau client
      <Plus className="size-4" />
    </PrimaryButton>
  );

  const toolbar = (
    <>
      <ToolbarSelect>Tous les statuts</ToolbarSelect>
      <ToolbarSelect>Tous les appareils</ToolbarSelect>
      <ToolbarSelect>Source</ToolbarSelect>
      <SecondaryButton
        className={filterVip ? "border-[#2A9D8F] bg-[#EAF6F2] text-[#1A1916]" : ""}
        onClick={() => setFilterVip(!filterVip)}
      >
        VIP uniquement
      </SecondaryButton>
    </>
  );

  return (
    <PageShell
      actions={actions}
      fitScreen
      searchPlaceholder="Rechercher un client..."
      searchValue={search}
      onSearchChange={setSearch}
      title="Clients"
      subtitle="Suivez vos clients, leurs appareils et leur historique d'interventions."
      toolbar={toolbar}
    >
      <section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <TableShell className="min-h-[620px] md:h-full md:min-h-0">
          <table className={tableClassName}>
            <thead className={tableHeadClassName}>
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Appareil</th>
                <th className="px-4 py-3">Dernière visite</th>
                <th className="px-4 py-3">Total dépensé</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  className={`cursor-pointer ${customer.id === selectedCustomer?.id ? "bg-[#EAF6F2]" : "bg-white/45"}`}
                  key={customer.id}
                  onClick={() => store.setSelected("customer", customer.id)}
                >
                  <td className="border-[#E7E4DC] border-b px-4 py-2.5 text-[#1A1916]">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-full bg-[#F1F1EF] font-medium text-[#1A1916] text-xs">
                        {customer.initials}
                      </span>
                      <span className="font-semibold">{displayCustomerName(customer)}</span>
                    </div>
                  </td>
                  <td className="border-[#E7E4DC] border-b px-4 py-2.5 text-[#1A1916]">{customer.device}</td>
                  <td className="border-[#E7E4DC] border-b px-4 py-2.5 text-[#1A1916]">
                    {formatIsoToDisplay(customer.lastVisit)}
                  </td>
                  <td className="border-[#E7E4DC] border-b px-4 py-2.5 text-[#1A1916]">
                    {formatEuro(customer.totalSpent)}
                  </td>
                  <td className="border-[#E7E4DC] border-b px-4 py-2.5 text-[#1A1916]">
                    <StatusBadge className="h-6 px-2 text-[11px]" status={customer.status} />
                  </td>
                  <td className="border-[#E7E4DC] border-b px-4 py-2.5 text-[#1A1916]">
                    <ChevronRight className="ml-auto size-4 text-[#6B6B6B]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        {selectedCustomer && (
          <Panel className="flex min-h-0 flex-col overflow-hidden rounded-[14px] p-4 md:h-full">
            <div className="mb-4 flex shrink-0 items-start gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-[#F1F1EF] font-semibold text-[#1A1916] text-lg">
                {selectedCustomer.initials}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-[#1A1916] text-xl leading-tight">
                  {displayCustomerName(selectedCustomer)}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-[#6B6B6B] text-sm">
                  <MessageCircle className="size-4" />
                  {selectedCustomer.phone}
                </p>
                <p className="mt-1 flex items-center gap-2 text-[#6B6B6B] text-sm">
                  <Mail className="size-4" />
                  {selectedCustomer.email}
                </p>
              </div>
              <button
                aria-label="Options client"
                className="text-[#6B6B6B]"
                onClick={() => setEditing(selectedCustomer)}
                type="button"
              >
                <MoreHorizontal className="size-5" />
              </button>
            </div>

            <dl className="divide-y divide-[#E7E4DC] border-[#E7E4DC] border-t">
              <DetailRow className="py-2" label="Appareil récent" value={selectedCustomer.device} />
              <DetailRow className="py-2" label="Adresse" value={selectedCustomer.address || "Non renseignée"} />
              <DetailRow className="py-2" label="Dernière réparation" value={selectedCustomer.lastRepair} />
              <DetailRow
                className="py-2"
                emphasize
                label="Total dépensé"
                value={formatEuro(selectedCustomer.totalSpent)}
              />
              <DetailRow className="py-2" label="Nombre d'interventions" value={selectedCustomer.interventions} />
              <DetailRow className="py-2" label="Source" value={selectedCustomer.source} />
              <DetailRow
                className="py-2"
                label="Tags"
                value={
                  <StatusBadge
                    className="h-6 px-2 text-[11px]"
                    status={selectedCustomer.tags || selectedCustomer.status}
                  />
                }
              />
              <DetailRow className="py-2" label="Notes" value={selectedCustomer.notes || "Aucune note"} />
            </dl>
            <div className="mt-4 min-h-0 flex-1 overflow-hidden border-[#E7E4DC] border-t pt-4">
              <h3 className="mb-3 font-semibold text-[#1A1916]">Historique récent</h3>
              <div className="space-y-2.5">
                {((historyItems.length
                  ? historyItems
                  : [
                      {
                        detail: "Aucun évènement lié pour le moment",
                        icon: ReceiptText,
                        time: "",
                        title: "Historique vide",
                        type: undefined,
                        id: undefined,
                      },
                    ]) as HistoryItem[]).map(({ title, detail, time, icon: Icon, type, id }) => (
                  <Link
                    href={type ? `/dashboard/${type === "repair" ? "reparations" : type === "quote" ? "devis" : type === "invoice" ? "factures" : type === "payment" ? "paiements" : ""}` : "#"}
                    onClick={() => {
                      if (type && id) store.setSelected(type, id);
                    }}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-[#FAFAF8] transition-colors"
                    key={`${title}-${detail}-${time}`}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-[#E8F7F3] text-[#2A9D8F]">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1A1916] text-sm">{title}</p>
                      <p className="mt-0.5 text-[#6B6B6B] text-xs">{detail}</p>
                    </div>
                    <span className="text-[#6B6B6B] text-xs">{formatIsoToDisplay(time)}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 grid shrink-0 gap-2 border-[#E7E4DC] border-t pt-4">
              <PrimaryButton
                className="h-10 w-full"
                onClick={() => {
                  const quoteId = store.addQuote({ customerId: selectedCustomer.id });
                  store.setSelected("quote", quoteId);
                  toast.success("Devis créé");
                }}
              >
                <ReceiptText className="size-4" />
                Créer un devis
              </PrimaryButton>
              <div className="grid grid-cols-2 gap-2">
                <SecondaryButton
                  className="h-10 w-full"
                  onClick={() => {
                    const repairId = store.addRepair({
                      customerId: selectedCustomer.id,
                      device: selectedCustomer.device,
                      issue: selectedCustomer.lastRepair || "Intervention atelier",
                      status: "Reçu",
                      amount: 0,
                      notes: "",
                      droppedAt: today,
                      technician: "Atelier principal",
                    });
                    if (!repairId) {
                      toast.error("Impossible de créer une réparation sans client lié");
                      return;
                    }
                    toast.success("Réparation créée pour ce client");
                  }}
                >
                  <Wrench className="size-4" />
                  Réparation
                </SecondaryButton>
                <SecondaryButton className="h-10 w-full" onClick={() => setAppointmentCustomerId(selectedCustomer.id)}>
                  <CalendarDays className="size-4" />
                  Rendez-vous
                </SecondaryButton>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SecondaryButton
                  className="h-10 w-full"
                  onClick={async () => {
                    const body = `Bonjour ${displayCustomerName(selectedCustomer)}, votre dossier Behar Tech est mis à jour.`;
                    if (!window.confirm(`Envoyer ce SMS au client (${selectedCustomer.phone}) ?\n\n"${body}"`)) {
                      return;
                    }
                    try {
                      await sendRealSms(selectedCustomer.phone, body);
                      store.sendMessage({
                        body,
                        channel: "SMS",
                        customerId: selectedCustomer.id,
                        subject: "Message client",
                      });
                      toast.success("SMS réel envoyé avec ClickSend");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi du SMS");
                    }
                  }}
                >
                  <MessageCircle className="size-4" />
                  SMS
                </SecondaryButton>
                <SecondaryButton
                  className="h-10 w-full text-[#B42318]"
                  onClick={() => {
                    const linkedCount =
                      store.repairs.filter((repair) => repair.customerId === selectedCustomer.id).length +
                      store.appointments.filter((appointment) => appointment.customerId === selectedCustomer.id)
                        .length +
                      store.quotes.filter((quote) => quote.customerId === selectedCustomer.id).length +
                      store.invoices.filter((invoice) => invoice.customerId === selectedCustomer.id).length +
                      store.payments.filter((payment) => payment.customerId === selectedCustomer.id).length;
                    if (linkedCount) {
                      toast.error(
                        `Ce client a ${linkedCount} donnée(s) liée(s). Supprimez ou réattribuez les éléments liés avant de supprimer le client.`,
                      );
                      return;
                    }
                    const message = "Supprimer ce client ?";
                    if (window.confirm(message)) {
                      store.deleteCustomer(selectedCustomer.id);
                      toast.success("Client supprimé");
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </SecondaryButton>
              </div>
            </div>
          </Panel>
        )}
      </section>

      {open && <CustomerModal onClose={() => setOpen(false)} />}
      {editing && <CustomerModal initial={editing} onClose={() => setEditing(null)} />}
      {appointmentCustomerId && (
        <AppointmentFromCustomerModal
          customerId={appointmentCustomerId}
          onClose={() => setAppointmentCustomerId(null)}
        />
      )}
    </PageShell>
  );
}

function CustomerModal({ onClose, initial }: Readonly<{ onClose: () => void; initial?: Customer }>) {
  const store = useBeharStore();
  const [deviceState, setDeviceState] = useState({
    deviceType: "Smartphone",
    brand: "Apple",
    model: "Autre",
    customModel: "",
    deviceLabel: initial?.device || "Apple Autre",
  });

  const inputClass =
    "h-11 w-full rounded-xl border border-[#E7E4DC] bg-white px-3 outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1916]/24 p-4 backdrop-blur-sm">
      <Panel className="mx-auto my-8 max-h-[calc(100svh-4rem)] max-w-xl overflow-y-auto p-6">
        <h2 className="font-semibold text-2xl text-[#1A1916]">{initial ? "Modifier client" : "Nouveau client"}</h2>
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const anonymous = data.get("anonymous") === "on";
            const name = anonymous ? "Client comptoir" : String(data.get("name") || "Client comptoir");
            const payload = {
              name,
              initials: name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase(),
              phone: String(data.get("phone") || "Non renseigné"),
              email: String(data.get("email") || "Non renseigné"),
              address: String(data.get("address") || ""),
              device: deviceState.deviceLabel,
              notes: String(data.get("notes") || ""),

              tags: String(data.get("tags") || "Actif"),
              status: String(data.get("tags") || "Actif"),
              source: "Création dashboard",
            };
            if (initial) {
              store.updateCustomer(initial.id, payload);
              toast.success("Client modifié");
            } else {
              store.addCustomer(payload);
              toast.success("Client créé");
            }
            onClose();
          }}
        >
          <label className="flex items-center gap-3 rounded-2xl bg-[#FAFAF8] p-3 text-sm">
            <input name="anonymous" type="checkbox" />
            Le client souhaite rester anonyme
          </label>
          <input className={inputClass} defaultValue={initial?.name} name="name" placeholder="Nom du client" />
          <input className={inputClass} defaultValue={initial?.phone} name="phone" placeholder="Téléphone" />
          <input className={inputClass} defaultValue={initial?.email} name="email" placeholder="Email" />
          <input className={inputClass} defaultValue={initial?.address} name="address" placeholder="Adresse" />
          <DeviceSelector
            deviceType={deviceState.deviceType}
            brand={deviceState.brand}
            model={deviceState.model}
            customModel={deviceState.customModel}
            onChange={(updates) => setDeviceState((prev) => ({ ...prev, ...updates }))}
          />

          <input
            className={inputClass}
            defaultValue={initial?.tags ?? initial?.status}
            name="tags"
            placeholder="Tags"
          />
          <textarea
            className="min-h-24 w-full rounded-xl border border-[#E7E4DC] bg-white px-3 py-2 outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10"
            defaultValue={initial?.notes}
            name="notes"
            placeholder="Notes client"
          />
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
            <PrimaryButton type="submit">
              <UserRound className="size-4" />
              {initial ? "Enregistrer" : "Créer"}
            </PrimaryButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function AppointmentFromCustomerModal({ customerId, onClose }: Readonly<{ customerId: string; onClose: () => void }>) {
  const store = useBeharStore();
  const customer = store.customers.find((c) => c.id === customerId);
  const now = new Date();
  const [date, setDate] = useState(toLocalIso(now).split("T")[0]);
  const [time, setTime] = useState("14:30");
  const [issue, setIssue] = useState(customer?.lastRepair || "");
  const [error, setError] = useState("");

  const inputClass =
    "h-11 w-full rounded-xl border border-[#E7E4DC] bg-white px-3 outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !issue.trim()) {
      setError("La date, l'heure et le motif sont obligatoires.");
      return;
    }
    const appointmentId = store.addAppointment({
      customerId,
      device: customer?.device || "Non renseigné",
      issue: issue.trim(),
      date: `${date}`,
      time,
    });
    if (!appointmentId) {
      toast.error("Impossible de créer le rendez-vous");
      return;
    }
    toast.success("Rendez-vous créé");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1916]/24 p-4 backdrop-blur-sm">
      <Panel className="mx-auto my-8 max-w-md overflow-y-auto p-6">
        <h2 className="font-semibold text-xl text-[#1A1916]">Nouveau rendez-vous</h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          Client : <span className="font-semibold text-[#1A1916]">{displayCustomerName(customer ?? undefined)}</span>
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="text-[#6B6B6B] mb-1 block">Date du rendez-vous *</span>
            <input
              className={inputClass}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#6B6B6B] mb-1 block">Heure *</span>
            <input
              className={inputClass}
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setError("");
              }}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#6B6B6B] mb-1 block">Motif du rendez-vous *</span>
            <input
              className={inputClass}
              placeholder="Ex: Diagnostic écran, Devis réparation..."
              value={issue}
              onChange={(e) => {
                setIssue(e.target.value);
                setError("");
              }}
              required
            />
          </label>
          {error && <p className="text-sm text-[#B42318] font-semibold">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
            <PrimaryButton type="submit">
              <CalendarDays className="size-4" />
              Créer le rendez-vous
            </PrimaryButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
