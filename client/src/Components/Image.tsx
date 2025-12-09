import { useState } from "react";
import Download from "./Download";
import Delete from "./Delete";
import ImageInspector from "./ImageInspector";
import { LuDownload, LuTrash2 } from "react-icons/lu";

export type ImageProps = {
  date: string;
  hint: string;
  image: string;
  extraCols: number;
  extraRows: number;
  publicId: string;
  id: number;
  bytes: number;
};

const blockSize = 8;

function Image({
  image,
  claveMaestra,
  onDeleted,
}: {
  image: ImageProps;
  claveMaestra: string | null;
  onDeleted?: (id: number) => void;
}) {
  const [download, setDownload] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleOpenModal = () => setDownload(true);
  const handleCloseModal = () => setDownload(false);
  const handleOpenDelete = () => setDeleteOpen(true);
  const handleCloseDelete = () => setDeleteOpen(false);

  const [verImagen, setVerImagen] = useState(false);

  const handleImageTap = () => {
    // En móvil, mostrar overlay al tocar
    setShowOverlay(!showOverlay);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/images/${image.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok || res.status === 204) {
        setDeleteOpen(false);
        if (onDeleted) onDeleted(image.id);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Error borrando la imagen:", res.status, err);
      }
    } catch (err) {
      console.error("Error al borrar la imagen:", err);
    } finally {
      setDeleting(false);
    }
  };
  //TODO obtener las columnas extras de la base de datos y añadirlas a los parametros
  return (
    <div className="group bg-neutral-800 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
      {deleteOpen && (
        <Delete
          isOpen={deleteOpen}
          image={image}
          onConfirm={handleDeleteConfirm}
          onCancel={handleCloseDelete}
          loading={deleting}
        />
      )}
      {download && (
        <Download
          onClose={handleCloseModal}
          hint={image.hint}
          src={image.image}
          blockSize={blockSize}
          extraCols={image.extraCols}
          extraRows={image.extraRows}
          claveMaestra={claveMaestra}
        />
      )}
      {/* <div className="flex justify-end items-center gap-2 font-bold">
        <button
          className="hover:text-blue-500 transition-all duration-300 ease-in-out self-end cursor-pointer"
          onClick={handleOpenModal}
        >
          <BsDownload />
        </button>
      </div> */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={image.image}
          loading="lazy"
          onClick={() => setVerImagen(true)}
          onTouchStart={handleImageTap}
          className="object-cover w-full h-full"
        />
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-3 ${
            showOverlay ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <button
            onClick={() => {
              handleOpenModal();
              setShowOverlay(false);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg p-4 hover:cursor-pointer"
          >
            <LuDownload />
          </button>
          <button
            onClick={() => {
              handleOpenDelete();
              setShowOverlay(false);
            }}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg p-4 hover:cursor-pointer"
          >
            <LuTrash2 />
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-2">
          {new Date(image.date).toLocaleDateString()}
        </p>
        <h3 className="text-sm font-medium text-foreground truncate mb-1">
          {image.hint}
        </h3>
        <p className="text-xs text-muted-foreground">
          {image.bytes
            ? (image.bytes / 1024).toFixed(2) + " KB"
            : "Desconocido"}
        </p>
      </div>

      {verImagen && (
        <ImageInspector src={image.image} onClose={() => setVerImagen(false)} />
      )}
    </div>
  );
}

export default Image;
