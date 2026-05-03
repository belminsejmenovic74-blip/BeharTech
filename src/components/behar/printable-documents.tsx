import type { ReactNode } from "react";

import {
  type Customer,
  workshopInfo as defaultWorkshopInfo,
  formatEuro,
  getInvoiceTotal,
  getQuoteTotal,
  type Invoice,
  type Payment,
  type Quote,
  type Repair,
  type WorkshopInfo,
} from "@/lib/behar-store";

function MoneyRow({ label, value, emphasize }: Readonly<{ label: string; value: string; emphasize?: boolean }>) {
  return (
    <div
      className={`flex justify-between gap-6 border-b border-[#E7E4DC] py-3 text-sm ${emphasize ? "font-semibold text-base" : ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function InfoGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function InfoBox({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="print-avoid-break rounded-2xl border border-[#E7E4DC] p-4 print:rounded-none print:border-black print:p-3">
      <h3 className="mb-2 font-semibold text-[#1A1916]">{title}</h3>
      <div className="space-y-1 text-[#1A1916] text-sm">{children}</div>
    </section>
  );
}

function DocumentLayout({
  title,
  number,
  date,
  badge,
  workshop = defaultWorkshopInfo,
  children,
}: Readonly<{
  title: string;
  number?: string;
  date?: string;
  badge?: string;
  workshop?: WorkshopInfo;
  children: ReactNode;
}>) {
  const logo = workshop?.logoUrl?.trim();
  const atelierName = workshop?.name?.trim() || defaultWorkshopInfo.name;
  const initials = atelierName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const paymentMethods = workshop?.acceptedPaymentMethods?.filter(Boolean) ?? [];
  return (
    <article className="print-document print-compact mx-auto max-w-[794px] rounded-[18px] border border-[#E7E4DC] bg-white p-12 print:border-0 print:p-0">
      <header className="flex items-start justify-between gap-8 border-b border-[#E7E4DC] pb-8 print:pb-6">
        <div>
          {logo ? (
            <img alt={atelierName} className="h-auto w-40 object-contain print:w-32" src={logo} />
          ) : (
            <div className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-[#E7E4DC] px-3 py-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#E7F5F1] font-semibold text-[#2A9D8F] text-xs">
                {initials || "AT"}
              </span>
              <span className="font-semibold text-[#1A1916] text-sm">{atelierName}</span>
            </div>
          )}
          <div className="mt-6 text-[#6B6B6B] text-xs leading-relaxed">
            <p className="font-semibold text-[#1A1916] text-sm">{atelierName}</p>
            <p>{workshop.address}</p>
            <p>
              {workshop.postalCity}, {workshop.country}
            </p>
            <p>SIRET : {workshop.siret}</p>
            {workshop.tvaNumber ? <p>TVA : {workshop.tvaNumber}</p> : null}
            <p>{workshop.email}</p>
            <p>{workshop.phone}</p>
            {workshop.website ? <p>{workshop.website}</p> : null}
          </div>
        </div>
        <div className="text-right">
          <h2 className="font-semibold text-3xl text-[#1A1916] print:text-2xl">{title}</h2>
          {number && <p className="mt-1 font-medium text-[#6B6B6B] text-lg">{number}</p>}
          {date && <p className="mt-2 font-semibold text-[#2A9D8F]">{date}</p>}
          {badge && (
            <p className="mt-3 inline-flex rounded-full bg-[#EAF6F2] px-3 py-1 font-semibold text-[#167B70] text-xs">
              {badge}
            </p>
          )}
        </div>
      </header>
      <div className="mt-8 space-y-8 print:mt-6 print:space-y-6">{children}</div>
      <footer className="mt-12 border-t border-[#E7E4DC] pt-8 text-[#6B6B6B] text-xs">
        {paymentMethods.length > 0 ? <p>Moyens de paiement acceptés : {paymentMethods.join(" · ")}</p> : null}
        {workshop?.documentFooter ? <p className="mt-1">{workshop.documentFooter}</p> : null}
        {workshop?.isMicroEnterprise && (
          <p className="mt-1">
            TVA non applicable — article 293 B du CGI. {workshop.siret ? `SIRET : ${workshop.siret}` : ""}
          </p>
        )}
      </footer>
    </article>
  );
}

export function RepairIntakeDocument({
  repair,
  customer,
  workshop,
}: Readonly<{ repair: Repair; customer: Customer; workshop?: WorkshopInfo }>) {
  return (
    <DocumentLayout date={repair.droppedAt} number={repair.number} title="Bon de prise en charge" workshop={workshop}>
      <InfoGrid>
        <InfoBox title="Client">
          <p className="font-medium">{customer.name}</p>
          <p>{customer.phone}</p>
          <p>{customer.email || "-"}</p>
        </InfoBox>
        <InfoBox title="Appareil">
          <p className="font-medium">
            {repair.brandName} {repair.deviceModel ?? repair.model}
          </p>
          <p>Appareil : {repair.device}</p>
          <p>Type : {repair.deviceType ?? "-"}</p>
          <p>IMEI/S/N : {repair.imei || "-"}</p>
        </InfoBox>
      </InfoGrid>

      <InfoBox title="Détails de la prise en charge">
        <p>
          <span className="font-medium">Panne déclarée :</span> {repair.issue}
        </p>
        <p>
          <span className="font-medium">État à l’entrée :</span> {repair.issueType ?? repair.status}
        </p>
        <p>
          <span className="font-medium">Notes :</span> {repair.notes || "Aucune note"}
        </p>
        <p>
          <span className="font-medium">Statut :</span> {repair.status}
        </p>
      </InfoBox>

      <div className="space-y-4 rounded-2xl border border-[#E7E4DC] p-5 print:rounded-none">
        <h3 className="font-semibold text-[#1A1916]">Conditions de prise en charge</h3>
        <p className="text-xs leading-relaxed">
          Le client confie l’appareil à l’atelier pour diagnostic et réparation. Les données personnelles restent sous
          la responsabilité exclusive du client. L’atelier ne saurait être tenu responsable de la perte de données.
          Toute réparation est garantie 3 mois (hors casse et oxydation) sur la pièce remplacée uniquement. Tout
          appareil non récupéré après 3 mois sera considéré comme abandonné.
        </p>
        {workshop?.defaultWarranty ? (
          <p className="text-xs leading-relaxed">Garantie atelier : {workshop.defaultWarranty}</p>
        ) : null}
      </div>

      <div className="grid gap-12 pt-8 md:grid-cols-2">
        <div className="border-t border-[#E7E4DC] pt-4">
          <p className="font-medium text-[#6B6B6B] text-xs uppercase tracking-wider">Signature client</p>
          <div className="mt-12 h-px" />
        </div>
        <div className="border-t border-[#E7E4DC] pt-4 text-right">
          <p className="font-medium text-[#6B6B6B] text-xs uppercase tracking-wider">Signature atelier</p>
          <div className="mt-12 h-px" />
        </div>
      </div>
    </DocumentLayout>
  );
}

export function QuoteDocument({
  quote,
  customer,
  repair,
  workshop,
}: Readonly<{ quote: Quote; customer: Customer; repair?: Repair; workshop?: WorkshopInfo }>) {
  const total = getQuoteTotal(quote);
  const vat = 0;
  return (
    <DocumentLayout badge={quote.status} date={quote.date} number={quote.number} title="Devis" workshop={workshop}>
      <InfoGrid>
        <InfoBox title="Client">
          <p className="font-medium">{customer.name}</p>
          <p>{customer.phone}</p>
          <p>{customer.email || "-"}</p>
        </InfoBox>
        {repair && (
          <InfoBox title="Appareil">
            <p className="font-medium">
              {repair.brandName} {repair.deviceModel ?? repair.model}
            </p>
            <p>Réparation liée : {repair.number}</p>
            <p>Panne : {repair.issue}</p>
          </InfoBox>
        )}
      </InfoGrid>

      <div className="overflow-hidden rounded-2xl border border-[#E7E4DC] print:rounded-none print:border-black">
        <div className="bg-[#FAFAF8] px-5 py-3 font-semibold text-[#1A1916] text-sm">Détail des prestations</div>
        <div className="divide-y divide-[#E7E4DC] px-5">
          {quote.lines.map((line) => (
            <div className="grid grid-cols-[1fr_80px_120px] items-center py-4 text-sm" key={line.id}>
              <span className="font-medium">{line.description}</span>
              <span className="text-center">x{line.quantity}</span>
              <span className="text-right font-semibold">{formatEuro(line.quantity * line.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E7E4DC] bg-[#FAFAF8] px-5 py-5">
          <MoneyRow label="Total HT" value={formatEuro(total)} />
          <MoneyRow label="TVA" value={formatEuro(vat)} />
          <MoneyRow emphasize label="Total TTC" value={formatEuro(total + vat)} />
          {workshop?.isMicroEnterprise && (
            <p className="mt-2 text-right text-[#6B6B6B] text-[10px]">TVA non applicable — article 293 B du CGI</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[#6B6B6B] text-xs">
          Mention : {workshop?.quoteTerms || "Prix valables sous réserve de disponibilité des pièces."}
        </p>
        {quote.notes && (
          <div className="rounded-xl bg-[#F6F7F4] p-4 text-sm italic">
            <p className="mb-1 font-medium text-[#6B6B6B] text-xs not-italic">Note :</p>
            {quote.notes}
          </div>
        )}
      </div>

      <div className="pt-8">
        <div className="max-w-[240px] border-t border-[#E7E4DC] pt-4">
          <p className="font-medium text-[#6B6B6B] text-xs uppercase tracking-wider">
            Bon pour accord (Signature) {workshop?.managerSignature ? `— ${workshop.managerSignature}` : ""}
          </p>
          <div className="mt-16 h-px" />
        </div>
      </div>
    </DocumentLayout>
  );
}

export function InvoiceDocument({
  invoice,
  customer,
  quote,
  repair,
  workshop,
}: Readonly<{ invoice: Invoice; customer: Customer; quote?: Quote; repair?: Repair; workshop?: WorkshopInfo }>) {
  const total = getInvoiceTotal(invoice);
  const paidAmount = Math.max(invoice.paidAmount ?? 0, invoice.status === "Payée" ? total : 0);
  return (
    <DocumentLayout
      badge={invoice.status === "Payée" ? "PAYÉE" : undefined}
      date={invoice.date}
      number={invoice.number}
      title="Facture"
      workshop={workshop}
    >
      <InfoGrid>
        <InfoBox title="Client">
          <p className="font-medium">{customer.name}</p>
          <p>{customer.phone}</p>
          <p>{customer.email || "-"}</p>
        </InfoBox>
        <InfoBox title="Informations">
          {repair && (
            <>
              <p>
                <span className="font-medium">Réparation liée :</span> {repair.number}
              </p>
              <p>
                <span className="font-medium">Appareil :</span> {repair.brandName} {repair.deviceModel ?? repair.model}
              </p>
            </>
          )}
          {quote && (
            <p>
              <span className="font-medium">Devis lié :</span> {quote.number}
            </p>
          )}
          <p>
            <span className="font-medium">Statut facture :</span> {invoice.status}
          </p>
          <p>
            <span className="font-medium">Statut paiement :</span>{" "}
            {invoice.status === "Payée" ? `Payée (${formatEuro(paidAmount)})` : "Non réglée"}
          </p>
        </InfoBox>
      </InfoGrid>

      <div className="overflow-hidden rounded-2xl border border-[#E7E4DC] print:rounded-none print:border-black">
        <div className="bg-[#FAFAF8] px-5 py-3 font-semibold text-[#1A1916] text-sm">Détail</div>
        <div className="divide-y divide-[#E7E4DC] px-5">
          {invoice.lines.map((line) => (
            <div className="grid grid-cols-[1fr_80px_120px] items-center py-4 text-sm" key={line.id}>
              <span className="font-medium">{line.description}</span>
              <span className="text-center">x{line.quantity}</span>
              <span className="text-right font-semibold">{formatEuro(line.quantity * line.unitPrice)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E7E4DC] bg-[#FAFAF8] px-5 py-5">
          <MoneyRow label="Total HT" value={formatEuro(total)} />
          <MoneyRow label="TVA" value={formatEuro(0)} />
          <MoneyRow emphasize label="Total TTC" value={formatEuro(total)} />
          {workshop?.isMicroEnterprise && (
            <p className="mt-2 text-right text-[#6B6B6B] text-[10px]">TVA non applicable — article 293 B du CGI</p>
          )}
          {invoice.status === "Payée" && (
            <div className="mt-4 border-t border-[#E7E4DC] pt-4 text-[#167B70] text-sm">
              <p>
                Paiement reçu le {invoice.paidAt ?? invoice.date} via {invoice.paymentMethod ?? "-"}.
              </p>
            </div>
          )}
          {workshop?.invoiceTerms ? <p className="mt-2 text-[#6B6B6B] text-xs">{workshop.invoiceTerms}</p> : null}
        </div>
      </div>
    </DocumentLayout>
  );
}

export function PaymentReceiptDocument({
  payment,
  customer,
  invoice,
  repair,
  workshop,
}: Readonly<{
  payment: Payment;
  customer: Customer;
  invoice?: Invoice;
  repair?: Repair;
  workshop?: WorkshopInfo;
}>) {
  return (
    <DocumentLayout
      badge="Paiement validé"
      date={payment.date}
      number={payment.paymentNumber}
      title="Reçu de paiement"
      workshop={workshop}
    >
      <InfoGrid>
        <InfoBox title="Client">
          <p className="font-medium">{customer.name}</p>
          <p>{customer.phone}</p>
        </InfoBox>
        <InfoBox title="Détails du paiement">
          <p>
            <span className="font-medium">Montant :</span> {formatEuro(payment.amount)}
          </p>
          <p>
            <span className="font-medium">Méthode :</span> {payment.method}
          </p>
          <p>
            <span className="font-medium">Statut :</span> {payment.status}
          </p>
          <p>
            <span className="font-medium">Référence :</span> {payment.paymentNumber || payment.reference || "-"}
          </p>
        </InfoBox>
      </InfoGrid>

      <section className="rounded-2xl border border-[#E7E4DC] p-5 print:rounded-none">
        <h3 className="mb-4 font-semibold text-[#1A1916]">Prestations liées</h3>
        <div className="space-y-2 text-sm">
          {invoice && (
            <p>
              <span className="font-medium">Facture liée :</span> {invoice.number}
            </p>
          )}
          {repair && (
            <p>
              <span className="font-medium">Réparation liée :</span> {repair.number} ({repair.brandName}{" "}
              {repair.deviceModel ?? repair.model})
            </p>
          )}
        </div>
      </section>

      <div className="mt-8 rounded-2xl bg-[#EAF6F2] p-6 text-center text-[#167B70]">
        <p className="font-semibold text-lg">Merci de votre confiance !</p>
        <p className="mt-1 text-sm">Ce document fait office de preuve de paiement.</p>
      </div>
    </DocumentLayout>
  );
}

export function DocumentById({ id }: Readonly<{ id: string }>) {
  void id;
  // This function is now legacy or for demo purposes if not updated.
  // Real implementation will use specific components above.
  return <p>Sélectionnez un document spécifique.</p>;
}
