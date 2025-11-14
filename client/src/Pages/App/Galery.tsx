import { useEffect, useState } from "react";
import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image";
import ImageEncryptor from "../../Components/ImageEncryptor";
import { toast } from "react-toastify";
import { SortBy, SortOrder, sortImages } from "../../lib/sortUtils";
import { TbSortAscending2, TbSortDescending2 } from "react-icons/tb";
import { useGlobal } from "../../context/GlobalContext";
import AnuncioRedireccion from "../../Components/AnuncioRedireccion";

// Mover fuera del componente
type ImageData = {
  createdAt: string;
  id: number;
  publicId: string;
  title: string;
  updatedAt: string;
  url: string;
  userId: number;
  extraCols: number;
  extraRows: number;
  bytes: number;
};

function Galery() {
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
  const handleCloseModal = (imageData?: Partial<ImageProps>) => {
    setIsModalOpen(false);
    if (imageData && "image" in imageData) {
      const newImage: ImageProps = {
        image: imageData.image!,
        hint: imageData.hint!,
        date: imageData.date!,
        extraCols: imageData.extraCols!,
        extraRows: imageData.extraRows!,
        publicId: imageData.publicId!,
        id: imageData.id!,
        bytes: imageData.bytes || 0,
      };
      setMyImages((prev) => [...prev, newImage]);
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
        const images: ImageProps[] = data.map((image: ImageData) => ({
          date: image.createdAt,
          publicId: image.publicId,
          id: image.id,
          hint: image.title,
          image: image.url,
          extraCols: image.extraCols,
          extraRows: image.extraRows,
          bytes: image.bytes,
        }));
        setMyImages(images);
      };
      getImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido");
    }
  }, []);

  //ordenar las imgenes por fecha subida o por nombre, de forma ascendente o descentente
  const [sortBy, setSortBy] = useState(SortBy.DATE);
  const [sortOrder, setSortOrder] = useState(SortOrder.DESC);

  // Aplica automáticamente el orden al cambiar sortBy o sortOrder
  useEffect(() => {
    const sorted = sortImages(myImages, sortBy, sortOrder);
    setMyImages(sorted);
  }, [sortBy, sortOrder]);


  // Cambia ascendente/descendente
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC));
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

  //Manipulación de la barra de herramientas
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      {/* Pop - up cuando se necesita */}

      {showOverlay && <AnuncioRedireccion />}

      <div className={`flex fixed w-17/18 gap-2 justify-between items-center bg-neutral-900 text-white px-4 py-3 mr-1 rounded-lg shadow-md transition-all duration-300
           ${isScrolled
            ? "bg-neutral-900/70 backdrop-blur-md"
            : "bg-neutral-900"}`}>
        <button
          className="bg-neutral-700 text-white py-2 px-4 rounded-lg hover:bg-neutral-500 transition-all"
          onClick={handleOpenModal}
        >
          Subir nueva imagen
        </button>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-neutral-300">
            Ordenar por:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-neutral-800 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={SortBy.HINT}>Título</option>
            <option value={SortBy.SIZE}>Tamaño</option>
            <option value={SortBy.DATE}>Fecha de subida</option>
          </select>

          <button
            onClick={toggleSortOrder}
            className="bg-neutral-700 hover:bg-neutral-600 px-3 py-2 rounded-md flex items-center justify-center text-lg transition-all"
            aria-label={sortOrder === SortOrder.ASC ? "Ascendente" : "Descendente"}
          >
            {sortOrder === SortOrder.ASC ? <TbSortAscending2 /> : <TbSortDescending2 />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-4 pt-2 mt-16">
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
