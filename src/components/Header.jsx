import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import Logo from "../assets/logo.png";

import {
    UserIcon,
    ArrowRightOnRectangleIcon,
    ExclamationTriangleIcon,
    Bars3Icon,
} from "@heroicons/react/24/outline";

import { Dropdown, Modal } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "../context/SidebarContext";
import { useLanguage } from "../context/LanguageContext";
import { availableLanguages } from "../i18n/translations";

const appName = import.meta.env.VITE_APP_NAME;
const docsUrl = import.meta.env.VITE_API_DOCS;

const Header = ({ variant = "app" }) => {
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const isDashboard = location.pathname.startsWith("/dashboard");
    const { isDesktopOpen, toggleDesktopSidebar, toggleMobileSidebar } = useSidebar();

    const isAuthenticated = Boolean(localStorage.getItem("JWT_TOKEN"));

    const handleLogout = () => {
        Modal.confirm({
            title: t('logout', 'Logout'),
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
            content: t('logoutConfirm', "Are you sure you want to log out?"),
            okText: t('logout', "Logout"),
            cancelText: t('cancel', "Cancel"),
            okType: "danger",
            onOk() {
                localStorage.removeItem("JWT_TOKEN");
                localStorage.removeItem("astragis_s2s_key");
                queryClient.clear();
                navigate("/auth/login");
            },
        });
    };

    const menuItems = [
        {
            key: "profile",
            icon: <UserIcon className="w-4 h-4" />,
            label: t('profile', "Profile"),
            onClick: () => navigate("/profile"),
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            danger: true,
            icon: <ArrowRightOnRectangleIcon className="w-4 h-4" />,
            label: t('logout', "Logout"),
            onClick: handleLogout,
        },
    ];

    const languageSwitcher = (
        <Dropdown
            menu={{
                items: availableLanguages.map((lang) => ({
                    key: lang.code,
                    label: `${lang.flag} ${lang.nativeName}`,
                    onClick: () => setLanguage(lang.code),
                })),
                selectedKeys: [language],
            }}
            trigger={["click"]}
            placement="bottomRight"
        >
            <button
                type="button"
                className="
                    flex
                    items-center
                    justify-center
                    gap-1.5
                    h-10
                    px-2.5
                    sm:px-3
                    rounded-lg
                    border
                    border-white/20
                    bg-blue-900
                    text-white
                    hover:bg-blue-800
                    transition
                    text-xs
                    sm:text-sm
                    font-semibold
                    cursor-pointer
                    shrink-0
                "
                title={t('changeLanguage', 'Change Language')}
                aria-label={t('changeLanguage', 'Change Language')}
            >
                <span className="text-sm sm:text-base leading-none">{availableLanguages.find((l) => l.code === language)?.flag || '🌐'}</span>
                <span className="uppercase tracking-wider font-bold leading-none">{language}</span>
            </button>
        </Dropdown>
    );

    if (variant === "landing") {
        return (
            <header className="sticky top-0 z-50 backdrop-blur-md bg-blue-950/90 border-b border-blue-900/60 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src={Logo} alt={`${appName} Logo`} className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                                {appName} <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700/60">{t("landingServer", "Server")}</span>
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-blue-400 transition-colors">{t("navFeatures", "Features")}</a>
                        <a href="#integration" className="hover:text-blue-400 transition-colors">{t("navIntegration", "Integration")}</a>
                        <Link to="/documentation" className="hover:text-blue-400 transition-colors">{t("navDocumentation", "Documentation")}</Link>
                        <a href={docsUrl} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                            {t("apiReference", "API Reference")} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {languageSwitcher}
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                            >
                                {t("goToDashboard", "Go to Dashboard")} <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link
                                to="/auth/login"
                                className="px-4 py-2 text-sm font-medium bg-blue-900/60 hover:bg-blue-900 text-white rounded-lg border border-blue-700/60 transition-all hover:border-blue-500"
                            >
                                {t("signIn", "Sign In")}
                            </Link>
                        )}
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-blue-950 shadow-md z-30 relative">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">

                {/* Left Section: Sidebar Toggle + Logo */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {isDashboard && (
                        <button
                            onClick={() => {
                                if (window.innerWidth < 768) {
                                    toggleMobileSidebar();
                                } else {
                                    toggleDesktopSidebar();
                                }
                            }}
                            className="p-1.5 -ml-1 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg transition active:scale-95 cursor-pointer focus:outline-none"
                            title={isDesktopOpen ? t('closeSidebar', "Tutup Sidebar") : t('openSidebar', "Buka Sidebar")}
                            aria-label={t('toggleSidebar', "Toggle Sidebar")}
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                    )}

                    <Link
                        to="/"
                        className="flex items-center gap-2.5 sm:gap-3 group"
                    >
                        <img
                            src={Logo}
                            alt="Logo"
                            className="h-8 sm:h-9 transition-transform group-hover:scale-105 rounded-lg"
                        />

                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                            {appName}
                        </h1>
                    </Link>
                </div>

                {/* Right Menu */}
                <div className="flex items-center gap-2 sm:gap-3">

                    {languageSwitcher}

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
                            {t('signIn', 'Sign In')}
                        </Link>
                    )}

                </div>

            </div>
        </header>
    );
};

export default Header;