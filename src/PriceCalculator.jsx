import React, { useState } from 'react';
import { ArrowRight, Bath, Check, CircleHelp, RotateCcw, Sparkles } from 'lucide-react';
import { PRICE_CATALOGUE, calculateBathroomPrice, makeInquiryPrefill } from './pricing.js';
import './price-calculator.css';

const format = amount => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
const initial = { area: 5, equipment: 'Bodengleiche Dusche', extras: [] };

export default function PriceCalculator({ onRequest }) {
  const [config, setConfig] = useState(initial);
  const result = calculateBathroomPrice(config);
  const choose = equipment => setConfig(prev => ({ ...prev, equipment }));
  const toggle = id => setConfig(prev => ({
    ...prev,
    extras: prev.extras.includes(id) ? prev.extras.filter(x => x !== id) : [...prev.extras, id],
  }));
  return (
    <div className="price-page">
      <div className="price-heading">
        <span className="eyebrow">INTERAKTIVER TEST · NORDE DEVELOPMENT</span>
        <h1>Was kostet Ihr neues Bad?</h1>
        <p>Stellen Sie Ihr Badezimmer zusammen und sehen Sie sofort, wie sich Ihre Auswahl auf den Beispielpreis auswirkt.</p>
      </div>
      <div className="price-demo-warning" role="note">
        <CircleHelp size={19} />
        <span><strong>Testmodus mit Beispiel-Aufpreisen.</strong> Noch kein verbindliches Angebot. Der bestätigte Basispreis beträgt 12.949 € brutto für ein Komplettbad bis 6 m² inklusive Material und Sanitärausstattung. Alle Aufpreise sind vorläufig und müssen von Norde bestätigt werden.</span>
      </div>
      <section className="price-card" aria-labelledby="size-title">
        <div className="price-card-top"><span className="price-step">01</span><h2 id="size-title">Wie groß ist Ihr Bad?</h2></div>
        <label className="price-size-input">Fläche in m²
          <input type="number" min="1" max="30" step="0.5" inputMode="decimal" value={config.area} onChange={event => setConfig(prev => ({ ...prev, area: event.target.value }))}/>
        </label>
        <div className="price-quick-areas" aria-label="Häufige Badgrößen">
          {[3, 4, 5, 6, 8].map(n => <button type="button" key={n} aria-pressed={Number(config.area) === n} onClick={() => setConfig(prev => ({ ...prev, area: n }))}>{n} m²</button>)}
        </div>
        <p className="price-hint">Der Test-Paketpreis gilt nur bis 6 m². Größere Bäder werden individuell kalkuliert.</p>
      </section>
      <section className="price-card" aria-labelledby="equip-title">
        <div className="price-card-top"><span className="price-step">02</span><h2 id="equip-title">Dusche oder Badewanne?</h2></div>
        <div className="price-options">
          {PRICE_CATALOGUE.equipment.map(item => <button type="button" className={'price-option' + (config.equipment === item.id ? ' is-selected' : '')} key={item.id} onClick={() => choose(item.id)} aria-pressed={config.equipment === item.id}>
            <span className="price-option-mark">{config.equipment === item.id ? <Check size={15}/> : <Bath size={17}/>}</span>
            <span className="price-option-copy"><strong>{item.name}</strong><small>{item.note}</small></span>
            <span className="price-option-amount">{item.delta ? '+' + format(item.delta) : 'inkl.'}</span>
          </button>)}
        </div>
      </section>
      <section className="price-card" aria-labelledby="extras-title">
        <div className="price-card-top"><span className="price-step">03</span><h2 id="extras-title">Mehr Komfort?</h2></div>
        <div className="price-options">
          {PRICE_CATALOGUE.extras.map(item => <button type="button" className={'price-option' + (config.extras.includes(item.id) ? ' is-selected' : '')} key={item.id} onClick={() => toggle(item.id)} aria-pressed={config.extras.includes(item.id)}>
            <span className="price-option-mark">{config.extras.includes(item.id) ? <Check size={15}/> : <span>+</span>}</span>
            <span className="price-option-copy"><strong>{item.id}</strong><small>{item.description}</small></span>
            <span className="price-option-amount">+{format(item.price)}</span>
          </button>)}
        </div>
      </section>
      <section className="price-total" aria-labelledby="price-total-heading">
        <div className="price-total-eyebrow"><Sparkles size={16}/> IHRE TESTKALKULATION</div>
        <h2 id="price-total-heading">{result.eligible ? 'Ihr Beispielpreis (brutto)' : 'Individuelle Kalkulation'}</h2>
        <div className="price-main-total" key={result.total ?? 'custom'} aria-live="polite">{result.total === null ? 'Auf Anfrage' : format(result.total)}</div>
        {result.eligible ? <div className="price-breakdown">{result.items.filter(item => item.amount > 0).map(item => <div key={item.id}><span>{item.label}</span><strong>{format(item.amount)}</strong></div>)}</div> : <p className="price-explanation">Bei dieser Größe ist eine individuelle Kalkulation nötig. Ihre gewählten Optionen übernehmen wir trotzdem in die Anfrage.</p>}
        <p className="price-disclaimer">Bruttopreis inkl. gesetzlicher Umsatzsteuer. Unverbindlicher Testwert. Leistungsumfang, Bauzustand, Materialauswahl, technische Voraussetzungen sowie der endgültige Preis werden persönlich abgestimmt.</p>
        <button type="button" className="price-primary-cta" onClick={() => onRequest(makeInquiryPrefill(config))}>
          Konfiguration unverbindlich anfragen <ArrowRight size={20}/>
        </button>
        <button type="button" className="price-reset" onClick={() => setConfig(initial)}><RotateCcw size={15}/> Auswahl zurücksetzen</button>
      </section>
    </div>
  );
}
