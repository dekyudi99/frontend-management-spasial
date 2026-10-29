import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import useAuth from "../hooks/useAuth";

const DashboardLayout = () => {
  const {
    isDesktopOpen,
    isMobileOpen,
    closeMobileSidebar,
    closeDesktopSidebar,
  } = useSidebar();

  const { accessDenied } = useAuth();
  const location = useLocation();

  if (accessDenied) {
    const portalUrl = import.meta.env.VITE_PORTAL_URL || "http://localhost:5170";
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center space-y-5 border border-slate-200">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-2xl">
            !
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">Anda belum memiliki akses ke aplikasi ini</h3>
            <p className="text-sm text-slate-600">
              Akun SSO Anda belum memiliki role akses (user atau admin) untuk VoxaGIS. Hubungi administrator platform untuk meminta akses.
            </p>
          </div>
          <div className="pt-2">
            <a
              href={portalUrl}
              className="w-full inline-block py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-center"
            >
              Kembali ke Portal SSO
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Dapatkan nama halaman aktif untuk judul
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/project")) return "Projects";
    if (path.includes("/workspace")) return "Workspace";
    if (path.includes("/layer")) return "Layer & Map";
    return "Dashboard";
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-100 overflow-hidden relative">
      {/* Sidebar Responsive Drawer (Mobile) & Desktop Sidebar */}
      <Sidebar
        isOpen={isMobileOpen}
        onClose={closeMobileSidebar}
        isDesktopOpen={isDesktopOpen}
        onCloseDesktop={closeDesktopSidebar}
      />

      {/* Main Content Area: Menggunakan 100% lebar layar secara bersih */}
      <main className="flex-1 overflow-y-auto w-full transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;