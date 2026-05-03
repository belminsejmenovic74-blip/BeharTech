const strip = (s: string) => s.trim();
const normalizeForSearch = (value: string) => value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

export type InterventionDeviceType = "Smartphone" | "Tablette" | "Ordinateur" | "Console" | "Autre";

const BASE_INTERVENTIONS: Record<InterventionDeviceType, string[]> = {
  Smartphone: [
    "Écran cassé",
    "Batterie",
    "Connecteur de charge",
    "Caméra arrière",
    "Caméra avant",
    "Dos arrière",
    "Haut-parleur",
    "Micro",
    "Lecteur carte SIM",
    "Nappe / capteur",
    "Diagnostic",
    "Nettoyage / désoxydation",
    "Micro-soudure",
    "Autre intervention",
  ],
  Tablette: [
    "Écran cassé",
    "Batterie",
    "Connecteur de charge",
    "Caméra arrière",
    "Caméra avant",
    "Haut-parleur",
    "Micro",
    "Lecteur carte SIM",
    "Diagnostic",
    "Nettoyage / désoxydation",
    "Micro-soudure",
    "Autre intervention",
  ],
  Console: [
    "Port HDMI",
    "Alimentation",
    "Lecteur disque",
    "Ventilation",
    "Manette / Joy-Con",
    "Nettoyage complet",
    "Diagnostic",
    "Autre intervention",
  ],
  Ordinateur: [
    "Écran / Dalle",
    "Batterie",
    "Clavier",
    "Trackpad",
    "SSD / stockage",
    "Système / logiciel",
    "Connecteur de charge",
    "Nettoyage interne",
    "Diagnostic",
    "Autre intervention",
  ],
  Autre: ["Diagnostic", "Autre intervention"],
};

const INTERVENTION_ALIASES: Record<string, string[]> = {
  "Écran cassé": ["vitre", "remplacement vitre", "ecran", "écran", "lcd", "oled", "display", "tactile"],
  "Connecteur de charge": ["charge", "dock", "connecteur", "port charge", "usb c", "usb-c", "lightning"],
  "Lecteur carte SIM": ["sim", "lecteur sim", "carte sim", "tiroir sim"],
  Batterie: ["battery", "batterie"],
  Diagnostic: ["diag", "diagnostic"],
  "Nettoyage / désoxydation": ["nettoyage", "desox", "désox", "oxydation", "desoxydation"],
  "Port HDMI": ["hdmi", "port hdmi"],
};

const aliasEntries = Object.entries(INTERVENTION_ALIASES).flatMap(([canonical, aliases]) =>
  aliases.map((alias) => [normalizeForSearch(alias), canonical] as const),
);

const aliasMap = new Map<string, string>(aliasEntries);

export const INTERVENTION_QUICK_SUGGESTIONS = BASE_INTERVENTIONS.Smartphone;

export function getDefaultInterventionsByDeviceType(deviceType: InterventionDeviceType): string[] {
  return BASE_INTERVENTIONS[deviceType] ?? BASE_INTERVENTIONS.Autre;
}

export function normalizeInterventionHint(raw: string): string {
  const clean = strip(raw);
  if (!clean) return "";
  const normalized = normalizeForSearch(clean);
  return aliasMap.get(normalized) ?? clean;
}

export function canonicalizeIntervention(raw: string): string {
  const clean = strip(raw);
  if (!clean) return "";
  const normalized = normalizeForSearch(clean);
  if (aliasMap.has(normalized)) return aliasMap.get(normalized) as string;
  for (const [key, canonical] of aliasMap.entries()) {
    if (normalized.includes(key)) return canonical;
  }
  return clean;
}

export function filterSuggestionChips(typed: string, deviceType: InterventionDeviceType = "Smartphone"): string[] {
  const q = normalizeForSearch(strip(typed));
  const base = getDefaultInterventionsByDeviceType(deviceType);
  if (!q) return base.slice(0, 8);
  return base.filter((item) => {
    const canonical = normalizeForSearch(item);
    return canonical.includes(q) || q.includes(canonical.slice(0, 4));
  });
}
