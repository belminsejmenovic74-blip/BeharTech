"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Check, ChevronDown, FileText, Mail, Phone, Sparkles, Tag, User, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Combobox, PrimaryButton, SecondaryButton } from "@/components/behar/primitives";
import { deviceCatalog } from "@/data/deviceCatalog";
import {
  deviceBrands,
  deviceModels,
  type DeviceType,
  formatEuro,
  getNowIso,
  getTomorrowIso,
  type PriceSnapshot,
  type Repair,
  type RepairStatus,
  useBeharStore,
} from "@/lib/behar-store";
import {
  extractPartQuality,
  findCatalogMatches,
  getBestPriceBookItem,
  groupCatalogByQualityLabel,
} from "@/lib/price-book";
import {
  canonicalizeIntervention,
  filterSuggestionChips,
  getDefaultInterventionsByDeviceType,
  normalizeInterventionHint,
} from "@/lib/repair-intervention";
import { getDeviceSeries } from "@/lib/device-series";

const UI_DEVICE_TYPES: DeviceType[] = ["Smartphone", "Tablette", "Ordinateur", "Console", "Autre"];

function uiTypeToPriceBook(t: string): import("@/lib/price-book").PriceBookDeviceType {
  const m: Record<string, import("@/lib/price-book").PriceBookDeviceType> = {
    Smartphone: "smartphone",
    Tablette: "tablet",
    Ordinateur: "computer",
    Console: "console",
    Autre: "other",
  };
  return m[t] ?? "other";
}

function buildQuoteLines(snapshot: PriceSnapshot, modelFull: string, issueLabel: string, finalPrice: number) {
  const lineId = () => `line_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const interventionLabel = (issueLabel || snapshot.reparation || snapshot.piece || "Réparation")
    .replace(/^Remplacement\s+/i, "Remplacement ")
    .trim();
  const tail = modelFull.trim();
  const total = finalPrice > 0 ? finalPrice : snapshot.prixClientTotal;
  if (total <= 0) return [];
  const description = (tail ? `${interventionLabel} — ${tail}` : interventionLabel).replace(/\s+/g, " ").trim();
  return [
    {
      id: lineId(),
      description,
      quantity: 1,
      unitPrice: total,
      total,
    },
  ];
}

export function RepairModal({
  initial,
  initialStatus,
  onClose,
}: Readonly<{ initial?: Repair; initialStatus: RepairStatus; onClose: () => void }>) {
  const {
    customers,
    priceBookItems,
    addCustomer,
    addPriceBookItem,
    addAppointment,
    updateRepair,
    addQuote,
    setSelected,
    addRepair,
  } = useBeharStore(
    useShallow((s) => ({
      customers: s.customers,
      priceBookItems: s.priceBookItems,
      addCustomer: s.addCustomer,
      addPriceBookItem: s.addPriceBookItem,
      addAppointment: s.addAppointment,
      updateRepair: s.updateRepair,
      addQuote: s.addQuote,
      setSelected: s.setSelected,
      addRepair: s.addRepair,
    })),
  );
  const router = useRouter();

  useEffect(() => {
    useBeharStore.getState().loadPreloadedCatalog();
  }, []);

  const [clientType, setClientType] = useState<"existant" | "nouveau" | "anonyme">("existant");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initial?.customerId || "");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [deviceType, setDeviceType] = useState<DeviceType>(initial?.deviceType ?? "Smartphone");
  const [marque, setMarque] = useState(initial?.brandName ?? "");
  const [modele, setModele] = useState(initial?.deviceModel ?? initial?.model ?? "");

  const [intervention, setIntervention] = useState(initial?.issue ?? "");
  const [prixPiece, setPrixPiece] = useState("");
  const [mainOeuvre, setMainOeuvre] = useState("");
  const [customInterventionOpen, setCustomInterventionOpen] = useState(false);
  const [customInterventionName, setCustomInterventionName] = useState("");
  const [customInterventionPurchase, setCustomInterventionPurchase] = useState("");
  const [customInterventionSale, setCustomInterventionSale] = useState("");
  const [customInterventionLabor, setCustomInterventionLabor] = useState("");
  const [customInterventionFinal, setCustomInterventionFinal] = useState("");
  const [customInterventionSave, setCustomInterventionSave] = useState(true);

  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("");

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [prixAchat, setPrixAchat] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [skuAdv, setSkuAdv] = useState("");
  const [stockAdv, setStockAdv] = useState("");
  const [garantieAdv, setGarantieAdv] = useState("");
  const [notesInternes, setNotesInternes] = useState("");
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  const [rdvOui, setRdvOui] = useState(false);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvTime, setRdvTime] = useState("");
  const [rdvDuration, setRdvDuration] = useState("60 min");
  const [rdvMotif, setRdvMotif] = useState("");

  useEffect(() => {
    if (!initial) return;
    setClientType("existant");
    setSelectedCustomerId(initial.customerId);
    setDeviceType(initial.deviceType ?? "Smartphone");
    setMarque(initial.brandName ?? "");
    setModele(initial.deviceModel ?? initial.model ?? "");
    setIntervention(initial.issue ?? "");
    const snap = initial.selectedPriceSnapshot;
    if (snap) {
      setPrixPiece(String(snap.prixVentePiece ?? ""));
      setMainOeuvre(String(snap.mainOeuvre ?? ""));
      setSelectedCatalogId(snap.priceBookItemId ?? null);
      setSelectedQuality(snap.qualite ?? "");
    }
    setNotesInternes(initial.notes ?? "");
    if (initial.brandName && (initial.deviceModel || initial.model)) {
      setSelectedSeries(getDeviceSeries(initial.brandName, initial.deviceModel ?? initial.model ?? ""));
    }
  }, [initial?.id]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, customerSearch]);

  const chosenCustomer = customers.find((c) => c.id === selectedCustomerId);
  
  const priceBookType = useMemo(() => uiTypeToPriceBook(deviceType), [deviceType]);

  const brandOptions = useMemo(() => {
    // Source 1: Official Catalog
    const fromOfficial = deviceCatalog
      .filter((entry) => entry.category === priceBookType)
      .map((entry) => entry.brand);
      
    // Source 2: Store/Mocks
    const fromStore = deviceBrands
      .filter((entry) => entry.deviceTypes.includes(deviceType))
      .map((entry) => entry.name);
      
    // Source 3: Price Book (existing items)
    const fromCatalog = priceBookItems
      .filter((entry) => entry.typeAppareil === priceBookType)
      .map((entry) => entry.marque);
      
    return Array.from(new Set([...fromOfficial, ...fromStore, ...fromCatalog])).sort((a, b) => a.localeCompare(b, "fr"));
  }, [deviceType, priceBookType, priceBookItems]);

  const modelsBySeries = useMemo(() => {
    const normalizedBrand = marque.trim().toLowerCase();
    
    // Official Catalog
    const fromOfficial = deviceCatalog
      .find(b => b.brand.toLowerCase() === normalizedBrand || b.aliases.some(a => a.toLowerCase() === normalizedBrand))
      ?.models || [];
      
    // Store
    const matchingBrandIds = deviceBrands
      .filter((entry) => entry.name.toLowerCase() === normalizedBrand)
      .map((entry) => entry.id);
    const fromStore = deviceModels
      .filter((entry) => entry.deviceType === deviceType)
      .filter((entry) => matchingBrandIds.length === 0 || matchingBrandIds.includes(entry.brandId))
      .map((entry) => entry.name);
      
    // Price Book
    const fromCatalog = priceBookItems
      .filter((entry) => entry.typeAppareil === priceBookType)
      .filter((entry) => !normalizedBrand || entry.marque.toLowerCase() === normalizedBrand)
      .filter((entry) => entry.isActive !== false)
      .map((entry) => entry.modele);
      
    const allModels = Array.from(new Set([...fromOfficial, ...fromStore, ...fromCatalog]));
    
    const map = new Map<string, string[]>();
    for (const m of allModels) {
      const series = getDeviceSeries(marque, m);
      if (!map.has(series)) map.set(series, []);
      map.get(series)!.push(m);
    }
    
    return map;
  }, [deviceType, marque, priceBookType, priceBookItems, deviceBrands, deviceModels]);

  const seriesOptions = useMemo(() => {
    return Array.from(modelsBySeries.keys()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [modelsBySeries]);

  const [selectedSeries, setSelectedSeries] = useState("");
  
  const modelOptions = useMemo(() => {
    if (!selectedSeries) return [];
    return (modelsBySeries.get(selectedSeries) || []).sort((a, b) => a.localeCompare(b, "fr"));
  }, [modelsBySeries, selectedSeries]);

  const interventionForMatch = useMemo(() => normalizeInterventionHint(intervention), [intervention]);

  const catalogPool = useMemo(() => {
    return findCatalogMatches(priceBookItems, {
      typeAppareil: uiTypeToPriceBook(deviceType),
      marque,
      modele,
      interventionHint: interventionForMatch || intervention,
    });
  }, [priceBookItems, deviceType, marque, modele, intervention, interventionForMatch]);

  const catalogByQuality = useMemo(() => groupCatalogByQualityLabel(catalogPool), [catalogPool]);
  const selectedInterventionKey = useMemo(
    () => canonicalizeIntervention((interventionForMatch || intervention || "").trim()),
    [intervention, interventionForMatch],
  );
  const qualityOptionsForIntervention = useMemo(() => {
    if (!selectedInterventionKey) return [];
    const matches = catalogPool.filter((item) => canonicalizeIntervention(item.reparation) === selectedInterventionKey);
    const byQuality = groupCatalogByQualityLabel(matches);
    const options: Array<{ label: string; itemId: string; price: number; item: (typeof matches)[number] }> = [];
    for (const [q, items] of byQuality.entries()) {
      const best = getBestPriceBookItem(items);
      if (!best) continue;
      options.push({ label: q, itemId: best.id, price: best.prixClientTotal, item: best });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [catalogPool, selectedInterventionKey]);

  // Auto-sélection d'une qualité si une seule existe (uniquement après intervention choisie)
  useEffect(() => {
    if (!selectedInterventionKey) return;
    if (selectedCatalogId) return;
    if (qualityOptionsForIntervention.length !== 1) return;
    const only = qualityOptionsForIntervention[0];
    setSelectedCatalogId(only.itemId);
    setSelectedQuality(only.label);
    setPrixPiece(String(only.item.prixVentePiece));
    setMainOeuvre(String(only.item.mainOeuvre));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInterventionKey, qualityOptionsForIntervention.length]);
  const interventionCards = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        price: number;
        labor: number;
        itemId?: string;
      }
    >();
    for (const item of catalogPool) {
      const label = canonicalizeIntervention(item.reparation);
      const existing = map.get(label);
      if (!existing || (item.prixClientTotal > 0 && item.prixClientTotal < existing.price)) {
        map.set(label, { label, price: item.prixClientTotal, labor: item.mainOeuvre, itemId: item.id });
      }
    }
    for (const fallback of getDefaultInterventionsByDeviceType(deviceType)) {
      if (!map.has(fallback)) {
        map.set(fallback, { label: fallback, price: 0, labor: 0 });
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [catalogPool, deviceType]);

  const selectedCatalogItem = useMemo(
    () => (selectedCatalogId ? priceBookItems.find((i) => i.id === selectedCatalogId) : undefined),
    [selectedCatalogId, priceBookItems],
  );

  const prixPieceNum = parseFloat(prixPiece.replace(",", ".") || "0") || 0;
  const mainNum = parseFloat(mainOeuvre.replace(",", ".") || "0") || 0;
  const totalClient = prixPieceNum + mainNum;

  const summarySource: "Catalogue atelier" | "Tarif manuel" | "À compléter" = useMemo(() => {
    if (totalClient <= 0) return "À compléter";
    if (selectedCatalogId && selectedCatalogItem) return "Catalogue atelier";
    return "Tarif manuel";
  }, [totalClient, selectedCatalogId, selectedCatalogItem]);

  const modelFull = `${marque} ${modele}`.replace(/\s+/g, " ").trim() || modele || marque || deviceType;
  const summaryQuality = useMemo(() => {
    if (selectedCatalogItem) return extractPartQuality(selectedCatalogItem);
    return selectedQuality || "";
  }, [selectedCatalogItem, selectedQuality]);

  const resolveCustomerId = (): string => {
    if (clientType === "anonyme") {
      return addCustomer({
        name: "Client comptoir",
        phone: "Non renseigné",
        email: "Non renseigné",
        device: modelFull,
        lastRepair: intervention,
      });
    }
    if (clientType === "nouveau") {
      return addCustomer({
        name: newName.trim() || "Nouveau client",
        phone: newPhone.trim() || "Non renseigné",
        email: newEmail.trim() || "Non renseigné",
        device: modelFull,
        lastRepair: intervention,
      });
    }
    return selectedCustomerId;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const intent = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "repair";
    const withQuote = intent === "repair-quote";

    if (!intervention.trim()) {
      toast.error("Indiquez ce qu'il faut réparer.");
      return;
    }

    const customerId = resolveCustomerId();
    if (clientType === "existant" && !customerId) {
      toast.error("Sélectionnez un client.");
      return;
    }

    const finalIssue = canonicalizeIntervention(intervention.trim());
    let savedPbId: string | undefined;

    if (saveToCatalog && !initial) {
      savedPbId = addPriceBookItem({
        source: "manual",
        typeAppareil: uiTypeToPriceBook(deviceType),
        marque,
        modele,
        reparation: finalIssue,
        piece: finalIssue,
        qualite: "Personnalisé",
        prixAchat: parseFloat(prixAchat.replace(",", ".") || "0") || 0,
        prixVentePiece: prixPieceNum,
        mainOeuvre: mainNum,
        fournisseur: fournisseur || undefined,
        sku: skuAdv || undefined,
        stockDisponible: stockAdv ? parseInt(stockAdv, 10) : undefined,
        garantie: garantieAdv || undefined,
        notes: notesInternes || undefined,
      });
    }

    const fromCatalog = Boolean(selectedCatalogItem && selectedCatalogId);
    let snapshot: PriceSnapshot;

    if (fromCatalog && selectedCatalogItem) {
      snapshot = {
        source: "catalogue",
        priceBookItemId: selectedCatalogItem.id,
        typeAppareil: deviceType,
        marque,
        modele,
        piece: selectedCatalogItem.piece,
        reparation: selectedCatalogItem.reparation,
        qualite: selectedCatalogItem.qualite,
        sku: selectedCatalogItem.sku,
        fournisseur: selectedCatalogItem.fournisseur,
        prixAchat: selectedCatalogItem.prixAchat,
        prixVentePiece: prixPieceNum,
        mainOeuvre: mainNum,
        prixClientTotal: totalClient,
        marge: selectedCatalogItem.marge,
        garantie: selectedCatalogItem.garantie,
        notes: notesInternes || selectedCatalogItem.notes,
        stockDisponible: selectedCatalogItem.stockDisponible,
        selectedAt: new Date().toISOString(),
      };
    } else {
      snapshot = {
        source: "manual",
        priceBookItemId: savedPbId,
        typeAppareil: deviceType,
        marque,
        modele,
        piece: finalIssue,
        reparation: finalIssue,
        qualite: "Personnalisé",
        sku: skuAdv || undefined,
        fournisseur: fournisseur || undefined,
        prixAchat: prixAchat ? parseFloat(prixAchat.replace(",", ".")) : undefined,
        prixVentePiece: prixPieceNum,
        mainOeuvre: mainNum,
        prixClientTotal: totalClient,
        marge:
          prixAchat && parseFloat(prixAchat.replace(",", "."))
            ? totalClient - parseFloat(prixAchat.replace(",", "."))
            : undefined,
        garantie: garantieAdv || undefined,
        notes: notesInternes || undefined,
        stockDisponible: stockAdv ? parseInt(stockAdv, 10) : undefined,
        selectedAt: new Date().toISOString(),
      };
    }

    let appointmentId: string | undefined;
    if (rdvOui) {
      if (!rdvDate || !rdvTime || !rdvMotif.trim()) {
        toast.error("Remplissez date, heure et motif du rendez-vous.");
        return;
      }
      const aid = addAppointment({
        customerId,
        device: modelFull,
        issue: rdvMotif.trim(),
        date: rdvDate,
        time: rdvTime,
        duration: rdvDuration || "60 min",
        notes: "",
      });
      if (!aid) {
        toast.error("Impossible de créer le rendez-vous.");
        return;
      }
      appointmentId = aid;
    }

    const deviceLabel = modelFull;
    const histCreate = ["Réparation créée"];
    if (fromCatalog) histCreate.push("Tarif issu du catalogue atelier");
    else histCreate.push("Tarif saisi manuellement");
    if (saveToCatalog) histCreate.push("Tarif enregistré dans le catalogue");
    if (appointmentId) histCreate.push("Rendez-vous créé");

    const basePayload = {
      customerId,
      deviceType,
      brandId: marque,
      brandName: marque,
      modelId: modele,
      deviceModel: modele,
      issueType: "Diagnostic",
      device: deviceLabel,
      model: modele || marque,
      issue: finalIssue,
      status: (initial?.status ?? initialStatus) as RepairStatus,
      amount: totalClient,
      laborPrice: mainNum,
      total: totalClient,
      notes: notesInternes || "",
      technician: "Atelier principal",
      imei: "Non renseigné",
      estimatedDoneAt: getTomorrowIso(),
      appointmentId,
      selectedPriceSnapshot: snapshot,
    };

    if (initial) {
      updateRepair(initial.id, {
        ...basePayload,
        history: [...initial.history, "Fiche réparation mise à jour"],
      });
      if (withQuote && totalClient > 0) {
        const lines = buildQuoteLines(snapshot, modelFull, finalIssue, totalClient);
        if (lines.length) {
          const quoteId = addQuote({ customerId, repairId: initial.id, lines });
          if (quoteId) {
            toast.success("Réparation mise à jour et devis créé");
            setSelected("quote", quoteId);
            onClose();
            router.push("/dashboard/devis");
            return;
          }
        }
      }
      toast.success("Réparation modifiée");
      onClose();
      return;
    }

    const repairId = addRepair({
      ...basePayload,
      droppedAt: getNowIso(),
      history: histCreate,
    });
    if (!repairId) {
      toast.error("Création impossible.");
      return;
    }

    if (withQuote) {
      if (totalClient <= 0) {
        toast.error("Ajoutez un tarif pour créer un devis.");
        return;
      }
      const lines = buildQuoteLines(snapshot, modelFull, finalIssue, totalClient);
      if (!lines.length) {
        toast.error("Aucune ligne de devis.");
        return;
      }
      const quoteId = addQuote({ customerId, repairId, lines });
      if (quoteId) {
        toast.success("Réparation et devis créés");
        setSelected("quote", quoteId);
        onClose();
        router.push("/dashboard/devis");
        return;
      }
      toast.error("Devis non créé");
      return;
    }

    toast.success("Réparation créée");
    setSelected("repair", repairId);
    onClose();
    router.push("/dashboard/reparations");
  };

  const suggestionChips = filterSuggestionChips(intervention, deviceType);
  const canSubmitQuote = totalClient > 0 && intervention.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#1A1916]/20 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border border-[#E7E4DC] bg-white shadow-2xl md:max-h-[92vh] md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:max-h-[92vh] md:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[12px] bg-[#E8F7F3] text-[#167B70]">
                <Wrench className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#1A1916] text-xl">
                  {initial ? "Modifier la réparation" : "Nouvelle réparation"}
                </h2>
                <p className="text-[#6B6B6B] text-sm">Client → Appareil → Intervention → Tarif client</p>
              </div>
            </div>
            <button className="rounded-full p-2 transition hover:bg-[#FAFAF8]" onClick={onClose} type="button">
              <X className="size-5 text-[#6B6B6B]" />
            </button>
          </div>

          <form className="space-y-6" id="repair-quick-form" onSubmit={handleSubmit}>
            {/* 1 Client */}
            <section className="space-y-3">
              <h3 className="font-semibold text-[#1A1916] text-sm">1. Client</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {(["existant", "nouveau", "anonyme"] as const).map((m) => (
                  <label className="flex cursor-pointer items-center gap-2" key={m}>
                    <input
                      checked={clientType === m}
                      className="accent-[#167B70]"
                      name="clientType"
                      onChange={() => setClientType(m)}
                      type="radio"
                    />
                    {m === "existant" ? "Client existant" : m === "nouveau" ? "Nouveau client" : "Client comptoir"}
                  </label>
                ))}
              </div>

              {clientType === "anonyme" && (
                <p className="rounded-lg border border-[#E7E4DC] bg-[#FAFAF8] px-3 py-2 text-[#6B6B6B] text-sm">
                  Client comptoir — informations à compléter plus tard.
                </p>
              )}

              {clientType === "existant" && (
                <div className="space-y-2">
                  <label className="text-[#6B6B6B] text-xs">Sélectionner un client</label>
                  <Combobox
                    leftIcon={<User className="size-4" />}
                    onChange={(name) => {
                      setCustomerSearch(name);
                      const match = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
                      setSelectedCustomerId(match ? match.id : "");
                    }}
                    options={filteredCustomers.map((c) => c.name)}
                    placeholder="Nom du client…"
                    value={chosenCustomer?.name ?? ""}
                  />
                </div>
              )}

              {clientType === "nouveau" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    className="h-11 rounded-xl border border-[#E7E4DC] px-3 text-sm"
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nom *"
                    value={newName}
                  />
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B6B6B]" />
                    <input
                      className="h-11 w-full rounded-xl border border-[#E7E4DC] py-2 pr-3 pl-10 text-sm"
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Téléphone"
                      value={newPhone}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6B6B6B]" />
                    <input
                      className="h-11 w-full rounded-xl border border-[#E7E4DC] py-2 pr-3 pl-10 text-sm"
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Email (optionnel)"
                      type="email"
                      value={newEmail}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 2 Appareil */}
            <section className="space-y-3 border-[#E7E4DC] border-t pt-4">
              <h3 className="font-semibold text-[#1A1916] text-sm">2. Appareil</h3>
              <div className="flex flex-wrap gap-2">
                {UI_DEVICE_TYPES.map((t) => (
                  <button
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      deviceType === t
                        ? "border-[#2A9D8F] bg-[#E8F7F3] text-[#1A1916]"
                        : "border-[#E7E4DC] bg-white text-[#6B6B6B] hover:border-[#2A9D8F]/50"
                    }`}
                    key={t}
                    onClick={() => {
                      setDeviceType(t);
                      setMarque("");
                      setModele("");
                      setIntervention("");
                      setSelectedCatalogId(null);
                      setSelectedQuality("");
                    }}
                    type="button"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[#6B6B6B] text-xs">Marque</label>
                  <Combobox
                    allowCreate
                    createLabel="Ajouter la marque"
                    onChange={(next) => {
                      setMarque(next);
                      setModele("");
                      setSelectedSeries("");
                      setSelectedCatalogId(null);
                      setSelectedQuality("");
                    }}
                    options={brandOptions}
                    placeholder="Apple, Samsung, Sony…"
                    value={marque}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[#6B6B6B] text-xs">Gamme / Série</label>
                  <Combobox
                    disabled={!marque.trim()}
                    onChange={(next) => {
                      setSelectedSeries(next);
                      setModele("");
                    }}
                    options={seriesOptions}
                    placeholder={marque.trim() ? "Ex. iPhone 13, Galaxy S…" : "Choisissez une marque"}
                    value={selectedSeries}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[#6B6B6B] text-xs">Modèle</label>
                  <Combobox
                    allowCreate
                    createLabel="Ajouter ce modèle"
                    disabled={!selectedSeries}
                    leftIcon={<Tag className="size-4" />}
                    onChange={(next) => {
                      setModele(next);
                      setSelectedCatalogId(null);
                      setSelectedQuality("");
                    }}
                    options={modelOptions}
                    placeholder={selectedSeries ? "Ex. iPhone 13 Pro…" : "Choisissez une gamme"}
                    value={modele}
                  />
                </div>
              </div>
            </section>

            {/* 3 Intervention */}
            <section className="space-y-3 border-[#E7E4DC] border-t pt-4">
              <h3 className="font-semibold text-[#1A1916] text-sm">3. Intervention</h3>
              <input
                className="h-11 w-full rounded-xl border border-[#E7E4DC] px-3 text-sm"
                onBlur={() => setIntervention((v) => normalizeInterventionHint(v))}
                onChange={(e) => setIntervention(e.target.value)}
                placeholder="Tapez: vitre, batterie, connecteur, sim..."
                value={intervention}
              />
              <div className="flex flex-wrap gap-2">
                {interventionCards.slice(0, 8).map((entry) => (
                  <button
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                      intervention === entry.label
                        ? "border-[#2A9D8F] bg-[#E8F7F3] text-[#1A1916]"
                        : "border-[#E7E4DC] bg-[#FAFAF8] text-[#1A1916] hover:border-[#2A9D8F]/50"
                    }`}
                    key={entry.label}
                    onClick={() => {
                      setIntervention(entry.label);
                      setSelectedCatalogId(null);
                      setSelectedQuality("");
                    }}
                    type="button"
                  >
                    <div className="font-medium">{entry.label}</div>
                    {entry.price > 0 && <div className="text-[#2A9D8F]">{formatEuro(entry.price)}</div>}
                  </button>
                ))}
                <button
                  className="rounded-xl border border-dashed border-[#E7E4DC] bg-white px-3 py-2 text-xs text-[#6B6B6B] hover:border-[#2A9D8F]/50"
                  onClick={() => setCustomInterventionOpen((prev) => !prev)}
                  type="button"
                >
                  + Ajouter intervention
                </button>
              </div>
              {customInterventionOpen && (
                <div className="grid gap-2 rounded-xl border border-[#E7E4DC] bg-[#FAFAF8] p-3 sm:grid-cols-2">
                  <input
                    className="h-10 rounded-lg border border-[#E7E4DC] bg-white px-3 text-sm sm:col-span-2"
                    onChange={(e) => setCustomInterventionName(e.target.value)}
                    placeholder="Nom intervention (ex: Lecteur carte SIM)"
                    value={customInterventionName}
                  />
                  <input
                    className="h-10 rounded-lg border border-[#E7E4DC] bg-white px-3 text-sm"
                    inputMode="decimal"
                    onChange={(e) => setCustomInterventionPurchase(e.target.value)}
                    placeholder="Prix achat conseillé (optionnel)"
                    value={customInterventionPurchase}
                  />
                  <input
                    className="h-10 rounded-lg border border-[#E7E4DC] bg-white px-3 text-sm"
                    inputMode="decimal"
                    onChange={(e) => setCustomInterventionSale(e.target.value)}
                    placeholder="Prix vente conseillé"
                    value={customInterventionSale}
                  />
                  <input
                    className="h-10 rounded-lg border border-[#E7E4DC] bg-white px-3 text-sm"
                    inputMode="decimal"
                    onChange={(e) => setCustomInterventionLabor(e.target.value)}
                    placeholder="Main-d'œuvre conseillée"
                    value={customInterventionLabor}
                  />
                  <input
                    className="h-10 rounded-lg border border-[#2A9D8F]/40 bg-white px-3 text-sm"
                    inputMode="decimal"
                    onChange={(e) => setCustomInterventionFinal(e.target.value)}
                    placeholder="Prix client final (€)"
                    value={customInterventionFinal}
                  />
                  <label className="flex items-center gap-2 text-xs sm:col-span-2">
                    <input
                      checked={customInterventionSave}
                      className="accent-[#2A9D8F]"
                      onChange={(e) => setCustomInterventionSave(e.target.checked)}
                      type="checkbox"
                    />
                    Enregistrer pour les prochaines fois
                  </label>
                  <button
                    className="rounded-lg bg-[#2A9D8F] px-3 py-2 font-medium text-white text-xs sm:col-span-2"
                    onClick={() => {
                      const name = customInterventionName.trim();
                      if (!name) {
                        toast.error("Nom d'intervention requis.");
                        return;
                      }
                      const sale = parseFloat(customInterventionSale.replace(",", ".") || "0") || 0;
                      const labor = parseFloat(customInterventionLabor.replace(",", ".") || "0") || 0;
                      const purchase = parseFloat(customInterventionPurchase.replace(",", ".") || "0") || 0;
                      const finalPrice = parseFloat(customInterventionFinal.replace(",", ".") || "0") || 0;

                      let pieceValue = sale;
                      let laborValue = labor;
                      if (finalPrice > 0) {
                        if (sale + labor !== finalPrice) {
                          if (sale > 0 && labor === 0) {
                            pieceValue = finalPrice;
                          } else if (labor > 0 && sale === 0) {
                            laborValue = finalPrice;
                            pieceValue = 0;
                          } else if (sale === 0 && labor === 0) {
                            pieceValue = finalPrice;
                          } else {
                            const ratio = finalPrice / (sale + labor || 1);
                            pieceValue = Math.round(sale * ratio * 100) / 100;
                            laborValue = Math.round(labor * ratio * 100) / 100;
                          }
                        }
                      }

                      setIntervention(canonicalizeIntervention(name));
                      setPrixPiece(String(pieceValue));
                      setMainOeuvre(String(laborValue));
                      if (purchase > 0) setPrixAchat(String(purchase));
                      setSaveToCatalog(customInterventionSave);
                      setSelectedCatalogId(null);
                      setCustomInterventionOpen(false);
                      toast.success(
                        customInterventionSave
                          ? "Intervention enregistrée pour les prochaines fois."
                          : "Intervention ajoutée à cette réparation.",
                      );
                    }}
                    type="button"
                  >
                    Utiliser cette intervention
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {suggestionChips.slice(0, 6).map((s) => (
                  <button
                    className="rounded-full border border-[#E7E4DC] bg-white px-3 py-1 text-[#1A1916] text-xs transition hover:border-[#167B70]/50"
                    key={s}
                    onClick={() => setIntervention(s)}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[#6B6B6B] text-[11px]">
                Le texte recherché peut être un synonyme (ex: "vitre"), mais l&apos;intervention enregistrée est
                normalisée (ex: "Écran cassé").
              </p>
            </section>

            {/* Catalogue (aide) */}
            {catalogPool.length > 0 && marque.trim() && modele.trim() && (
              <div className="rounded-xl border border-[#E8F7F3] bg-[#F8FCFA] p-4">
                  <p className="mb-2 font-semibold text-[#167B70] text-sm">Catalogue atelier</p>

                  {selectedInterventionKey && qualityOptionsForIntervention.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[#6B6B6B] text-xs">
                        Qualité pièce disponible pour <span className="font-medium text-[#1A1916]">{intervention}</span>
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {qualityOptionsForIntervention.map((opt) => {
                          const active = selectedCatalogId === opt.itemId || selectedQuality === opt.label;
                          return (
                            <button
                              className={`rounded-lg border p-3 text-left text-sm transition ${
                                active
                                  ? "border-[#167B70] bg-white shadow-sm"
                                  : "border-[#E7E4DC] bg-white hover:border-[#167B70]/40"
                              }`}
                              key={opt.itemId}
                              onClick={() => {
                                setSelectedCatalogId(opt.itemId);
                                setSelectedQuality(opt.label);
                                setPrixPiece(String(opt.item.prixVentePiece));
                                setMainOeuvre(String(opt.item.mainOeuvre));
                              }}
                              type="button"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-[#1A1916]">{opt.label}</span>
                                <span className="font-semibold text-[#167B70]">{formatEuro(opt.price)}</span>
                              </div>
                              <div className="mt-1 text-[#6B6B6B] text-xs">{opt.item.piece}</div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        className="mt-1 text-[#167B70] text-xs underline"
                        onClick={() => {
                          setSelectedCatalogId(null);
                          setSelectedQuality("");
                        }}
                        type="button"
                      >
                        Ignorer le catalogue et saisir un tarif manuel
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-48 space-y-3 overflow-y-auto">
                      {[...catalogByQuality.entries()].map(([quality, items]) => {
                        const best = getBestPriceBookItem(items);
                        if (!best) return null;
                        const active = selectedCatalogId === best.id;
                        return (
                          <button
                            className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                              active
                                ? "border-[#167B70] bg-white shadow-sm"
                                : "border-[#E7E4DC] bg-white hover:border-[#167B70]/40"
                            }`}
                            key={quality}
                            onClick={() => {
                              setSelectedCatalogId(best.id);
                              setSelectedQuality(extractPartQuality(best));
                              setPrixPiece(String(best.prixVentePiece));
                              setMainOeuvre(String(best.mainOeuvre));
                            }}
                            type="button"
                          >
                            <span className="font-medium text-[#1A1916]">{best.reparation}</span>
                            <span className="text-[#6B6B6B]"> · {extractPartQuality(best)}</span>
                            <div className="mt-1 flex justify-between text-[#167B70]">
                              <span>Prix client proposé</span>
                              <span className="font-semibold">{formatEuro(best.prixClientTotal)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
            )}

            {/* 4 Tarif */}
            <section className="space-y-3 border-[#E7E4DC] border-t pt-4">
              <h3 className="font-semibold text-[#1A1916] text-sm">4. Tarif client</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs">
                  <span className="text-[#6B6B6B]">Prix pièce / prestation (€)</span>
                  <input
                    className="mt-1 h-11 w-full rounded-xl border border-[#E7E4DC] px-3 text-sm"
                    inputMode="decimal"
                    onChange={(e) => {
                      setSelectedCatalogId(null);
                      setSelectedQuality("");
                      setPrixPiece(e.target.value);
                    }}
                    value={prixPiece}
                  />
                </label>
                <label className="text-xs">
                  <span className="text-[#6B6B6B]">Main-d&apos;œuvre (€)</span>
                  <input
                    className="mt-1 h-11 w-full rounded-xl border border-[#E7E4DC] px-3 text-sm"
                    inputMode="decimal"
                    onChange={(e) => {
                      setSelectedCatalogId(null);
                      setSelectedQuality("");
                      setMainOeuvre(e.target.value);
                    }}
                    value={mainOeuvre}
                  />
                </label>
                <div className="flex flex-col justify-end">
                  <span className="text-[#6B6B6B] text-xs">Total client</span>
                  <span className="font-bold text-[#167B70] text-xl">{formatEuro(totalClient)}</span>
                </div>
              </div>
            </section>

            <div className="rounded-xl border border-[#E7E4DC] bg-[#FAFAF8] p-3">
              <button
                className="flex w-full cursor-pointer items-center justify-between font-medium text-[#1A1916] text-sm"
                onClick={() => setAdvancedOpen((o) => !o)}
                type="button"
              >
                Options avancées
                <ChevronDown className={`size-4 transition ${advancedOpen ? "rotate-180" : ""}`} />
              </button>
              {advancedOpen && (
                <div className="mt-4 grid gap-3 border-[#E7E4DC] border-t pt-4 sm:grid-cols-2">
                  <label className="text-xs">
                    <span className="text-[#6B6B6B]">Prix achat interne (€)</span>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2 text-sm"
                      onChange={(e) => setPrixAchat(e.target.value)}
                      value={prixAchat}
                    />
                  </label>
                  <label className="text-xs">
                    <span className="text-[#6B6B6B]">Fournisseur</span>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2 text-sm"
                      onChange={(e) => setFournisseur(e.target.value)}
                      value={fournisseur}
                    />
                  </label>
                  <label className="text-xs">
                    <span className="text-[#6B6B6B]">SKU</span>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2 text-sm"
                      onChange={(e) => setSkuAdv(e.target.value)}
                      value={skuAdv}
                    />
                  </label>
                  <label className="text-xs">
                    <span className="text-[#6B6B6B]">Stock (interne)</span>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2 text-sm"
                      onChange={(e) => setStockAdv(e.target.value)}
                      value={stockAdv}
                    />
                  </label>
                  <label className="text-xs sm:col-span-2">
                    <span className="text-[#6B6B6B]">Garantie</span>
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2 text-sm"
                      onChange={(e) => setGarantieAdv(e.target.value)}
                      value={garantieAdv}
                    />
                  </label>
                  <label className="text-xs sm:col-span-2">
                    <span className="text-[#6B6B6B]">Notes internes</span>
                    <textarea
                      className="mt-1 min-h-[64px] w-full rounded-lg border border-[#E7E4DC] px-2 py-1 text-sm"
                      onChange={(e) => setNotesInternes(e.target.value)}
                      value={notesInternes}
                    />
                  </label>
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input
                      checked={saveToCatalog}
                      className="accent-[#167B70]"
                      onChange={(e) => setSaveToCatalog(e.target.checked)}
                      type="checkbox"
                    />
                    <span className="text-sm">Enregistrer ce tarif dans le catalogue atelier</span>
                  </label>
                </div>
              )}
            </div>

            {/* RDV */}
            <section className="space-y-2 border-[#E7E4DC] border-t pt-4">
              <p className="font-medium text-[#1A1916] text-sm">Ajouter un rendez-vous ?</p>
              <div className="flex gap-6 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={!rdvOui}
                    className="accent-[#167B70]"
                    onChange={() => setRdvOui(false)}
                    type="radio"
                  />
                  Non
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    checked={rdvOui}
                    className="accent-[#167B70]"
                    onChange={() => {
                      setRdvOui(true);
                      setRdvMotif((m) => {
                        if (m.trim()) return m;
                        if (!intervention.trim()) return m;
                        return `${intervention.trim()} — ${modelFull}`;
                      });
                    }}
                    type="radio"
                  />
                  Oui
                </label>
              </div>
              {rdvOui && (
                <div className="grid gap-2 rounded-xl bg-[#FAFAF8] p-3 sm:grid-cols-2">
                  <label className="text-xs">
                    Date *
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2"
                      onChange={(e) => setRdvDate(e.target.value)}
                      required={rdvOui}
                      type="date"
                      value={rdvDate}
                    />
                  </label>
                  <label className="text-xs">
                    Heure *
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2"
                      onChange={(e) => setRdvTime(e.target.value)}
                      required={rdvOui}
                      type="time"
                      value={rdvTime}
                    />
                  </label>
                  <label className="text-xs">
                    Durée
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2"
                      onChange={(e) => setRdvDuration(e.target.value)}
                      value={rdvDuration}
                    />
                  </label>
                  <label className="text-xs sm:col-span-2">
                    Motif *
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-[#E7E4DC] px-2"
                      onChange={(e) => setRdvMotif(e.target.value)}
                      placeholder={`${intervention || "Intervention"} — ${modelFull}`}
                      value={rdvMotif}
                    />
                  </label>
                </div>
              )}
            </section>
          </form>
        </div>

        {/* Résumé */}
        <aside className="flex w-full flex-col border-[#E7E4DC] border-t bg-[#FAFAF8] p-6 md:w-[320px] md:border-t-0 md:border-l">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-[#167B70]" />
            <h3 className="font-semibold text-[#1A1916]">Résumé</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[#6B6B6B] text-xs">Client</dt>
              <dd className="font-medium">
                {clientType === "anonyme"
                  ? "Client comptoir"
                  : clientType === "nouveau"
                    ? newName || "—"
                    : (chosenCustomer?.name ?? "—")}
              </dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B] text-xs">Appareil</dt>
              <dd className="font-medium">{modelFull}</dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B] text-xs">Intervention</dt>
              <dd>{intervention || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B] text-xs">Qualité</dt>
              <dd>{summaryQuality || "—"}</dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B] text-xs">Tarif client</dt>
              <dd>
                Pièce {formatEuro(prixPieceNum)} · M.O. {formatEuro(mainNum)}
              </dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B] text-xs">Total</dt>
              <dd className="font-bold text-[#167B70] text-lg">{formatEuro(totalClient)}</dd>
            </div>
            <div>
              <dt className="text-[#6B6B6B] text-xs">Source</dt>
              <dd>{summarySource}</dd>
            </div>
          </dl>

          {!canSubmitQuote && (
            <p className="mt-4 rounded-lg border border-[#F2DFA7] bg-[#FFF8EB] px-3 py-2 text-[#9A6A17] text-xs">
              Ajoutez un tarif pour créer un devis.
            </p>
          )}

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <SecondaryButton
              className="h-11 w-full justify-center gap-2"
              disabled={!canSubmitQuote}
              form="repair-quick-form"
              type="submit"
              value="repair-quote"
            >
              <FileText className="size-4" />
              Créer réparation + devis
            </SecondaryButton>
            <PrimaryButton
              className="h-11 w-full justify-center gap-2"
              form="repair-quick-form"
              type="submit"
              value="repair"
            >
              <Check className="size-4" />
              {initial ? "Enregistrer" : "Créer réparation"}
            </PrimaryButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
