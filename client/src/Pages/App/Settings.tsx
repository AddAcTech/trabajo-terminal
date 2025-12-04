"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  LuCheck,
  LuCircleAlert,
  LuKey,
  LuSave,
  LuShield,
} from "react-icons/lu";
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-balance flex items-center gap-3">
            <LuShield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            Configuración de Seguridad
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestiona cómo se comportan las llaves de cifrado y los niveles de
            seguridad de tu cuenta.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <LuKey className="w-5 h-5 text-muted-foreground" />
                  Política de Clave Maestra
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <label
                    className={`relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-all ${
                      selected === "true"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-accent hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        value="true"
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        {...register("keyPolitic", {
                          required: "Selecciona una opción",
                        })}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span
                        className={`font-semibold block ${
                          selected === "true"
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        Uso de clave única
                      </span>
                      <span className="text-muted-foreground mt-1 block">
                        Mayor seguridad. Una sola llave maestra para todo el
                        contenido.
                      </span>
                    </div>
                    {selected === "true" && (
                      <LuCheck className="absolute top-4 right-4 w-5 h-5 text-primary" />
                    )}
                  </label>

                  <label
                    className={`relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-all ${
                      selected === "false"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-accent hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        value="false"
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        {...register("keyPolitic", {
                          required: "Selecciona una opción",
                        })}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span
                        className={`font-semibold block ${
                          selected === "false"
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        Uso de claves múltiples
                      </span>
                      <span className="text-muted-foreground mt-1 block">
                        Mayor flexibilidad. Permite claves distintas por sesión.
                      </span>
                    </div>
                    {selected === "false" && (
                      <LuCheck className="absolute top-4 right-4 w-5 h-5 text-primary" />
                    )}
                  </label>
                </div>

                {errors.keyPolitic && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-2">
                    <LuCircleAlert className="w-4 h-4" />
                    {errors.keyPolitic.message}
                  </p>
                )}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                <div className="flex gap-3">
                  <LuCircleAlert
                    className={`w-5 h-5 flex-shrink-0 ${
                      selected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {!selected &&
                      "Selecciona una política arriba para ver los detalles de seguridad e implicaciones."}
                    {selected === "true" &&
                      "Al activar esta opción, usted debe asignar una clave única para cifrar y descifrar imágenes. Advertencia: Si pierde u olvida esta clave, no podrá recuperar el acceso a sus imágenes almacenadas."}
                    {selected === "false" &&
                      "Al activar esta opción, usted permite ingresar claves distintas por cada sesión. Esto es útil si comparte el dispositivo, pero requiere que recuerde qué clave usó para cada lote de imágenes."}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    "Guardando..."
                  ) : (
                    <>
                      <LuSave className="w-4 h-4" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
