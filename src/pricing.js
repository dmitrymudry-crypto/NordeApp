// Test prices only. Replace the catalogue with Norde-approved gross prices before production.
export const PRICE_CATALOGUE = Object.freeze({
  base: 12949,
  maxStandardArea: 6,
  equipment: [
    { id: 'Bodengleiche Dusche', name: 'Bodengleiche Dusche', delta: 0, note: 'In dieser Testbasis enthalten' },
    { id: 'Dusche mit Duschtasse', name: 'Dusche mit Duschtasse', delta: 0, note: 'Testannahme: gleicher Paketpreis' },
    { id: 'Badewanne', name: 'Badewanne statt Dusche', delta: 650, note: 'Beispiel-Aufpreis' },
    { id: 'Dusche und Badewanne', name: 'Dusche und Badewanne', delta: 1400, note: 'Nur wenn technisch möglich' },
  ],
  extras: [
    { id: 'Fußbodenheizung', price: 900, description: 'Elektrische Lösung, technische Prüfung nötig' },
    { id: 'LED-Spiegel', price: 250, description: 'Beispiel für ein Ausstattungs-Upgrade' },
    { id: 'Handtuchheizkörper', price: 350, description: 'Beispiel-Aufpreis, Anschlüsse prüfen' },
    { id: 'Neue Decke & Spots', price: 600, description: 'Beispiel für abgehängte Decke mit Beleuchtung' },
    { id: 'Waschmaschinenanschluss', price: 480, description: 'Abhängig von den vorhandenen Leitungen' },
  ],
});

export function calculateBathroomPrice(configuration, catalogue = PRICE_CATALOGUE) {
  const area = Number(configuration?.area);
  const eligible = Number.isFinite(area) && area >= 1 && area <= catalogue.maxStandardArea;
  const equipment = catalogue.equipment.find(e => e.id === configuration?.equipment) || catalogue.equipment[0];
  const chosen = Array.isArray(configuration?.extras) ? [...new Set(configuration.extras)] : [];
  const extras = catalogue.extras.filter(e => chosen.includes(e.id));
  const items = [
    { id: 'base', label: 'Komplettsanierung bis 6 m²', amount: catalogue.base },
    { id: 'equipment', label: equipment.name, amount: equipment.delta },
    ...extras.map(e => ({ id: e.id, label: e.id, amount: e.price })),
  ];
  return {
    eligible,
    items,
    total: eligible ? items.reduce((sum, item) => sum + item.amount, 0) : null,
    unknownExtras: chosen.filter(id => !catalogue.extras.some(e => e.id === id)),
  };
}

export function makeInquiryPrefill(configuration) {
  const result = calculateBathroomPrice(configuration);
  const lines = [
    'TESTKALKULATION (unverbindlich, Preise noch nicht freigegeben):',
    'Badgröße: ' + configuration.area + ' m²',
    'Ausstattung: ' + configuration.equipment,
    'Extras: ' + (configuration.extras.join(', ') || 'keine'),
    'Angezeigter Testwert: ' + (result.total === null ? 'individuelles Angebot erforderlich' : result.total + ' EUR'),
    'Bitte technische Machbarkeit, Leistungsumfang und Endpreis persönlich prüfen.',
  ];
  return {
    area: Number(configuration.area),
    equipment: configuration.equipment,
    extras: [...configuration.extras],
    notes: lines.join('\n'),
  };
}
