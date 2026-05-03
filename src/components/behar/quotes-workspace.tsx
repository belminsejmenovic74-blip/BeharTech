"use client";

import React, { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Smartphone,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useDocument } from "@/components/behar/print-provider";
import { formatEuro, getQuoteTotal, Quote, type QuoteStatus, useBeharStore } from "@/lib/behar-store";
import type { PriceBookItem } from "@/lib/price-book";

import {
  ChoiceCard,
  FormField,
  Input,
  Modal,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  StatusBadge,
  Textarea,
} from "./primitives";

// --- Types ---
type QuoteOrigin = "repair" | "client" | "manual";

interface QuoteLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteFormValues {
  origin: QuoteOrigin;
  customerId: string;
  repairId?: string;
  lines: QuoteLine[];
  notes: string;
  validityDays: number;
}

type QuoteCreatePrefill = {
  origin: QuoteOrigin;
  customerId: string;
  repairId?: string;
  notes?: string;
};

const safeFormat = (dateStr: string | undefined, formatStr: string) => {
  if (!dateStr) return "---";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "---";
    return format(d, formatStr, { locale: fr });
  } catch (e) {
    return "---";
  }
};

export function CreateQuoteModal({
  isOpen,
  onClose,
  prefill,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefill?: QuoteCreatePrefill | null;
}) {
  const { customers, repairs, addQuote, workshopInfo } = useBeharStore();
  const { download } = useDocument();

  const [step, setStep] = useState<"origin" | "form">("origin");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [form, setForm] = useState<QuoteFormValues>({
    origin: "manual",
    customerId: "",
    lines: [{ id: "1", description: "", quantity: 1, unitPrice: 0 }],
    notes: "",
    validityDays: 30,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (!prefill) {
      setStep("origin");
      setForm({
        origin: "manual",
        customerId: "",
        lines: [{ id: "1", description: "", quantity: 1, unitPrice: 0 }],
        notes: "",
        validityDays: 30,
      });
      return;
    }
    setStep("form");
    setForm({
      origin: prefill.origin,
      customerId: prefill.customerId,
      repairId: prefill.repairId,
      lines: [{ id: "1", description: "", quantity: 1, unitPrice: 0 }],
      notes: prefill.notes ?? "",
      validityDays: 30,
    });
  }, [isOpen, prefill]);

  // Derived data
  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const selectedRepair = repairs.find((r) => r.id === form.repairId);

  const subtotal = form.lines.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  const total = subtotal; // Simplement TTC pour le moment

  const handleAddLine = () => {
    setForm((f) => ({
      ...f,
      lines: [...f.lines, { id: Math.random().toString(36).substr(2, 9), description: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveLine = (id: string) => {
    if (form.lines.length === 1) return;
    setForm((f) => ({
      ...f,
      lines: f.lines.filter((l) => l.id !== id),
    }));
  };

  const handleAddFromCatalog = (item: PriceBookItem) => {
    setIsCatalogOpen(false);

    const hasOnlyEmptyLine = form.lines.length === 1 && !form.lines[0].description && form.lines[0].unitPrice === 0;
    const newLines = hasOnlyEmptyLine ? [] : [...form.lines];

    newLines.push({
      id: Math.random().toString(36).substr(2, 9),
      description: `${item.piece} ${item.modele} ${item.qualite}`.trim(),
      quantity: 1,
      unitPrice: item.prixVentePiece,
    });

    if (item.mainOeuvre > 0) {
      newLines.push({
        id: Math.random().toString(36).substr(2, 9),
        description: `Main-d'œuvre ${item.reparation}`.trim(),
        quantity: 1,
        unitPrice: item.mainOeuvre,
      });
    }

    setForm((f) => ({ ...f, lines: newLines }));
  };

  const handleLineChange = (id: string, field: keyof QuoteLine, value: any) => {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }));
  };

  const handleCreate = (status: QuoteStatus = "Envoyé", shouldDownload = false) => {
    if (!form.customerId && form.origin !== "manual") return;

    // Build lines with proper ids for the store
    const quoteLines = form.lines
      .filter((l) => l.description.trim() !== "" || l.unitPrice > 0)
      .map((l) => ({
        id: l.id,
        description: l.description || "Prestation",
        quantity: Math.max(1, l.quantity),
        unitPrice: Math.max(0, l.unitPrice),
      }));

    const quoteId = addQuote({
      customerId: form.customerId,
      repairId: form.repairId,
      status,
      lines: quoteLines.length > 0 ? quoteLines : undefined,
      notes: form.notes,
    });

    if (!quoteId) {
      toast.error(
        "Un devis accepté existe déjà pour cette réparation. Ouvrez-le ou modifiez son statut avant d'en créer un nouveau.",
      );
      return;
    }

    if (shouldDownload) {
      setTimeout(() => {
        download("quote", quoteId);
      }, 500);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un nouveau devis" maxWidth="max-w-6xl">
      <div className="flex h-[75vh]">
        {/* Left Column: Form */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100 custom-scrollbar">
          {step === "origin" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center max-w-sm mx-auto mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">D'où provient ce devis ?</h2>
                <p className="text-gray-500">Choisissez le contexte de création pour automatiser la saisie.</p>
              </div>

              <div className="flex gap-4">
                <ChoiceCard
                  title="Réparation"
                  subtitle="Lier à une réparation existante et son appareil."
                  icon={Smartphone}
                  selected={form.origin === "repair"}
                  onClick={() => setForm({ ...form, origin: "repair" })}
                />
                <ChoiceCard
                  title="Client existant"
                  subtitle="Sélectionner un client dans votre base de données."
                  icon={User}
                  selected={form.origin === "client"}
                  onClick={() => setForm({ ...form, origin: "client" })}
                />
                <ChoiceCard
                  title="Devis libre"
                  subtitle="Création manuelle sans lien préalable."
                  icon={Plus}
                  selected={form.origin === "manual"}
                  onClick={() => setForm({ ...form, origin: "manual" })}
                />
              </div>

              <div className="mt-10 pt-8 border-top border-gray-100 flex justify-center">
                <PrimaryButton onClick={() => setStep("form")} className="px-10 h-12 rounded-xl group">
                  Continuer la configuration
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Origin Context */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Informations Client</h3>
                <div className="grid grid-cols-2 gap-4">
                  {form.origin === "repair" && (
                    <FormField label="Réparation associée">
                      <Select
                        value={form.repairId}
                        onChange={(e) => {
                          const r = repairs.find((rep) => rep.id === e.target.value);
                          setForm({ ...form, repairId: e.target.value, customerId: r?.customerId || "" });
                        }}
                      >
                        <option value="">Sélectionner une réparation</option>
                        {repairs
                          .filter((r) => r.status !== "Prêt")
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              #{r.id.slice(0, 5)} - {customers.find((c) => c.id === r.customerId)?.name} (
                              {r.deviceModel})
                            </option>
                          ))}
                      </Select>
                    </FormField>
                  )}

                  {(form.origin === "client" || form.origin === "repair") && (
                    <FormField label="Client">
                      <Select
                        value={form.customerId}
                        onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                        disabled={form.origin === "repair"}
                      >
                        <option value="">Sélectionner un client</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}

                  {form.origin === "manual" && (
                    <FormField label="Nom du prospect (Manuel)">
                      <Input
                        placeholder="Ex: Jean Dupont"
                        value={form.customerId}
                        onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                      />
                    </FormField>
                  )}

                  <FormField label="Validité (jours)">
                    <Input
                      type="number"
                      value={form.validityDays}
                      onChange={(e) => setForm({ ...form, validityDays: parseInt(e.target.value) })}
                    />
                  </FormField>
                </div>
              </section>

              {/* Lines */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Lignes du devis</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCatalogOpen(true)}
                      className="text-[#2A9D8F] text-xs font-semibold flex items-center hover:underline"
                    >
                      <Search size={14} className="mr-1" /> Ajouter depuis catalogue prix
                    </button>
                    <button
                      onClick={handleAddLine}
                      className="text-[#2A9D8F] text-xs font-semibold flex items-center hover:underline"
                    >
                      <Plus size={14} className="mr-1" /> Ajouter une ligne
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-200"
                    >
                      <div className="flex-1">
                        <Input
                          placeholder="Description de la prestation"
                          value={line.description}
                          onChange={(e) => handleLineChange(line.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qté"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(line.id, "quantity", parseInt(e.target.value))}
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          placeholder="P. Unit"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(line.id, "unitPrice", parseFloat(e.target.value))}
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveLine(line.id)}
                        className="mt-2.5 p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Notes & Conditions</h3>
                <Textarea
                  placeholder="Notes à l'attention du client ou conditions particulières..."
                  className="min-h-[100px]"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </section>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="w-[420px] bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aperçu en direct</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div
              className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 aspect-[1/1.414] origin-top scale-[0.85] w-[117%]"
              style={{ transformOrigin: "top left" }}
            >
              {/* Fake PDF Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h1 className="text-2xl font-black text-[#2A9D8F] tracking-tighter italic">BEHAR TECH</h1>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Document de Devis Officiel</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">DEVIS #PROV-{(Math.random() * 1000).toFixed(0)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {format(new Date(), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Émetteur</p>
                    <p className="text-xs font-bold text-gray-900">{workshopInfo?.name || "Behar Tech"}</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                      {workshopInfo?.address || "Adresse non configurée"}
                      <br />
                      {workshopInfo?.phone || "01 02 03 04 05"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Client</p>
                    <p className="text-xs font-bold text-gray-900">
                      {selectedCustomer?.name || form.customerId || "---"}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                      {selectedCustomer?.email || "---"}
                      <br />
                      {selectedCustomer?.phone || "---"}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-3">Détails de la prestation</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-[9px] text-gray-400 font-bold">
                        <th className="pb-2">DESCRIPTION</th>
                        <th className="pb-2 text-right w-12">QTÉ</th>
                        <th className="pb-2 text-right w-20">P. UNIT</th>
                        <th className="pb-2 text-right w-20">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lines.map((line, i) => (
                        <tr key={i} className="border-b border-gray-50 text-[10px]">
                          <td className="py-3 text-gray-700">{line.description || "Nouvelle prestation..."}</td>
                          <td className="py-3 text-right text-gray-500">{line.quantity}</td>
                          <td className="py-3 text-right text-gray-900 font-medium">{line.unitPrice.toFixed(2)}€</td>
                          <td className="py-3 text-right text-gray-900 font-bold">
                            {(line.quantity * line.unitPrice).toFixed(2)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-auto">
                  <div className="w-40 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Sous-total</span>
                      <span className="font-bold text-gray-900">{subtotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-900 pt-2">
                      <span className="font-black text-gray-900 uppercase">Total TTC</span>
                      <span className="font-black text-[#2A9D8F]">{total.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-100 space-y-3">
            <div className="flex gap-2">
              <SecondaryButton onClick={onClose} className="flex-1 rounded-xl">
                Annuler
              </SecondaryButton>
              <SecondaryButton onClick={() => handleCreate("Brouillon")} className="flex-1 rounded-xl">
                Brouillon
              </SecondaryButton>
            </div>
            <PrimaryButton
              disabled={subtotal === 0 || (!form.customerId && form.origin !== "manual")}
              onClick={() => handleCreate("Envoyé")}
              className="w-full h-12 rounded-xl"
            >
              Créer le devis
            </PrimaryButton>
            <button
              disabled={subtotal === 0 || (!form.customerId && form.origin !== "manual")}
              onClick={() => handleCreate("Envoyé", true)}
              className="w-full flex items-center justify-center gap-2 text-[#2A9D8F] text-sm font-bold h-10 hover:bg-[#2A9D8F]/5 rounded-xl transition-colors"
            >
              <Download size={16} /> Créer + Télécharger PDF
            </button>
          </div>
        </div>
      </div>

      <CatalogSearchModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelect={handleAddFromCatalog}
      />
    </Modal>
  );
}

function CatalogSearchModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: PriceBookItem) => void;
}) {
  const items = useBeharStore((s) => s.priceBookItems);
  const loadPreloadedCatalog = useBeharStore((s) => s.loadPreloadedCatalog);

  useEffect(() => {
    if (isOpen) loadPreloadedCatalog();
  }, [isOpen, loadPreloadedCatalog]);

  const [selMarque, setSelMarque] = useState("");
  const [selModele, setSelModele] = useState("");
  const [selReparation, setSelReparation] = useState("");
  const [selQualite, setSelQualite] = useState("");

  const resetFrom = (level: number) => {
    if (level <= 1) setSelMarque("");
    if (level <= 2) setSelModele("");
    if (level <= 3) setSelReparation("");
    if (level <= 4) setSelQualite("");
  };

  const marques = useMemo(() => Array.from(new Set(items.map((i) => i.marque))).sort(), [items]);

  const modeles = useMemo(() => {
    if (!selMarque) return [];
    return Array.from(new Set(items.filter((i) => i.marque === selMarque).map((i) => i.modele))).sort();
  }, [items, selMarque]);

  const reparations = useMemo(() => {
    if (!selModele) return [];
    return Array.from(
      new Set(items.filter((i) => i.marque === selMarque && i.modele === selModele).map((i) => i.reparation)),
    ).sort();
  }, [items, selMarque, selModele]);

  const qualites = useMemo(() => {
    if (!selReparation) return [];
    return items.filter((i) => i.marque === selMarque && i.modele === selModele && i.reparation === selReparation);
  }, [items, selMarque, selModele, selReparation]);

  const selectedItem = useMemo(() => {
    return qualites.find((i) => i.qualite === selQualite);
  }, [qualites, selQualite]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter depuis catalogue prix" maxWidth="max-w-3xl">
      <div className="p-6 space-y-4">
        {/* Cascade Dropdowns */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Marque">
            <Select
              value={selMarque}
              onChange={(e) => {
                setSelMarque(e.target.value);
                resetFrom(2);
              }}
            >
              <option value="">-- Choisir --</option>
              {marques.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Modèle">
            <Select
              value={selModele}
              onChange={(e) => {
                setSelModele(e.target.value);
                resetFrom(3);
              }}
              disabled={!selMarque}
            >
              <option value="">-- Choisir --</option>
              {modeles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Réparation / Panne">
            <Select
              value={selReparation}
              onChange={(e) => {
                setSelReparation(e.target.value);
                resetFrom(4);
              }}
              disabled={!selModele}
            >
              <option value="">-- Choisir --</option>
              {reparations.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Qualité">
            <Select value={selQualite} onChange={(e) => setSelQualite(e.target.value)} disabled={!selReparation}>
              <option value="">-- Choisir --</option>
              {Array.from(new Set(qualites.map((q) => q.qualite))).map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {selectedItem ? (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Détail du prix (Interne)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Pièce</p>
                <p className="font-medium text-gray-900">{selectedItem.piece}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Fournisseur</p>
                <p className="font-medium text-gray-900">{selectedItem.fournisseur || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Stock interne</p>
                <p className="font-medium text-gray-900">{selectedItem.stockDisponible ?? "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Prix Vente Pièce</p>
                <p className="font-medium text-gray-900">{formatEuro(selectedItem.prixVentePiece)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Main d'œuvre</p>
                <p className="font-medium text-gray-900">{formatEuro(selectedItem.mainOeuvre)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Client</p>
                <p className="font-bold text-[#2A9D8F] text-base">{formatEuro(selectedItem.prixClientTotal)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Marge Interne</p>
                <p className={`font-bold ${selectedItem.marge >= 0 ? "text-gray-900" : "text-red-500"}`}>
                  {formatEuro(selectedItem.marge)}{" "}
                  <span className="text-xs text-gray-400 font-normal">({selectedItem.margePourcentage}%)</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-10 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
            Sélectionnez une réparation et une qualité pour voir le détail du prix.
          </div>
        )}

        <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
          <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
          <PrimaryButton onClick={() => selectedItem && onSelect(selectedItem)} disabled={!selectedItem}>
            Ajouter au devis
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export function QuotesList() {
  const store = useBeharStore();
  const { quotes, customers, repairs } = store;
  const { download } = useDocument();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<QuoteCreatePrefill | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");

  const router = useRouter();

  const filteredQuotes = useMemo(() => {
    return quotes
      .filter((q) => {
        const customer = customers.find((c) => c.id === q.customerId);
        const searchStr = `${customer?.name || ""} ${q.number || ""} ${q.id} ${q.status}`.toLowerCase();
        const matchesSearch = searchStr.includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || q.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [quotes, customers, search, statusFilter]);

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);
  const selectedCustomer = selectedQuote ? customers.find((c) => c.id === selectedQuote.customerId) : undefined;
  const selectedRepair = selectedQuote ? repairs.find((r) => r.id === selectedQuote.repairId) : undefined;
  const selectedRepairFromStore = repairs.find((repair) => repair.id === store.selectedRepairId);
  const canEditSelectedQuote = selectedQuote
    ? selectedQuote.status === "Brouillon" || selectedQuote.status === "Envoyé"
    : false;
  const quoteLineGridClass = canEditSelectedQuote
    ? "grid grid-cols-[1fr_56px_92px_92px_34px] items-center gap-2"
    : "grid grid-cols-[1fr_40px_80px_80px] items-center gap-2";

  const quoteStatuses: QuoteStatus[] = ["Brouillon", "Envoyé", "Accepté", "Refusé"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenCreate = params.get("create") === "1";
    const origin = params.get("origin");
    if (!shouldOpenCreate || origin !== "repair" || !selectedRepairFromStore?.customerId) return;
    setModalPrefill({
      origin: "repair",
      customerId: selectedRepairFromStore.customerId,
      repairId: selectedRepairFromStore.id,
      notes:
        `Type : ${selectedRepairFromStore.deviceType ?? "Non renseigné"}\n` +
        `Marque : ${selectedRepairFromStore.brandName ?? "Non renseignée"}\n` +
        `Modèle : ${selectedRepairFromStore.deviceModel ?? selectedRepairFromStore.model}\n` +
        `Panne : ${selectedRepairFromStore.issue}\n` +
        "Devis valable 30 jours.",
    });
    setIsModalOpen(true);
    router.replace("/dashboard/devis");
  }, [selectedRepairFromStore, router]);

  useEffect(() => {
    if (!store.selectedQuoteId) return;
    if (!quotes.some((quote) => quote.id === store.selectedQuoteId)) return;
    setSelectedQuoteId(store.selectedQuoteId);
  }, [store.selectedQuoteId, quotes]);

  const handleConvertToInvoice = () => {
    if (!selectedQuote) return;
    if (selectedQuote.status !== "Accepté") {
      toast.info("Le devis doit être accepté avant d'être converti en facture");
      return;
    }
    if (selectedQuote.invoiceId) {
      store.setSelected("invoice", selectedQuote.invoiceId);
      router.push("/dashboard/factures");
      toast.info("Facture déjà existante pour ce devis");
      return;
    }
    const invoiceId = store.convertQuoteToInvoice(selectedQuote.id);
    if (invoiceId) {
      store.setSelected("invoice", invoiceId);
      router.push("/dashboard/factures");
      toast.success("Facture créée depuis le devis");
    } else {
      toast.error("Impossible de convertir ce devis en facture");
    }
  };

  const handleUpdateSelectedQuoteLine = (
    lineId: string,
    field: "description" | "quantity" | "unitPrice",
    value: string,
  ) => {
    if (!(selectedQuote && canEditSelectedQuote)) return;
    if (field === "description") {
      store.updateQuoteLine(selectedQuote.id, lineId, { description: value });
      return;
    }
    if (field === "quantity") {
      const quantity = Number.parseInt(value, 10);
      store.updateQuoteLine(selectedQuote.id, lineId, { quantity: Number.isFinite(quantity) ? quantity : 1 });
      return;
    }
    const unitPrice = Number.parseFloat(value);
    store.updateQuoteLine(selectedQuote.id, lineId, { unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1A1916] tracking-tight">Devis</h1>
          <p className="text-[#6B6B6B] mt-1">Gérez vos propositions commerciales et suivez leur acceptation.</p>
        </div>
        <PrimaryButton
          onClick={() => {
            setModalPrefill(null);
            setIsModalOpen(true);
          }}
          className="rounded-xl px-6 h-12"
        >
          <Plus size={20} className="mr-2" />
          Nouveau devis
        </PrimaryButton>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={18} />
          <input
            type="text"
            placeholder="Rechercher un devis, un client..."
            className="w-full pl-12 pr-4 h-12 bg-white border border-[#E7E4DC] rounded-xl focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-white border border-[#E7E4DC] rounded-xl p-1">
          {["All", "Brouillon", "Envoyé", "Accepté", "Refusé", "Facturé"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 h-9 rounded-lg text-sm font-semibold transition-all ${
                statusFilter === status ? "bg-[#1A1916] text-white shadow-sm" : "text-[#6B6B6B] hover:text-[#1A1916]"
              }`}
            >
              {status === "All" ? "Tous" : status}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="overflow-hidden border-none shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7E4DC] bg-[#FAFAF8]">
                  <th className="px-6 py-4 text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                    Client / Appareil
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B6B6B] uppercase tracking-wider text-right">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B6B6B] uppercase tracking-wider text-center">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#6B6B6B] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4DC]/50">
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => {
                    const customer = customers.find((c) => c.id === quote.customerId);
                    const repair = repairs.find((r) => r.id === quote.repairId);
                    const isSelected = quote.id === selectedQuoteId;

                    return (
                      <tr
                        key={quote.id}
                        className={`cursor-pointer transition-colors group ${isSelected ? "bg-[#E7F5F1] border-[#2A9D8F]/30" : "hover:bg-[#FAFAF8]"}`}
                        onClick={() => setSelectedQuoteId(quote.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#2A9D8F]/10 text-[#2A9D8F]" : "bg-[#F1F1EF] text-[#6B6B6B]"}`}
                            >
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1A1916] uppercase">
                                {quote.number || `#${quote.id.slice(0, 8)}`}
                              </p>
                              <p className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-tight">Devis Pro</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-[#1A1916]">{customer?.name || "---"}</p>
                          <p className="text-xs text-[#6B6B6B]">{repair?.deviceModel || "---"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#1A1916]">{safeFormat(quote.date, "dd MMM yyyy")}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-[#6B6B6B]" />
                            <p className="text-[10px] text-[#6B6B6B]">
                              Expire le {safeFormat(quote.expiryDate, "dd/MM")}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-black text-[#1A1916]">{formatEuro(getQuoteTotal(quote))}</p>
                          <p className="text-[10px] text-[#6B6B6B] font-bold uppercase">{quote.lines.length} lignes</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <StatusBadge status={quote.status} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 text-[#6B6B6B] hover:text-[#2A9D8F] transition-colors bg-white border border-[#E7E4DC] rounded-lg shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                download("quote", quote.id);
                              }}
                              title="Télécharger PDF"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-[#F1F1EF] rounded-full flex items-center justify-center mx-auto mb-4 text-[#B0AEA8]">
                          <Search size={32} />
                        </div>
                        <p className="text-[#1A1916] font-bold">Aucun devis trouvé</p>
                        <p className="text-[#6B6B6B] text-sm mt-1">
                          Essayez de modifier vos filtres ou créez un nouveau devis.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Detail panel for selected quote */}
        {selectedQuote && selectedCustomer && (
          <Panel className="p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[#1A1916] text-xl">
                  Devis {selectedQuote.number || `#${selectedQuote.id.slice(0, 8)}`}
                </h2>
                <p className="mt-1 text-[#6B6B6B] text-sm">{selectedCustomer.name}</p>
              </div>
              {selectedQuote.status === "Accepté" || selectedQuote.status === "Facturé" ? (
                <StatusBadge status={selectedQuote.status} />
              ) : (
                <select
                  className="h-9 rounded-[12px] border border-[#E7E4DC] bg-white px-3 font-semibold text-[#1A1916] text-sm outline-none transition focus:border-[#2A9D8F]/60 focus:ring-4 focus:ring-[#2A9D8F]/10"
                  onChange={(e) => {
                    store.updateQuote(selectedQuote.id, { status: e.target.value as QuoteStatus });
                    toast.success(`Devis passé en "${e.target.value}"`);
                  }}
                  value={selectedQuote.status}
                >
                  {quoteStatuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {(selectedQuote.status === "Accepté" || selectedQuote.status === "Facturé") && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FFF8EB] px-4 py-2.5 text-sm text-[#9A6A17] border border-[#F2DFA7]">
                <AlertCircle size={16} />
                <span>
                  Ce devis est <strong>verrouillé</strong> après acceptation. Seul le PDF et la conversion en facture
                  sont disponibles.
                </span>
              </div>
            )}

            <div className="rounded-[14px] border border-[#E7E4DC] bg-white p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#6B6B6B]">Client</p>
                  <Link
                    href={`/dashboard/clients?id=${selectedCustomer.id}`}
                    className="mt-1 block font-semibold text-[#1A1916] hover:text-[#2A9D8F] transition-colors"
                  >
                    {selectedCustomer.name}
                  </Link>
                </div>
                <div>
                  <p className="text-[#6B6B6B]">Téléphone</p>
                  <p className="mt-1 font-semibold text-[#1A1916]">{selectedCustomer.phone}</p>
                </div>
                {selectedRepair && (
                  <>
                    <div>
                      <p className="text-[#6B6B6B]">Appareil</p>
                      <Link
                        href="/dashboard/reparations"
                        onClick={() => store.setSelected("repair", selectedRepair.id)}
                        className="mt-1 block font-semibold text-[#1A1916] hover:text-[#2A9D8F] transition-colors"
                      >
                        {selectedRepair.device}
                      </Link>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B]">Panne</p>
                      <p className="mt-1 font-semibold text-[#1A1916]">{selectedRepair.issue}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 space-y-2 text-xs">
                <div className={`${quoteLineGridClass} px-2 font-semibold text-[#6B6B6B] uppercase tracking-wider`}>
                  <span>Description</span>
                  <span className="text-center">Qté</span>
                  <span className="text-right">Prix U.</span>
                  <span className="text-right">Total</span>
                  {canEditSelectedQuote ? <span /> : null}
                </div>
                {selectedQuote.lines.map((line) => (
                  <div
                    key={line.id}
                    className={`${quoteLineGridClass} rounded-xl border border-[#E7E4DC] bg-white p-2 text-[#1A1916]`}
                  >
                    {canEditSelectedQuote ? (
                      <input
                        className="h-8 rounded-lg border border-[#E7E4DC] px-2 text-sm"
                        onChange={(e) => handleUpdateSelectedQuoteLine(line.id, "description", e.target.value)}
                        value={line.description}
                      />
                    ) : (
                      <span className="text-sm truncate">{line.description}</span>
                    )}
                    {canEditSelectedQuote ? (
                      <input
                        className="h-8 rounded-lg border border-[#E7E4DC] px-1 text-center text-sm"
                        min={1}
                        onChange={(e) => handleUpdateSelectedQuoteLine(line.id, "quantity", e.target.value)}
                        type="number"
                        value={line.quantity}
                      />
                    ) : (
                      <span className="text-center text-sm">{line.quantity}</span>
                    )}
                    {canEditSelectedQuote ? (
                      <input
                        className="h-8 rounded-lg border border-[#E7E4DC] px-2 text-right text-sm"
                        min={0}
                        onChange={(e) => handleUpdateSelectedQuoteLine(line.id, "unitPrice", e.target.value)}
                        step="0.01"
                        type="number"
                        value={line.unitPrice}
                      />
                    ) : (
                      <span className="text-right text-sm">{formatEuro(line.unitPrice)}</span>
                    )}
                    <span className="text-right font-semibold text-sm">
                      {formatEuro(line.quantity * line.unitPrice)}
                    </span>
                    {canEditSelectedQuote ? (
                      <button
                        className="grid size-7 place-items-center rounded-md text-[#B42318] hover:bg-[#FFF1F0]"
                        onClick={() => store.deleteQuoteLine(selectedQuote.id, line.id)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                ))}
                {canEditSelectedQuote ? (
                  <div className="flex justify-end gap-2 pt-1">
                    <SecondaryButton className="h-8 px-2" onClick={() => store.addQuoteLine(selectedQuote.id)}>
                      <Plus size={14} />
                      Ajouter ligne
                    </SecondaryButton>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 border-[#E7E4DC] border-t pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-[#1A1916] text-lg">Total</span>
                  <span className="font-semibold text-[#167B70] text-xl">
                    {formatEuro(getQuoteTotal(selectedQuote))}
                  </span>
                </div>
              </div>

              {selectedQuote.notes && (
                <div className="mt-4 rounded-xl bg-[#FAFAF8] p-3 text-sm text-[#6B6B6B]">
                  <p className="font-semibold text-[#1A1916] mb-1">Notes</p>
                  <p>{selectedQuote.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-2">
              <SecondaryButton className="w-full" onClick={() => download("quote", selectedQuote.id)}>
                <Download size={16} />
                Télécharger PDF devis
              </SecondaryButton>

              {selectedQuote.status === "Accepté" && !selectedQuote.invoiceId && (
                <PrimaryButton className="w-full" onClick={handleConvertToInvoice}>
                  <ArrowRight size={16} />
                  Convertir en facture
                </PrimaryButton>
              )}

              {selectedQuote.invoiceId && (
                <SecondaryButton
                  className="w-full border-[#2A9D8F] text-[#167B70]"
                  onClick={() => {
                    store.setSelected("invoice", selectedQuote.invoiceId!);
                    window.location.href = "/dashboard/factures";
                  }}
                >
                  <FileText size={16} />
                  Voir la facture liée
                </SecondaryButton>
              )}
            </div>
          </Panel>
        )}
      </section>

      <CreateQuoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalPrefill(null);
        }}
        prefill={modalPrefill}
      />
    </div>
  );
}

// Old workspace component kept for compatibility or reference if needed,
// but we'll use QuotesList as the main entry point now.
export function QuotesWorkspace() {
  return <QuotesList />;
}
