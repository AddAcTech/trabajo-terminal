import React, { useState } from "react";
import { decryptImage, applyMedianFilter } from "./cifrado";
import { downloadBlob } from "./download_utils";

type DownloadProps = {
  onClose: () => void;
  hint: string;
  src: string;
  blockSize: number;
  extraCols: number;
  extraRows: number;
};

const Download: React.FC<DownloadProps> = ({ onClose, hint, src, blockSize, extraCols, extraRows }) => {
  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedSrc, setDecryptedSrc] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"jpeg" | "png" | "gif">("jpeg");

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
          password,
          extraRows,
          extraCols
        );
        imageDataToSRCString( decryptedImage );
        setIsDecrypting(false);
      };
    } catch (error) {
      console.error("Error al descifrar:", error);
      setIsDecrypting(false);
    }
  };

   const handleCorrect = () => {
    if (!decryptedSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = decryptedSrc;

    img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const corrected = applyMedianFilter(imageData);

      imageDataToSRCString(corrected);

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

  const imageDataToSRCString = (imageData : ImageData) => {
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = imageData.width;
    tmpCanvas.height = imageData.height;
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx) return;

    tmpCtx.putImageData(imageData, 0, 0);
    setDecryptedSrc(tmpCanvas.toDataURL(`image/${downloadFormat}`));
  };


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white p-4 rounded-xl shadow-lg w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Descifrar y descargar la imagen</h2>

        {/* Imagen cifrada */}
        <img
          src={src}
          loading="lazy"
          className="bg-gray-700 h-36 w-60 rounded-xl mb-4 object-cover"
        />

        {/* Contraseña */}
        <label className="block font-semibold mb-1">Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-2 py-1 mb-4 w-full"
          placeholder="Ingrese la clave"
        />

        {/* Botón para descifrar */}
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting || !password}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mb-4 disabled:opacity-50"
        >
          {isDecrypting ? "Descifrando..." : "Descifrar imagen"}
        </button>

        {/* Vista previa imagen descifrada */}
        {decryptedSrc && (
          <>
            <h3 className="font-semibold mb-2">Vista previa:</h3>
            <img
              src={decryptedSrc}
              className="bg-gray-200 h-36 w-60 rounded-xl mb-4 object-cover"
            />

            <button
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                onClick={handleCorrect}
              >
                Corregir imagen
            </button>

            {/* Selección de formato */}
            <label className="block font-semibold mb-1">Formato de descarga:</label>
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as "jpeg" | "png" | "gif")}
              className="border rounded px-2 py-1 mb-4 w-full"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="gif">GIF</option>
            </select>

            {/* Botón de descarga */}
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Descargar imagen descifrada
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Download;
