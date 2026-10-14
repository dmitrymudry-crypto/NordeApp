export const DEFAULT_CONFIGURATION = Object.freeze({
  area: 5,
  equipment: "Bodengleiche Dusche",
  extras: [],
  toilet: "wall",
  vanity: "standard",
  tileFormat: "60x30",
  material: "sand",
  finish: "matte",
});
export const MATERIALS = [
  {
    id: "sand",
    name: "Sandstein",
    description: "Warm und ruhig",
    color: "#ddd3bc",
    floor: "#b8aa91",
  },
  {
    id: "chalk",
    name: "Kreideweiß",
    description: "Hell und zeitlos",
    color: "#e8e8e2",
    floor: "#caccc4",
  },
  {
    id: "stone",
    name: "Steingrau",
    description: "Klar und modern",
    color: "#b6bdb6",
    floor: "#8d9691",
  },
  {
    id: "clay",
    name: "Warmbeige",
    description: "Weich und natürlich",
    color: "#d6c2ae",
    floor: "#a38c75",
  },
];
export const TOILETS = [
  {
    id: "wall",
    name: "Wandhängend",
    description: "Freier Boden, einfache Reinigung. Machbarkeit wird geprüft.",
  },
  {
    id: "floor",
    name: "Bodenstehend",
    description: "Eine Alternative für vorhandene Anschlüsse.",
  },
];
export const VANITIES = [
  {
    id: "standard",
    name: "Waschtisch mit Unterschrank",
    description: "Standardausstattung im Paket enthalten.",
  },
  {
    id: "double",
    name: "Doppelwaschtisch",
    description: "Mehr Platz. Individuelle Prüfung und Kalkulation.",
  },
];
export const TILE_FORMATS = [
  {
    id: "60x30",
    name: "30 × 60 cm",
    description: "Ruhiges, klassisches Fugenbild.",
  },
  {
    id: "60x60",
    name: "60 × 60 cm",
    description: "Großzügige, gleichmäßige Flächen.",
  },
  {
    id: "large",
    name: "Großformat",
    description: "Individuelle Material- und Verlegekosten.",
  },
];
export const FINISHES = [
  { id: "matte", name: "Matt" },
  { id: "satin", name: "Seidenmatt" },
];
export function configurationIssues(c) {
  const errors = [];
  const n = Number(c.area);
  if (c.area === "" || !Number.isFinite(n) || n < 1 || n > 100)
    errors.push("Bitte eine Fläche zwischen 1 und 100 m² eingeben.");
  for (const [key, options] of [
    ["toilet", TOILETS],
    ["vanity", VANITIES],
    ["material", MATERIALS],
    ["tileFormat", TILE_FORMATS],
    ["finish", FINISHES],
  ])
    if (c[key] && !options.some((x) => x.id === c[key]))
      errors.push("Bitte eine gültige Auswahl für " + key + " treffen.");
  return errors;
}
export function configurationLabel(c) {
  return [
    c.area + " m²",
    c.equipment,
    TOILETS.find((x) => x.id === c.toilet)?.name,
    VANITIES.find((x) => x.id === c.vanity)?.name,
    MATERIALS.find((x) => x.id === c.material)?.name,
    TILE_FORMATS.find((x) => x.id === c.tileFormat)?.name,
    FINISHES.find((x) => x.id === c.finish)?.name,
    ...c.extras,
  ].filter(Boolean);
}
