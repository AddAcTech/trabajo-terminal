import React, { useState } from "react";
import { decryptImage } from "../lib/cifrado";
import { downloadBlob } from "../lib/download_utils";
import ImageInspector from "./ImageInspector";
import { LuDownload, LuLock, LuLockOpen, LuX } from "react-icons/lu";

type DownloadProps = {
  onClose: () => void;
  hint: string;
  src: string;
  blockSize: number;
  extraCols: number;
  extraRows: number;
  claveMaestra: string | null;
};

const Download: React.FC<DownloadProps> = ({
  onClose,
  hint,
  src,

  blockSize,
  extraCols,
  extraRows,
  claveMaestra,
}) => {
  //const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedSrc, setDecryptedSrc] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"jpeg" | "png" | "gif">(
    "jpeg"
  );

  const [verImagenCifrada, setVerImagenCifrada] = useState(false);
  const [verImagenDescifrada, setVerImagenDescifrada] = useState(false);

  if (!claveMaestra) {
    return;
  }

  const handleDecrypt = async () => {
    setIsDecrypting(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const { image: decryptedImage } = await decryptImage(
          imageData,
          blockSize,
          claveMaestra,
          extraRows,
          extraCols
        );

        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = decryptedImage.width;
        outputCanvas.height = decryptedImage.height;
        const outputCtx = outputCanvas.getContext("2d");
        if (!outputCtx) return;

        outputCtx.putImageData(decryptedImage, 0, 0);
        setDecryptedSrc(outputCanvas.toDataURL(`image/${downloadFormat}`));
        setIsDecrypting(false);
      };
    } catch (error) {
      console.error("Error al descifrar:", error);
      setIsDecrypting(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedSrc) return;

    fetch(decryptedSrc)
      .then((res) => res.blob())
      .then((blob) => {
        downloadBlob(blob, hint, downloadFormat);
      });
  };

  //descargar imagen cifrada con sus metadatos
  const downloadJPEG = async () => {
    if (!src) return;
    try {
      const blob = await fetch(src).then((r) => r.blob());

      await downloadBlob(blob, `${hint}_cifrada`, "jpeg", {
        extraCols,
        extraRows,
        blockSize,
      });
    } catch (error) {
      console.error("Error al descargar:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <LuLock className="w-5 h-5 text-primary" />
            {"Imagen: " + hint}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar modal"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium text-foreground text-sm">
                  Imagen cifrada
                </h3>
              </div>
              <img
                src={src}
                loading="lazy"
                alt="Encrypted"
                onClick={() => setVerImagenCifrada(true)}
                className="bg-secondary h-40 w-full rounded-lg object-cover border border-border hover:border-primary transition-colors cursor-pointer"
              />
              {verImagenCifrada && (
                <ImageInspector
                  src={src}
                  onClose={() => setVerImagenCifrada(false)}
                />
              )}
            </div>

            {decryptedSrc && (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-foreground text-sm">
                    Imagen descifrada
                  </h3>
                </div>
                <img
                  onClick={() => setVerImagenDescifrada(true)}
                  src={decryptedSrc || "/placeholder.svg"}
                  alt="Decrypted"
                  className="bg-secondary h-40 w-full rounded-lg object-cover border border-border hover:border-accent transition-colors cursor-pointer"
                />
                {verImagenDescifrada && (
                  <ImageInspector
                    src={decryptedSrc}
                    onClose={() => setVerImagenDescifrada(false)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!decryptedSrc && (
              <button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LuLockOpen className="w-4 h-4" />
                {isDecrypting ? "Descifrando..." : "Descifrar imagen"}
              </button>
            )}

            {decryptedSrc && (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-foreground text-sm">
                    Formato de descarga
                  </label>
                  <select
                    value={downloadFormat}
                    onChange={(e) =>
                      setDownloadFormat(
                        e.target.value as "jpeg" | "png" | "gif"
                      )
                    }
                    className="bg-input border border-border text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LuDownload className="w-4 h-4" />
                  Descargar imagen descifrada
                </button>
              </div>
            )}

            <button
              onClick={downloadJPEG}
              className=" w-full flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 text-neutral-50 rounded-lg hover:bg-neutral-700 hover:border-neutral-600 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <LuDownload className="w-4 h-4" />
                Descargar imagan cifrada como JPEG
            </button>
          </div>

          <div className="mt-6 p-4 bg-secondary rounded-lg border border-border">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Esta imagen se descifrará temporalmente en tu navegador. Ningún
              dato se envía a servidores externos. La imagen descifrada se
              descarga directamente a tu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
