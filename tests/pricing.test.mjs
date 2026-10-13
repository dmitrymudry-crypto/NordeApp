import test from 'node:test';
import assert from 'node:assert/strict';
import { PRICE_CATALOGUE, calculateBathroomPrice, makeInquiryPrefill } from '../src/pricing.js';

test('base bathroom stays at the catalogue price', () => {
  const estimate = calculateBathroomPrice({ area: 5, equipment: 'Bodengleiche Dusche', extras: [] });
  assert.equal(estimate.eligible, true);
  assert.equal(estimate.total, PRICE_CATALOGUE.base);
});

test('each selected upgrade affects total once', () => {
  const estimate = calculateBathroomPrice({
    area: 6, equipment: 'Badewanne', extras: ['LED-Spiegel', 'LED-Spiegel', 'Fußbodenheizung'],
  });
  assert.equal(estimate.total, 12949 + 650 + 250 + 900);
});

test('bathrooms above package area never display a false total', () => {
  const estimate = calculateBathroomPrice({ area: 8, equipment: 'Badewanne', extras: ['LED-Spiegel'] });
  assert.equal(estimate.eligible, false);
  assert.equal(estimate.total, null);
});

test('invalid sizes and unknown option IDs cannot produce arbitrary charges', () => {
  assert.equal(calculateBathroomPrice({ area: -1, extras: [] }).total, null);
  const result = calculateBathroomPrice({ area: 5, equipment: 'Bodengleiche Dusche', extras: ['UNKNOWN'] });
  assert.equal(result.total, 12949);
  assert.deepEqual(result.unknownExtras, ['UNKNOWN']);
});

test('inquiry prefill carries equipment, extras and a visible test disclaimer', () => {
  const data = makeInquiryPrefill({ area: 5, equipment: 'Bodengleiche Dusche', extras: ['LED-Spiegel'] });
  assert.deepEqual(data.extras, ['LED-Spiegel']);
  assert.match(data.notes, /TESTKALKULATION/);
  assert.match(data.notes, /unverbindlich/);
  assert.match(data.notes, /13199 EUR/);
});
