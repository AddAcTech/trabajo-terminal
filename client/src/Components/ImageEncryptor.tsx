import React, { useState } from "react";
import Spinner from "./Spinner";
import { encryptImage } from "./cifrado";

const ImageEncryptor: React.FC<{
  onClose: (imageData?: {
    image: string;
    hint: string;
    date: string;
    extraCols: number;
    extraRows: number;
  }) => void;
}> = ({ onClose }) => {
  // const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedImage(file);
  };

  const modifyImage = async () => {
    if (!selectedImage) return;

    const password = "p455w0rd-PL4C3H0LD3R";
    const blockSize = 8;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const {
            image: encryptedImage,
            extraRows: filasExtra,
            extraCols: columnasExtra,
          } = await encryptImage(imageData, blockSize, password);

          const outputCanvas = document.createElement("canvas");
          outputCanvas.width = encryptedImage.width;
          outputCanvas.height = encryptedImage.height;
          const outputCtx = outputCanvas.getContext("2d");
          if (!outputCtx) return;
          outputCtx.putImageData(encryptedImage, 0, 0);

          setModifiedImage(outputCanvas.toDataURL());
          setExtraCols(columnasExtra);
          setExtraRows(filasExtra);
        } catch (error) {
          console.error("Error al cifrar la imagen:", error);
        }
      };
    };

    reader.readAsDataURL(selectedImage);
  };

  function imageToJpegBlob(imageSrc: string, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No se pudo obtener el contexto");

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Error al generar JPEG");
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject("No se pudo cargar la imagen");
    });
  }

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  const downloadJPEG = async () => {
    if (!modifiedImage) return;
    setIsLoading(true);
    try {
      const blob = await imageToJpegBlob(modifiedImage, 0.85);
      downloadBlob(blob, "imagen_cifrada.jpg");
      setIsLoading(false);
    } catch (error) {
      console.error("Error al convertir o descargar la imagen:", error);
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (modifiedImage) {
      setIsLoading(true);

      try {
        const blob = await imageToJpegBlob(modifiedImage, 0.85);
        const imageFile = new File([blob], "modified_image.jpg", {
          type: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("description", hint);
        //después, vamos a necesitar este dato de columnas y filas que se añaden
        formData.append("extraCols", String(extraCols || 0));
        formData.append("extraRows", String(extraRows || 0));

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/images/upload`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          console.log("Image uploaded successfully!");
          const today = new Date().toISOString().split("T")[0];
          const base64JPEG = await blobToDataURL(blob);
          onClose({
            image: base64JPEG,
            hint,
            date: today,
            extraCols: extraCols,
            extraRows: extraRows,
          });
        } else {
          console.error("Error uploading image:", response.statusText);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error uploading image:", error);
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      onClick={() => onClose()}
    >
      <div
        className="bg-white p-7 rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-4xl font-bold mb-6 text-center">
          Cifrado de imagen
        </h1>
        <div className="max-w-sm mx-auto">
          <input
            className="sessionsInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <input
            className="sessionsInput mt-2"
            type="text"
            placeholder="Image title"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
          />
          <button className="sessionsButton" onClick={modifyImage}>
            Aplicar cifrado
          </button>
          <button
            className={`w-full bg-black text-white font-bold p-2 rounded-lg mt-4 ${
              isLoading ? "bg-gray-400 cursor-default" : "cursor-pointer"
            }`}
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 justify-center">
                <span>Subiendo</span> <Spinner />
              </div>
            ) : (
              "Subir"
            )}
          </button>
        </div>

        <div className="flex justify-around mt-6">
          {selectedImage && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Imagen Original</h2>
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Imagen Original"
                className="max-w-xs max-h-xs border border-gray-300 rounded p-2"
              />
            </div>
          )}
          {modifiedImage && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Imagen Cifrada</h2>
              <img
                src={modifiedImage}
                alt="Imagen Cifrada"
                className="max-w-xs max-h-xs border border-gray-300 rounded p-2"
              />
              <button className="sessionsButton" onClick={downloadJPEG}>
                Descargar como JPEG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEncryptor;
