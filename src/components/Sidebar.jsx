import React from "react";
import { NavLink, Link } from "react-router-dom";

// import DashboardLogo from "../assets/dashboard.png";
import ProjectLogo from "../assets/project.png";
import WorkspaceLogo from "../assets/document.png";
import LayerLogo from "../assets/layer.png";
import DocumentationLogo from "../assets/open-book.png"
import ApiLogo from "../assets/notes.png"

const docs = import.meta.env.VITE_API_DOCS

const menus = [
  // {
  //   text: "Dashboard",
  //   to: "/dashboard",
  //   image: DashboardLogo,
  // },
  {
    text: "Project",
    to: "/dashboard/project",
    image: ProjectLogo,
    target: "",
  },
  // {
  //   text: "Workspace",
  //   to: "/dashboard/workspace",
  //   image: WorkspaceLogo,
  // },
  {
    text: "Layer",
    to: "/dashboard/layer",
    image: LayerLogo,
    target: "",
  },
  {
    text: "Documentation",
    to: "/documentation",
    image: DocumentationLogo,
    target: "_blank",
  },
  {
    text: "Endpoint List",
    to: docs,
    image: ApiLogo,
    target: "_blank",
  },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-blue-800 text-white flex flex-col shadow-lg">
      <Link to="/dashboard" className="p-6 text-2xl font-bold border-b border-blue-700">
        Dashboard
      </Link>

      <nav className="flex flex-col py-3">
        {menus.map((menu) => (
          <SideMenu key={menu.to} {...menu} />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

function SideMenu({ image, text, to, target }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      target={target}
      className={({ isActive }) =>
        `flex items-center gap-4 px-6 py-4 transition-all duration-200
        ${
          isActive
            ? "bg-blue-900 border-r-4 border-white"
            : "hover:bg-blue-700"
        }`
      }
    >
      <img src={image} alt={text} className="w-7 h-7 object-contain" />

      <span className="text-lg font-semibold">{text}</span>
    </NavLink>
  );
}