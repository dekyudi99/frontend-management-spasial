import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";

import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Dropdown, Modal } from "antd";

const Header = () => {
    const navigate = useNavigate();

    const isAuthenticated = Boolean(localStorage.getItem("JWT_TOKEN"));

    const handleLogout = () => {
        Modal.confirm({
            title: "Logout",
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
            content: "Are you sure you want to log out?",
            okText: "Logout",
            cancelText: "Cancel",
            okType: "danger",
            onOk() {
                localStorage.removeItem("JWT_TOKEN");
                navigate("/auth/login");
            },
        });
    };

    const menuItems = [
        {
            key: "profile",
            icon: <UserIcon className="w-4 h-4" />,
            label: "Profile",
            onClick: () => navigate("/profile"),
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            danger: true,
            icon: <ArrowRightOnRectangleIcon className="w-4 h-4" />,
            label: "Logout",
            onClick: handleLogout,
        },
    ];

    return (
        <header className="bg-blue-950 shadow-md">
            <div className="flex items-center justify-between px-6 py-4">

                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-3"
                >
                    <img
                        src={Logo}
                        alt="Logo"
                        className="h-9"
                    />

                    <h1 className="text-2xl font-bold text-white">
                        AstraGIS
                    </h1>
                </Link>

                {/* Right Menu */}
                <div className="flex items-center">

                    {isAuthenticated ? (
                        <Dropdown
                            menu={{ items: menuItems }}
                            trigger={["click"]}
                            placement="bottomRight"
                        >
                            <button
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    w-10
                                    h-10
                                    rounded-lg
                                    border
                                    border-white/20
                                    bg-blue-900
                                    text-white
                                    hover:bg-blue-800
                                    transition
                                "
                            >
                                <UserIcon className="w-5 h-5" />
                            </button>
                        </Dropdown>
                    ) : (
                        <Link
                            to="/auth/login"
                            className="
                                text-white
                                hover:text-blue-300
                                transition
                                font-medium
                            "
                        >
                            Sign In
                        </Link>
                    )}

                </div>

            </div>
        </header>
    );
};

export default Header;