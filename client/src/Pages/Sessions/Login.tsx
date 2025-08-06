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
        throw new Error(responseData.error || "Login failed");
      }

      if (responseData.token) {
        localStorage.setItem("token", responseData.token);
      }

      // Redirect to gallery page after successful login
      toast.success("Succesfully logged in");
      navigate("/galery");
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
          Login to your account
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
            {error}
          </div>
        )}

        <div>
          <input
            placeholder="Enter your email"
            type="email"
            className={`sessionsInput w-full ${
              errors.email ? "border-red-500" : ""
            }`}
            {...register("email", {
              required: "Email is required",
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
            placeholder="Enter your password"
            type="password"
            className={`sessionsInput w-full ${
              errors.password ? "border-red-500" : ""
            }`}
            {...register("password", {
              required: "Password is required",
            })}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button type="submit" className="sessionsButton" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p>
        Don't have an account?{" "}
        <Link to="/signup" className="text-amber-950">
          Sign up here
        </Link>
      </p>
    </div>
  );
}

export default Login;
