/**
 * Heuristiques pour extraire la gamme (série) d'un modèle d'appareil.
 * Utilisé pour éviter les listes plates interminables dans l'UI.
 */
export function getDeviceSeries(brand: string, model: string): string {
  const b = brand.toLowerCase();
  const m = model.trim();
  const ml = m.toLowerCase();

  if (b.includes("apple")) {
    if (ml.startsWith("iphone se")) return "iPhone SE";
    const iphoneMatch = m.match(/iphone\s+(\d+)/i);
    if (iphoneMatch) return `iPhone ${iphoneMatch[1]}`;
    if (ml.includes("ipad pro")) return "iPad Pro";
    if (ml.includes("ipad air")) return "iPad Air";
    if (ml.includes("ipad mini")) return "iPad mini";
    if (ml.startsWith("ipad")) return "iPad (Classique)";
    if (ml.includes("macbook pro")) return "MacBook Pro";
    if (ml.includes("macbook air")) return "MacBook Air";
    if (ml.includes("imac")) return "iMac";
    return "Autres modèles Apple";
  }

  if (b.includes("samsung")) {
    if (ml.includes("ultra")) {
      const sMatch = m.match(/s\d+/i);
      if (sMatch) return `Galaxy S Ultra`;
    }
    if (ml.startsWith("galaxy s")) return "Galaxy S";
    if (ml.startsWith("galaxy a")) return "Galaxy A";
    if (ml.startsWith("galaxy z flip")) return "Galaxy Z Flip";
    if (ml.startsWith("galaxy z fold")) return "Galaxy Z Fold";
    if (ml.startsWith("galaxy note")) return "Galaxy Note";
    if (ml.startsWith("galaxy m")) return "Galaxy M";
    if (ml.startsWith("galaxy j")) return "Galaxy J";
    if (ml.startsWith("galaxy tab")) return "Galaxy Tab";
    return "Autres modèles Samsung";
  }

  if (b.includes("xiaomi")) {
    if (ml.includes("redmi note")) return "Redmi Note";
    if (ml.includes("redmi")) return "Redmi";
    if (ml.includes("poco")) return "POCO";
    if (ml.includes("mi ")) return "Série Mi";
    return "Autres modèles Xiaomi";
  }

  if (b.includes("google")) {
    if (ml.includes("pixel")) return "Pixel";
    return "Autres modèles Google";
  }

  if (b.includes("sony")) {
    if (ml.includes("playstation 5") || ml.includes("ps5")) return "PlayStation 5";
    if (ml.includes("playstation 4") || ml.includes("ps4")) return "PlayStation 4";
    if (ml.includes("xperia")) return "Xperia";
    return "Autres modèles Sony";
  }

  if (b.includes("nintendo")) {
    if (ml.includes("switch")) return "Switch";
    return "Autres modèles Nintendo";
  }

  if (b.includes("microsoft")) {
    if (ml.includes("xbox series")) return "Xbox Series";
    if (ml.includes("xbox one")) return "Xbox One";
    if (ml.includes("surface")) return "Surface";
    return "Autres modèles Microsoft";
  }

  return "Autres modèles";
}
