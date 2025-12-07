import { Link } from "react-router-dom";

export default function AnuncioRedireccion() {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white px-4">
      <div className="bg-neutral-900 p-8 rounded-lg shadow-2xl w-full max-w-lg">
        <div className="text-xl font-semibold text-neutral-50">
          La llave para el cifrado no ha sido asignada o ha expirado.
        </div>
        <div className="mt-2 text-neutral-400">
          Debes asignar una clave global para cifrar y descifrar imágenes
        </div>
        <Link to="/clave-maestra">
          <button className="mt-6 w-full bg-violet-600 text-neutral-50 hover:bg-violet-700 transtion-colors duration-300 px-4 py-2 rounded-lg">
            Establecer llave
          </button>
        </Link>
      </div>
    </div>
  );
}
