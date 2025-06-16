import React, { useState } from "react";
import Spinner from "./Spinner";

import { encryptImage } from './cifrado'; // Asegúrate que el path sea correcto

const ImageEncryptor: React.FC<{
  onClose: (imageData?: { image: string; hint: string; date: string }) => void;
}> = ({ onClose }) => {
  // const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
          const { image: encryptedImage } = await encryptImage(imageData, blockSize, password);

          const outputCanvas = document.createElement("canvas");
          outputCanvas.width = encryptedImage.width;
          outputCanvas.height = encryptedImage.height;
          const outputCtx = outputCanvas.getContext("2d");
          if (!outputCtx) return;
          outputCtx.putImageData(encryptedImage, 0, 0);

          setModifiedImage(outputCanvas.toDataURL());
        } catch (error) {
          console.error("Error al cifrar la imagen:", error);
        }
      };
    };

    reader.readAsDataURL(selectedImage);
  };

  const dataURLtoBlob = (dataURL: string) => {
    const parts = dataURL.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  };

  const handleUpload = async () => {
    if (modifiedImage) {
      setIsLoading(true);
      const imageBlob = dataURLtoBlob(modifiedImage);
      const imageFile = new File([imageBlob], "modified_image.png", {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("description", hint);

      try {
        const response = await fetch("http://localhost:3000/images/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          console.log("Image uploaded successfully!");
          const today = new Date().toISOString().split("T")[0];
          onClose({ image: modifiedImage, hint, date: today });
        } else {
          console.error("Error uploading image:", response.statusText);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
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
          Modificador de Imagen
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
            Modificar
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
              <h2 className="text-2xl font-semibold mb-2">Imagen Modificada</h2>
              <img
                src={modifiedImage}
                alt="Imagen Modificada"
                className="max-w-xs max-h-xs border border-gray-300 rounded p-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEncryptor;
