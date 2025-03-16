import { createBrowserRouter } from "react-router-dom";
import NotFound from "./Pages/NotFound";
import Landing from "./Pages/Landing";
import GuestLayout from "./Pages/Sessions/GuestLayout";
import Login from "./Pages/Sessions/Login";
import ForgotPassword from "./Pages/Sessions/ForgotPassword";
import PasswordReset from "./Pages/Sessions/PasswordReset";
import DefaultLayout from "./Pages/App/DefaultLayout";
import Galery from "./Pages/App/Galery";
import Settings from "./Pages/App/Settings";
import SignUp from "./Pages/Sessions/SignUp";
// import Si from "./Components/Si";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        path: "/galery",
        element: <Galery />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      // {
      //   path: "/encrypt",
      //   element: <Si />,
      // },
      //   {
      //     path: "/check-email",
      //     element: <CheckEmail />,
      //   },
      //   {
      //     path: "/verify-email",
      //     element: <VerifyEmail />,
      //   },
    ],
  },

  {
    path: "/",
    element: <GuestLayout />,
    children: [
      {
        path: "/signup",
        element: <SignUp />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/password-reset",
        element: <PasswordReset />,
      },
    ],
  },
  {
    path: "/home",
    element: <Landing />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
