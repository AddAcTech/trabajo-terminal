import { useEffect } from "react";
import Spinner from "./Spinner";
import { ImageProps } from "./Image";

type DeleteProps = {
  isOpen: boolean;
  image: ImageProps;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
};

function Delete({ isOpen, image, onConfirm, onCancel, loading }: DeleteProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      <div className="relative bg-white dark:bg-gray-800 rounded-md shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          ¿Eliminar imagen?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          ¿Estás seguro de que deseas borrar la imagen
          {image.hint ? ` "${image.hint}"` : ""}? Esta acción no se puede
          deshacer.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm text-white flex items-center gap-2"
            onClick={() => onConfirm()}
            disabled={loading}
          >
            {loading ? <Spinner /> : null}
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Delete;
