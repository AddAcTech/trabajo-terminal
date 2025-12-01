"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

  // Cargar configuración actual del usuario
  useEffect(() => {
    const politic = sessionStorage.getItem("politic");
    setValue("keyPolitic",politic?"true":"false");
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
        return;
      }

      toast.success("Configuración actualizada correctamente");

      //Limpiar información para el login
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    } catch {
      toast.error("No se pudo actualizar la configuración");
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <h1 className="text-3xl font-bold mb-6">Configuración de Seguridad</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg flex flex-col gap-4"
      >
        <h2 className="text-xl font-semibold">Política de Clave Maestra</h2>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="true"
              {...register("keyPolitic", { required: "Selecciona una opción" })}
            />
            Uso de clave unica
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="false"
              {...register("keyPolitic", { required: "Selecciona una opción" })}
            />
            Uso de claves multiples
          </label>

          {errors.keyPolitic && (
            <p className="text-red-500 text-xs">
              {errors.keyPolitic.message}
            </p>
          )}
        </div>

        {/* Texto dinámico */}
        <p className="text-sm text-gray-700 mt-2 min-h-10">
          {(selected === "true") &&
              "Al activar esta opción, usted debe asignar un clave unica para cifrar y descifrar imagenes, si ingresa una clave distinta, no podrá acceder a sus imagenes."}

            {(selected === "false") &&
              "Al activar esta opción, usted permite ingresar claves distintas por cada sesión para el cifrado y descifrado de imagenes"}
        </p>
        <button className="sessionsButton mt-4" type="submit">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}