import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

type LoginFormData = {
  email: string;
  password: string;
};

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            "Usuario y/o contraseña ingresados son incorrectos"
        );
      }
      //guardar en el local Storage información fundamental
      if (responseData.token) {
        localStorage.setItem("token", responseData.token);
      }

      if (responseData.user.id) {
        sessionStorage.setItem("id", responseData.user.id);
      }

      if (responseData.user.useUniqueKey) {
        sessionStorage.setItem("politic", responseData.user.useUniqueKey);
      }
      // Redirect to gallery page after successful login
      toast.success("Inicio de sesión exitoso");
      navigate("/galery");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ha ocurrido un error interno"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-900/5 rounded-full blur-3xl"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 sm:p-10 shadow-2xl">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-violet-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-center text-neutral-50 mb-2">
              Ingrese a su cuenta
            </h1>
            <p className="text-center text-neutral-400 text-sm">
              Acceso a tu almacenamiento de imágenes
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Correo electrónico
              </label>
              <input
                placeholder="email@example.com"
                type="email"
                className="sessionsFormInput"
                {...register("email", {
                  required: "Se requiere ingresar un correo electrónico",
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Contraseña
              </label>
              <div>
                <input
                  placeholder="Contraseña"
                  type="password"
                  className="sessionsFormInput"
                  {...register("password", {
                    required: "Se requiere una contraseña",
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            {error && (
              <div className="bg-red-100 text-violet-600 p-2 rounded mb-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-neutral-50 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-violet-500/20"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center text-neutral-400 text-sm mt-8">
            ¿No posee una cuenta?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Regístrese aquí
            </Link>
          </p>
        </div>

        <p className="text-center text-neutral-500 text-xs mt-6 px-4">
          Cifrado perceptible para tus imágenes.
        </p>
      </div>
    </div>
  );
}

export default Login;
