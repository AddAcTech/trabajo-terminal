import React, { useState } from "react";
import { decryptImage } from "../lib/cifrado";
import { downloadBlob } from "../lib/download_utils";

type DownloadProps = {
  onClose: () => void;
  hint: string;
  src: string;
<<<<<<< HEAD
  hint: string;
  password: string;
=======
>>>>>>> clave_maestra
  blockSize: number;
  extraCols: number;
  extraRows: number;
  claveMaestra : string | null;
};

<<<<<<< HEAD
const Download: React.FC<DownloadProps> = ({
  onClose,
  hint,
  src,
  password,
  blockSize,
  extraCols,
  extraRows,
}) => {
=======
const Download: React.FC<DownloadProps> = ({ onClose, hint, src, blockSize, extraCols, extraRows, claveMaestra }) => {
  //const [password, setPassword] = useState("");
>>>>>>> clave_maestra
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedSrc, setDecryptedSrc] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"jpeg" | "png" | "gif">("jpeg");

<<<<<<< HEAD
  // const handleDownloadCifrada = async () => {
  //   //TODO descarga de la imágen cifrada
  // };
=======
  if(!claveMaestra){
    return 
  }
>>>>>>> clave_maestra

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
<<<<<<< HEAD
          password,
=======
          claveMaestra,
>>>>>>> clave_maestra
          extraRows,
          extraCols
        );

        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = decryptedImage.width;
        outputCanvas.height = decryptedImage.height;
        const outputCtx = outputCanvas.getContext("2d");
        if (!outputCtx) return;

        outputCtx.putImageData(decryptedImage, 0, 0);
<<<<<<< HEAD
        const link = document.createElement("a");
        link.download = "imagen_descifrada_" + hint + ".jpeg"; //sustituir por la notación ´someting${var}´, pero no me sale de momento
        link.href = outputCanvas.toDataURL("image/jpeg", 0.85); //"image/jpeg",0.85
        link.click();

=======
        setDecryptedSrc(outputCanvas.toDataURL(`image/${downloadFormat}`));
>>>>>>> clave_maestra
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

  return (
<<<<<<< HEAD
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          Descifrar y descargar la imagen
        </h2>

        <img
          src={src}
          loading="lazy"
          className="bg-gray-700 h-32 w-60 rounded-xl mb-4"
        />

        <div className="flex flex-col gap-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            onClick={handleDownloadDescifrada}
            disabled={isDecrypting}
          >
            {isDecrypting ? "Descifrando..." : "Descargar imagen descifrada"}
          </button>
        </div>
=======
    <div className="fixed inset-0 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white p-4 rounded-xl shadow-lg w-[400px] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Descifre y descargue su imagen</h2>

        {/* Imagen cifrada */}
        <img
          src={src}
          loading="lazy"
          className="bg-gray-700 h-36 w-70 rounded-xl mb-4 object-cover mx-auto"
        />

        {/* Botón para descifrar */}
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting}
          className="sessionsButton mb-4 disabled:opacity-50"
        >
          {isDecrypting ? "Descifrando..." : "Descifrar imagen"}
        </button>

        {/* Vista previa imagen descifrada */}
        {decryptedSrc && (
          <>
            <h3 className="font-semibold mb-2">Vista previa:</h3>
            <img
              src={decryptedSrc}
              className="bg-gray-200 h-36 w-70 rounded-xl mb-4 object-cover mx-auto"
            />

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
              className="sessionsButton"
            >
              Descargar imagen descifrada
            </button>
          </>
        )}
>>>>>>> clave_maestra
      </div>
    </div>
  );
};

export default Download;
