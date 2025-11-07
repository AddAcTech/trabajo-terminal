import { useState } from "react";
import { BsDownload, BsTrash } from "react-icons/bs";
import Download from "./Download";
import Delete from "./Delete";

//el cuerpo de una imágen, traida de la base de datos
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

  const handleOpenModal = () => setDownload(true);
  const handleCloseModal = () => setDownload(false);
  const handleOpenDelete = () => setDeleteOpen(true);
  const handleCloseDelete = () => setDeleteOpen(false);

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
    <div className="flex flex-col gap-4 p-4 shadow rounded-xl bg-white mx-auto">
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
      <div className="flex justify-end items-center gap-2 font-bold">
        <button
          className="hover:text-blue-500 transition-all duration-300 ease-in-out self-end cursor-pointer"
          onClick={handleOpenModal}
        >
          <BsDownload />
        </button>
        <button
          className="hover:text-red-500 transition-all duration-300 ease-in-out self-end cursor-pointer"
          onClick={handleOpenDelete}
        >
          <BsTrash />
        </button>
      </div>
      <div>
        <img
          src={image.image}
          loading="lazy"
          className="bg-gray-700 h-32 w-60 rounded-xl"
        />
      </div>
      <div>
        <p>{image.id}</p>
        <p>{image.date}</p>
        <p>{image.hint}</p>
        <p>
          {image.bytes
            ? (image.bytes / 1024).toFixed(2) + " KB"
            : "Desconocido"}
        </p>
      </div>
    </div>
  );
}

export default Image;
