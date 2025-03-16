import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-full bg-black"></div>
      <form className="p-4 flex flex-col gap-2 w-full md:max-w-sm">
        <h1 className="font-bold text-3xl text-center font-mono mb-2">
          Welcome Back!
        </h1>
        <input
          placeholder="Enter your email"
          type="text"
          name="name"
          className="sessionsInput"
        />
        <input
          placeholder="Enter your password"
          type="password"
          name="name"
          className="sessionsInput"
        />
        <button className="sessionsButton">LogIn</button>
      </form>
      <p>
        Do not have an account?{" "}
        <Link to="/signup" className="text-amber-950">
          Sign Up here
        </Link>
      </p>
    </div>
  );
}

export default Login;
