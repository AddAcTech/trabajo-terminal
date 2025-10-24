import { Link } from "react-router-dom";



export default function AnuncioRedireccion (){

    return (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white">
          <div className="bg-neutral-900 p-8 rounded-lg shadow-2xl text-center w-[90%] max-w-md">
            <h2 className="text-2xl font-semibold mb-4">
              La clave global no ha sido asignada o ha expirado.
            </h2>
            <p className="text-neutral-300 mb-6">
              Usted requiere asignar una clave global para cifrar y descifrar imágenes
            </p>
            <Link to="/clave-maestra">
                <button className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-md text-lg transition-all" >
                Establecer la clave maestra
                </button>
            </Link>
          </div>
        </div>

    )
}