import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

// Define types for our form data
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  keyPolitic: "true" | "false";
};

function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>();

  const password = watch("password");
  const selectedPolitic = watch("keyPolitic");

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError("");

      // API call directly in the component
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/store`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            keyPolitic: data.keyPolitic === "true",
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Registration failed");
      }
      toast.success("Registro exitoso!");
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 sm:p-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-50 mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-neutral-400 text-sm">
            Únete a nosotros de forma segura
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                placeholder="Nombre(s)"
                type="text"
                className={`sessionsFormInput ${
                  errors.firstName ? "border-red-500" : ""
                }`}
                {...register("firstName", {
                  required: "First name is required",
                })}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="w-1/2">
              <input
                placeholder="Apellidos(s)"
                type="text"
                className={`sessionsFormInput ${
                  errors.lastName ? "border-red-500" : ""
                }`}
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <input
              placeholder="Ingrese su correo"
              type="email"
              className={`sessionsFormInput ${
                errors.email ? "border-red-500" : ""
              }`}
              {...register("email", {
                required: "Se requiere un correo electronico",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              placeholder="Ingrese una contraseña"
              type="password"
              className={`sessionsFormInput ${
                errors.password ? "border-red-500" : ""
              }`}
              {...register("password", {
                required: "Se requiere una contraseña",
                minLength: {
                  value: 8,
                  message: "La contraseña debe contener al menos 8 caracteres",
                },
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <input
              placeholder="Confirme su contraseña"
              type="password"
              className={`sessionsFormInput ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
              {...register("confirmPassword", {
                required: "Por favor, confirme su contraseña.",
                validate: (value) =>
                  value === password ||
                  "Las contraseñas ingresadas no son iguales.",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* <div className="flex flex-col mt-2">
          <h3 className="text-sm font-semibold text-neutral-50 mb-3">
            Política de seguridad de claves
          </h3>
          <div className="flex flex-col gap-1 pl-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="true"
                {...register("keyPolitic", {
                  required: "Debe seleccionar una opción",
                })}
              />
              <span>Usar clave unica</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="false"
                {...register("keyPolitic", {
                  required: "Debe seleccionar una opción",
                })}
              />
              <span>Permitir uso de claves multiples</span>
            </label>
          </div>

          <p className="text-xs text-gray-600 mb-2">
            {selectedPolitic === "true" &&
              "Al activar esta opción, usted debe asignar un clave unica para cifrar y descifrar imagenes, si ingresa una clave distinta, no podrá acceder a sus imagenes."}

            {selectedPolitic === "false" &&
              "Al activar esta opción, usted permite ingresar claves distintas por cada sesión para el cifrado y descifrado de imagenes"}
          </p>
          <p className="text-xs text-gray-700 italic">
            Usted puede editar esta configuración en cualquier momento, pero las
            imagenes ya almacenadas ya han sido cifradas con la clave activa en
            ese momento, así que requerirá descifrarlas para no perder su acceso
            a ellas.
          </p>
          {errors.keyPolitic && (
            <p className="text-red-500 text-xs mt-1">
              {errors.keyPolitic.message}
            </p>
          )}
        </div> */}
        <div className="pt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-50 mb-3">
              Política de seguridad de claves
            </h3>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  value="true"
                  {...register("keyPolitic", {
                    required: "Debe seleccionar una opción",
                  })}
                  className="w-4 h-4 accent-violet-500 cursor-pointer"
                />
                <span className="ml-3 text-neutral-300 group-hover:text-neutral-200 transition-colors">
                  Usar clave única
                </span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  value="false"
                  {...register("keyPolitic", {
                    required: "Debe seleccionar una opción",
                  })}
                  className="w-4 h-4 accent-violet-500 cursor-pointer"
                />
                <span className="ml-3 text-neutral-300 group-hover:text-neutral-200 transition-colors">
                  Permitir uso de claves múltiples
                </span>
              </label>
            </div>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed italic">
            {selectedPolitic === "true" &&
              "Al activar esta opción, usted debe asignar una clave única para cifrar y descifrar imágenes; si ingresa una clave distinta, no podrá acceder a sus imágenes."}

            {selectedPolitic === "false" &&
              "Al activar esta opción, usted permite ingresar claves distintas por cada sesión para el cifrado y descifrado de imágenes."}
          </p>

          <p className="text-xs text-neutral-500 leading-relaxed italic">
            Usted puede editar esta configuración en cualquier momento, pero las
            imágenes ya almacenadas han sido cifradas con la clave activa en ese
            momento, así que requerirá descifrarlas para no perder su acceso a
            ellas.
          </p>

          {errors.keyPolitic && (
            <p className="text-red-500 text-xs mt-1">
              {errors.keyPolitic.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-neutral-50 font-semibold rounded-lg transition-colors duration-200 mt-8"
          disabled={loading}
        >
          {loading ? "Procesando..." : "Registrarse"}
        </button>
      </form>
      <div className="text-center mt-6">
        <p className="text-neutral-400 text-sm">
          ¿Ya tiene una cuenta?{" "}
          <Link
            to="/login"
            className="text-violet-500 hover:text-violet-400 transition-colors font-semibold"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
