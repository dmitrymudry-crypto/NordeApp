import { PRICE_CATALOGUE, calculateBathroomPrice } from './pricing.js';

export const LEAD_STATUSES = ['Neu', 'Kontaktiert', 'Besichtigung', 'Angebot gesendet', 'Beauftragt', 'Abgelehnt'];

function clean(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max) throw Error('Bitte überprüfen Sie die Formularangaben.');
  const result = value.trim();
  if (required && !result) throw Error('Bitte füllen Sie alle Pflichtfelder aus.');
  return result;
}

export function validateLead(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw Error('Ungültige Anfrage.');
  const name = clean(payload.name, 100, true);
  const phone = clean(payload.phone, 35, true);
  const email = clean(payload.email ?? '', 254);
  const address = clean(payload.address, 300, true);
  const notes = clean(payload.notes ?? '', 1500);
  const startDate = clean(payload.startDate ?? '', 10);
  const clientRequestId = clean(payload.clientRequestId ?? '', 80);
  if (name.length < 2 || !/^[+0-9 ()/.-]{6,35}$/.test(phone) || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw Error('Bitte Namen, Telefonnummer und E-Mail prüfen.');
  if (address.length < 3 || (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate))) throw Error('Bitte Ort und Wunschtermin prüfen.');
  if (payload.consent !== true) throw Error('Bitte bestätigen Sie die Datenschutzhinweise.');
  const configuration = payload.configuration;
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) throw Error('Bitte konfigurieren Sie Ihr Badezimmer.');
  const area = Number(configuration.area);
  if (!Number.isFinite(area) || area < 1 || area > 100) throw Error('Die Badfläche muss zwischen 1 und 100 m² liegen.');
  if (!PRICE_CATALOGUE.equipment.some(e => e.id === configuration.equipment)) throw Error('Bitte wählen Sie die Sanitärausstattung.');
  if (!Array.isArray(configuration.extras) || configuration.extras.length > PRICE_CATALOGUE.extras.length || configuration.extras.some(x => !PRICE_CATALOGUE.extras.some(e => e.id === x))) throw Error('Unbekannte Zusatzleistung.');
  const extras = [...new Set(configuration.extras)];
  const photos = payload.photos ?? [];
  if (!Array.isArray(photos) || photos.length > 3 || photos.some(p => typeof p !== 'string' || p.length > 1500000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p))) throw Error('Bitte maximal drei JPG-, PNG- oder WebP-Fotos hochladen.');
  const normalizedConfiguration = { area, equipment: configuration.equipment, extras };
  const quote = calculateBathroomPrice(normalizedConfiguration);
  return {
    name, phone, email, address, startDate, notes, photos,
    configuration: normalizedConfiguration,
    quote: {
      eligible: quote.eligible,
      gross: true,
      total: quote.total,
      lineItems: quote.items,
      nonBinding: true,
      extrasUnapproved: true,
    },
    clientRequestId,
    consent: true,
  };
}
