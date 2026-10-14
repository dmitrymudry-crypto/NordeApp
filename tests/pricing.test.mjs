import test from "node:test";
import assert from "node:assert/strict";
import {
  PRICE_CATALOGUE,
  calculateBathroomPrice,
  makeInquiryPrefill,
} from "../src/pricing.js";

test("base bathroom stays at the catalogue price", () => {
  const estimate = calculateBathroomPrice({
    area: 5,
    equipment: "Bodengleiche Dusche",
    extras: [],
  });
  assert.equal(estimate.eligible, true);
  assert.equal(estimate.total, PRICE_CATALOGUE.base);
});

test("each selected upgrade affects total once", () => {
  const estimate = calculateBathroomPrice({
    area: 6,
    equipment: "Badewanne",
    extras: ["LED-Spiegel", "LED-Spiegel", "Fußbodenheizung"],
  });
  assert.equal(estimate.total, 12949 + 250 + 900);
});

test("bathrooms above package area never display a false total", () => {
  const estimate = calculateBathroomPrice({
    area: 8,
    equipment: "Badewanne",
    extras: ["LED-Spiegel"],
  });
  assert.equal(estimate.eligible, false);
  assert.equal(estimate.total, null);
});

test("invalid sizes and unknown option IDs cannot produce arbitrary charges", () => {
  assert.equal(calculateBathroomPrice({ area: -1, extras: [] }).total, null);
  const result = calculateBathroomPrice({
    area: 5,
    equipment: "Bodengleiche Dusche",
    extras: ["UNKNOWN"],
  });
  assert.equal(result.total, null);
  assert.ok(result.issues.length);
  assert.deepEqual(result.unknownExtras, ["UNKNOWN"]);
});

test("inquiry prefill carries equipment, extras and a visible test disclaimer", () => {
  const data = makeInquiryPrefill({
    area: 5,
    equipment: "Bodengleiche Dusche",
    extras: ["LED-Spiegel"],
  });
  assert.deepEqual(data.extras, ["LED-Spiegel"]);
  assert.match(data.notes, /TESTKALKULATION/);
  assert.match(data.notes, /unverbindlich/);
  assert.match(data.notes, /13199 EUR/);
});

test("standard bath and shower are alternatives already included in the base price", () => {
  for (const equipment of [
    "Bodengleiche Dusche",
    "Dusche mit Duschtasse",
    "Badewanne",
  ]) {
    assert.equal(
      calculateBathroomPrice({ area: 6, equipment, extras: [] }).total,
      12949,
    );
  }
});
test("custom combinations, double vanity and large tiles require individual quotations", () => {
  for (const selection of [
    { equipment: "Dusche und Badewanne" },
    { vanity: "double" },
    { tileFormat: "large" },
  ]) {
    const result = calculateBathroomPrice({
      area: 5,
      equipment: "Bodengleiche Dusche",
      extras: [],
      ...selection,
    });
    assert.equal(result.total, null);
    assert.ok(result.quoteReasons.length);
    assert.equal(result.issues.length, 0);
  }
});
test("adding and removing LED mirror changes the gross estimate by exactly 250", () => {
  const c = { area: 5, equipment: "Badewanne", extras: [] };
  assert.equal(
    calculateBathroomPrice({ ...c, extras: ["LED-Spiegel"] }).total -
      calculateBathroomPrice(c).total,
    250,
  );
  assert.equal(calculateBathroomPrice({ ...c, extras: [] }).total, 12949);
});
test("invalid and incomplete sizes never show a fabricated exact total", () => {
  for (const area of ["", NaN, Infinity, -1, 0, 101])
    assert.equal(calculateBathroomPrice({ area, extras: [] }).total, null);
});
test("invalid saved sanitary selections cannot be submitted as a valid priced configuration", () => {
  const r = calculateBathroomPrice({ area: 5, vanity: "unknown", extras: [] });
  assert.equal(r.total, null);
  assert.ok(r.issues.length);
});
