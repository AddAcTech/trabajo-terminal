import React, { useState } from "react";

const ImageEncryptor: React.FC<{
  onClose: (imageData?: { image: string; hint: string; date: string }) => void;
}> = ({ onClose }) => {
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedImage(file);
  };

  const modifyImage = async () => {
    if (!selectedImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(data[i] - 70, 0);
          // data[i] = data[i + 2]; // R
          data[i + 1] = Math.max(255 - data[i + 1], 0); // G
          data[i + 2] = Math.max(255 - data[i + 2], 0); // B
        }

        ctx.putImageData(imageData, 0, 0);
        setModifiedImage(canvas.toDataURL());
      };
    };

    reader.readAsDataURL(selectedImage);
  };

  const handleUpload = () => {
    if (modifiedImage) {
      const today = new Date().toISOString().split("T")[0];
      onClose({ image: modifiedImage, hint, date: today });
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
          <button className="sessionsButton mt-1" onClick={handleUpload}>
            Subir
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
