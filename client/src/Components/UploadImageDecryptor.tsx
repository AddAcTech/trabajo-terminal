"use client";

import React, { useState } from "react";
import { decryptImage } from "../lib/cifrado";
import { downloadBlob, readMetadataFromFile } from "../lib/download_utils";
import ImageInspector from "./ImageInspector";

const UploadImageDecryptor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
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
  const [downloadFormat, setDownloadFormat] =
    useState<"jpeg" | "png" | "gif">("jpeg");

  const [showEncryptedPreview, setShowEncryptedPreview] = useState(false);
  const [showDecryptedPreview, setShowDecryptedPreview] = useState(false);

  // ------------------------------------------------------------
  //   Cargar archivo y extraer EXIF + mostrar preview
  // ------------------------------------------------------------
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        alert("La imagen no contiene los metadatos necesarios para el descifrado.");
        setLoadingMeta(false);
        return;
      }

      setMetadata(meta);

      // Cargar la preview
      const src = URL.createObjectURL(file);
      setEncryptedSrc(src);
    } catch (error) {
      console.error(error);
      alert("Error al leer metadatos");
    }

    setLoadingMeta(false);
  };

  // ------------------------------------------------------------
  //   DESCIFRADO
  // ------------------------------------------------------------
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
        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

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

  // ------------------------------------------------------------
  //   DESCARGAR DESCIFRADA
  // ------------------------------------------------------------
  const handleDownload = async () => {
    if (!decryptedSrc) return;

    const blob = await fetch(decryptedSrc).then((r) => r.blob());

    downloadBlob(blob, "imagen_descifrada", downloadFormat);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Descifrar Imagen subida
      </h1>
      <p>Si tiene una imagen cifrada almacenada por otros medios, aquí puede descifrarla</p>
      {/* Subir archivo */}
      <input
        type="file"
        accept="image/jpeg,image/png"
        className="sessionsInput mb-4"
        onChange={handleFileUpload}
      />

      {loadingMeta && <p className="mb-4">Leyendo información...</p>}

      {/* Mostrar metadatos */}
      { /*metadata && (
        <div className="mb-4 border p-3 rounded bg-gray-50">
          <p className="font-semibold">Metadatos detectados:</p>
          <p>BlockSize: {metadata.blockSize}</p>
          <p>Extra Rows: {metadata.extraRows}</p>
          <p>Extra Cols: {metadata.extraCols}</p>
        </div>
      )*/}

      {/* Input clave */}
      <input
        type="password"
        placeholder="Clave de descifrado"
        className="sessionsInput mb-4"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
      />

      {/* Imagen cifrada */}
      {encryptedSrc && (
        <div className="mb-4">
          <h3 className="font-semibold">Imagen cifrada:</h3>

          <img
            src={encryptedSrc}
            className="bg-gray-700 h-48 w-full rounded-xl object-cover cursor-pointer"
            onClick={() => setShowEncryptedPreview(true)}
          />

          {showEncryptedPreview && (
            <ImageInspector
              src={encryptedSrc}
              onClose={() => setShowEncryptedPreview(false)}
            />
          )}
        </div>
      )}

      {/* Botón descifrar */}
      {metadata && (
        <button
          onClick={handleDecrypt}
          disabled={loadingDecrypt}
          className="sessionsButton mb-4 w-full"
        >
          {loadingDecrypt ? "Descifrando..." : "Descifrar"}
        </button>
      )}

      {/* Imagen descifrada */}
      {decryptedSrc && (
        <>
          <h3 className="font-semibold mb-2">Imagen descifrada:</h3>

          <img
            src={decryptedSrc}
            className="bg-gray-200 h-48 w-full rounded-xl object-cover cursor-pointer mb-4"
            onClick={() => setShowDecryptedPreview(true)}
          />

          {showDecryptedPreview && (
            <ImageInspector
              src={decryptedSrc}
              onClose={() => setShowDecryptedPreview(false)}
            />
          )}

          {/* Formato */}
          <label className="block font-semibold mb-1">
            Formato de descarga:
          </label>
          <select
            value={downloadFormat}
            onChange={(e) =>
              setDownloadFormat(e.target.value as "jpeg" | "png" | "gif")
            }
            className="border rounded px-2 py-1 mb-3 w-full"
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="gif">GIF</option>
          </select>

          <button
            onClick={handleDownload}
            className="sessionsButton w-full"
          >
            Descargar imagen descifrada
          </button>
        </>
      )}
    </div>
  );
};

export default UploadImageDecryptor;
