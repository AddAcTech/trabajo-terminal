import { useEffect, useState } from "react";
import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image";
import ImageEncryptor from "../../Components/ImageEncryptor";
import { toast } from "react-toastify";
import { SortBy, SortOrder, sortImages } from "../../lib/sortUtils";
import { TbSortAscending2, TbSortDescending2 } from "react-icons/tb";
import { useGlobal } from "../../context/GlobalContext";
import AnuncioRedireccion from "../../Components/AnuncioRedireccion";

function Galery() {
  type Image = {
    createdAt: string;
    id: number;
    publicId: string;
    title: string;
    updatedAt: string;
    url: string;
    userId: number;
    extraCols: number;
    extraRows: number;
  };

  //variables del galery
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myImages, setMyImages] = useState<ImageProps[]>([]);

  // handler para eliminar una imagen localmente cuando el servidor confirma el borrado
  const handleImageDeleted = (id: number) => {
    setMyImages((prev) => prev.filter((img) => img.id !== id));
    toast.success("Imagen eliminada");
  };

  const { claveMaestra, isExpired } = useGlobal(); //para manipular la llave maestra

  const showOverlay = !claveMaestra || isExpired;

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = (imageData?: {
    image: string;
    hint: string;
    date: string;
    extraCols: number;
    extraRows: number;
  }) => {
    setIsModalOpen(false);
    if (imageData) {
      setMyImages([...myImages, imageData]);
    }
  };

  //funcion del galery para recuperar las imágenes
  useEffect(() => {
    try {
      const getImages = async () => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/images/getAll`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        const images: ImageProps[] = data.map((image: Image) => ({
          date: image.createdAt,
          publicId: image.publicId,
          id: image.id,
          hint: image.title,
          image: image.url,
          extraCols: image.extraCols,
          extraRows: image.extraRows,
        }));
        setMyImages(images);
      };
      getImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  }, []);

  //ordenar las imgenes por fecha subida o por nombre, de forma ascendente o descentente
  const [sortBy, setSortBy] = useState(SortBy.HINT);
  const [sortOrder, setSortOrder] = useState(SortOrder.ASC);

  // Aplica automáticamente el orden al cambiar sortBy o sortOrder
  useEffect(() => {
    const sorted = sortImages(myImages, sortBy, sortOrder);
    setMyImages(sorted);
  }, [sortBy, sortOrder]);

  // Cambia el tipo de orden (sin errores de inferencia)
  const toggleSortType = () => {
    setSortBy((prev) => (prev === SortBy.HINT ? SortBy.DATE : SortBy.HINT));
  };

  // Cambia ascendente/descendente
  const toggleSortOrder = () => {
    setSortOrder((prev) =>
      prev === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
    );
  };

  //preservar al recargar la página, tal vez se quite
  useEffect(() => {
    localStorage.setItem("sortBy", sortBy);
    localStorage.setItem("sortOrder", sortOrder);
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const savedBy = localStorage.getItem("sortBy") as SortBy | null;
    const savedOrder = localStorage.getItem("sortOrder") as SortOrder | null;
    if (savedBy) setSortBy(savedBy);
    if (savedOrder) setSortOrder(savedOrder);
  }, []);

  return (
    <div className="relative">
      {/* Pop - up cuando se necesita */}

      {showOverlay && <AnuncioRedireccion />}

      <div className="flex gap-2 justify-between items-center bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-md">
        <button
          className="bg-neutral-700 text-white py-2 px-4 rounded-lg hover:bg-neutral-500 transition-all"
          onClick={handleOpenModal}
        >
          Subir nueva imagen
        </button>
        <div className="flex gap-2">
          <button
            onClick={toggleSortType}
            className="bg-neutral-700 hover:bg-neutral-500 px-3 py-2 rounded-md"
          >
            Ordenar por: {sortBy === SortBy.HINT ? "Título" : "Fecha de subida"}
          </button>
          <button
            onClick={toggleSortOrder}
            className="bg-neutral-700 hover:bg-neutral-500 px-3 py-2 rounded-md flex items-center justify-center text-lg transition-all"
            aria-label={
              sortOrder === SortOrder.ASC ? "Ascendente" : "Descendente"
            }
          >
            {sortOrder === SortOrder.ASC ? (
              <TbSortAscending2 />
            ) : (
              <TbSortDescending2 />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-4 pt-2">
        {myImages.map((image) => (
          <Image
            key={image.id}
            image={image}
            claveMaestra={claveMaestra}
            onDeleted={handleImageDeleted}
          />
        ))}
      </div>
      {isModalOpen && (
        <ImageEncryptor
          onClose={handleCloseModal}
          claveMaestra={claveMaestra}
        />
      )}
    </div>
  );
}

export default Galery;
