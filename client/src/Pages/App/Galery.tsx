import { useEffect, useState } from "react";
import { ImageProps } from "../../Components/Image";
import Image from "../../Components/Image";
import ImageEncryptor from "../../Components/ImageEncryptor";
import { toast } from "react-toastify";
import {
  SortBy,
  SortOrder,
  formatBytes,
  sortImages,
} from "../../lib/sortUtils";
import { useGlobal } from "../../context/GlobalContext";
import AnuncioRedireccion from "../../Components/AnuncioRedireccion";
import { LuArrowDownUp, LuArrowUpDown, LuPlus } from "react-icons/lu";

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
  const espacioTotal = myImages.reduce((sum, img) => sum + (img.bytes ?? 0), 0);

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
  }, [sortBy, sortOrder, myImages]);

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
      {showOverlay && <AnuncioRedireccion />}

      <header className="bg-card border-b border-neutral-800 px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              Mis Imágenes
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {myImages.length} archivos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-3 py-2 rounded-lg flex justify-center items-center p-2"
              >
                <LuPlus className="w-4 h-4" />
                <span>Subir imagen</span>
              </button>
            </div>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-neutral-800 text-white h-10 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={SortBy.HINT}>Título</option>
              <option value={SortBy.SIZE}>Tamaño</option>
              <option value={SortBy.DATE}>Fecha</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
            >
              {sortOrder === SortOrder.ASC ? (
                <LuArrowUpDown className="text-white" />
              ) : (
                <LuArrowDownUp className="text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {myImages.map((image) => (
            <Image
              key={image.id}
              image={image}
              claveMaestra={claveMaestra}
              onDeleted={handleImageDeleted}
            />
          ))}
        </div>
      </div>
      {isModalOpen && (
        <ImageEncryptor
          onClose={handleCloseModal}
          claveMaestra={claveMaestra}
        />
      )}

      <div className="bg-card border-t border-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Espacio total ocupado
            </p>
            <p className="text-sm font-medium text-foreground">
              {formatBytes(espacioTotal)}
            </p>
          </div>
          <div className="h-1.5 w-48 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-gradient-to-r from-primary to-accent rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Galery;
