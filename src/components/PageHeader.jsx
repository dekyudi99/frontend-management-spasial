import React from "react";

/**
 * Reusable PageHeader Component (DRY Principle)
 * Standardizes the top page banner across Dashboard, Workspace, Layer, Admin, API Key, etc.
 */
const PageHeader = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  extra = null,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-600",
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${className}`}>
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {Icon && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center shrink-0 border border-slate-100`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate sm:whitespace-normal">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-none">{subtitle}</p>}
        </div>
      </div>
      {extra && <div className="flex items-center gap-2 sm:gap-3 shrink-0">{extra}</div>}
    </div>
  );
};

export default PageHeader;
