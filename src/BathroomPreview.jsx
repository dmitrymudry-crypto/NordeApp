import React, { useId } from "react";
import { MATERIALS } from "./bathroom-options.js";
export default function BathroomPreview({ configuration, compact = false }) {
  const uid = useId().replace(/:/g, "");
  const m =
    MATERIALS.find((x) => x.id === configuration.material) || MATERIALS[0];
  const tub = configuration.equipment.includes("Badewanne"),
    shower = !tub || configuration.equipment === "Dusche und Badewanne";
  const led = configuration.extras.includes("LED-Spiegel"),
    double = configuration.vanity === "double";
  return (
    <figure className={"bath-preview " + (compact ? "compact" : "")}>
      <svg
        viewBox="0 0 680 500"
        role="img"
        aria-label={`Illustrative Badvorschau: ${m.name}, ${configuration.equipment}${led ? ", LED-Spiegel" : ""}`}
      >
        <defs>
          <linearGradient id={uid + "wall"} x2="1" y2="1">
            <stop stopColor={m.color} />
            <stop offset="1" stopColor={m.floor} />
          </linearGradient>
          <linearGradient id={uid + "wood"}>
            <stop stopColor="#b19474" />
            <stop offset="1" stopColor="#8a7256" />
          </linearGradient>
          <pattern
            id={uid + "tile"}
            width={configuration.tileFormat === "large" ? 170 : 100}
            height={configuration.tileFormat === "60x30" ? 60 : 100}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 100V0H170"
              fill="none"
              stroke="#fff"
              strokeOpacity=".35"
              strokeWidth="1"
            />
          </pattern>
          <linearGradient id={uid + "gloss"} x2="1" y2="1">
            <stop stopColor="#ffffff" stopOpacity=".4" />
            <stop offset=".6" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={uid + "mirror"} x2="1" y2="1">
            <stop stopColor="#b9c7be" />
            <stop offset="1" stopColor="#e5ece6" />
          </linearGradient>
        </defs>
        <path fill={m.color} d="M0 0H680V500H0z" />
        <path fill={"url(#" + uid + "wall)"} d="M0 0H125V365L0 470z" />
        <path d="M125 0H680V365H125z" fill={"url(#" + uid + "tile)"} />
        {configuration.finish === "satin" && (
          <path d="M125 0H680V365H125z" fill={"url(#" + uid + "gloss)"} />
        )}
        <path d="M0 470L125 365H680V500H0z" fill={m.floor} />
        <path
          d="M0 470H680M77 405H680M220 365L190 500M425 365L450 500M570 365L645 500"
          stroke="#fff"
          strokeOpacity=".2"
          fill="none"
        />
        {shower && (
          <g>
            <rect
              x="468"
              y="43"
              width="178"
              height="328"
              fill="#f9fff7"
              fillOpacity=".13"
              stroke="#f2f5eb"
              strokeWidth="2"
            />
            <path
              d="M560 217V96q0-16 24-16h32"
              fill="none"
              stroke="#677b70"
              strokeWidth="5"
            />
            <path d="M596 81h34M555 217h22" stroke="#61756b" strokeWidth="6" />
            <path
              d="M568 226q-20 56 2 93"
              fill="none"
              stroke="#8b9a91"
              strokeWidth="2"
            />
            <path
              d="M462 371H653L631 387H452z"
              fill={
                configuration.equipment === "Dusche mit Duschtasse"
                  ? "#f2f1e9"
                  : m.floor
              }
            />
          </g>
        )}
        <rect
          x="170"
          y="63"
          width={double ? 244 : 173}
          height="170"
          rx="70"
          fill={led ? "#fff1cd" : "#eee9dc"}
        />
        <rect
          x="177"
          y="70"
          width={double ? 230 : 159}
          height="156"
          rx="65"
          fill={"url(#" + uid + "mirror)"}
        />
        {led && (
          <rect
            x="172"
            y="65"
            width={double ? 240 : 169}
            height="166"
            rx="69"
            fill="none"
            stroke="#fff8d9"
            strokeWidth="4"
          />
        )}
        <rect
          x="157"
          y="286"
          width={double ? 268 : 211}
          height="118"
          rx="2"
          fill={"url(#" + uid + "wood)"}
        />
        <path
          d={`M157 345h${double ? 268 : 211}`}
          stroke="#786147"
          strokeOpacity=".5"
        />
        <rect
          x="146"
          y="270"
          width={double ? 290 : 233}
          height="22"
          rx="3"
          fill="#f5f4ec"
        />
        <ellipse cx="260" cy="272" rx="63" ry="16" fill="#fffdf7" />
        <ellipse cx="260" cy="270" rx="47" ry="10" fill="#dce0d7" />
        <path
          d="M259 257v-22q0-8 12-8h11"
          fill="none"
          stroke="#82918a"
          strokeWidth="5"
        />
        {double && (
          <>
            <ellipse cx="373" cy="272" rx="42" ry="14" fill="#fffdf7" />
            <path
              d="M372 260v-23h17"
              fill="none"
              stroke="#82918a"
              strokeWidth="5"
            />
          </>
        )}
        {tub && (
          <g>
            <path
              d="M423 339h230l-21 78q-5 19-25 19H457q-21 0-27-18z"
              fill="#f5f4ee"
            />
            <ellipse cx="533" cy="337" rx="116" ry="25" fill="#faf9f3" />
            <ellipse cx="533" cy="339" rx="98" ry="17" fill="#d9dfd7" />
          </g>
        )}
        <g transform="translate(38,306)">
          <path d="M0 0h55v49q0 24 28 24v30H27q-21 0-21-20z" fill="#f0f1e9" />
          {configuration.toilet === "floor" && (
            <path d="M31 75v55h33V75" fill="#f0f1e9" />
          )}
          <ellipse cx="52" cy="62" rx="36" ry="17" fill="#fffef7" />
          <ellipse cx="52" cy="61" rx="24" ry="9" fill="#e0e5dc" />
        </g>
        {configuration.extras.includes("Neue Decke & Spots") &&
          [220, 375, 530].map((x) => (
            <ellipse key={x} cx={x} cy="15" rx="14" ry="4" fill="#fff8d9" />
          ))}
        <g transform="translate(397,251)">
          <rect width="18" height="24" rx="3" fill="#948e68" />
          <path
            d="M9 0V-41M9-16q-27-15-19-26q18 0 19 26M9-22q23-23 23-32q-21 1-23 32"
            fill="#758868"
            stroke="#758868"
          />
        </g>
      </svg>
      <figcaption>
        Illustrative Vorschau · keine maßstabsgetreue Planung
      </figcaption>
    </figure>
  );
}
