import React, { useState } from "react";
import { Camera, X } from "lucide-react";
export async function readImages(files, { max = 6, limit = 2000000 } = {}) {
  if (files.length > max) throw Error(`Bitte maximal ${max} Fotos auswählen.`);
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve, reject) => {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 10 * 1024 * 1024
          )
            return reject(
              Error("Bitte JPG, PNG oder WebP bis 10 MB pro Foto wählen."),
            );
          const img = new Image(),
            url = URL.createObjectURL(file);
          img.onload = () => {
            try {
              const scale = Math.min(1, 1200 / Math.max(img.width, img.height)),
                canvas = document.createElement("canvas");
              canvas.width = Math.round(img.width * scale);
              canvas.height = Math.round(img.height * scale);
              canvas
                .getContext("2d")
                .drawImage(img, 0, 0, canvas.width, canvas.height);
              let quality = 0.82,
                result = canvas.toDataURL("image/jpeg", quality);
              while (result.length > limit && quality > 0.4) {
                quality -= 0.1;
                result = canvas.toDataURL("image/jpeg", quality);
              }
              result.length > limit
                ? reject(
                    Error(
                      "Das Foto ist zu groß. Bitte ein kleineres Bild wählen.",
                    ),
                  )
                : resolve(result);
            } catch {
              reject(Error("Das Foto konnte nicht verarbeitet werden."));
            } finally {
              URL.revokeObjectURL(url);
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(Error("Das Foto konnte nicht gelesen werden."));
          };
          img.src = url;
        }),
    ),
  );
}
export default function PhotoUpload({
  photos,
  onChange,
  onError,
  max = 6,
  limit = 2000000,
}) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <label className="upload-area">
        <Camera size={24} />
        <b>{busy ? "Fotos werden vorbereitet …" : "Fotos vom aktuellen Bad"}</b>
        <span>JPG, PNG, WebP · bis zu {max} Fotos · je 10 MB</span>
        <input
          aria-label="Badfotos hochladen"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          onChange={async (e) => {
            const input = e.target;
            setBusy(true);
            onError("");
            try {
              if (photos.length + input.files.length > max)
                throw Error(`Maximal ${max} Fotos möglich.`);
              onChange([
                ...photos,
                ...(await readImages(input.files, { max, limit })),
              ]);
            } catch (e) {
              onError(e.message);
            } finally {
              setBusy(false);
              input.value = "";
            }
          }}
        />
      </label>
      <span className="upload-status" role="status">
        {busy
          ? "Fotos werden verarbeitet."
          : photos.length
            ? `${photos.length} von ${max} Fotos hinzugefügt.`
            : ""}
      </span>
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((p, i) => (
            <div key={i}>
              <img src={p} alt={"Badfoto " + (i + 1)} />
              <button
                type="button"
                aria-label={"Foto " + (i + 1) + " entfernen"}
                onClick={() => onChange(photos.filter((_, j) => i !== j))}
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
