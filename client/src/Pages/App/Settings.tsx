"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { LuCircleAlert, LuCircleCheck, LuLock, LuSave } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type FormData = {
  keyPolitic: "true" | "false";
};

export default function Settings() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>();
  const navigate = useNavigate();
  const selected = watch("keyPolitic");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cargar configuración actual del usuario
  useEffect(() => {
    const politic = sessionStorage.getItem("politic");
    setValue("keyPolitic", politic ? "true" : "false");
  }, [setValue]);

  // Guardar cambios
  const onSubmit = async (form: FormData) => {
    const confirmAction = window.confirm(
      "¿Está seguro de que desea modificar esta configuración? Esto cerrará su sesión y deberá volver a iniciar sesión."
    );

    if (!confirmAction) {
      toast.info("Operación cancelada");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const id_user = sessionStorage.getItem("id");

      setIsSubmitting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/update-key-politic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_user: id_user,
            useUniqueKey: form.keyPolitic === "true",
          }),
        }
      );

      if (!response.ok) {
        toast.error("Error al actualizar configuración");
        setIsSubmitting(false);
        return;
      }

      toast.success("Configuración actualizada correctamente");
      setIsSubmitting(false);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    } catch {
      toast.error("No se pudo actualizar la configuración");
    }
  };

  async function deleteAccount(): Promise<import("react").MouseEventHandler<HTMLButtonElement> | undefined> {
    try {
      const token = localStorage.getItem("token");
      const id_user = sessionStorage.getItem("id");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${id_user}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_user: id_user
          }),
        }
      );
      if (!response.ok) {
        toast.error("Error al borrar la cuenta");
        return;
      }
      toast.success("Usuario eliminado correctamente");

      //Limpiar información para el login
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    } catch {
      toast.error("No se pudo actualizar la configuración");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-neutral-900 rounded-lg">
              <LuLock className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-50">
              Configuración de Seguridad
            </h1>
          </div>
          <p className="text-neutral-400">
            Gestiona cómo se comportan las llaves de cifrado y los niveles de
            seguridad de tu cuenta.
          </p>
        </div>

        <div className="bg-neutral-900 rounded-lg p-6 md:p-8 border border-neutral-800">
          <div className="flex items-center gap-2 mb-6">
            <LuLock className="w-5 h-5 text-violet-600" />
            <h2 className="text-xl font-semibold text-neutral-50">
              Política de Clave Maestra
            </h2>
          </div>

          <label
            className="flex items-start gap-4 p-4 md:p-6 mb-4 border-2 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              borderColor:
                selected === "true" ? "rgb(147, 51, 234)" : "rgb(38, 38, 38)",
              backgroundColor:
                selected === "true" ? "rgba(147, 51, 234, 0.1)" : "transparent",
            }}
          >
            <input
              type="radio"
              value="true"
              {...register("keyPolitic", {
                required: "Selecciona una opción",
              })}
              className="w-5 h-5 mt-1 cursor-pointer accent-violet-600"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-50 mb-1">
                Uso de clave única
              </h3>
              <p className="text-sm text-neutral-400">
                Una sola llave privada para todo el contenido.
              </p>
            </div>
            {selected === "true" && (
              <LuCircleCheck className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
            )}
          </label>

          <label
            className="flex items-start gap-4 p-4 md:p-6 mb-6 border-2 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              borderColor:
                selected === "false" ? "rgb(147, 51, 234)" : "rgb(38, 38, 38)",
              backgroundColor:
                selected === "false"
                  ? "rgba(147, 51, 234, 0.1)"
                  : "transparent",
            }}
          >
            <input
              type="radio"
              {...register("keyPolitic", {
                required: "Selecciona una opción",
              })}
              value="false"
              checked={selected === "false"}
              className="w-5 h-5 mt-1 cursor-pointer accent-violet-600"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-50 mb-1">
                Uso de claves múltiples
              </h3>
              <p className="text-sm text-neutral-400">
                Permite claves distintas por sesión.
              </p>
            </div>
            {selected === "false" && (
              <LuCircleCheck className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
            )}
          </label>

          {selected === "false" && (
            <div className="flex gap-3 p-4 bg-neutral-800 rounded-lg mb-6 border border-neutral-700">
              <LuCircleAlert className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-300">
                Al activar esta opción, usted permite ingresar claves distintas
                por cada sesión. Esto es útil si comparte el dispositivo, pero
                requiere que recuerde qué clave usó para cada lote de imágenes.
              </p>
            </div>
          )}

          {errors.keyPolitic && (
            <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
              <LuCircleAlert className="w-4 h-4" />
              {errors.keyPolitic.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-700 text-neutral-50 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <LuSave className="w-5 h-5" />
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    
      <div className="flex flex-row border-2 border-red-600 rounded-2xl w-fit p-2 m-4 mt-6" >
            <div className="flex flex-col items">
              <h2>Borrar cuenta</h2>
              <span>Borrar su cuenta elimina toda su informacióne imagenes subidas a la plataforma, siendo una acción irreversible </span>
            </div>
            <button className="flex text-center text-white bg-red-600 rounded-4xl align-middle" type="button" onClick={() => {deleteAccount()}}>
              BORRAR CUENTA
            </button>
      </div>
      </form>
  );
}
