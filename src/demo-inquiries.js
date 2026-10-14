import { validateLead, LEAD_STATUSES } from "./lead-schema.js";
import { calculateBathroomPrice } from "./pricing.js";
import { configurationIssues } from "./bathroom-options.js";
const KEY = "norde-demo-inquiries-v1";
let fallback = [];
export function listDemoInquiries() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return fallback;
  }
}
function save(rows) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch (e) {
    if (e.name !== "SecurityError")
      throw Error(
        "Der Gerätespeicher ist voll. Bitte weniger Fotos verwenden.",
      );
  }
  fallback = rows;
}
export function submitDemoInquiry(data, configuration) {
  const problems = configurationIssues(configuration);
  if (problems.length) throw Error(problems[0]);
  const validated = validateLead({ ...data, configuration });
  const quote = calculateBathroomPrice(configuration);
  const record = {
    ...validated,
    id:
      "DEMO-" +
      Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
        b.toString(16).padStart(2, "0"),
      )
        .join("")
        .toUpperCase(),
    createdAt: new Date().toISOString(),
    status: "Neu",
    configuration: {
      ...configuration,
      area: Number(configuration.area),
      extras: [...configuration.extras],
    },
    quote: {
      ...validated.quote,
      total: quote.total,
      lineItems: quote.items,
      quoteReasons: quote.quoteReasons,
    },
    simulated: true,
  };
  save([record, ...listDemoInquiries()]);
  return record;
}
export function updateDemoInquiry(id, status) {
  if (!LEAD_STATUSES.includes(status)) throw Error("Unbekannter Status.");
  save(listDemoInquiries().map((r) => (r.id === id ? { ...r, status } : r)));
}
