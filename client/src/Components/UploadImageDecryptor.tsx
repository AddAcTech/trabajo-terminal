import type React from "react";
import { useState } from "react";
import { decryptImage } from "../lib/cifrado";
import { downloadBlob, readMetadataFromFile } from "../lib/download_utils";
import ImageInspector from "./ImageInspector";
import { LuDownload, LuLock, LuLockOpen } from "react-icons/lu";

const UploadImageDecryptor: React.FC = () => {
  const [, setFile] = useState<File | null>(null);
  const [clave, setClave] = useState("");
  const [metadata, setMetadata] = useState<{
    blockSize: number;
    extraCols: number;
    extraRows: number;
  } | null>(null);

  const [encryptedSrc, setEncryptedSrc] = useState<string | null>(null);
  const [decryptedSrc, setDecryptedSrc] = useState<string | null>(null);

  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingDecrypt, setLoadingDecrypt] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"jpeg" | "png" | "gif">(
    "jpeg"
  );

  const [showEncryptedPreview, setShowEncryptedPreview] = useState(false);
  const [showDecryptedPreview, setShowDecryptedPreview] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setFile(file);
    setMetadata(null);
    setEncryptedSrc(null);
    setDecryptedSrc(null);

    setLoadingMeta(true);

    try {
      const meta = await readMetadataFromFile(file);

      if (!meta) {
        alert(
          "La imagen no contiene los metadatos necesarios para el descifrado."
        );
        setLoadingMeta(false);
        return;
      }

      setMetadata(meta);

      const src = URL.createObjectURL(file);
      setEncryptedSrc(src);
    } catch (error) {
      console.error(error);
      alert("Error al leer metadatos");
    }

    setLoadingMeta(false);
  };

  const handleDecrypt = async () => {
    if (!encryptedSrc || !metadata) return;

    if (!clave || clave.trim().length === 0) {
      alert("Debes ingresar la clave de descifrado.");
      return;
    }

    setLoadingDecrypt(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = encryptedSrc;

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
          metadata.blockSize,
          clave,
          metadata.extraRows,
          metadata.extraCols
        );

        const outCanvas = document.createElement("canvas");
        outCanvas.width = decryptedImage.width;
        outCanvas.height = decryptedImage.height;
        const outCtx = outCanvas.getContext("2d");
        if (!outCtx) return;

        outCtx.putImageData(decryptedImage, 0, 0);
        setDecryptedSrc(outCanvas.toDataURL(`image/${downloadFormat}`));
      };
    } catch (error) {
      console.error("Error al descifrar:", error);
      alert("Error al descifrar");
    }

    setLoadingDecrypt(false);
  };

  const handleDownload = async () => {
    if (!decryptedSrc) return;

    const blob = await fetch(decryptedSrc).then((r) => r.blob());

    downloadBlob(blob, "imagen_descifrada", downloadFormat);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-balance">
            Descifrar imagen subida
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Si tienes una imagen cifrada por nuestra aplicación y almacenada por
            otros medios, aquí puedes descifrarla de forma segura
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold">
                Seleccionar imagen cifrada
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border rounded-lg hover:bg-card cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <LuLock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Haz clic o arrastra una imagen
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPEG o PNG
                    </p>
                  </div>
                </label>
              </div>
              {loadingMeta && (
                <p className="text-sm text-muted-foreground">
                  Leyendo información...
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label htmlFor="clave" className="block text-sm font-semibold">
                Clave de descifrado
              </label>
              <input
                id="clave"
                type="password"
                placeholder="Ingresa tu clave privada"
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>
            {metadata && (
              <button
                onClick={handleDecrypt}
                disabled={loadingDecrypt}
                className="w-full px-4 py-2.5 bg-primary hover:bg-accent text-primary-foreground font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LuLockOpen className="w-4 h-4" />
                {loadingDecrypt ? "Descifrando..." : "Descifrar imagen"}
              </button>
            )}
            {encryptedSrc && (
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <LuLock className="w-4 h-4" />
                  Imagen cifrada
                </p>
                <img
                  src={encryptedSrc || "/placeholder.svg"}
                  alt="Encrypted"
                  className="w-full h-48 sm:h-56 bg-card rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-border"
                  onClick={() => setShowEncryptedPreview(true)}
                />
                {showEncryptedPreview && (
                  <ImageInspector
                    src={encryptedSrc || "/placeholder.svg"}
                    onClose={() => setShowEncryptedPreview(false)}
                  />
                )}
              </div>
            )}
          </div>
          <div className="space-y-6">
            {decryptedSrc ? (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <LuLockOpen className="w-4 h-4 text-primary" />
                    Imagen descifrada
                  </p>
                  <img
                    src={decryptedSrc || "/placeholder.svg"}
                    alt="Decrypted"
                    className="w-full h-48 sm:h-56 bg-card rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity border border-border"
                    onClick={() => setShowDecryptedPreview(true)}
                  />
                  {showDecryptedPreview && (
                    <ImageInspector
                      src={decryptedSrc || "/placeholder.svg"}
                      onClose={() => setShowDecryptedPreview(false)}
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <label
                    htmlFor="format"
                    className="block text-sm font-semibold"
                  >
                    Formato de descarga
                  </label>
                  <select
                    id="format"
                    value={downloadFormat}
                    onChange={(e) =>
                      setDownloadFormat(
                        e.target.value as "jpeg" | "png" | "gif"
                      )
                    }
                    className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2.5 bg-primary hover:bg-accent text-primary-foreground font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LuDownload className="w-4 h-4" />
                  Descargar imagen descifrada
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 sm:h-72 bg-card border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <LuLockOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Descifra una imagen para verla aquí
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadImageDecryptor;
