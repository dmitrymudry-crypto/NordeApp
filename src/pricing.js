import { configurationIssues } from "./bathroom-options.js";
// Test prices only. Replace the catalogue with Norde-approved gross prices before production.
export const PRICE_CATALOGUE = Object.freeze({
  base: 12949,
  maxStandardArea: 6,
  equipment: [
    {
      id: "Bodengleiche Dusche",
      name: "Bodengleiche Dusche",
      delta: 0,
      note: "In dieser Testbasis enthalten",
    },
    {
      id: "Dusche mit Duschtasse",
      name: "Dusche mit Duschtasse",
      delta: 0,
      note: "Testannahme: gleicher Paketpreis",
    },
    {
      id: "Badewanne",
      name: "Badewanne statt Dusche",
      delta: 0,
      note: "Standardwanne im Paket enthalten",
    },
    {
      id: "Dusche und Badewanne",
      name: "Dusche und Badewanne",
      delta: 1400,
      note: "Nur wenn technisch möglich",
    },
  ],
  extras: [
    {
      id: "Fußbodenheizung",
      price: 900,
      description: "Elektrische Lösung, technische Prüfung nötig",
    },
    {
      id: "LED-Spiegel",
      price: 250,
      description: "Beispiel für ein Ausstattungs-Upgrade",
    },
    {
      id: "Handtuchheizkörper",
      name: "Design-Heizkörper (Upgrade)",
      price: 350,
      description:
        "Beispiel-Differenz zum bereits enthaltenen Standardheizkörper",
    },
    {
      id: "Neue Decke & Spots",
      price: 600,
      description: "Beispiel für abgehängte Decke mit Beleuchtung",
    },
    {
      id: "Waschmaschinenanschluss",
      price: 480,
      description: "Abhängig von den vorhandenen Leitungen",
    },
  ],
});

export function calculateBathroomPrice(
  configuration,
  catalogue = PRICE_CATALOGUE,
) {
  const area = Number(configuration?.area);
  const issues = configurationIssues(configuration || {});
  const equipment = catalogue.equipment.find(
    (e) => e.id === configuration?.equipment,
  );
  if (configuration?.equipment && !equipment)
    issues.push("Bitte eine gültige Dusche oder Badewanne wählen.");
  const chosen = Array.isArray(configuration?.extras)
    ? [...new Set(configuration.extras)]
    : [];
  const extras = catalogue.extras.filter((e) => chosen.includes(e.id));
  const unknownExtras = chosen.filter(
    (id) => !catalogue.extras.some((e) => e.id === id),
  );
  if (unknownExtras.length)
    issues.push("Die Auswahl enthält unbekannte Zusatzleistungen.");
  const quoteReasons = [];
  if (area > catalogue.maxStandardArea) quoteReasons.push("Mehr als 6 m²");
  if (configuration?.equipment === "Dusche und Badewanne")
    quoteReasons.push("Dusche und Badewanne gemeinsam");
  if (configuration?.vanity === "double") quoteReasons.push("Doppelwaschtisch");
  if (configuration?.tileFormat === "large")
    quoteReasons.push("Großformatfliesen");
  const selectedEquipment = equipment || catalogue.equipment[0];
  const items = [
    { id: "base", label: "Komplettsanierung bis 6 m²", amount: catalogue.base },
    {
      id: "equipment",
      label: selectedEquipment.name,
      amount: selectedEquipment.delta,
    },
    ...extras.map((e) => ({
      id: e.id,
      label: e.name || e.id,
      amount: e.price,
    })),
  ];
  const eligible =
    !issues.length &&
    !quoteReasons.length &&
    Number.isFinite(area) &&
    area >= 1 &&
    area <= catalogue.maxStandardArea;
  return {
    eligible,
    issues,
    quoteReasons,
    items,
    total: eligible ? items.reduce((sum, item) => sum + item.amount, 0) : null,
    unknownExtras,
  };
}

export function makeInquiryPrefill(configuration) {
  const result = calculateBathroomPrice(configuration);
  const lines = [
    "TESTKALKULATION (unverbindlich, Preise noch nicht freigegeben):",
    "Badgröße: " + configuration.area + " m²",
    "Ausstattung: " + configuration.equipment,
    "Extras: " + ((configuration.extras || []).join(", ") || "keine"),
    "Angezeigter Testwert: " +
      (result.total === null
        ? "individuelles Angebot erforderlich"
        : result.total + " EUR"),
    "Bitte technische Machbarkeit, Leistungsumfang und Endpreis persönlich prüfen.",
  ];
  return {
    area: Number(configuration.area),
    equipment: configuration.equipment,
    extras: [...(configuration.extras || [])],
    toilet: configuration.toilet,
    vanity: configuration.vanity,
    tileFormat: configuration.tileFormat,
    material: configuration.material,
    finish: configuration.finish,
    notes: lines.join("\n"),
  };
}
