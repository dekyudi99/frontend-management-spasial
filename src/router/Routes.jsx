import { createBrowserRouter } from "react-router-dom";
import AuthRoot from "./AuthRoot";
import MainLayout from "../layout/MainLayout";
import Landing from "../pages/Landing";
import Documentation from "../pages/Documentation";
import NotFound from "../pages/NotFound";
import Register from "../pages/auth/Register";
import AuthLayout from "../layout/AuthLayout";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import AuthCallbackPage from "../pages/auth/AuthCallbackPage";
import SsoStartPage from "../pages/auth/SsoStartPage";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import DashboardLayout from "../layout/DashboardLayout";
import Workspace from "../pages/Workspace";
import Layer from "../pages/Layer";
import ApiKey from "../pages/ApiKey";
import Admin from "../pages/Admin";
import authGuard from "./loader/AuthGuard";

const routes = createBrowserRouter([
    {
        element: <AuthRoot />,
        errorElement: <NotFound />,
        children: [
            {
                path: "/",
                element: <Landing />,
            },
            {
                path: "/sso/start",
                element: <SsoStartPage />,
            },
            {
                path: "/auth/callback",
                element: <AuthCallbackPage />,
            },
    {
        element: <MainLayout/>,
        errorElement: <NotFound/>,
        children:[
            {
                path: "/dashboard",
                element: <DashboardLayout/>,
                loader: authGuard,
                children:[
                    {
                      index: true,
                      element: <Dashboard/>,  
                    },
                    {
                      path: "workspace",
                      element: <Workspace/>,  
                    },
                    {
                      path: "layer",
                      element: <Layer/>,
                    },
                    {
                      path: "api-key",
                      element: <ApiKey/>,
                    },
                    {
                      path: "admin",
                      element: <Admin/>,
                    },
                ]
            },
            {
                path: "profile",
                element: <Profile/>,
                loader: authGuard
            }
        ]
    },
    {
        path: "/auth",
        element: <AuthLayout/>,
        errorElement:<NotFound/>,
        children: [
            {
                path: "register",
                element: <Register/>
            },
            {
                path: "login",
                element: <Login/>
            },
            {
                path: "forgot-password",
                element: <ForgotPassword/>
            },
        ]
    },
    {
        path: "/documentation",
        element: <Documentation/>,
        errorElement:<NotFound/>
    },
        ]
    }
])

export default routes;