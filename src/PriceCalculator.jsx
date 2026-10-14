import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";
import { PRICE_CATALOGUE, calculateBathroomPrice } from "./pricing.js";
import {
  DEFAULT_CONFIGURATION,
  MATERIALS,
  TOILETS,
  VANITIES,
  TILE_FORMATS,
  FINISHES,
  configurationLabel,
} from "./bathroom-options.js";
import BathroomPreview from "./BathroomPreview.jsx";
import "./price-calculator.css";
export const formatPrice = (n) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
const steps = [
  "Raum",
  "Dusche & Wanne",
  "Sanitär",
  "Materialien",
  "Komfort",
  "Übersicht",
];
function Choice({ name, description, price, selected, onClick, children }) {
  return (
    <button
      type="button"
      className={"visual-choice " + (selected ? "selected" : "")}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="visual-choice-art">{children}</span>
      <span className="visual-choice-copy">
        <strong>{name}</strong>
        <span>{description}</span>
        <b>{price}</b>
      </span>
      <span className="choice-check">{selected && <Check size={14} />}</span>
    </button>
  );
}
function FixtureSketch({ type }) {
  return (
    <svg viewBox="0 0 200 105" aria-hidden="true">
      <path d="M10 90H190" stroke="#b9c9bd" />
      {type === "wall" || type === "floor" ? (
        <>
          <rect x="64" y="20" width="32" height="41" rx="5" fill="#e6eae3" />
          <path
            d="M65 60h80v10q0 17-22 17H88q-17 0-17-17z"
            fill="#fff"
            stroke="#b0beb2"
          />
          <ellipse
            cx="106"
            cy="59"
            rx="41"
            ry="12"
            fill="#fff"
            stroke="#b0beb2"
          />
          {type === "floor" && <path d="M98 78v13h27V77" fill="#e8ece6" />}
        </>
      ) : (
        <>
          <rect x="44" y="56" width="112" height="32" rx="3" fill="#b99c7c" />
          <rect x="38" y="50" width="124" height="10" rx="2" fill="#f6f6ed" />
          <rect x="62" y="9" width="76" height="31" rx="12" fill="#cddbd1" />
          {type === "double" ? (
            <>
              <ellipse cx="72" cy="51" rx="20" ry="5" fill="#d8e1d7" />
              <ellipse cx="127" cy="51" rx="20" ry="5" fill="#d8e1d7" />
            </>
          ) : (
            <ellipse cx="100" cy="51" rx="32" ry="6" fill="#d8e1d7" />
          )}
        </>
      )}
    </svg>
  );
}
export default function PriceCalculator({
  onRequest,
  configuration,
  onChange,
  step = 0,
  onStepChange,
}) {
  const c = configuration || DEFAULT_CONFIGURATION,
    [localStep, setLocalStep] = useState(0),
    [delta, setDelta] = useState(null);
  const active = onStepChange ? step : localStep;
  const go = (n) => (onStepChange || setLocalStep)(n);
  const previousStep = useRef(active);
  useEffect(() => {
    if (previousStep.current === active) return;
    previousStep.current = active;
    const h = document.querySelector(".wizard-heading h2");
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
    document
      .querySelector(".wizard-progress")
      ?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [active]);
  const result = calculateBathroomPrice(c),
    prev = useRef(result.total);
  useEffect(() => {
    if (
      prev.current !== null &&
      result.total !== null &&
      prev.current !== result.total
    )
      setDelta(result.total - prev.current);
    else setDelta(null);
    prev.current = result.total;
  }, [result.total]);
  const set = (key, value) => onChange({ ...c, [key]: value });
  const toggle = (id) =>
    set(
      "extras",
      c.extras.includes(id)
        ? c.extras.filter((x) => x !== id)
        : [...c.extras, id],
    );
  const invalid = result.issues.length > 0;
  const next = () =>
    active === 5 ? onRequest({ ...c, extras: [...c.extras] }) : go(active + 1);
  const summary = (
    <>
      <div className="estimate-heading">
        <span className="eyebrow">IHRE KALKULATION</span>
        <span className="demo-pill">Unverbindlich</span>
      </div>
      <h3>
        {invalid
          ? "Angaben prüfen"
          : result.eligible
            ? "Ihr Richtwert, brutto"
            : "Individuelles Angebot"}
      </h3>
      <div className="estimate-price" aria-live="polite" aria-atomic="true">
        <span key={invalid ? "invalid" : (result.total ?? "custom")}>
          {invalid
            ? "—"
            : result.total === null
              ? "Auf Anfrage"
              : formatPrice(result.total)}
        </span>
      </div>
      <div className="price-difference" aria-live="polite">
        {delta !== null ? (
          <span>
            {delta > 0 ? "+" : "−"}
            {formatPrice(Math.abs(delta))} zur vorherigen Auswahl
          </span>
        ) : (
          <span>
            {result.total !== null
              ? "Inkl. gesetzlicher Umsatzsteuer"
              : "Ihre Wünsche bleiben gespeichert."}
          </span>
        )}
      </div>
      {result.quoteReasons.length > 0 && (
        <p className="quote-reasons">
          {result.quoteReasons.join(" · ")}: Dafür braucht es eine persönliche
          Planung.
        </p>
      )}
      <div className="estimate-lines">
        {result.items
          .filter((x) => x.id === "base" || x.amount > 0)
          .map((x) => (
            <div key={x.id}>
              <span>
                {x.label}
                {x.id !== "base" && <small>Demo-Aufpreis</small>}
              </span>
              <b>
                {x.id !== "base" ? "+" : ""}
                {formatPrice(x.amount)}
              </b>
            </div>
          ))}
      </div>
      <details className="price-details">
        <summary>
          Was ist im Basispaket enthalten?
          <ChevronDown size={16} />
        </summary>
        <p>
          Komplette Badsanierung bis 6 m², inklusive Baumaterial und
          Standard-Sanitärausstattung. Dusche oder Standardwanne, Waschtisch und
          WC sind keine zusätzlichen Upgrades. Ausführung und technische
          Machbarkeit stimmen wir persönlich ab.
        </p>
      </details>
      <p className="price-footnote">
        <b>{formatPrice(PRICE_CATALOGUE.base)} Basispreis bestätigt.</b>{" "}
        Zuschläge sind Beispiele für die Demo, keine freigegebenen
        Verkaufspreise.
      </p>
    </>
  );
  return (
    <section className="price-page">
      <div className="price-heading">
        <span className="eyebrow">IHR BAD, SCHRITT FÜR SCHRITT</span>
        <h1>Ein Bad nach Ihrem Gefühl.</h1>
        <p>Wählen Sie, was zu Ihnen passt. Den Preis behalten Sie im Blick.</p>
      </div>
      <div className="configurator-grid">
        <div className="configurator-main">
          <div className="config-stage">
            <BathroomPreview configuration={c} />
          </div>
          <nav className="wizard-progress" aria-label="Konfigurator-Schritte">
            {steps.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => go(i)}
                aria-label={`Schritt ${i + 1}: ${name}`}
                aria-current={i === active ? "step" : undefined}
                className={i === active ? "active" : i < active ? "done" : ""}
              >
                <span>{i < active ? <Check size={13} /> : i + 1}</span>
                <small>{name}</small>
              </button>
            ))}
          </nav>
          <div className="wizard-body" key={active}>
            <div className="wizard-heading">
              <span>Schritt {active + 1} von 6</span>
              <h2>
                {
                  [
                    "Wie groß ist Ihr Bad?",
                    "Duschen. Baden. Wohlfühlen.",
                    "Die Details für jeden Tag.",
                    "Ihr Stil. Ihre Oberfläche.",
                    "Ein bisschen mehr Komfort.",
                    "So könnte Ihr neues Bad werden.",
                  ][active]
                }
              </h2>
              <p>
                {
                  [
                    "Eine ungefähre Fläche genügt für den Anfang.",
                    "Die technische Machbarkeit prüfen wir gemeinsam.",
                    "Standardausstattung ist bereits im Paket enthalten.",
                    "Materialideen zur Orientierung, keine konkreten Produktzusagen.",
                    "Alle angezeigten Aufpreise sind Demonstrationswerte.",
                    "Alles auf einen Blick, bevor Sie eine Beratung anfragen.",
                  ][active]
                }
              </p>
            </div>
            {active === 0 && (
              <>
                <div className="area-control">
                  <label htmlFor="bath-area">
                    Badfläche <span>m²</span>
                  </label>
                  <div>
                    <button
                      aria-label="Fläche verkleinern"
                      onClick={() =>
                        set("area", Math.max(1, (Number(c.area) || 1) - 0.5))
                      }
                    >
                      <Minus size={19} />
                    </button>
                    <input
                      id="bath-area"
                      aria-label="Badfläche (m²)"
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="100"
                      step="0.5"
                      value={c.area}
                      onChange={(e) => set("area", e.target.value)}
                    />
                    <button
                      aria-label="Fläche vergrößern"
                      onClick={() =>
                        set("area", Math.min(100, (Number(c.area) || 1) + 0.5))
                      }
                    >
                      <Plus size={19} />
                    </button>
                  </div>
                </div>
                <input
                  className="area-slider"
                  type="range"
                  min="1"
                  max="20"
                  step=".5"
                  aria-label="Badfläche mit Schieberegler"
                  value={Math.min(20, Number(c.area) || 1)}
                  onChange={(e) => set("area", Number(e.target.value))}
                />
                <div className="price-quick-areas">
                  {[3, 4, 5, 6, 8].map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-pressed={Number(c.area) === n}
                      onClick={() => set("area", n)}
                    >
                      {n} m²
                    </button>
                  ))}
                </div>
                <div className="compact-notice">
                  Bis {PRICE_CATALOGUE.maxStandardArea} m²:{" "}
                  {formatPrice(PRICE_CATALOGUE.base)} Basispaket. Größere Bäder
                  kalkulieren wir individuell.
                </div>
              </>
            )}
            {active === 1 && (
              <div className="visual-choice-grid">
                {PRICE_CATALOGUE.equipment.map((e) => (
                  <Choice
                    key={e.id}
                    name={e.name}
                    description={
                      e.id === "Dusche und Badewanne"
                        ? "Mehr Raum nötig. Individuelle Kalkulation."
                        : e.note
                    }
                    price={
                      e.id === "Dusche und Badewanne"
                        ? "Auf Anfrage"
                        : e.delta
                          ? "Demo: +" + formatPrice(e.delta)
                          : "Im Basispaket"
                    }
                    selected={c.equipment === e.id}
                    onClick={() => set("equipment", e.id)}
                  >
                    <BathroomPreview
                      configuration={{ ...c, equipment: e.id }}
                      compact
                    />
                  </Choice>
                ))}
              </div>
            )}
            {active === 2 && (
              <>
                <h3 className="choice-group-title">WC</h3>
                <div className="visual-choice-grid">
                  {TOILETS.map((e) => (
                    <Choice
                      key={e.id}
                      name={e.name}
                      description={e.description}
                      price="Standard · kein Aufpreis"
                      selected={c.toilet === e.id}
                      onClick={() => set("toilet", e.id)}
                    >
                      <FixtureSketch type={e.id} />
                    </Choice>
                  ))}
                </div>
                <h3 className="choice-group-title">Waschtisch</h3>
                <div className="visual-choice-grid">
                  {VANITIES.map((e) => (
                    <Choice
                      key={e.id}
                      name={e.name}
                      description={e.description}
                      price={
                        e.id === "double" ? "Auf Anfrage" : "Im Basispaket"
                      }
                      selected={c.vanity === e.id}
                      onClick={() => set("vanity", e.id)}
                    >
                      <FixtureSketch type={e.id} />
                    </Choice>
                  ))}
                </div>
                <h3 className="choice-group-title">Spiegel</h3>
                <div className="visual-choice-grid">
                  <Choice
                    name="Standardspiegel"
                    description="Eine klare, schlichte Lösung."
                    price="Im Basispaket"
                    selected={!c.extras.includes("LED-Spiegel")}
                    onClick={() =>
                      set(
                        "extras",
                        c.extras.filter((x) => x !== "LED-Spiegel"),
                      )
                    }
                  >
                    <FixtureSketch type="standard" />
                  </Choice>
                  <Choice
                    name="LED-Spiegel"
                    description="Licht direkt am Waschtisch."
                    price={
                      "Demo: +" +
                      formatPrice(
                        PRICE_CATALOGUE.extras.find(
                          (x) => x.id === "LED-Spiegel",
                        ).price,
                      )
                    }
                    selected={c.extras.includes("LED-Spiegel")}
                    onClick={() =>
                      set("extras", [...new Set([...c.extras, "LED-Spiegel"])])
                    }
                  >
                    <FixtureSketch type="led" />
                  </Choice>
                </div>
              </>
            )}
            {active === 3 && (
              <>
                <h3 className="choice-group-title">Farbstimmung</h3>
                <div className="material-grid">
                  {MATERIALS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className={c.material === m.id ? "selected" : ""}
                      aria-pressed={c.material === m.id}
                      onClick={() => set("material", m.id)}
                    >
                      <span
                        className={"material-swatch material-" + m.id}
                        style={{ "--swatch": m.color }}
                      >
                        {c.material === m.id && <Check size={20} />}
                      </span>
                      <strong>{m.name}</strong>
                      <small>{m.description}</small>
                    </button>
                  ))}
                </div>
                <h3 className="choice-group-title">Fliesenformat</h3>
                <div className="format-options">
                  {TILE_FORMATS.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      aria-pressed={c.tileFormat === t.id}
                      className={c.tileFormat === t.id ? "selected" : ""}
                      onClick={() => set("tileFormat", t.id)}
                    >
                      <span className={"format-diagram format-" + t.id} />
                      <strong>{t.name}</strong>
                      <small>
                        {t.id === "large" ? "Individuell" : "Standardformat"}
                      </small>
                    </button>
                  ))}
                </div>
                <h3 className="choice-group-title">Oberfläche</h3>
                <div className="segmented">
                  {FINISHES.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      aria-pressed={c.finish === f.id}
                      className={c.finish === f.id ? "selected" : ""}
                      onClick={() => set("finish", f.id)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            {active === 4 && (
              <div className="comfort-options">
                {PRICE_CATALOGUE.extras.map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    aria-pressed={c.extras.includes(e.id)}
                    className={c.extras.includes(e.id) ? "selected" : ""}
                    onClick={() => toggle(e.id)}
                  >
                    <span className="choice-check">
                      {c.extras.includes(e.id) && <Check size={14} />}
                    </span>
                    <span>
                      <strong>{e.name || e.id}</strong>
                      <small>{e.description}</small>
                    </span>
                    <b>
                      +{formatPrice(e.price)}
                      <small>Demo</small>
                    </b>
                  </button>
                ))}
              </div>
            )}
            {active === 5 && (
              <>
                <BathroomPreview configuration={c} />
                <div className="configuration-summary">
                  {configurationLabel(c).map((s, i) => (
                    <span key={i}>
                      <Check size={15} />
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mobile-full-summary">{summary}</div>
                <p className="summary-invitation">
                  Ihre Konfiguration ist der Anfang. Mit einer kurzen Anfrage
                  können Sie den Beratungsablauf ausprobieren — ohne Konto.
                </p>
              </>
            )}
            {invalid && (
              <div className="error" role="alert">
                {result.issues.map((s) => (
                  <p key={s}>{s}</p>
                ))}
              </div>
            )}
            <div className="wizard-controls">
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  active
                    ? go(active - 1)
                    : onChange({ ...DEFAULT_CONFIGURATION, extras: [] })
                }
              >
                {active ? (
                  <>
                    <ArrowLeft size={18} />
                    Zurück
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Zurücksetzen
                  </>
                )}
              </button>
              <span className="desktop-next">
                <button
                  type="button"
                  className="button"
                  disabled={invalid}
                  onClick={next}
                >
                  {active === 5 ? "Beratung anfragen" : "Weiter"}
                  <ArrowRight size={18} />
                </button>
              </span>
            </div>
          </div>
        </div>
        <aside className="estimate-panel">
          <BathroomPreview configuration={c} />
          {summary}
          <button
            type="button"
            className="button full"
            disabled={invalid}
            onClick={next}
          >
            {active === 5
              ? "Beratung anfragen"
              : "Weiter zu " + steps[active + 1]}
            <ArrowRight size={18} />
          </button>
        </aside>
      </div>
      <div className="mobile-estimate">
        <div>
          <small>
            {result.eligible
              ? "Richtwert · brutto · Demo-Aufpreise"
              : "Individuelle Kalkulation"}
          </small>
          <strong aria-live="polite">
            <span key={invalid ? "invalid" : (result.total ?? "custom")}>
              {invalid
                ? "—"
                : result.total === null
                  ? "Auf Anfrage"
                  : formatPrice(result.total)}
            </span>
          </strong>
          <span className="mobile-difference">
            {delta !== null
              ? `${delta > 0 ? "+" : "−"}${formatPrice(Math.abs(delta))}`
              : "Basis " + formatPrice(PRICE_CATALOGUE.base) + " bestätigt"}
          </span>
        </div>
        <button
          type="button"
          className="button"
          disabled={invalid}
          onClick={next}
        >
          {active === 5 ? "Anfragen" : "Weiter"}
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}
