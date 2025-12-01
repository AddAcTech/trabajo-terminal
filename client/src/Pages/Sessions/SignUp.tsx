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
  keyPolitic : "true" | "false";
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
      <div className="w-24 h-24 rounded-full bg-black"></div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 flex flex-col gap-2 w-full md:max-w-sm"
      >
        <h1 className="font-bold text-3xl text-center font-mono mb-2">
          Create your account
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <div className="w-1/2">
            <input
              placeholder="Nombre(s)"
              type="text"
              className={`sessionsInput w-full ${
                errors.firstName ? "border-red-500" : ""
              }`}
              {...register("firstName", { required: "First name is required" })}
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
              className={`sessionsInput w-full ${
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
            className={`sessionsInput w-full ${
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
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <input
            placeholder="Ingrese una contraseña"
            type="password"
            className={`sessionsInput w-full ${
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
            className={`sessionsInput w-full ${
              errors.confirmPassword ? "border-red-500" : ""
            }`}
            {...register("confirmPassword", {
              required: "Por favor, confirme su contraseña.",
              validate: (value) =>
                value === password || "Las contraseñas ingresadas no son iguales.",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex flex-col mt-2">
          <p className="text-sm mb-1 font-semibold">
            Política de seguridad de claves
          </p>

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
             {(selectedPolitic === "true") &&
              "Al activar esta opción, usted debe asignar un clave unica para cifrar y descifrar imagenes, si ingresa una clave distinta, no podrá acceder a sus imagenes."}

            {(selectedPolitic === "false") &&
              "Al activar esta opción, usted permite ingresar claves distintas por cada sesión para el cifrado y descifrado de imagenes"}
          </p>
          <p className="text-xs text-gray-700 italic">
            Usted puede editar esta configuración en cualquier momento, pero las imagenes ya almacenadas ya han sido cifradas con la clave activa en ese momento, así que requerirá descifrarlas para no perder su acceso a ellas.
          </p>
          {errors.keyPolitic && (
            <p className="text-red-500 text-xs mt-1">
              {errors.keyPolitic.message}
            </p>
          )}
        </div>

        
        <button type="submit" className="sessionsButton" disabled={loading}>
          {loading ? "Procesando..." : "Registrarse"}
        </button>
      </form>
      <p>
        ¿Ya tiene una cuenta?{" "}
        <Link to="/login" className="text-amber-950">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default SignUp;
