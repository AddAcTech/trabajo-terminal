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
          className="border w-full rounded-full bg-amber-100 p-4"
        />
        <input
          placeholder="Enter your password"
          type="password"
          name="name"
          className="border w-full rounded-full bg-amber-100 p-4"
        />
        <button className="w-full bg-black text-white font-bold p-2 rounded-lg mt-4">
          LogIn
        </button>
      </form>
      <p>
        Do not have an account?{" "}
        <a href="/" className="text-amber-950">
          Sign Up here
        </a>
      </p>
    </div>
  );
}

export default Login;
