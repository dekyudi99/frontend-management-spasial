import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;