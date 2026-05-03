"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  createPriceBookItem,
  normalizePriceBookItem,
  type PriceBookInput,
  type PriceBookItem,
  seedPriceBookExamples,
  updatePriceBookItem,
} from "@/lib/price-book";
import { appointments as appointmentMocks } from "@/mock/appointments";
import { customers as customerMocks } from "@/mock/customers";
import { invoices as invoiceMocks } from "@/mock/invoices";
import { transactions as paymentMocks } from "@/mock/payments";
import { quote as quoteMock } from "@/mock/quotes";
import { repairKanbanColumns } from "@/mock/repairs";
import { stockItems as stockMocks } from "@/mock/stock";
import { deviceCatalog, type DeviceCategory } from "@/data/deviceCatalog";

export type RepairStatus =
  | "Reçu"
  | "Diagnostic"
  | "Préparation / Réparation"
  | "Test final"
  | "Prêt"
  | "Restitué"
  | "Annulé";
export type InvoiceStatus = "Brouillon" | "Envoyée" | "Payée" | "Annulée";
export type QuoteStatus = "Brouillon" | "Envoyé" | "Accepté" | "Refusé" | "Facturé";
export type PaymentStatus = "Payé" | "Annulé" | "Remboursé";
export type PaymentMethod = "Espèces" | "Carte" | "Virement" | "Paiement en ligne simulé";
export type DocumentType = "intake" | "quote" | "invoice" | "payment" | "internal" | "summary";
export type DeviceType = "Smartphone" | "Tablette" | "Ordinateur" | "Console" | "Autre";

export type DeviceBrand = {
  id: string;
  name: string;
  deviceTypes: DeviceType[];
};

export type DeviceModel = {
  id: string;
  brandId: string;
  name: string;
  deviceType: DeviceType;
  aliases?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartCategory = {
  id: string;
  name: string;
  deviceTypes: DeviceType[];
};

export type Customer = {
  id: string;
  shopId: string;
  name: string;
  type?: "named" | "counter";
  initials: string;
  phone: string;
  email: string;
  address?: string;
  device: string;
  lastVisit: string;
  totalSpent: number;
  status: string;
  lastRepair: string;
  interventions: number;
  source: string;
  notes?: string;
  tags?: string;
};

export type PriceSnapshot = {
  source: "catalogue" | "manual";
  priceBookItemId?: string;
  /** Libellé type appareil (ex. Smartphone, Console) */
  typeAppareil?: string;
  marque?: string;
  modele?: string;
  piece: string;
  reparation: string;
  qualite: string;
  sku?: string;
  fournisseur?: string;
  prixAchat?: number;
  prixVentePiece: number;
  mainOeuvre: number;
  prixClientTotal: number;
  marge?: number;
  garantie?: string;
  notes?: string;
  stockDisponible?: number;
  selectedAt: string;
};

export type RepairPart = {
  stockItemId: string;
  name: string;
  reference: string;
  sku?: string;
  categoryName?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
};

export type Repair = {
  id: string;
  shopId: string;
  number: string;
  customerId: string;
  appointmentId?: string;
  quoteId?: string;
  quoteIds?: string[];
  invoiceId?: string;
  invoiceIds?: string[];
  paymentId?: string;
  paymentIds?: string[];
  deviceType?: DeviceType;
  brandId?: string;
  brandName?: string;
  modelId?: string;
  deviceModel?: string;
  issueType?: string;
  device: string;
  model: string;
  issue: string;
  status: RepairStatus;
  amount: number;
  laborPrice?: number;
  total?: number;
  notes: string;
  droppedAt: string;
  estimatedDoneAt: string;
  technician: string;
  imei: string;
  parts: RepairPart[];
  history: string[];
  selectedPriceSnapshot?: PriceSnapshot;
};

export type QuoteLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Quote = {
  id: string;
  shopId: string;
  number: string;
  customerId: string;
  repairId?: string;
  invoiceId?: string;
  status: QuoteStatus;
  date: string;
  expiryDate: string;
  lines: QuoteLine[];
  notes?: string;
  totalAmount: number;
  sourceType?: string;
};

export type Invoice = {
  id: string;
  shopId: string;
  number: string;
  customerId: string;
  repairId?: string;
  quoteId?: string;
  status: InvoiceStatus;
  date: string;
  lines: QuoteLine[];
  sourceType: "quote" | "repair" | "client" | "manual";
  sourceNumber?: string;
  paymentMethod: string;
  paymentIds?: string[];
  paidAmount?: number;
  paidAt?: string;
};

export type Payment = {
  id: string;
  shopId: string;
  invoiceId: string;
  customerId: string;
  repairId?: string;
  quoteId?: string;
  paymentNumber: string;
  reference: string;
  method: PaymentMethod;
  mode: string;
  status: PaymentStatus;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  shopId: string;
  customerId: string;
  repairId?: string;
  device: string;
  issue: string;
  date: string;
  time: string;
  duration: string;
  channel: string;
  source: string;
  technician: string;
  notes: string;
  status: string;
  confirmed: boolean;
  dayIndex: number;
  row: number;
  color: string;
  type?: "repair_pickup" | "standard";
};

export type StockItem = {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  deviceType: DeviceType;
  brandId?: string;
  brandName?: string;
  modelIds: string[];
  compatibleModels: string[];
  categoryId: string;
  categoryName: string;
  part: string;
  reference: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  stock: number;
  threshold: number;
  supplier: string;
  leadTime: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkshopInfo = {
  brand: string;
  name: string;
  address: string;
  postalCode?: string;
  city?: string;
  postalCity: string;
  country: string;
  siret: string;
  email: string;
  phone: string;
  website?: string;
  tvaNumber?: string;
  vatApplicable?: boolean;
  isMicroEnterprise?: boolean;
  tvaMention?: string;
  quoteTerms?: string;
  invoiceTerms?: string;
  documentFooter?: string;
  acceptedPaymentMethods?: string[];
  businessHours?: string;
  allowCounterClient?: boolean;
  repairPrefix?: string;
  quotePrefix?: string;
  invoicePrefix?: string;
  receiptPrefix?: string;
  nextRepairNumber?: number;
  nextQuoteNumber?: number;
  nextInvoiceNumber?: number;
  nextReceiptNumber?: number;
  defaultWarranty?: string;
  managerSignature?: string;
  logoUrl?: string;
};

export type WorkshopSettings = WorkshopInfo & {
  configuredAt?: string;
  updatedAt?: string;
};

export type BeharDocument = {
  id: string;
  shopId: string;
  type: DocumentType;
  title: string;
  customerId: string;
  repairId?: string;
  quoteId?: string;
  invoiceId?: string;
  paymentId?: string;
  createdAt: string;
};

export type MessageLog = {
  id: string;
  shopId: string;
  customerId: string;
  repairId?: string;
  channel: "SMS" | "Email";
  subject: string;
  body: string;
  createdAt: string;
};

export type StoreState = {
  workshopInfo: WorkshopInfo;
  workshopSettings: WorkshopSettings;
  onboardingCompleted: boolean;
  configuredAt?: string;
  updatedAt?: string;
  selectedCustomerId: string;
  selectedRepairId: string;
  selectedQuoteId: string;
  selectedInvoiceId: string;
  selectedPaymentId: string;
  selectedAppointmentId: string;
  selectedStockItemId: string;
  selectedDocumentId: string;
  deviceBrands: DeviceBrand[];
  deviceModels: DeviceModel[];
  partCategories: PartCategory[];
  customers: Customer[];
  repairs: Repair[];
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  appointments: Appointment[];
  stockItems: StockItem[];
  documents: BeharDocument[];
  messageLogs: MessageLog[];
  priceBookItems: PriceBookItem[];
  isCatalogPreloaded: boolean;
  addDeviceBrand: (input: { name: string; deviceType: DeviceType }) => string;
  updateDeviceBrand: (id: string, patch: Partial<Pick<DeviceBrand, "name" | "deviceTypes">>) => void;
  addDeviceModel: (input: { brandId: string; name: string; deviceType: DeviceType; aliases?: string[] }) => string;
  updateDeviceModel: (id: string, patch: Partial<Pick<DeviceModel, "name" | "aliases" | "deviceType" | "brandId">>) => void;
  toggleDeviceModel: (id: string, isActive: boolean) => void;
  setSelected: (entity: SelectableEntity, id: string) => void;
  loadPreloadedCatalog: () => Promise<void>;
  addPriceBookItem: (input: PriceBookInput) => string;
  updatePriceBookItem: (id: string, patch: Partial<PriceBookItem>) => void;
  deletePriceBookItem: (id: string) => void;
  togglePriceBookItem: (id: string, isActive: boolean) => void;
  addCustomer: (input: Partial<Customer> & Pick<Customer, "name">) => string;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addRepair: (input: RepairInput) => string;
  updateRepair: (id: string, patch: Partial<Repair>) => void;
  deleteRepair: (id: string) => void;
  changeRepairStatus: (id: string, status: RepairStatus) => void;
  addPartToRepair: (repairId: string, stockItemId: string, quantity?: number) => boolean;
  removePartFromRepair: (repairId: string, stockItemId: string) => boolean;
  addQuote: (input: QuoteInput) => string;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  addQuoteLine: (quoteId: string) => void;
  updateQuoteLine: (quoteId: string, lineId: string, patch: Partial<QuoteLine>) => void;
  deleteQuoteLine: (quoteId: string, lineId: string) => void;
  convertQuoteToInvoice: (quoteId: string) => string;
  addInvoice: (input: InvoiceInput) => string;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markInvoicePaid: (invoiceId: string, method?: PaymentMethod, note?: string) => string;
  createInvoiceFromRepair: (repairId: string) => string;
  markRepairAsPaid: (repairId: string, method?: PaymentMethod, note?: string) => string;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  addAppointment: (input: AppointmentInput) => string;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string, deleteLinkedRepair?: boolean) => void;
  createRepairFromAppointment: (appointmentId: string) => string;
  addStockItem: (input: StockInput) => string;
  updateStockItem: (id: string, patch: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  restockItem: (id: string, quantity?: number) => void;
  importStockItems: (items: StockInput[]) => void;
  sendMessage: (input: MessageInput) => void;
  updateWorkshopInfo: (patch: Partial<WorkshopInfo>) => void;
  saveWorkshopSettings: (settings: Partial<WorkshopSettings>) => void;
  setOnboardingCompleted: (done: boolean) => void;
  addDocument: (input: Omit<BeharDocument, "id" | "shopId" | "createdAt">) => string;
  deleteDocument: (id: string) => void;
  resetDemo: () => void;
};

type SelectableEntity =
  | "customer"
  | "repair"
  | "quote"
  | "invoice"
  | "payment"
  | "appointment"
  | "stockItem"
  | "document";
type RepairInput = Pick<
  Repair,
  "customerId" | "device" | "issue" | "status" | "amount" | "notes" | "droppedAt" | "technician"
> &
  Partial<
    Pick<
      Repair,
      | "model"
      | "imei"
      | "estimatedDoneAt"
      | "appointmentId"
      | "deviceType"
      | "brandId"
      | "brandName"
      | "modelId"
      | "deviceModel"
      | "issueType"
      | "laborPrice"
      | "total"
      | "selectedPriceSnapshot"
      | "history"
      | "parts"
    >
  >;
type QuoteInput = Pick<Quote, "customerId"> & Partial<Pick<Quote, "repairId" | "notes" | "status">> & { lines?: any[] };
type InvoiceInput = Pick<Invoice, "customerId"> &
  Partial<Pick<Invoice, "repairId" | "quoteId" | "status" | "sourceType" | "sourceNumber" | "paymentMethod">> & {
    lines?: any[];
  };
type AppointmentInput = Pick<Appointment, "customerId" | "device" | "issue" | "date" | "time"> &
  Partial<
    Pick<
      Appointment,
      | "repairId"
      | "duration"
      | "channel"
      | "source"
      | "technician"
      | "notes"
      | "status"
      | "confirmed"
      | "dayIndex"
      | "row"
      | "color"
    >
  >;
type StockInput = Pick<StockItem, "purchasePrice" | "salePrice" | "threshold" | "supplier"> &
  Partial<
    Pick<
      StockItem,
      | "part"
      | "reference"
      | "category"
      | "stock"
      | "sku"
      | "name"
      | "deviceType"
      | "brandId"
      | "brandName"
      | "modelIds"
      | "compatibleModels"
      | "categoryId"
      | "categoryName"
      | "quantity"
      | "leadTime"
    >
  >;
type MessageInput = Pick<MessageLog, "customerId" | "channel" | "subject" | "body"> &
  Partial<Pick<MessageLog, "repairId">>;

const shopId = "shop_atelier_belmin";

const catalogTimestamp = "2026-04-29";

const categoryToType = (cat: DeviceCategory): DeviceType => {
  switch (cat) {
    case "smartphone": return "Smartphone";
    case "tablet": return "Tablette";
    case "computer": return "Ordinateur";
    case "console": return "Console";
    default: return "Autre";
  }
};

// On construit deviceBrands et deviceModels dynamiquement depuis deviceCatalog.ts (Source Propre)
const { generatedBrands, generatedModels } = (() => {
  const brandsMap = new Map<string, DeviceBrand>();
  const modelsList: DeviceModel[] = [];

  for (const entry of deviceCatalog) {
    const cleanBrandName = entry.brand.replace(/\s*\(.*\)/, "").trim();
    const brandId = `brand_${cleanBrandName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const deviceType = categoryToType(entry.category);

    if (!brandsMap.has(brandId)) {
      brandsMap.set(brandId, {
        id: brandId,
        name: cleanBrandName,
        deviceTypes: [],
      });
    }
    const brand = brandsMap.get(brandId)!;
    if (!brand.deviceTypes.includes(deviceType)) {
      brand.deviceTypes.push(deviceType);
    }

    for (const modelName of entry.models) {
      const modelId = `model_${modelName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      modelsList.push({
        id: modelId,
        brandId,
        name: modelName,
        deviceType,
        aliases: entry.aliases,
        isActive: true,
        createdAt: catalogTimestamp,
        updatedAt: catalogTimestamp,
      });
    }
  }

  // Ajout de la marque "Autre" par défaut
  if (!brandsMap.has("brand_other")) {
    brandsMap.set("brand_other", {
      id: "brand_other",
      name: "Autre",
      deviceTypes: ["Smartphone", "Tablette", "Ordinateur", "Console", "Autre"],
    });
  }

  return {
    generatedBrands: Array.from(brandsMap.values()),
    generatedModels: modelsList,
  };
})();

export const deviceBrands: DeviceBrand[] = generatedBrands;
export const deviceModels: DeviceModel[] = generatedModels;

export const partCategories: PartCategory[] = [
  { id: "cat_screen", name: "Écran", deviceTypes: ["Smartphone", "Tablette"] },
  { id: "cat_battery", name: "Batterie", deviceTypes: ["Smartphone", "Tablette", "Ordinateur", "Console"] },
  { id: "cat_charge_port", name: "Connecteur de charge", deviceTypes: ["Smartphone", "Tablette", "Console"] },
  { id: "cat_camera", name: "Caméra", deviceTypes: ["Smartphone", "Tablette"] },
  { id: "cat_back_glass", name: "Vitre arrière", deviceTypes: ["Smartphone"] },
  { id: "cat_speaker", name: "Haut-parleur", deviceTypes: ["Smartphone", "Tablette", "Ordinateur", "Console"] },
  { id: "cat_joystick", name: "Joystick", deviceTypes: ["Console"] },
  { id: "cat_fan", name: "Ventilateur", deviceTypes: ["Ordinateur", "Console"] },
  { id: "cat_thermal_paste", name: "Pâte thermique", deviceTypes: ["Ordinateur", "Console"] },
  { id: "cat_diagnostic", name: "Diagnostic", deviceTypes: ["Smartphone", "Tablette", "Ordinateur", "Console"] },
  { id: "cat_other", name: "Autre", deviceTypes: ["Smartphone", "Tablette", "Ordinateur", "Console"] },
];

const defaultWorkshopInfo: WorkshopInfo = {
  brand: "BEHAR • TECH",
  name: "Behar Tech",
  address: "2 rue de la Zone",
  postalCode: "74100",
  city: "Annemasse",
  postalCity: "74100 Annemasse",
  country: "France",
  siret: "000 000 000 00000",
  email: "contact@behartechpro.fr",
  phone: "06 12 34 56 78",
  website: "",
  tvaNumber: "",
  vatApplicable: false,
  isMicroEnterprise: true,
  tvaMention: "TVA non applicable — art. 293 B du CGI",
  quoteTerms: "Devis valable 30 jours.",
  invoiceTerms: "Paiement comptant à réception.",
  documentFooter: "Merci pour votre confiance.",
  acceptedPaymentMethods: ["Espèces", "Carte bancaire", "Virement"],
  businessHours: "Lun-Ven 09:00-18:00 · Sam 09:00-13:00",
  allowCounterClient: true,
  repairPrefix: "REP",
  quotePrefix: "DEV",
  invoicePrefix: "FAC",
  receiptPrefix: "REC",
  nextRepairNumber: 1,
  nextQuoteNumber: 1,
  nextInvoiceNumber: 1,
  nextReceiptNumber: 1,
  defaultWarranty: "Garantie 3 mois sur pièce remplacée.",
  managerSignature: "Responsable atelier",
  logoUrl: "/assets/logos/logo-horizontal.jpg",
};
export const workshopInfo = defaultWorkshopInfo;
const defaultWorkshopSettings: WorkshopSettings = {
  ...defaultWorkshopInfo,
  configuredAt: undefined,
  updatedAt: undefined,
};

const asWorkshopInfo = (settings: WorkshopSettings): WorkshopInfo => ({
  ...settings,
});

const euro = (value: string | number) =>
  typeof value === "number" ? value : Number(value.replace(/\s/g, "").replace("€", "").replace(",", ".").trim()) || 0;
export const formatEuro = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    typeof value === "number" && Number.isFinite(value) ? value : 0,
  );
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
const todayLabel = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const thirtyDaysLaterLabel = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const nowLabel = () =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AN";
const safeLineAmount = (line: QuoteLine) => {
  const fromTotal = typeof line.total === "number" && Number.isFinite(line.total) ? line.total : undefined;
  const q = Number.isFinite(line.quantity) ? line.quantity : 0;
  const u = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;
  const computed = q * u;
  const value = fromTotal ?? computed;
  return Number.isFinite(value) ? value : 0;
};
const quoteTotal = (quote: Pick<Quote, "lines">) =>
  quote.lines.reduce((total, line) => total + safeLineAmount(line), 0);
const invoiceTotal = (invoice: Pick<Invoice, "lines">) =>
  invoice.lines.reduce((total, line) => total + safeLineAmount(line), 0);
const normalizeCounter = (value: unknown, fallback = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
};
const padDocNumber = (n: number) => String(normalizeCounter(n)).padStart(4, "0");
const docNumber = (prefix: string | undefined, n: number, fallbackPrefix: string) =>
  `${normalizeText(prefix, fallbackPrefix).toUpperCase()}-${padDocNumber(n)}`;
const clampMoney = (value: number | undefined) => Math.max(0, Number.isFinite(value ?? 0) ? (value ?? 0) : 0);
const clampQuantity = (value: number | undefined) =>
  Math.max(0, Math.floor(Number.isFinite(value ?? 0) ? (value ?? 0) : 0));
const repairStatuses: RepairStatus[] = [
  "Reçu",
  "Diagnostic",
  "Préparation / Réparation",
  "Test final",
  "Prêt",
  "Restitué",
  "Annulé",
];
const quoteStatuses: QuoteStatus[] = ["Brouillon", "Envoyé", "Accepté", "Refusé", "Facturé"];
const invoiceStatuses: InvoiceStatus[] = ["Brouillon", "Envoyée", "Payée", "Annulée"];
const paymentStatuses: PaymentStatus[] = ["Payé", "Annulé", "Remboursé"];
export const paymentMethods: PaymentMethod[] = ["Espèces", "Carte", "Virement", "Paiement en ligne simulé"];
const deviceTypes: DeviceType[] = ["Smartphone", "Tablette", "Ordinateur", "Console", "Autre"];
const normalizeText = (value: unknown, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const text = value.trim();
  return text || fallback;
};
const normalizeRepairStatus = (status: unknown): RepairStatus =>
  repairStatuses.includes(status as RepairStatus) ? (status as RepairStatus) : "Reçu";
const normalizeDeviceType = (type: unknown, fallback: DeviceType = "Smartphone"): DeviceType =>
  deviceTypes.includes(type as DeviceType) ? (type as DeviceType) : fallback;
const findBrandByName = (name: unknown) => {
  const text = normalizeText(name).toLowerCase();
  return deviceBrands.find((brand) => brand.name.toLowerCase() === text);
};
const findModelByName = (name: unknown, brandId?: string) => {
  const text = normalizeText(name).toLowerCase();
  const exactMatch = deviceModels.find(
    (entry) =>
      (!brandId || entry.brandId === brandId) &&
      (entry.name.toLowerCase() === text || entry.aliases?.some((alias) => alias.toLowerCase() === text)),
  );
  if (exactMatch) return exactMatch;
  return deviceModels
    .filter(
      (entry) =>
        (!brandId || entry.brandId === brandId) &&
        (text.includes(entry.name.toLowerCase()) || entry.aliases?.some((alias) => text.includes(alias.toLowerCase()))),
    )
    .sort((a, b) => b.name.length - a.name.length)[0];
};
const getCategoryByName = (name: unknown) => {
  const text = normalizeText(name).toLowerCase();
  if (text.includes("écran") || text.includes("ecran"))
    return partCategories.find((entry) => entry.id === "cat_screen");
  if (text.includes("batterie")) return partCategories.find((entry) => entry.id === "cat_battery");
  if (text.includes("connecteur") || text.includes("charge"))
    return partCategories.find((entry) => entry.id === "cat_charge_port");
  if (text.includes("joystick")) return partCategories.find((entry) => entry.id === "cat_joystick");
  if (text.includes("ventilateur")) return partCategories.find((entry) => entry.id === "cat_fan");
  return partCategories.find((entry) => entry.name.toLowerCase() === text) ?? partCategories.at(-1);
};
const inferDeviceCatalog = (device: unknown, modelName?: unknown) => {
  const source = `${normalizeText(device)} ${normalizeText(modelName)}`.toLowerCase();
  if (source.includes("iphone") || source.includes("macbook")) {
    const foundModel = findModelByName(modelName ?? device, "brand_apple");
    return {
      deviceType: foundModel?.deviceType ?? (source.includes("macbook") ? "Ordinateur" : "Smartphone"),
      brandId: "brand_apple",
      brandName: "Apple",
      modelId: foundModel?.id,
      deviceModel: foundModel?.name ?? normalizeText(modelName, normalizeText(device)),
    };
  }
  if (source.includes("galaxy") || source.includes("samsung")) {
    const foundModel = findModelByName(modelName ?? device, "brand_samsung");
    return {
      deviceType: "Smartphone" as DeviceType,
      brandId: "brand_samsung",
      brandName: "Samsung",
      modelId: foundModel?.id,
      deviceModel: foundModel?.name ?? normalizeText(modelName, normalizeText(device)),
    };
  }
  if (source.includes("switch")) {
    const foundModel = findModelByName(modelName ?? device, "brand_nintendo");
    return {
      deviceType: "Console" as DeviceType,
      brandId: "brand_nintendo",
      brandName: "Nintendo",
      modelId: foundModel?.id,
      deviceModel: foundModel?.name ?? normalizeText(modelName, normalizeText(device)),
    };
  }
  if (source.includes("ps4") || source.includes("ps5") || source.includes("playstation")) {
    const foundModel = findModelByName(modelName ?? device, "brand_sony");
    return {
      deviceType: "Console" as DeviceType,
      brandId: "brand_sony",
      brandName: "Sony",
      modelId: foundModel?.id,
      deviceModel: foundModel?.name ?? normalizeText(modelName, normalizeText(device)),
    };
  }
  return {
    deviceType: "Smartphone" as DeviceType,
    brandId: "brand_other",
    brandName: "Autre",
    modelId: undefined,
    deviceModel: normalizeText(modelName, normalizeText(device, "Modèle à renseigner")),
  };
};

export const toLocalIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const getNowIso = () => toLocalIso(new Date());

export const getTomorrowIso = (hour = 15, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return toLocalIso(d);
};

export const formatIsoToDisplay = (iso: string) => {
  if (!iso || iso.includes(",") || iso.includes("Aujourd'hui")) return iso; // Fallback
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso; // Not an ISO string

  try {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const hasTime = iso.includes("T") || iso.length > 10;
    const time = hasTime ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

    if (isToday) return hasTime ? `Aujourd'hui, ${time}` : "Aujourd'hui";
    if (isTomorrow) return hasTime ? `Demain, ${time}` : "Demain";

    const datePart = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return hasTime ? `${datePart} à ${time}` : datePart;
  } catch (e) {
    return iso;
  }
};
const getValidCustomerId = (customerId: unknown, customers: Customer[], fallback = "") => {
  const id = normalizeText(customerId);
  if (id && customers.some((customer) => customer.id === id)) return id;
  if (fallback && customers.some((customer) => customer.id === fallback)) return fallback;
  return customers[0]?.id ?? "";
};

/** Ligne éditable devis (placeholders autorisés). */
const PLACEHOLDER_LINE_DESCRIPTION = "Ligne à compléter";

const sanitizeQuoteLines = (lines: any[] | undefined): QuoteLine[] =>
  (Array.isArray(lines) ? lines : []).map((line) => {
    const qty = clampQuantity(line.quantity);
    const price = clampMoney(line.unitPrice);
    return {
      ...line,
      id: normalizeText(line.id, uid("line")),
      description: normalizeText(line.description, PLACEHOLDER_LINE_DESCRIPTION),
      quantity: qty,
      unitPrice: price,
      total: qty * price,
    };
  });

const isUsableInvoiceLineDescription = (description: string) => {
  const t = normalizeText(description);
  return t.length > 0 && t !== PLACEHOLDER_LINE_DESCRIPTION;
};

/**
 * Lignes utilisables pour une facture (devis accepté → facture).
 * Exclut placeholders, quantités nulles et montants nuls.
 */
export const linesForInvoiceFromQuote = (lines: QuoteLine[] | any[]): QuoteLine[] =>
  sanitizeQuoteLines(lines).filter(
    (line) => isUsableInvoiceLineDescription(line.description) && line.quantity > 0 && line.unitPrice > 0,
  );

/**
 * Facture/devis directs depuis réparation : UNE SEULE ligne commerciale au prix final client.
 * Le client ne voit jamais le détail pièce + main-d'œuvre.
 * Source du prix final (par ordre de priorité) : repair.total → repair.amount → snapshot.prixClientTotal.
 */
export function buildInvoiceLinesFromRepair(
  repair: Repair,
): { ok: true; lines: QuoteLine[] } | { ok: false; message: string } {
  const snap = repair.selectedPriceSnapshot;
  const modelLabel = normalizeText(repair.deviceModel ?? repair.model);
  const brandLabel = normalizeText(repair.brandName);
  const interventionLabel =
    normalizeText(snap?.reparation) ||
    normalizeText(repair.issue) ||
    normalizeText(snap?.piece) ||
    "Réparation";

  const finalPrice = clampMoney(repair.total ?? repair.amount ?? snap?.prixClientTotal ?? 0);
  if (finalPrice <= 0) {
    return { ok: false, message: "Ajoutez un tarif à la réparation avant de facturer." };
  }

  const deviceTail = [brandLabel, modelLabel].filter(Boolean).join(" ").trim();
  const description = (deviceTail ? `${interventionLabel} — ${deviceTail}` : interventionLabel)
    .replace(/\s+/g, " ")
    .trim();

  return {
    ok: true,
    lines: [{ id: uid("line"), description, quantity: 1, unitPrice: finalPrice, total: finalPrice }],
  };
}

const resolveInvoiceCustomerId = (
  input: { customerId?: string },
  customers: Customer[],
  quote?: Quote,
  repair?: Repair,
) => {
  const tryId = (id: unknown) => {
    const t = normalizeText(String(id));
    return t && customers.some((c) => c.id === t) ? t : "";
  };
  return tryId(input.customerId) || tryId(quote?.customerId) || tryId(repair?.customerId) || "";
};
const normalizeQuoteStatus = (status: unknown): QuoteStatus =>
  status === "Converti"
    ? "Accepté"
    : quoteStatuses.includes(status as QuoteStatus)
      ? (status as QuoteStatus)
      : "Brouillon";
const normalizeInvoiceStatus = (status: unknown): InvoiceStatus =>
  invoiceStatuses.includes(status as InvoiceStatus) ? (status as InvoiceStatus) : "Brouillon";
const normalizePaymentStatus = (status: unknown): PaymentStatus => {
  if (status === "Réussi") return "Payé";
  if (status === "Échoué" || status === "En attente") return "Annulé";
  return paymentStatuses.includes(status as PaymentStatus) ? (status as PaymentStatus) : "Payé";
};
const normalizePaymentMethod = (method: unknown): PaymentMethod => {
  const text = normalizeText(method);
  if (paymentMethods.includes(text as PaymentMethod)) return text as PaymentMethod;
  const lower = text.toLowerCase();
  if (lower.includes("carte")) return "Carte";
  if (lower.includes("virement")) return "Virement";
  if (lower.includes("esp")) return "Espèces";
  return "Paiement en ligne simulé";
};
const uniqueIds = (ids: Array<string | undefined>) => [...new Set(ids.filter(Boolean) as string[])];
const repairPartsTotal = (parts: RepairPart[]) =>
  parts.reduce((total, part) => total + part.salePrice * part.quantity, 0);
const createRepairRecord = (input: RepairInput, sequence: number): Repair => {
  const device = normalizeText(input.device, "Appareil à renseigner");
  const model = normalizeText(input.model, device);
  const inferred = inferDeviceCatalog(device, input.deviceModel ?? model);
  const brand = input.brandId ? deviceBrands.find((entry) => entry.id === input.brandId) : undefined;
  const selectedModel = input.modelId ? deviceModels.find((entry) => entry.id === input.modelId) : undefined;
  const deviceType = normalizeDeviceType(input.deviceType ?? selectedModel?.deviceType ?? inferred.deviceType);
  const brandId = normalizeText(input.brandId, inferred.brandId);
  const brandName = normalizeText(input.brandName, brand?.name ?? inferred.brandName);
  const deviceModel = normalizeText(input.deviceModel, selectedModel?.name ?? model);
  const laborPrice = clampMoney(input.laborPrice ?? input.amount);
  return {
    id: uid("repair"),
    shopId,
    number: `R-2026-${String(sequence + 520).padStart(4, "0")}`,
    customerId: normalizeText(input.customerId),
    appointmentId: input.appointmentId,
    quoteIds: [],
    invoiceIds: [],
    deviceType,
    brandId,
    brandName,
    modelId: normalizeText(input.modelId, selectedModel?.id ?? inferred.modelId),
    deviceModel,
    issueType: normalizeText(input.issueType, normalizeText(input.issue, "Diagnostic")),
    device,
    model: deviceModel,
    issue: normalizeText(input.issue, "Problème à renseigner"),
    status: normalizeRepairStatus(input.status),
    amount: laborPrice,
    laborPrice,
    total: laborPrice,
    notes: normalizeText(input.notes),
    droppedAt: normalizeText(input.droppedAt, getNowIso()),
    estimatedDoneAt: normalizeText(input.estimatedDoneAt, getTomorrowIso()),
    technician: normalizeText(input.technician, "Atelier principal"),
    imei: normalizeText(input.imei, "IMEI non renseigné"),
    parts: [],
    history: ["Réparation créée"],
  };
};
const normalizeRepair = (
  repair: Partial<Repair>,
  customers: Customer[] = [],
  appointments: Partial<Appointment>[] = [],
): Repair => {
  const id = normalizeText(repair.id, uid("repair"));
  const device = normalizeText(repair.device, normalizeText(repair.model, "Appareil à renseigner"));
  const inferred = inferDeviceCatalog(device, repair.deviceModel ?? repair.model);
  const selectedBrand = repair.brandId ? deviceBrands.find((entry) => entry.id === repair.brandId) : undefined;
  const selectedModel = repair.modelId ? deviceModels.find((entry) => entry.id === repair.modelId) : undefined;
  const deviceType = normalizeDeviceType(repair.deviceType ?? selectedModel?.deviceType ?? inferred.deviceType);
  const brandId = normalizeText(repair.brandId, inferred.brandId);
  const brandName = normalizeText(repair.brandName, selectedBrand?.name ?? inferred.brandName);
  const deviceModel = normalizeText(repair.deviceModel, selectedModel?.name ?? normalizeText(repair.model, device));
  const linkedAppointment = repair.appointmentId
    ? appointments.find((appointment) => appointment.id === repair.appointmentId)
    : undefined;
  const linkedCustomerId = normalizeText(linkedAppointment?.customerId);
  const customerId = customers.length
    ? getValidCustomerId(linkedCustomerId || repair.customerId, customers)
    : normalizeText(linkedCustomerId || repair.customerId);
  const parts = Array.isArray(repair.parts)
    ? repair.parts.map((part) => ({
        stockItemId: normalizeText(part.stockItemId),
        name: normalizeText(part.name, "Pièce"),
        reference: normalizeText(part.reference),
        sku: normalizeText(part.sku, normalizeText(part.reference)),
        categoryName: normalizeText(part.categoryName),
        purchasePrice: clampMoney(part.purchasePrice),
        salePrice: clampMoney(part.salePrice),
        quantity: clampQuantity(part.quantity),
      }))
    : [];
  const partsTotal = repairPartsTotal(parts);
  const laborPrice = clampMoney(
    repair.laborPrice ?? (repair.amount !== undefined ? Math.max(0, repair.amount - partsTotal) : 0),
  );
  const total = clampMoney(repair.total ?? laborPrice + partsTotal);
  return {
    id,
    shopId: normalizeText(repair.shopId, shopId),
    number: normalizeText(repair.number, `R-2026-${id.slice(-4).padStart(4, "0")}`),
    customerId,
    appointmentId: repair.appointmentId,
    quoteId: repair.quoteId,
    quoteIds: uniqueIds([...(Array.isArray(repair.quoteIds) ? repair.quoteIds : []), repair.quoteId]),
    invoiceId: repair.invoiceId,
    invoiceIds: uniqueIds([...(Array.isArray(repair.invoiceIds) ? repair.invoiceIds : []), repair.invoiceId]),
    paymentId: repair.paymentId,
    paymentIds: uniqueIds([...(Array.isArray(repair.paymentIds) ? repair.paymentIds : []), repair.paymentId]),
    deviceType,
    brandId,
    brandName,
    modelId: normalizeText(repair.modelId, selectedModel?.id ?? inferred.modelId),
    deviceModel,
    issueType: normalizeText(repair.issueType, normalizeText(repair.issue, "Diagnostic")),
    device,
    model: deviceModel,
    issue: normalizeText(repair.issue, "Problème à renseigner"),
    status: normalizeRepairStatus(repair.status),
    amount: total,
    laborPrice,
    total,
    notes: normalizeText(repair.notes),
    droppedAt: normalizeText(repair.droppedAt, getNowIso()),
    estimatedDoneAt: normalizeText(repair.estimatedDoneAt, getTomorrowIso()),
    technician: normalizeText(repair.technician, "Atelier principal"),
    imei: normalizeText(repair.imei, "IMEI non renseigné"),
    parts,
    history: Array.isArray(repair.history) ? repair.history.map((entry) => normalizeText(entry)).filter(Boolean) : [],
    selectedPriceSnapshot: repair.selectedPriceSnapshot,
  };
};
const normalizeQuote = (quote: Partial<Quote>, customers: Customer[], repairs: Repair[]): Quote => {
  const id = normalizeText(quote.id, uid("quote"));
  const repairId = repairs.some((repair) => repair.id === quote.repairId) ? quote.repairId : undefined;
  const repair = repairs.find((entry) => entry.id === repairId);
  return {
    id,
    shopId: normalizeText(quote.shopId, shopId),
    number: normalizeText(quote.number, `DV-${id.slice(-4).padStart(4, "0")}`),
    customerId: getValidCustomerId(quote.customerId, customers, repair?.customerId),
    repairId,
    invoiceId: quote.invoiceId,
    status: normalizeQuoteStatus(quote.status),
    date: normalizeText(quote.date, todayLabel()),
    expiryDate: normalizeText(quote.expiryDate, thirtyDaysLaterLabel()),
    lines: sanitizeQuoteLines(
      Array.isArray(quote.lines) && quote.lines.length
        ? quote.lines
        : [{ id: uid("line"), description: "Ligne à compléter", quantity: 1, unitPrice: 0 }],
    ),
    notes: quote.notes || "",
    totalAmount: typeof quote.totalAmount === "number" ? quote.totalAmount : 0,
    sourceType: quote.sourceType || "direct",
  };
};
const syncRepairQuoteIds = (repairs: Repair[], quotes: Quote[]) =>
  repairs.map((repair) => {
    const linkedQuoteIds = quotes.filter((quote) => quote.repairId === repair.id).map((quote) => quote.id);
    const quoteIds = uniqueIds([...(repair.quoteIds ?? []), repair.quoteId, ...linkedQuoteIds]);
    return {
      ...repair,
      quoteId: quoteIds[0],
      quoteIds,
    };
  });
const syncRepairInvoiceIds = (repairs: Repair[], invoices: Invoice[]) =>
  repairs.map((repair) => {
    const linkedInvoiceIds = invoices.filter((invoice) => invoice.repairId === repair.id).map((invoice) => invoice.id);
    const invoiceIds = uniqueIds([...(repair.invoiceIds ?? []), repair.invoiceId, ...linkedInvoiceIds]);
    return {
      ...repair,
      invoiceId: invoiceIds[0],
      invoiceIds,
    };
  });
const syncRepairPaymentIds = (repairs: Repair[], payments: Payment[]) =>
  repairs.map((repair) => {
    const linkedPaymentIds = payments.filter((payment) => payment.repairId === repair.id).map((payment) => payment.id);
    const paymentIds = uniqueIds([...(repair.paymentIds ?? []), repair.paymentId, ...linkedPaymentIds]);
    return {
      ...repair,
      paymentId: paymentIds[0],
      paymentIds,
    };
  });
const syncQuoteInvoiceIds = (quotes: Quote[], invoices: Invoice[]) =>
  quotes.map((quote) => {
    const linkedInvoice = invoices.find((invoice) => invoice.quoteId === quote.id);
    return {
      ...quote,
      invoiceId: quote.invoiceId ?? linkedInvoice?.id,
    };
  });
const normalizeInvoice = (invoice: Partial<Invoice>, customers: Customer[], repairs: Repair[], quotes: Quote[]) => {
  const id = normalizeText(invoice.id, uid("invoice"));
  const quote = quotes.find((entry) => entry.id === invoice.quoteId);
  const repairId = repairs.some((repair) => repair.id === (invoice.repairId ?? quote?.repairId))
    ? (invoice.repairId ?? quote?.repairId)
    : undefined;
  const repair = repairs.find((entry) => entry.id === repairId);
  const inv = invoice as Partial<Invoice> & { items?: any[] };
  const fromItems =
    Array.isArray(inv.items) && inv.items.length
      ? inv.items.map((item: any, idx: number) => ({
          id: item.id ?? `line_${id}_${idx}`,
          description: item.description ?? item.label ?? "",
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? item.price ?? item.unit_price ?? 0,
        }))
      : undefined;
  const lineSource = Array.isArray(invoice.lines) && invoice.lines.length ? invoice.lines : fromItems;
  return {
    id,
    shopId: normalizeText(invoice.shopId, shopId),
    number: normalizeText(invoice.number, `FA-2026-${id.slice(-4).padStart(4, "0")}`),
    customerId: getValidCustomerId(invoice.customerId, customers, quote?.customerId ?? repair?.customerId),
    repairId,
    quoteId: quote?.id ?? invoice.quoteId,
    status: normalizeInvoiceStatus(invoice.status),
    date: normalizeText(invoice.date, todayLabel()),
    lines: sanitizeQuoteLines(
      lineSource && lineSource.length
        ? lineSource
        : [{ id: uid("line"), description: "Intervention atelier", quantity: 1, unitPrice: 90 }],
    ),
    paymentMethod: normalizeText(invoice.paymentMethod, "Non réglée"),
    paymentIds: uniqueIds([...(Array.isArray(invoice.paymentIds) ? invoice.paymentIds : [])]),
    paidAmount: clampMoney(invoice.paidAmount),
    paidAt: invoice.paidAt,
    sourceType: invoice.sourceType || (quote ? "quote" : repair ? "repair" : "manual"),
  };
};
const normalizePayment = (
  payment: Partial<Payment>,
  customers: Customer[],
  invoices: Invoice[],
): Payment | undefined => {
  const invoice = invoices.find((entry) => entry.id === payment.invoiceId);
  if (!invoice) return undefined;
  const customerId = getValidCustomerId(payment.customerId, customers, invoice.customerId);
  if (!customerId) return undefined;
  const id = normalizeText(payment.id, uid("payment"));
  const method = normalizePaymentMethod(payment.method ?? payment.mode);
  const paymentNumber = normalizeText(
    payment.paymentNumber,
    normalizeText(payment.reference, `PAY-2026-${id.slice(-4)}`),
  );
  const date = normalizeText(payment.date, nowLabel());
  return {
    id,
    shopId: normalizeText(payment.shopId, shopId),
    invoiceId: invoice.id,
    customerId,
    repairId: payment.repairId ?? invoice.repairId,
    quoteId: payment.quoteId ?? invoice.quoteId,
    paymentNumber,
    reference: paymentNumber,
    method,
    mode: method,
    status: normalizePaymentStatus(payment.status),
    amount: clampMoney(payment.amount),
    date,
    note: normalizeText(payment.note),
    createdAt: normalizeText(payment.createdAt, date),
    updatedAt: normalizeText(payment.updatedAt, date),
  };
};
const syncInvoicePayments = (invoices: Invoice[], payments: Payment[]) =>
  invoices.map((invoice) => {
    const relatedPayments = payments.filter((payment) => payment.invoiceId === invoice.id);
    const activePayments = relatedPayments.filter((payment) => payment.status === "Payé");
    const paidAmount = activePayments.reduce((total, payment) => total + payment.amount, 0);
    const total = invoiceTotal(invoice);
    const isPaid = total > 0 && paidAmount >= total;
    const paidAt = isPaid ? (invoice.paidAt ?? activePayments[0]?.date ?? nowLabel()) : undefined;
    const method = activePayments[0]?.method ?? invoice.paymentMethod;
    return {
      ...invoice,
      paymentIds: uniqueIds([...(invoice.paymentIds ?? []), ...relatedPayments.map((payment) => payment.id)]),
      paidAmount,
      paidAt,
      status: isPaid ? ("Payée" as InvoiceStatus) : invoice.status === "Payée" ? "Envoyée" : invoice.status,
      paymentMethod: isPaid ? method : invoice.paymentMethod === "Non réglée" ? "Non réglée" : invoice.paymentMethod,
    };
  });
const normalizeAppointment = (
  appointment: Partial<Appointment>,
  customers: Customer[],
  repairs: Partial<Repair>[] = [],
): Appointment => {
  const id = normalizeText(appointment.id, uid("appointment"));
  const linkedRepair = repairs.find((repair) => repair.id === appointment.repairId || repair.appointmentId === id);
  const customerId = getValidCustomerId(appointment.customerId, customers, linkedRepair?.customerId);
  const status = normalizeText(appointment.status, "prévu");
  return {
    id,
    shopId: normalizeText(appointment.shopId, shopId),
    customerId,
    repairId: linkedRepair?.id ?? appointment.repairId,
    device: normalizeText(appointment.device, linkedRepair?.device ?? "Appareil à renseigner"),
    issue: normalizeText(appointment.issue, linkedRepair?.issue ?? "Diagnostic"),
    date: normalizeText(appointment.date, todayLabel()),
    time: normalizeText(appointment.time, "14:30"),
    duration: normalizeText(appointment.duration, "30 min"),
    channel: normalizeText(appointment.channel, "Atelier"),
    source: normalizeText(appointment.source, "Atelier"),
    technician: normalizeText(appointment.technician, "Atelier principal"),
    notes: normalizeText(appointment.notes),
    status: linkedRepair && status !== "annulé" ? "terminé" : status,
    confirmed: appointment.confirmed ?? false,
    dayIndex: clampQuantity(appointment.dayIndex),
    row: clampQuantity(appointment.row),
    color: normalizeText(appointment.color, "mint"),
  };
};
const normalizeStockItem = (item: Partial<StockItem>): StockItem => {
  const id = normalizeText(item.id, uid("stock"));
  const name = normalizeText(item.name, normalizeText(item.part, "Pièce"));
  const sku = normalizeText(item.sku, normalizeText(item.reference, `REF-${Date.now()}`));
  const category = item.categoryId
    ? partCategories.find((entry) => entry.id === item.categoryId)
    : getCategoryByName(item.categoryName ?? item.category ?? name);
  const brand = item.brandId
    ? deviceBrands.find((entry) => entry.id === item.brandId)
    : (findBrandByName(item.brandName) ?? findBrandByName(name));
  const modelIds = uniqueIds(Array.isArray(item.modelIds) ? item.modelIds : []);
  const inferredModel = modelIds.length ? undefined : findModelByName(name, brand?.id);
  const finalModelIds = uniqueIds([...modelIds, inferredModel?.id]);
  const firstModel = finalModelIds.length ? deviceModels.find((entry) => entry.id === finalModelIds[0]) : undefined;
  const effectiveBrand = brand ?? deviceBrands.find((entry) => entry.id === firstModel?.brandId);
  const compatibleModels = uniqueIds([
    ...(Array.isArray(item.compatibleModels) ? item.compatibleModels : []),
    ...finalModelIds.map((modelId) => deviceModels.find((entry) => entry.id === modelId)?.name),
  ]);
  const deviceType = normalizeDeviceType(firstModel?.deviceType ?? item.deviceType ?? category?.deviceTypes[0]);
  const quantity = clampQuantity(item.quantity ?? item.stock);
  const now = todayLabel();
  return {
    id,
    shopId: normalizeText(item.shopId, shopId),
    sku,
    name,
    deviceType,
    brandId: effectiveBrand?.id ?? item.brandId,
    brandName: normalizeText(item.brandName, effectiveBrand?.name),
    modelIds: finalModelIds,
    compatibleModels,
    categoryId: category?.id ?? "cat_other",
    categoryName: category?.name ?? normalizeText(item.categoryName, normalizeText(item.category, "Autre")),
    part: name,
    reference: sku,
    category: category?.name ?? normalizeText(item.category, "Autre"),
    purchasePrice: clampMoney(item.purchasePrice),
    salePrice: clampMoney(item.salePrice),
    quantity,
    stock: quantity,
    threshold: clampQuantity(item.threshold),
    supplier: normalizeText(item.supplier, "Non renseigné"),
    leadTime: normalizeText(item.leadTime, "2 à 3 jours"),
    createdAt: normalizeText(item.createdAt, now),
    updatedAt: normalizeText(item.updatedAt, now),
  };
};
const normalizePersistedState = (state: unknown) => {
  const persisted = state && typeof state === "object" ? (state as Partial<StoreState>) : {};
  const now = nowLabel();
  const DEVICE_TYPES: DeviceType[] = ["Smartphone", "Tablette", "Ordinateur", "Console", "Autre"];
  const asDeviceType = (v: unknown): DeviceType | null =>
    typeof v === "string" && DEVICE_TYPES.includes(v as DeviceType) ? (v as DeviceType) : null;
  const persistedBrands: DeviceBrand[] = Array.isArray(persisted.deviceBrands)
    ? [
        ...persisted.deviceBrands
          .map((b) => {
            const id = String((b as any).id || uid("brand"));
            const seedBrand = seed.deviceBrands.find(
              (sb) => sb.id === id || sb.name.toLowerCase() === String((b as any).name || "").toLowerCase(),
            );
            const types = new Set([
              ...(Array.isArray((b as any).deviceTypes) ? (b as any).deviceTypes : []),
              ...(seedBrand?.deviceTypes || []),
            ]);
            return {
              id,
              name: String((b as any).name || seedBrand?.name || "Autre"),
              deviceTypes: (Array.from(types).filter(Boolean) as DeviceType[]).length
                ? (Array.from(types).filter(Boolean) as DeviceType[])
                : (["Autre"] as DeviceType[]),
            };
          })
          .filter((b) => b.name.trim().length > 0),
        ...seed.deviceBrands.filter(
          (seedBrand) =>
            !persisted.deviceBrands?.some(
              (b: any) => b.id === seedBrand.id || b.name.toLowerCase() === seedBrand.name.toLowerCase(),
            ),
        ),
      ]
    : seed.deviceBrands;

  const persistedModels: DeviceModel[] = Array.isArray(persisted.deviceModels)
    ? [
        ...persisted.deviceModels
          .map((m) => ({
            id: String((m as any).id || uid("model")),
            brandId: String((m as any).brandId || "brand_other"),
            name: String((m as any).name || "").trim(),
            deviceType: asDeviceType((m as any).deviceType) ?? "Autre",
            aliases: Array.isArray((m as any).aliases) ? ((m as any).aliases as string[]) : undefined,
            isActive: (m as any).isActive !== false,
            createdAt: typeof (m as any).createdAt === "string" ? (m as any).createdAt : now,
            updatedAt: typeof (m as any).updatedAt === "string" ? (m as any).updatedAt : now,
          }))
          .filter((m) => m.name.length > 0),
        ...seed.deviceModels.filter(
          (seedModel) =>
            !persisted.deviceModels?.some(
              (m: any) => m.id === seedModel.id || m.name.toLowerCase() === seedModel.name.toLowerCase(),
            ),
        ),
      ]
    : seed.deviceModels;

  const baseCustomers = Array.isArray(persisted.customers) ? persisted.customers : seed.customers;
  const rawAppointments = Array.isArray(persisted.appointments) ? persisted.appointments : seed.appointments;
  const initialRepairs = Array.isArray(persisted.repairs)
    ? persisted.repairs.map((repair) => normalizeRepair(repair, baseCustomers, rawAppointments))
    : seed.repairs;
  const initialAppointments = rawAppointments.map((appointment) =>
    normalizeAppointment(appointment, baseCustomers, initialRepairs),
  );
  const repairs = initialRepairs.map((repair) => normalizeRepair(repair, baseCustomers, initialAppointments));
  const appointments = initialAppointments.map((appointment) =>
    normalizeAppointment(appointment, baseCustomers, repairs),
  );
  const rawQuotes = (Array.isArray(persisted.quotes) ? persisted.quotes : seed.quotes)
    .map((quote) => normalizeQuote(quote, baseCustomers, repairs))
    .filter((quote) => quote.customerId);
  const rawInvoices = (Array.isArray(persisted.invoices) ? persisted.invoices : seed.invoices)
    .map((invoice) => normalizeInvoice(invoice, baseCustomers, repairs, rawQuotes))
    .filter((invoice) => invoice.customerId);
  const rawPayments = (Array.isArray(persisted.payments) ? persisted.payments : seed.payments)
    .map((payment) => normalizePayment(payment, baseCustomers, rawInvoices))
    .filter(Boolean) as Payment[];
  const invoices = syncInvoicePayments(rawInvoices, rawPayments);
  const quotes = syncQuoteInvoiceIds(rawQuotes, invoices);
  const repairsWithLinks = syncRepairPaymentIds(
    syncRepairInvoiceIds(syncRepairQuoteIds(repairs, quotes), invoices),
    rawPayments,
  );
  const payments = rawPayments;
  const customers = deriveCustomers(baseCustomers, repairsWithLinks, payments);
  const stockItems = (
    Array.isArray(persisted.stockItems)
      ? [
          ...persisted.stockItems.map(normalizeStockItem),
          ...seed.stockItems
            .filter((seedItem) => !persisted.stockItems?.some((item) => item.id === seedItem.id))
            .map(normalizeStockItem),
        ]
      : seed.stockItems
  ).filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  const workshopSettings: WorkshopSettings = {
    ...defaultWorkshopSettings,
    ...(persisted.workshopSettings ?? persisted.workshopInfo ?? seed.workshopInfo),
    configuredAt:
      typeof (persisted.workshopSettings ?? persisted)?.configuredAt === "string"
        ? (persisted.workshopSettings ?? persisted).configuredAt
        : undefined,
    updatedAt:
      typeof (persisted.workshopSettings ?? persisted)?.updatedAt === "string"
        ? (persisted.workshopSettings ?? persisted).updatedAt
        : undefined,
  };
  workshopSettings.nextRepairNumber = normalizeCounter(
    workshopSettings.nextRepairNumber,
    Math.max(1, repairsWithLinks.length + 1),
  );
  workshopSettings.nextQuoteNumber = normalizeCounter(workshopSettings.nextQuoteNumber, Math.max(1, quotes.length + 1));
  workshopSettings.nextInvoiceNumber = normalizeCounter(
    workshopSettings.nextInvoiceNumber,
    Math.max(1, invoices.length + 1),
  );
  workshopSettings.nextReceiptNumber = normalizeCounter(
    workshopSettings.nextReceiptNumber,
    Math.max(1, payments.length + 1),
  );

  return {
    workshopInfo: asWorkshopInfo(workshopSettings),
    workshopSettings,
    onboardingCompleted: Boolean((persisted as any).onboardingCompleted ?? workshopSettings.configuredAt),
    configuredAt: workshopSettings.configuredAt,
    updatedAt: workshopSettings.updatedAt,
    selectedCustomerId: persisted.selectedCustomerId ?? seed.selectedCustomerId,
    selectedRepairId: repairs.some((repair) => repair.id === persisted.selectedRepairId)
      ? (persisted.selectedRepairId ?? "")
      : (repairs[0]?.id ?? ""),
    selectedQuoteId: quotes.some((quote) => quote.id === persisted.selectedQuoteId)
      ? (persisted.selectedQuoteId ?? "")
      : (quotes[0]?.id ?? ""),
    selectedInvoiceId: persisted.selectedInvoiceId ?? seed.selectedInvoiceId,
    selectedPaymentId: persisted.selectedPaymentId ?? seed.selectedPaymentId,
    selectedAppointmentId: persisted.selectedAppointmentId ?? seed.selectedAppointmentId,
    selectedStockItemId: persisted.selectedStockItemId ?? seed.selectedStockItemId,
    selectedDocumentId: persisted.selectedDocumentId ?? seed.selectedDocumentId,
    deviceBrands: persistedBrands,
    deviceModels: persistedModels,
    partCategories,
    customers,
    repairs: repairsWithLinks,
    quotes,
    invoices,
    payments,
    appointments,
    stockItems,
    documents: Array.isArray(persisted.documents) ? persisted.documents : seed.documents,
    messageLogs: Array.isArray(persisted.messageLogs) ? persisted.messageLogs : seed.messageLogs,
    priceBookItems: (() => {
      if (!Array.isArray(persisted.priceBookItems)) return seed.priceBookItems;
      const normalized = persisted.priceBookItems
        .map((item) => normalizePriceBookItem(item))
        .filter((item): item is PriceBookItem => Boolean(item));
      const hasExamples = normalized.some((item) => item.source === "behar_example");
      if (hasExamples) return normalized;
      const existingIds = new Set(normalized.map((item) => item.id));
      const examples = seed.priceBookItems.filter((item) => !existingIds.has(item.id));
      return [...normalized, ...examples];
    })(),
  };
};
const deriveCustomers = (customers: Customer[], repairs: Repair[], payments: Payment[]) =>
  customers.map((customer) => {
    const customerRepairs = repairs.filter((repair) => repair.customerId === customer.id);
    const paidTotal = payments
      .filter((payment) => payment.customerId === customer.id && payment.status === "Payé")
      .reduce((total, payment) => total + payment.amount, 0);
    const latestRepair = customerRepairs[0];
    return {
      ...customer,
      totalSpent: paidTotal,
      interventions: customerRepairs.length,
      device: latestRepair?.device ?? customer.device,
      lastRepair: latestRepair ? `${latestRepair.device} - ${latestRepair.issue}` : customer.lastRepair,
      lastVisit: latestRepair?.droppedAt ?? customer.lastVisit,
    };
  });

function createSeed() {
  // EMPTY SEED — atelier vierge (pas de clients, réparations, devis, factures, paiements de démo)
  return {
    workshopInfo: defaultWorkshopInfo,
    workshopSettings: defaultWorkshopSettings,
    onboardingCompleted: false,
    configuredAt: undefined,
    updatedAt: undefined,
    selectedCustomerId: "",
    selectedRepairId: "",
    selectedQuoteId: "",
    selectedInvoiceId: "",
    selectedPaymentId: "",
    selectedAppointmentId: "",
    selectedStockItemId: "",
    selectedDocumentId: "",
    deviceBrands,
    deviceModels,
    partCategories,
    customers: [] as Customer[],
    repairs: [] as Repair[],
    quotes: [] as Quote[],
    invoices: [] as Invoice[],
    payments: [] as Payment[],
    appointments: [] as Appointment[],
    stockItems: [] as StockItem[],
    documents: [] as BeharDocument[],
    messageLogs: [],
    priceBookItems: seedPriceBookExamples(),
    isCatalogPreloaded: false,
  };
}

function _unusedCreateSeedLegacy() {
  const customers: Customer[] = customerMocks.map((customer) => ({
    id: customer.id,
    shopId,
    name: customer.name,
    initials: customer.initials,
    phone: customer.phone,
    email: customer.email,
    device: customer.device,
    lastVisit: customer.lastVisit,
    totalSpent: euro(customer.totalSpent),
    status: customer.status,
    lastRepair: customer.lastRepair,
    interventions: customer.interventions,
    source: customer.source,
  }));

  const ensureCustomer = (name: string, device: string, issue: string) => {
    const existing = customers.find((customer) => customer.name === name);
    if (existing) return existing.id;
    const id = `customer_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    customers.push({
      id,
      shopId,
      name,
      initials: initials(name),
      phone: "Non renseigné",
      email: "Non renseigné",
      device,
      lastVisit: "Aujourd'hui",
      totalSpent: 0,
      status: "Actif",
      lastRepair: issue,
      interventions: 1,
      source: "Atelier",
    });
    return id;
  };

  const seen = new Set<string>();
  const repairs: Repair[] = repairKanbanColumns
    .flatMap((column) => column.cards.map((card) => ({ card, columnTitle: column.title })))
    .filter(({ card }) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    })
    .map(({ card, columnTitle }, index) => {
      const customerId = ensureCustomer(card.customer, card.device, card.issue);
      const status = card.status;
      return {
        id: card.id,
        shopId,
        number: `R-2026-${String(518 + index).padStart(4, "0")}`,
        customerId,
        device: card.device,
        model: card.device,
        issue: card.issue,
        status: status as RepairStatus,
        amount: card.id === "repair_belmin_iphone13" ? 189 : 89 + index * 20,
        notes:
          card.id === "repair_belmin_iphone13"
            ? "Le client souhaite conserver le True Tone."
            : "Diagnostic atelier en cours.",
        droppedAt: getNowIso(),
        estimatedDoneAt: getTomorrowIso(),
        technician: index % 2 ? "Ahmed K." : "Atelier principal",
        imei: `35 ${123456 + index} ${789012 + index} ${index}`,
        parts:
          card.id === "repair_belmin_iphone13"
            ? [
                {
                  stockItemId: "stock_ip13_screen",
                  name: "Écran iPhone 13",
                  reference: "IP13-SCR",
                  purchasePrice: 80,
                  salePrice: 150,
                  quantity: 1,
                },
              ]
            : [],
        history: ["Réparation créée", status === "Reçu" ? "En attente de diagnostic" : "Diagnostic démarré"],
      };
    });

  const belmin = customers.find((customer) => customer.name === "Belmin") ?? customers[0];
  const belminRepair = repairs.find((repair) => repair.id === "repair_belmin_iphone13") ?? repairs[0];

  const quotes: Quote[] = [
    {
      id: quoteMock.id,
      shopId,
      number: quoteMock.number,
      customerId: belmin.id,
      repairId: belminRepair.id,
      status: "Brouillon",
      date: quoteMock.date,
      expiryDate: thirtyDaysLaterLabel(),
      notes: "Pièce premium garantie 12 mois. Intervention réalisée en atelier.",
      totalAmount: 190,
      sourceType: "repair",
      lines: sanitizeQuoteLines(
        quoteMock.lines.map((line) => ({
          id: line.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: euro(line.unitPrice),
          total: euro(line.unitPrice) * line.quantity,
        })),
      ),
    },
  ];

  const invoices: Invoice[] = invoiceMocks.map((invoice, index) => {
    const customer = customers.find((entry) => entry.name === invoice.customer) ?? belmin;
    const repair = repairs.find((entry) => entry.customerId === customer.id);
    return {
      id: invoice.id,
      shopId,
      number: invoice.number,
      customerId: customer.id,
      repairId: repair?.id,
      quoteId: index === 0 ? quoteMock.id : undefined,
      status: invoice.status as InvoiceStatus,
      date: invoice.date,
      lines: sanitizeQuoteLines(
        (invoice as any).items?.map((item: any, idx: number) => ({
          id: `line_${invoice.id}_${idx}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
        })) || [
          { id: uid("line"), description: "Intervention", quantity: 1, unitPrice: euro((invoice as any).amount) },
        ],
      ),
      sourceType: index === 0 ? "quote" : repair ? "repair" : "client",
      sourceNumber: index === 0 ? quoteMock.number : repair ? repair.number : undefined,
      paymentMethod: invoice.payment === "Stripe" ? "Stripe Checkout simulé" : invoice.payment,
      paymentIds: [],
      paidAmount: 0,
      paidAt: undefined,
    };
  });

  const payments: Payment[] = paymentMocks.map((payment, index) => {
    const customer = customers.find((entry) => entry.name === payment.customer) ?? belmin;
    const invoice = invoices[index] ?? invoices[0];
    return {
      id: payment.id,
      shopId,
      invoiceId: invoice.id,
      customerId: customer.id,
      repairId: invoice.repairId,
      quoteId: invoice.quoteId,
      paymentNumber: payment.reference,
      reference: payment.reference,
      method: normalizePaymentMethod(payment.mode),
      mode: normalizePaymentMethod(payment.mode),
      status: normalizePaymentStatus(payment.status),
      amount: euro(payment.amount),
      date: payment.date,
      note: "",
      createdAt: payment.date,
      updatedAt: payment.date,
    };
  });

  const appointments: Appointment[] = appointmentMocks.map((appointment) => {
    const customerId = ensureCustomer(appointment.customer, appointment.device, appointment.issue);
    return {
      id: appointment.id,
      shopId,
      customerId,
      device: appointment.device,
      issue: appointment.issue,
      date: todayLabel(),
      time: appointment.time,
      duration: "30 min",
      channel: "Site internet",
      source: "Widget site internet",
      technician: "Atelier principal",
      notes: "",
      status: appointment.id === "appointment_belmin" ? "Confirmé" : "Planifié",
      confirmed: appointment.id === "appointment_belmin",
      dayIndex: appointment.dayIndex,
      row: appointment.row,
      color: appointment.color,
    };
  });

  const stockItems: StockItem[] = [
    ...stockMocks.map((item) =>
      normalizeStockItem({
        id: item.id,
        shopId,
        name: item.part,
        part: item.part,
        sku: item.reference,
        reference: item.reference,
        category: item.category,
        purchasePrice: euro(item.purchasePrice),
        salePrice: euro(item.salePrice),
        quantity: item.stock,
        stock: item.stock,
        threshold: item.threshold,
        supplier: item.supplier,
        leadTime: item.leadTime,
      }),
    ),
    normalizeStockItem({
      id: "stock_iphone_13_pro_screen",
      sku: "IP13P-SCR",
      name: "Écran iPhone 13 Pro",
      deviceType: "Smartphone",
      brandId: "brand_apple",
      modelIds: ["model_iphone_13_pro"],
      categoryId: "cat_screen",
      purchasePrice: 95,
      salePrice: 179,
      quantity: 3,
      threshold: 1,
      supplier: "Fournisseur test",
    }),
    normalizeStockItem({
      id: "stock_iphone_13_pro_battery",
      sku: "IP13P-BAT",
      name: "Batterie iPhone 13 Pro",
      deviceType: "Smartphone",
      brandId: "brand_apple",
      modelIds: ["model_iphone_13_pro"],
      categoryId: "cat_battery",
      purchasePrice: 35,
      salePrice: 89,
      quantity: 5,
      threshold: 2,
      supplier: "Fournisseur test",
    }),
    normalizeStockItem({
      id: "stock_galaxy_s21_screen_test",
      sku: "S21-SCR-TEST",
      name: "Écran Galaxy S21",
      deviceType: "Smartphone",
      brandId: "brand_samsung",
      modelIds: ["model_galaxy_s21"],
      categoryId: "cat_screen",
      purchasePrice: 80,
      salePrice: 149,
      quantity: 4,
      threshold: 1,
      supplier: "Fournisseur test",
    }),
    normalizeStockItem({
      id: "stock_galaxy_s21_battery_test",
      sku: "S21-BAT-TEST",
      name: "Batterie Galaxy S21",
      deviceType: "Smartphone",
      brandId: "brand_samsung",
      modelIds: ["model_galaxy_s21"],
      categoryId: "cat_battery",
      purchasePrice: 30,
      salePrice: 79,
      quantity: 5,
      threshold: 2,
      supplier: "Fournisseur test",
    }),
    normalizeStockItem({
      id: "stock_switch_joystick_test",
      sku: "SW-JOY-TEST",
      name: "Joystick Nintendo Switch",
      deviceType: "Console",
      brandId: "brand_nintendo",
      modelIds: ["model_switch"],
      categoryId: "cat_joystick",
      purchasePrice: 12,
      salePrice: 39,
      quantity: 8,
      threshold: 2,
      supplier: "Fournisseur test",
    }),
  ];

  const documents: BeharDocument[] = [
    ...repairs.map((repair) => ({
      id: `doc_intake_${repair.id}`,
      shopId,
      type: "intake" as DocumentType,
      title: `Bon de prise en charge - ${repair.number}`,
      customerId: repair.customerId,
      repairId: repair.id,
      createdAt: repair.droppedAt,
    })),
    ...quotes.map((quote) => ({
      id: `doc_${quote.id}`,
      shopId,
      type: "quote" as DocumentType,
      title: `Devis #${quote.number}`,
      customerId: quote.customerId,
      repairId: quote.repairId,
      quoteId: quote.id,
      createdAt: quote.date,
    })),
    ...invoices.map((invoice) => ({
      id: `doc_${invoice.id}`,
      shopId,
      type: "invoice" as DocumentType,
      title: `Facture #${invoice.number}`,
      customerId: invoice.customerId,
      repairId: invoice.repairId,
      quoteId: invoice.quoteId,
      invoiceId: invoice.id,
      createdAt: invoice.date,
    })),
  ];

  const syncedCustomers = deriveCustomers(customers, repairs, payments);

  return {
    workshopInfo: defaultWorkshopInfo,
    selectedCustomerId: belmin.id,
    selectedRepairId: belminRepair.id,
    selectedQuoteId: quotes[0].id,
    selectedInvoiceId: invoices[0].id,
    selectedPaymentId: payments[0].id,
    selectedAppointmentId:
      appointments.find((appointment) => appointment.id === "appointment_belmin")?.id ?? appointments[0].id,
    selectedStockItemId: stockItems[0].id,
    selectedDocumentId: documents[0].id,
    deviceBrands,
    deviceModels,
    partCategories,
    customers: syncedCustomers,
    repairs,
    quotes,
    invoices,
    payments,
    appointments,
    stockItems,
    documents,
    messageLogs: [],
  };
}

const seed = createSeed();

const syncPickup = (repair: Repair, appointments: Appointment[], customers: Customer[]): Appointment[] => {
  void repair;
  void customers;
  // V1 atelier: aucun rendez-vous automatique créé/modifié.
  return appointments;
};

/*
const _legacySyncPickup = (repair: Repair, appointments: Appointment[], customers: Customer[]): Appointment[] => {
  const existingId = appointments.find((a) => a.repairId === repair.id && a.type === "repair_pickup")?.id;
  
  if (!repair.estimatedDoneAt) {
    if (existingId) return appointments.filter((a) => a.id !== existingId);
    return appointments;
  }

  const end = new Date(repair.estimatedDoneAt);
  const start = new Date(repair.droppedAt);
  
  if (isNaN(end.getTime()) || end < start) {
    if (existingId) return appointments.filter((a) => a.id !== existingId);
    return appointments;
  }

  const dateStr = end.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "/");
  const timeStr = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const pickupData: Partial<Appointment> = {
    customerId: repair.customerId,
    repairId: repair.id,
    device: repair.device,
    issue: `Retrait : ${repair.issueType || repair.issue}`,
    date: dateStr,
    time: timeStr,
    duration: "15 min",
    channel: "Automatique",
    source: "Behar Tech Sync",
    technician: repair.technician || "Atelier principal",
    notes: `Rendez-vous généré automatiquement pour le retrait de la réparation ${repair.number}.`,
    status: repair.status === "Prêt" ? "terminé" : "prévu",
    confirmed: repair.status === "Prêt",
    type: "repair_pickup",
    color: "mint",
  };

  if (existingId) {
    return appointments.map((a) => (a.id === existingId ? { ...a, ...pickupData } : a));
  }

  const newPickup: Appointment = {
    id: `apt_pickup_${repair.id}`,
    shopId: repair.shopId,
    ...pickupData,
    dayIndex: 0,
    row: 0,
  } as Appointment;
  return [...appointments, newPickup];
};
*/

export const useBeharStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...seed,
      addDeviceBrand: ({ name, deviceType }) => {
        const clean = String(name || "").trim();
        if (!clean) return "";
        const id = `brand_${clean.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
        set((state) => {
          const existing = state.deviceBrands.find((b) => b.id === id || b.name.toLowerCase() === clean.toLowerCase());
          if (existing) {
            const nextTypes = Array.from(new Set([...(existing.deviceTypes ?? []), deviceType]));
            return {
              deviceBrands: state.deviceBrands.map((b) => (b.id === existing.id ? { ...b, deviceTypes: nextTypes } : b)),
            };
          }
          const brand: DeviceBrand = { id, name: clean, deviceTypes: [deviceType] };
          return { deviceBrands: [brand, ...state.deviceBrands] };
        });
        return id;
      },
      updateDeviceBrand: (id, patch) =>
        set((state) => ({
          deviceBrands: state.deviceBrands.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      addDeviceModel: ({ brandId, name, deviceType, aliases }) => {
        const cleanName = String(name || "").replace(/\s+/g, " ").trim();
        if (!cleanName) return "";
        const id = `model_${brandId}_${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
        const now = nowLabel();
        set((state) => {
          const exists = state.deviceModels.some(
            (m) => m.brandId === brandId && m.deviceType === deviceType && m.name.toLowerCase() === cleanName.toLowerCase(),
          );
          if (exists) return state;
          const model: DeviceModel = {
            id,
            brandId,
            name: cleanName,
            deviceType,
            aliases,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          };
          return { deviceModels: [model, ...state.deviceModels] };
        });
        return id;
      },
      updateDeviceModel: (id, patch) =>
        set((state) => ({
          deviceModels: state.deviceModels.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: nowLabel() } : m)),
        })),
      toggleDeviceModel: (id, isActive) =>
        set((state) => ({
          deviceModels: state.deviceModels.map((m) => (m.id === id ? { ...m, isActive, updatedAt: nowLabel() } : m)),
        })),
      setSelected: (entity, id) => set({ [`selected${entity[0].toUpperCase()}${entity.slice(1)}Id`]: id }),
      addCustomer: (input) => {
        const id = uid("customer");
        const customer: Customer = {
          id,
          shopId,
          name: input.name || "Client comptoir",
          type: input.name === "Anonyme" || input.name === "Client comptoir" || !input.name ? "counter" : "named",
          initials: initials(input.name || "Client comptoir"),
          phone: input.phone || "Non renseigné",
          email: input.email || "Non renseigné",
          address: input.address,
          device: input.device || "Non renseigné",
          lastVisit: input.lastVisit || todayLabel(),
          totalSpent: input.totalSpent ?? 0,
          status: input.status || "Actif",
          lastRepair: input.lastRepair || "Aucune",
          interventions: input.interventions ?? 0,
          source: input.source || "Atelier",
          notes: input.notes,
          tags: input.tags,
        };
        set((state) => ({ customers: [customer, ...state.customers], selectedCustomerId: id }));
        return id;
      },
      updateCustomer: (id, patch) =>
        set((state) => ({
          customers: deriveCustomers(
            state.customers.map((customer) =>
              customer.id === id
                ? { ...customer, ...patch, initials: patch.name ? initials(patch.name) : customer.initials }
                : customer,
            ),
            state.repairs,
            state.payments,
          ),
        })),
      deleteCustomer: (id) =>
        set((state) => {
          const hasLinkedAppointments = state.appointments.some((appointment) => appointment.customerId === id);
          const hasLinkedRepairs = state.repairs.some((repair) => repair.customerId === id);
          if (hasLinkedAppointments || hasLinkedRepairs) return state;
          const customers = state.customers.filter((customer) => customer.id !== id);
          return {
            appointments: state.appointments.filter((appointment) => appointment.customerId !== id),
            customers,
            invoices: state.invoices.filter((invoice) => invoice.customerId !== id),
            messageLogs: state.messageLogs.filter((message) => message.customerId !== id),
            payments: state.payments.filter((payment) => payment.customerId !== id),
            quotes: state.quotes.filter((quote) => quote.customerId !== id),
            repairs: state.repairs,
            selectedCustomerId: customers[0]?.id ?? "",
          };
        }),
      addRepair: (input) => {
        const state = get();
        const ws = state.workshopSettings ?? defaultWorkshopSettings;
        const appointment = input.appointmentId
          ? state.appointments.find((entry) => entry.id === input.appointmentId)
          : undefined;
        const customerId = getValidCustomerId(appointment?.customerId ?? input.customerId, state.customers);
        if (!customerId) return "";
        const id = uid("repair");
        const created = createRepairRecord(
          { ...input, customerId, appointmentId: appointment?.id ?? input.appointmentId },
          state.repairs.length,
        );
        const totalClient = clampMoney(input.amount ?? input.total ?? created.amount);
        const labor = clampMoney(input.laborPrice ?? created.laborPrice);
        const repair = {
          ...created,
          id,
          number: docNumber(ws.repairPrefix, ws.nextRepairNumber ?? 1, "REP"),
          amount: totalClient,
          laborPrice: labor,
          total: totalClient,
          selectedPriceSnapshot: input.selectedPriceSnapshot,
          history: Array.isArray(input.history) && input.history.length ? input.history : created.history,
        };
        set((state) => {
          const repairs = [repair, ...state.repairs];
          const nextAppointments = syncPickup(repair, state.appointments, state.customers);
          return {
            workshopSettings: {
              ...state.workshopSettings,
              nextRepairNumber: normalizeCounter((state.workshopSettings?.nextRepairNumber ?? 1) + 1),
              updatedAt: nowLabel(),
            },
            workshopInfo: asWorkshopInfo({
              ...state.workshopSettings,
              nextRepairNumber: normalizeCounter((state.workshopSettings?.nextRepairNumber ?? 1) + 1),
              updatedAt: nowLabel(),
            } as WorkshopSettings),
            appointments: nextAppointments.map((entry) =>
              entry.id === repair.appointmentId
                ? {
                    ...entry,
                    repairId: id,
                    status: "Converti en réparation",
                    confirmed: true,
                  }
                : entry,
            ),
            customers: deriveCustomers(state.customers, repairs, state.payments),
            repairs,
            selectedRepairId: id,
          };
        });
        return id;
      },
      updateRepair: (id, patch) =>
        set((state) => {
          const repairs = state.repairs.map((repair) => {
            if (repair.id !== id) return repair;
            const appointmentId = patch.appointmentId ?? repair.appointmentId;
            const linkedAppointment = appointmentId
              ? state.appointments.find((appointment) => appointment.id === appointmentId)
              : undefined;
            const nextCustomerId = getValidCustomerId(
              linkedAppointment?.customerId ?? patch.customerId ?? repair.customerId,
              state.customers,
              repair.customerId,
            );
            const changes: string[] = [];
            if (nextCustomerId !== repair.customerId) changes.push("client");
            if (patch.issue !== undefined && patch.issue !== repair.issue) changes.push("problème");
            if (patch.device !== undefined && patch.device !== repair.device) changes.push("appareil");
            if (patch.model !== undefined && patch.model !== repair.model) changes.push("modèle");
            if (patch.brandName !== undefined && patch.brandName !== repair.brandName) changes.push("marque");
            if (patch.deviceModel !== undefined && patch.deviceModel !== repair.deviceModel)
              changes.push("modèle métier");
            if (patch.issueType !== undefined && patch.issueType !== repair.issueType) changes.push("panne type");
            if (patch.imei !== undefined && patch.imei !== repair.imei) changes.push("IMEI");
            if (patch.notes !== undefined && patch.notes !== repair.notes) changes.push("notes internes");
            if (patch.laborPrice !== undefined && patch.laborPrice !== repair.laborPrice) changes.push("main-d'œuvre");
            if (patch.status !== undefined && patch.status !== repair.status) changes.push(`statut : ${patch.status}`);
            const nextLaborPrice =
              patch.laborPrice === undefined
                ? patch.amount === undefined
                  ? repair.laborPrice
                  : clampMoney(patch.amount)
                : clampMoney(patch.laborPrice);
            const nextRepair = normalizeRepair(
              {
                ...repair,
                ...patch,
                customerId: nextCustomerId,
                appointmentId,
                laborPrice: nextLaborPrice,
                amount: clampMoney((nextLaborPrice ?? 0) + repairPartsTotal(patch.parts ?? repair.parts)),
                history: changes.length ? [...repair.history, `Modification : ${changes.join(", ")}`] : repair.history,
              },
              state.customers,
              state.appointments,
            );
            return nextRepair;
          });
          const targetRepair = repairs.find((r) => r.id === id);
          let appointments = state.appointments.map((appointment) => {
            const linkedRepair = repairs.find((repair) => repair.appointmentId === appointment.id);
            return linkedRepair
              ? { ...appointment, repairId: linkedRepair.id, status: "Converti en réparation", confirmed: true }
              : appointment;
          });
          if (targetRepair) {
            appointments = syncPickup(targetRepair, appointments, state.customers);
          }
          return { appointments, customers: deriveCustomers(state.customers, repairs, state.payments), repairs };
        }),
      deleteRepair: (id) =>
        set((state) => {
          const repairs = state.repairs.filter((repair) => repair.id !== id);
          const deletedRepair = state.repairs.find((repair) => repair.id === id);
          const stockItems = state.stockItems.map((stockItem) => {
            const usedPart = deletedRepair?.parts.find((part) => part.stockItemId === stockItem.id);
            return usedPart
              ? {
                  ...stockItem,
                  quantity: stockItem.quantity + usedPart.quantity,
                  stock: stockItem.stock + usedPart.quantity,
                }
              : stockItem;
          });
          return {
            appointments: state.appointments
              .filter((a) => a.repairId !== id || a.type !== "repair_pickup")
              .map((appointment) =>
                deletedRepair?.appointmentId === appointment.id || appointment.repairId === id
                  ? { ...appointment, repairId: undefined, status: "Réparation supprimée" }
                  : appointment,
              ),
            customers: deriveCustomers(state.customers, repairs, state.payments),
            repairs,
            selectedRepairId: repairs[0]?.id ?? "",
            stockItems,
          };
        }),
      changeRepairStatus: (id, status) => {
        const state = get();
        const previous = state.repairs.find((r) => r.id === id);
        if (!previous) return;
        if (previous.status === status) return;

        const statusEvent = (() => {
          switch (status) {
            case "Diagnostic":
              return "Diagnostic démarré";
            case "Préparation / Réparation":
              return "Réparation en préparation";
            case "Test final":
              return "Test final en cours";
            case "Prêt":
              return "Réparation prête";
            case "Restitué":
              return "Réparation restituée";
            case "Annulé":
              return "Réparation annulée";
            default:
              return `Statut changé : ${status}`;
          }
        })();

        set((current) => ({
          repairs: current.repairs.map((repair) =>
            repair.id === id ? { ...repair, status, history: [...repair.history, statusEvent] } : repair,
          ),
        }));

        if (status !== "Prêt") return;

        // Workflow auto au passage en "Prêt" : facture propre si possible
        const after = get();
        const repair = after.repairs.find((r) => r.id === id);
        if (!repair) return;

        const acceptedQuote = after.quotes.find((q) => q.repairId === id && q.status === "Accepté");
        const existingInvoice =
          (acceptedQuote && after.invoices.find((inv) => inv.quoteId === acceptedQuote.id)) ||
          after.invoices.find((inv) => inv.repairId === id);

        const appendHistory = (msg: string) => {
          set((current) => ({
            repairs: current.repairs.map((r) => (r.id === id ? { ...r, history: [...r.history, msg] } : r)),
          }));
        };

        if (existingInvoice) {
          appendHistory(`Facture déjà existante : ${existingInvoice.number}`);
          return;
        }

        if (acceptedQuote) {
          const invoiceId = get().convertQuoteToInvoice(acceptedQuote.id);
          if (invoiceId) {
            const inv = get().invoices.find((i) => i.id === invoiceId);
            appendHistory(`Facture créée depuis le devis : ${inv?.number ?? invoiceId}`);
          } else {
            appendHistory("Facturation bloquée : conversion devis impossible.");
          }
          return;
        }

        const customer = after.customers.find((c) => c.id === repair.customerId);
        if (!customer) {
          appendHistory("Réparation prête, facturation bloquée : client invalide.");
          return;
        }

        const built = buildInvoiceLinesFromRepair(repair);
        if (!built.ok) {
          appendHistory(`Réparation prête, facturation bloquée : ${built.message}`);
          return;
        }

        const invoiceId = get().addInvoice({
          customerId: repair.customerId,
          repairId: repair.id,
          lines: built.lines,
          sourceType: "repair",
          sourceNumber: repair.number,
          status: "Envoyée",
        });
        if (invoiceId) {
          const inv = get().invoices.find((i) => i.id === invoiceId);
          appendHistory(`Facture créée depuis la réparation : ${inv?.number ?? invoiceId}`);
        } else {
          appendHistory("Réparation prête, facturation bloquée : données invalides.");
        }
      },
      addPartToRepair: (repairId, stockItemId, quantity = 1) => {
        const wanted = clampQuantity(quantity);
        if (wanted <= 0) return false;
        const state = get();
        const item = state.stockItems.find((stockItem) => stockItem.id === stockItemId);
        const repair = state.repairs.find((entry) => entry.id === repairId);
        if (!repair || !item || item.stock < wanted) return false;
        set((current) => {
          const currentItem = current.stockItems.find((stockItem) => stockItem.id === stockItemId);
          const currentRepair = current.repairs.find((entry) => entry.id === repairId);
          if (!currentRepair || !currentItem || currentItem.stock < wanted) return current;
          const repairs = current.repairs.map((repair) => {
            if (repair.id !== repairId) return repair;
            const existing = repair.parts.find((part) => part.stockItemId === stockItemId);
            const parts = existing
              ? repair.parts.map((part) =>
                  part.stockItemId === stockItemId ? { ...part, quantity: part.quantity + wanted } : part,
                )
              : [
                  ...repair.parts,
                  {
                    stockItemId: currentItem.id,
                    name: currentItem.name,
                    reference: currentItem.sku,
                    sku: currentItem.sku,
                    categoryName: currentItem.categoryName,
                    purchasePrice: currentItem.purchasePrice,
                    salePrice: currentItem.salePrice,
                    quantity: wanted,
                  },
                ];
            const amount = clampMoney((repair.laborPrice ?? 0) + repairPartsTotal(parts));
            return {
              ...repair,
              amount,
              total: amount,
              parts,
              history: [
                ...repair.history,
                `Pièce ajoutée : ${currentItem.name} x${wanted} (${formatEuro(currentItem.salePrice * wanted)})`,
              ],
            };
          });
          return {
            stockItems: current.stockItems.map((stockItem) =>
              stockItem.id === stockItemId
                ? {
                    ...stockItem,
                    quantity: Math.max(0, stockItem.quantity - wanted),
                    stock: Math.max(0, stockItem.stock - wanted),
                  }
                : stockItem,
            ),
            repairs,
          };
        });
        return true;
      },
      removePartFromRepair: (repairId, stockItemId) => {
        const state = get();
        const repair = state.repairs.find((entry) => entry.id === repairId);
        const part = repair?.parts.find((entry) => entry.stockItemId === stockItemId);
        if (!(repair && part)) return false;
        set((current) => {
          const currentRepair = current.repairs.find((entry) => entry.id === repairId);
          const currentPart = currentRepair?.parts.find((entry) => entry.stockItemId === stockItemId);
          if (!(currentRepair && currentPart)) return current;
          return {
            stockItems: current.stockItems.map((item) =>
              item.id === stockItemId
                ? { ...item, quantity: item.quantity + currentPart.quantity, stock: item.stock + currentPart.quantity }
                : item,
            ),
            repairs: current.repairs.map((entry) =>
              entry.id === repairId
                ? {
                    ...entry,
                    amount: clampMoney(
                      (entry.laborPrice ?? 0) +
                        repairPartsTotal(entry.parts.filter((repairPart) => repairPart.stockItemId !== stockItemId)),
                    ),
                    total: clampMoney(
                      (entry.laborPrice ?? 0) +
                        repairPartsTotal(entry.parts.filter((repairPart) => repairPart.stockItemId !== stockItemId)),
                    ),
                    parts: entry.parts.filter((repairPart) => repairPart.stockItemId !== stockItemId),
                    history: [...entry.history, `Pièce retirée : ${currentPart.name} x${currentPart.quantity}`],
                  }
                : entry,
            ),
          };
        });
        return true;
      },
      addQuote: (input) => {
        const state = get();
        const ws = state.workshopSettings ?? defaultWorkshopSettings;
        // Anti-doublon : bloquer si un devis accepté existe déjà sur cette réparation
        if (input.repairId) {
          const existingAccepted = state.quotes.find((q) => q.repairId === input.repairId && q.status === "Accepté");
          if (existingAccepted) return "";
        }
        // Résolution stricte du client : pas de fallback silencieux vers un autre client
        const rawCustomerId = normalizeText((input as any).customerId || (input as any).clientId);
        const repairForQuote = input.repairId ? state.repairs.find((r) => r.id === input.repairId) : undefined;
        const candidateCustomerId = rawCustomerId || normalizeText(repairForQuote?.customerId);
        const customerExists = candidateCustomerId && state.customers.some((c) => c.id === candidateCustomerId);
        if (!customerExists) return "";
        const customer = state.customers.find((c) => c.id === candidateCustomerId);

        const status: QuoteStatus = normalizeQuoteStatus(input.status ?? "Brouillon");
        const sanitizedLines = sanitizeQuoteLines(input.lines);
        const usableLines = sanitizedLines.filter(
          (l) => isUsableInvoiceLineDescription(l.description) && l.quantity > 0 && l.unitPrice > 0,
        );
        const lineTotal = sanitizedLines.reduce((sum, l) => sum + safeLineAmount(l), 0);
        // Devis non-brouillon : interdiction de créer vide / à 0 €
        if (status !== "Brouillon") {
          if (!usableLines.length || lineTotal <= 0) return "";
        }

        const id = uid("quote");
        const quote = normalizeQuote(
          {
            ...input,
            id,
            number: docNumber(ws.quotePrefix, ws.nextQuoteNumber ?? 1, "DEV"),
            customerId: candidateCustomerId,
          },
          state.customers,
          state.repairs,
        );
        set((state) => ({
          workshopSettings: {
            ...state.workshopSettings,
            nextQuoteNumber: normalizeCounter((state.workshopSettings?.nextQuoteNumber ?? 1) + 1),
            updatedAt: nowLabel(),
          },
          workshopInfo: asWorkshopInfo({
            ...state.workshopSettings,
            nextQuoteNumber: normalizeCounter((state.workshopSettings?.nextQuoteNumber ?? 1) + 1),
            updatedAt: nowLabel(),
          } as WorkshopSettings),
          quotes: [quote, ...state.quotes],
          repairs: state.repairs.map((repair) =>
            repair.id === quote.repairId
              ? {
                  ...repair,
                  quoteId: repair.quoteId ?? id,
                  quoteIds: uniqueIds([...(repair.quoteIds ?? []), repair.quoteId, id]),
                  history: [...repair.history, `Devis lié : ${quote.number}`],
                }
              : repair,
          ),
          selectedQuoteId: id,
          documents: [
            {
              id: `doc_${id}`,
              shopId,
              type: "quote",
              title: `Devis #${quote.number}`,
              customerId: quote.customerId,
              repairId: quote.repairId,
              quoteId: id,
              createdAt: quote.date,
            },
            ...state.documents,
          ],
        }));
        return id;
      },
      updateQuote: (id, patch) =>
        set((state) => {
          const previous = state.quotes.find((quote) => quote.id === id);
          const quotes = state.quotes.map((quote) => {
            if (quote.id !== id) return quote;
            const repair = patch.repairId ? state.repairs.find((entry) => entry.id === patch.repairId) : undefined;
            return {
              ...quote,
              ...patch,
              customerId: patch.customerId
                ? getValidCustomerId(patch.customerId, state.customers, repair?.customerId ?? quote.customerId)
                : quote.customerId,
              status: patch.status ? normalizeQuoteStatus(patch.status) : quote.status,
              lines: sanitizeQuoteLines(patch.lines ? patch.lines : quote.lines),
              totalAmount: patch.totalAmount ?? quote.totalAmount,
            };
          });
          const updated = quotes.find((quote) => quote.id === id);
          const repairs =
            updated && previous?.status !== "Accepté" && updated.status === "Accepté" && updated.repairId
              ? state.repairs.map((repair) =>
                  repair.id === updated.repairId
                    ? {
                        ...repair,
                        quoteIds: uniqueIds([...(repair.quoteIds ?? []), repair.quoteId, updated.id]),
                        history: [...repair.history, `Devis accepté : ${updated.number}`],
                      }
                    : repair,
                )
              : state.repairs;
          return { quotes, repairs: syncRepairQuoteIds(repairs, quotes) };
        }),
      deleteQuote: (id) =>
        set((state) => {
          const quotes = state.quotes.filter((quote) => quote.id !== id);
          return {
            documents: state.documents.filter((document) => document.quoteId !== id),
            quotes,
            repairs: state.repairs.map((repair) => {
              const quoteIds = (repair.quoteIds ?? []).filter((quoteId) => quoteId !== id);
              return {
                ...repair,
                quoteId: repair.quoteId === id ? quoteIds[0] : repair.quoteId,
                quoteIds,
              };
            }),
            selectedQuoteId: quotes[0]?.id ?? "",
          };
        }),
      addQuoteLine: (quoteId) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  lines: [
                    ...quote.lines,
                    { id: uid("line"), description: "Ligne à compléter", quantity: 1, unitPrice: 0, total: 0 },
                  ],
                }
              : quote,
          ),
        })),
      updateQuoteLine: (quoteId, lineId, patch) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId
              ? {
                  ...quote,
                  lines: quote.lines.map((line) =>
                    line.id === lineId
                      ? {
                          ...line,
                          ...patch,
                          quantity: patch.quantity === undefined ? line.quantity : clampQuantity(patch.quantity),
                          unitPrice: patch.unitPrice === undefined ? line.unitPrice : clampMoney(patch.unitPrice),
                        }
                      : line,
                  ),
                }
              : quote,
          ),
        })),
      deleteQuoteLine: (quoteId, lineId) =>
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId && quote.lines.length > 1
              ? { ...quote, lines: quote.lines.filter((line) => line.id !== lineId) }
              : quote,
          ),
        })),
      convertQuoteToInvoice: (quoteId) => {
        const quote = get().quotes.find((entry) => entry.id === quoteId);
        if (!quote?.customerId || !quote.lines.length) return "";
        if (quote.status !== "Accepté") return "";

        // Anti-doublon strict
        const existingInvoice =
          get().invoices.find((invoice) => invoice.id === quote.invoiceId) ??
          get().invoices.find((invoice) => invoice.quoteId === quote.id);

        if (existingInvoice) {
          if (quote.invoiceId !== existingInvoice.id) {
            get().updateQuote(quote.id, { invoiceId: existingInvoice.id, status: "Facturé" });
          }
          get().setSelected("invoice", existingInvoice.id);
          return existingInvoice.id;
        }

        const lines = linesForInvoiceFromQuote(quote.lines);
        if (!lines.length) return "";

        const invoiceId = get().addInvoice({
          customerId: quote.customerId,
          repairId: quote.repairId,
          quoteId: quote.id,
          lines,
          status: "Envoyée",
          sourceType: "quote",
          sourceNumber: quote.number,
          paymentMethod: "Lien envoyé",
        });

        if (invoiceId) {
          get().updateQuote(quote.id, { invoiceId, status: "Facturé" });
        }

        return invoiceId;
      },
      addInvoice: (input) => {
        const state = get();
        const ws = state.workshopSettings ?? defaultWorkshopSettings;
        const quote = input.quoteId ? state.quotes.find((entry) => entry.id === input.quoteId) : undefined;
        const existingInvoice =
          quote &&
          (state.invoices.find((invoice) => invoice.id === quote.invoiceId) ??
            state.invoices.find((invoice) => invoice.quoteId === quote.id));
        if (existingInvoice) {
          if (!quote.invoiceId) {
            set((current) => ({
              quotes: current.quotes.map((entry) =>
                entry.id === quote.id ? { ...entry, invoiceId: existingInvoice.id } : entry,
              ),
            }));
          }
          return existingInvoice.id;
        }
        const repair =
          (input.repairId ?? quote?.repairId)
            ? state.repairs.find((entry) => entry.id === (input.repairId ?? quote?.repairId))
            : undefined;
        const customerId = resolveInvoiceCustomerId({ customerId: input.customerId }, state.customers, quote, repair);
        const lines = sanitizeQuoteLines(input.lines).filter(
          (l) => isUsableInvoiceLineDescription(l.description) && l.quantity > 0,
        );
        if (!customerId || !lines.length) return "";

        const customer = state.customers.find((c) => c.id === customerId);
        const isDraft = input.status === "Brouillon";

        // Blocage Total 0 (Règle métier P0)
        const total = lines.reduce((acc, l) => acc + safeLineAmount(l), 0);
        if (total <= 0 && !isDraft) {
          return "";
        }
        const id = uid("invoice");
        const invoice: Invoice = {
          id,
          shopId,
          number: docNumber(ws.invoicePrefix, ws.nextInvoiceNumber ?? 1, "FAC"),
          customerId,
          repairId: repair?.id ?? input.repairId ?? quote?.repairId,
          quoteId: quote?.id ?? input.quoteId,
          sourceType: input.sourceType || (quote ? "quote" : repair ? "repair" : "client"),
          sourceNumber: input.sourceNumber || (quote ? quote.number : repair ? repair.number : undefined),
          status: input.status || "Brouillon",
          date: todayLabel(),
          lines,
          paymentMethod: input.paymentMethod || "Non réglée",
          paymentIds: [],
          paidAmount: 0,
          paidAt: undefined,
        };
        set((state) => ({
          workshopSettings: {
            ...state.workshopSettings,
            nextInvoiceNumber: normalizeCounter((state.workshopSettings?.nextInvoiceNumber ?? 1) + 1),
            updatedAt: nowLabel(),
          },
          workshopInfo: asWorkshopInfo({
            ...state.workshopSettings,
            nextInvoiceNumber: normalizeCounter((state.workshopSettings?.nextInvoiceNumber ?? 1) + 1),
            updatedAt: nowLabel(),
          } as WorkshopSettings),
          invoices: [invoice, ...state.invoices],
          repairs: state.repairs.map((repair) =>
            repair.id === invoice.repairId
              ? {
                  ...repair,
                  invoiceId: repair.invoiceId ?? id,
                  invoiceIds: uniqueIds([...(repair.invoiceIds ?? []), repair.invoiceId, id]),
                  history: [...repair.history, `Facture liée : ${invoice.number}`],
                }
              : repair,
          ),
          quotes: state.quotes.map((quote) =>
            quote.id === invoice.quoteId ? { ...quote, invoiceId: id, status: "Facturé" as QuoteStatus } : quote,
          ),
          selectedInvoiceId: id,
          documents: [
            {
              id: `doc_${id}`,
              shopId,
              type: "invoice",
              title: `Facture #${invoice.number}`,
              customerId: invoice.customerId,
              repairId: invoice.repairId,
              quoteId: invoice.quoteId,
              invoiceId: id,
              createdAt: invoice.date,
            },
            ...state.documents,
          ],
        }));
        return id;
      },
      updateInvoice: (id, patch) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) => {
            if (invoice.id !== id || invoice.status === "Payée") return invoice;
            const quote = patch.quoteId ? state.quotes.find((entry) => entry.id === patch.quoteId) : undefined;
            const repair =
              (patch.repairId ?? quote?.repairId)
                ? state.repairs.find((entry) => entry.id === (patch.repairId ?? quote?.repairId))
                : undefined;
            return {
              ...invoice,
              ...patch,
              customerId: patch.customerId
                ? getValidCustomerId(patch.customerId, state.customers, quote?.customerId ?? repair?.customerId)
                : invoice.customerId,
              repairId: patch.repairId ?? quote?.repairId ?? invoice.repairId,
              quoteId: patch.quoteId ?? invoice.quoteId,
              status: patch.status ? normalizeInvoiceStatus(patch.status) : invoice.status,
              lines: patch.lines ? sanitizeQuoteLines(patch.lines) : invoice.lines,
            };
          }),
        })),
      deleteInvoice: (id) =>
        set((state) => {
          const invoices = state.invoices.filter((invoice) => invoice.id !== id);
          return {
            documents: state.documents.filter((document) => document.invoiceId !== id),
            invoices,
            quotes: state.quotes.map((quote) => (quote.invoiceId === id ? { ...quote, invoiceId: undefined } : quote)),
            repairs: state.repairs.map((repair) => {
              const invoiceIds = (repair.invoiceIds ?? []).filter((invoiceId) => invoiceId !== id);
              return {
                ...repair,
                invoiceId: repair.invoiceId === id ? invoiceIds[0] : repair.invoiceId,
                invoiceIds,
              };
            }),
            selectedInvoiceId: invoices[0]?.id ?? "",
          };
        }),
      markInvoicePaid: (invoiceId, method = "Carte", note = "") => {
        const invoice = get().invoices.find((entry) => entry.id === invoiceId);
        if (!invoice?.customerId) return "";
        const ws = get().workshopSettings ?? defaultWorkshopSettings;
        const total = invoiceTotal(invoice);
        const existingPayments = get().payments.filter((payment) => payment.invoiceId === invoiceId);
        const activePaidAmount = existingPayments
          .filter((payment) => payment.status === "Payé")
          .reduce((sum, payment) => sum + payment.amount, 0);
        const existing = existingPayments.find((payment) => payment.status === "Payé" && payment.amount >= total);
        if (invoice.status === "Payée" && existing) return existing.id;
        if (total <= 0 || activePaidAmount >= total) return existing?.id ?? "";
        const amount = Math.max(0, total - activePaidAmount);
        const paymentId = uid("payment");
        const timestamp = nowLabel();
        const payment: Payment = {
          id: paymentId,
          shopId,
          invoiceId,
          customerId: invoice.customerId,
          repairId: invoice.repairId,
          quoteId: invoice.quoteId,
          paymentNumber: docNumber(ws.receiptPrefix, ws.nextReceiptNumber ?? 1, "REC"),
          reference: docNumber(ws.receiptPrefix, ws.nextReceiptNumber ?? 1, "REC"),
          method,
          mode: method,
          status: "Payé",
          amount,
          date: timestamp,
          note,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => {
          const nextPaymentIds = uniqueIds([...(invoice.paymentIds ?? []), paymentId]);
          const invoices = state.invoices.map((entry) =>
            entry.id === invoiceId
              ? {
                  ...entry,
                  status: "Payée" as InvoiceStatus,
                  paymentMethod: method,
                  paymentIds: nextPaymentIds,
                  paidAmount: total,
                  paidAt: timestamp,
                }
              : entry,
          );
          const payments = [payment, ...state.payments];
          const repairs = state.repairs.map((repair) =>
            repair.id === invoice.repairId
              ? {
                  ...repair,
                  paymentId,
                  paymentIds: uniqueIds([...(repair.paymentIds ?? []), repair.paymentId, paymentId]),
                  invoiceId: repair.invoiceId ?? invoiceId,
                  invoiceIds: uniqueIds([...(repair.invoiceIds ?? []), repair.invoiceId, invoiceId]),
                  status: "Prêt" as RepairStatus,
                  history: [...repair.history, `Paiement encaissé : ${formatEuro(payment.amount)}`],
                }
              : repair,
          );
          return {
            workshopSettings: {
              ...state.workshopSettings,
              nextReceiptNumber: normalizeCounter((state.workshopSettings?.nextReceiptNumber ?? 1) + 1),
              updatedAt: nowLabel(),
            },
            workshopInfo: asWorkshopInfo({
              ...state.workshopSettings,
              nextReceiptNumber: normalizeCounter((state.workshopSettings?.nextReceiptNumber ?? 1) + 1),
              updatedAt: nowLabel(),
            } as WorkshopSettings),
            invoices,
            payments,
            repairs,
            customers: deriveCustomers(state.customers, repairs, payments),
            selectedPaymentId: paymentId,
            documents: [
              {
                id: `doc_${paymentId}`,
                shopId,
                type: "payment",
                title: `Reçu de paiement - ${payment.reference}`,
                customerId: payment.customerId,
                repairId: payment.repairId,
                invoiceId,
                paymentId,
                createdAt: payment.date,
              },
              ...state.documents,
            ],
          };
        });
        return paymentId;
      },
      createInvoiceFromRepair: (repairId: string) => {
        const state = get();
        const repair = state.repairs.find((r) => r.id === repairId);
        if (!repair) return "";

        // Anti-doublon
        const existingInvoice = state.invoices.find((inv) => inv.repairId === repairId);
        if (existingInvoice) return existingInvoice.id;

        const built = buildInvoiceLinesFromRepair(repair);
        if (!built.ok || !built.lines.length) return "";

        return state.addInvoice({
          customerId: repair.customerId,
          repairId: repair.id,
          lines: built.lines,
          status: "Envoyée",
          sourceType: "repair",
          sourceNumber: repair.number,
        });
      },
      markRepairAsPaid: (repairId: string, method = "Carte", note = "") => {
        const state = get();
        const repair = state.repairs.find((r) => r.id === repairId);
        if (!repair) return "";

        // Cas A : Facture existante
        const existingInvoice = state.invoices.find((inv) => inv.repairId === repairId);
        if (existingInvoice) {
          if (existingInvoice.status === "Payée") return "";
          return state.markInvoicePaid(existingInvoice.id, method, note);
        }

        // Cas B : Pas de facture, créer automatiquement
        const invoiceId = state.createInvoiceFromRepair(repairId);
        if (!invoiceId) return "";

        return state.markInvoicePaid(invoiceId, method, note);
      },
      updatePaymentStatus: (id, status) =>
        set((state) => {
          const timestamp = nowLabel();
          const payments = state.payments.map((payment) =>
            payment.id === id ? { ...payment, status, updatedAt: timestamp } : payment,
          );
          const changedPayment = payments.find((payment) => payment.id === id);
          if (!changedPayment) return { payments };
          const invoices = state.invoices.map((invoice) => {
            if (invoice.id !== changedPayment.invoiceId) return invoice;
            const relatedPayments = payments.filter((payment) => payment.invoiceId === invoice.id);
            const activePayments = relatedPayments.filter((payment) => payment.status === "Payé");
            const paidAmount = activePayments.reduce((sum, payment) => sum + payment.amount, 0);
            const total = invoiceTotal(invoice);
            const isPaid = total > 0 && paidAmount >= total;
            return {
              ...invoice,
              paymentIds: uniqueIds([...(invoice.paymentIds ?? []), ...relatedPayments.map((payment) => payment.id)]),
              paidAmount,
              paidAt: isPaid ? (invoice.paidAt ?? activePayments[0]?.date ?? timestamp) : undefined,
              status: isPaid ? ("Payée" as InvoiceStatus) : invoice.status === "Payée" ? "Envoyée" : invoice.status,
              paymentMethod: isPaid ? (activePayments[0]?.method ?? invoice.paymentMethod) : "Non réglée",
            };
          });
          const repairs = state.repairs.map((repair) => {
            if (repair.id !== changedPayment.repairId) return repair;
            return {
              ...repair,
              paymentIds: uniqueIds([
                ...(repair.paymentIds ?? []),
                ...payments.filter((payment) => payment.repairId === repair.id).map((payment) => payment.id),
              ]),
              history:
                status === "Annulé"
                  ? [...repair.history, `Paiement annulé : ${changedPayment.paymentNumber}`]
                  : repair.history,
            };
          });
          return { customers: deriveCustomers(state.customers, repairs, payments), invoices, payments, repairs };
        }),
      addAppointment: (input) => {
        const customerId = getValidCustomerId(input.customerId, get().customers);
        if (!customerId) return "";
        const id = uid("appointment");
        const appointment: Appointment = {
          id,
          shopId,
          customerId,
          repairId: input.repairId,
          device: input.device,
          issue: input.issue,
          date: input.date,
          time: input.time,
          duration: input.duration || "30 min",
          channel: input.channel || "Atelier",
          source: input.source || "Atelier",
          technician: input.technician || "Atelier principal",
          notes: input.notes || "",
          status: input.status || (input.confirmed ? "venu" : "prévu"),
          confirmed: input.confirmed ?? false,
          dayIndex: input.dayIndex ?? 2,
          row: input.row ?? 6,
          color: input.color || "mint",
        };
        set((state) => ({ appointments: [appointment, ...state.appointments], selectedAppointmentId: id }));
        return id;
      },
      updateAppointment: (id, patch) =>
        set((state) => {
          const appointments = state.appointments.map((appointment) => {
            if (appointment.id !== id) return appointment;
            const linkedRepair = state.repairs.find((repair) => repair.id === (patch.repairId ?? appointment.repairId));
            const customerId = getValidCustomerId(
              linkedRepair?.customerId ?? patch.customerId ?? appointment.customerId,
              state.customers,
              appointment.customerId,
            );
            return normalizeAppointment({ ...appointment, ...patch, customerId }, state.customers, state.repairs);
          });
          const repairs = state.repairs.map((repair) => {
            const appointment = appointments.find((entry) => entry.id === repair.appointmentId);
            return appointment && repair.customerId !== appointment.customerId
              ? normalizeRepair(
                  {
                    ...repair,
                    customerId: appointment.customerId,
                    history: [...repair.history, "Client synchronisé depuis le rendez-vous"],
                  },
                  state.customers,
                  appointments,
                )
              : repair;
          });
          return { appointments, customers: deriveCustomers(state.customers, repairs, state.payments), repairs };
        }),
      deleteAppointment: (id, deleteLinkedRepair = false) =>
        set((state) => {
          const appointments = state.appointments.filter((appointment) => appointment.id !== id);
          const linkedRepair = state.repairs.find(
            (repair) =>
              repair.appointmentId === id ||
              repair.id === state.appointments.find((appointment) => appointment.id === id)?.repairId,
          );
          const repairs = deleteLinkedRepair
            ? state.repairs.filter((repair) => repair.appointmentId !== id && repair.id !== linkedRepair?.id)
            : state.repairs.map((repair) =>
                repair.appointmentId === id || repair.id === linkedRepair?.id
                  ? {
                      ...repair,
                      appointmentId: undefined,
                      history: [...repair.history, "Rendez-vous lié supprimé"],
                    }
                  : repair,
              );
          return {
            appointments,
            customers: deriveCustomers(state.customers, repairs, state.payments),
            repairs,
            selectedAppointmentId: appointments[0]?.id ?? "",
            selectedRepairId:
              deleteLinkedRepair && linkedRepair?.id === state.selectedRepairId
                ? (repairs[0]?.id ?? "")
                : state.selectedRepairId,
          };
        }),
      createRepairFromAppointment: (appointmentId) => {
        const appointment = get().appointments.find((entry) => entry.id === appointmentId);
        if (!appointment) return "";
        const customerId = getValidCustomerId(appointment.customerId, get().customers);
        if (!customerId) return "";
        const existing =
          get().repairs.find((repair) => repair.id === appointment.repairId) ??
          get().repairs.find((repair) => repair.appointmentId === appointment.id);
        if (existing) {
          get().updateRepair(existing.id, { appointmentId: appointment.id, customerId });
          get().updateAppointment(appointment.id, {
            repairId: existing.id,
            status: "terminé",
            confirmed: true,
          });
          return existing.id;
        }
        const repairId = get().addRepair({
          appointmentId: appointment.id,
          customerId,
          device: appointment.device,
          model: appointment.device,
          issue: appointment.issue,
          status: "Reçu",
          amount: 0,
          notes: appointment.notes,
          droppedAt: `${appointment.date}, ${appointment.time}`,
          technician: "Atelier principal",
        });
        if (repairId) {
          get().updateAppointment(appointment.id, {
            repairId,
            status: "terminé",
            confirmed: true,
          });
        }
        return repairId;
      },
      addStockItem: (input) => {
        const id = uid("stock");
        const item = normalizeStockItem({
          id,
          shopId,
          leadTime: input.leadTime || "2 à 3 jours",
          ...input,
        });
        set((state) => ({ stockItems: [item, ...state.stockItems], selectedStockItemId: id }));
        return id;
      },
      updateStockItem: (id, patch) =>
        set((state) => ({
          stockItems: state.stockItems.map((item) =>
            item.id === id
              ? normalizeStockItem({
                  ...item,
                  ...patch,
                  name: patch.name ?? patch.part ?? item.name,
                  part: patch.name ?? patch.part ?? item.name,
                  sku: patch.sku ?? patch.reference ?? item.sku,
                  reference: patch.sku ?? patch.reference ?? item.sku,
                  categoryName: patch.categoryName ?? patch.category ?? item.categoryName,
                  category: patch.categoryName ?? patch.category ?? item.categoryName,
                  quantity: patch.quantity ?? patch.stock ?? item.quantity,
                  stock: patch.quantity ?? patch.stock ?? item.quantity,
                  purchasePrice:
                    patch.purchasePrice === undefined ? item.purchasePrice : clampMoney(patch.purchasePrice),
                  salePrice: patch.salePrice === undefined ? item.salePrice : clampMoney(patch.salePrice),
                  threshold: patch.threshold === undefined ? item.threshold : clampQuantity(patch.threshold),
                  updatedAt: todayLabel(),
                })
              : item,
          ),
        })),
      deleteStockItem: (id) =>
        set((state) => {
          const stockItems = state.stockItems.filter((item) => item.id !== id);
          return { stockItems, selectedStockItemId: stockItems[0]?.id ?? "" };
        }),
      restockItem: (id, quantity = 5) =>
        set((state) => ({
          stockItems: state.stockItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: item.quantity + clampQuantity(quantity),
                  stock: item.stock + clampQuantity(quantity),
                }
              : item,
          ),
        })),
      importStockItems: (items) =>
        set((state) => {
          const byReference = new Map(state.stockItems.map((item) => [item.reference, item]));
          const stockItems = [...state.stockItems];
          for (const input of items) {
            const existing = byReference.get(input.reference ?? input.sku ?? "");
            if (existing) {
              const index = stockItems.findIndex((item) => item.id === existing.id);
              stockItems[index] = normalizeStockItem({
                ...existing,
                ...input,
                leadTime: input.leadTime || existing.leadTime,
              });
            } else {
              stockItems.unshift(
                normalizeStockItem({ id: uid("stock"), shopId, leadTime: input.leadTime || "2 à 3 jours", ...input }),
              );
            }
          }
          return { stockItems };
        }),
      sendMessage: (input) => {
        const log: MessageLog = {
          id: uid("message"),
          shopId,
          customerId: input.customerId,
          repairId: input.repairId,
          channel: input.channel,
          subject: input.subject,
          body: input.body,
          createdAt: nowLabel(),
        };
        set((state) => ({ messageLogs: [log, ...state.messageLogs] }));
      },
      updateWorkshopInfo: (patch) =>
        set((state) => {
          const nextSettings: WorkshopSettings = {
            ...(state.workshopSettings ?? defaultWorkshopSettings),
            ...patch,
            updatedAt: nowLabel(),
          };
          return {
            workshopSettings: nextSettings,
            workshopInfo: asWorkshopInfo(nextSettings),
            updatedAt: nextSettings.updatedAt,
          };
        }),
      saveWorkshopSettings: (settings) =>
        set((state) => {
          const now = nowLabel();
          const nextSettings: WorkshopSettings = {
            ...(state.workshopSettings ?? defaultWorkshopSettings),
            ...settings,
            configuredAt: state.configuredAt ?? now,
            updatedAt: now,
          };
          return {
            workshopSettings: nextSettings,
            workshopInfo: asWorkshopInfo(nextSettings),
            onboardingCompleted: true,
            configuredAt: nextSettings.configuredAt,
            updatedAt: nextSettings.updatedAt,
          };
        }),
      setOnboardingCompleted: (done) =>
        set((state) => ({
          onboardingCompleted: done,
          configuredAt: done ? (state.configuredAt ?? nowLabel()) : undefined,
          updatedAt: done ? nowLabel() : state.updatedAt,
        })),
      addDocument: (input) => {
        const id = uid("doc");
        const document = { id, shopId, createdAt: todayLabel(), ...input };
        set((state) => ({ documents: [document, ...state.documents], selectedDocumentId: id }));
        return id;
      },
      deleteDocument: (id) =>
        set((state) => {
          const documents = state.documents.filter((document) => document.id !== id);
          return { documents, selectedDocumentId: documents[0]?.id ?? "" };
        }),
      loadPreloadedCatalog: async () => {
        // [DESACTIVER] Le catalogue global.json est pollué par des faux modèles (ex: "iPhone 11 Blanc").
        // On ne l'utilise plus comme base automatique pour garantir la propreté du catalogue.
        set({ isCatalogPreloaded: true });
        return;
      },
      addPriceBookItem: (input) => {
        const item = createPriceBookItem({ ...input, source: input.source ?? "manual" });
        set((state) => ({ priceBookItems: [item, ...state.priceBookItems] }));
        return item.id;
      },
      updatePriceBookItem: (id, patch) =>
        set((state) => ({
          priceBookItems: state.priceBookItems.map((item) =>
            item.id === id ? updatePriceBookItem(item, patch) : item,
          ),
        })),
      deletePriceBookItem: (id) =>
        set((state) => ({
          priceBookItems: state.priceBookItems.filter((item) => item.id !== id),
        })),
      togglePriceBookItem: (id, isActive) =>
        set((state) => ({
          priceBookItems: state.priceBookItems.map((item) =>
            item.id === id ? { ...item, isActive, updatedAt: new Date().toISOString() } : item,
          ),
        })),
      resetDemo: () => set(createSeed()),
    }),
    {
      name: "behar-tech-local-demo-v3",
      version: 1,
      partialize: (state) => {
        const { priceBookItems, ...rest } = state;
        const manualItems = priceBookItems.filter((item) => item.source === "manual");
        return { ...rest, priceBookItems: manualItems };
      },
      migrate: (persistedState) => normalizePersistedState(persistedState) as any,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedState(persistedState),
      }),
    },
  ),
);

export const getQuoteTotal = quoteTotal;
export const getInvoiceTotal = invoiceTotal;
