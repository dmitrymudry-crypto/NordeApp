import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  submitDemoInquiry,
  listDemoInquiries,
  updateDemoInquiry,
} from "../src/demo-inquiries.js";
import { DEFAULT_CONFIGURATION } from "../src/bathroom-options.js";
beforeEach(() => {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
});
const data = {
  name: "Demo Kunde",
  phone: "+49 123456789",
  email: "",
  address: "Beispielweg 1, Berlin",
  notes: "Nur ein Test",
  startDate: "",
  consent: true,
  photos: [],
};
test("local inquiry carries the complete configuration and a transparently simulated status", () => {
  const config = {
    ...DEFAULT_CONFIGURATION,
    material: "clay",
    tileFormat: "60x60",
    extras: ["LED-Spiegel"],
  };
  const record = submitDemoInquiry(data, config);
  assert.equal(record.simulated, true);
  assert.match(record.id, /^DEMO-/);
  assert.equal(record.quote.total, 13199);
  assert.equal(record.configuration.material, "clay");
  assert.equal(record.configuration.tileFormat, "60x60");
  assert.deepEqual(listDemoInquiries()[0], record);
});
test("simulated inquiries never use fetch or claim delivery", () => {
  const fetch = globalThis.fetch;
  let count = 0;
  globalThis.fetch = () => {
    count++;
    throw Error("Network forbidden");
  };
  try {
    const record = submitDemoInquiry(data, {
      ...DEFAULT_CONFIGURATION,
      extras: [],
    });
    assert.equal(count, 0);
    assert.equal(record.simulated, true);
    assert.equal("delivered" in record, false);
  } finally {
    globalThis.fetch = fetch;
  }
});
test("missing consent and invalid contact data cannot create an inquiry", () => {
  assert.throws(() =>
    submitDemoInquiry({ ...data, consent: false }, DEFAULT_CONFIGURATION),
  );
  assert.throws(() =>
    submitDemoInquiry({ ...data, phone: "not a phone" }, DEFAULT_CONFIGURATION),
  );
  assert.equal(listDemoInquiries().length, 0);
});
test("custom selections preserve individual quote reasons across the inquiry handoff", () => {
  const record = submitDemoInquiry(data, {
    ...DEFAULT_CONFIGURATION,
    vanity: "double",
    extras: [],
  });
  assert.equal(record.quote.total, null);
  assert.ok(record.quote.quoteReasons.includes("Doppelwaschtisch"));
  assert.equal(record.configuration.vanity, "double");
});
test("local staff status updates preserve other inquiry fields", () => {
  const record = submitDemoInquiry(data, DEFAULT_CONFIGURATION);
  updateDemoInquiry(record.id, "Besichtigung");
  assert.equal(listDemoInquiries()[0].status, "Besichtigung");
  assert.equal(listDemoInquiries()[0].name, data.name);
  assert.throws(() => updateDemoInquiry(record.id, "Unknown"));
});
