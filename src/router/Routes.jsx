import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Landing from "../pages/Landing";
import Documentation from "../pages/Documentation";
import NotFound from "../pages/NotFound";
import Register from "../pages/auth/Register";
import AuthLayout from "../layout/AuthLayout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import DashboardLayout from "../layout/DashboardLayout";
import Project from "../pages/Project";
import Workspace from "../pages/Workspace";
import Layer from "../pages/Layer";
import authGuard from "./loader/AuthGuard";
import DetailProject from "../pages/DetailProject";

const routes = createBrowserRouter([
    {
        path: "/",
        element: <Landing/>,
        errorElement: <NotFound/>
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
                      path: "project",
                      element: <Project/>,  
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
                        path: "project/detail/:id",
                        element: <DetailProject/>
                    },
                    {
                        path: "project/detail/:id/workspace/:id_workspace",
                        element: <Workspace/>
                    }
                ]
            },
            {
                path: "profile",
                element: <Profile/>
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
        ]
    },
    {
        path: "/documentation",
        element: <Documentation/>,
        errorElement:<NotFound/>
    },
])

export default routes