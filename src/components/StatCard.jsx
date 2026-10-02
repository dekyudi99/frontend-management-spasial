import React from "react";
import { Card } from "antd";

/**
 * Reusable StatCard Component (DRY Principle)
 * Used for metrics, counters, and status indicators with consistent styling.
 */
const StatCard = ({
  icon: Icon,
  title,
  value,
  subvalue = null,
  valueColor = "text-slate-800",
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  badge = null,
  className = ""
}) => {
  return (
    <Card className={`rounded-2xl border-slate-200 shadow-xs hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${valueColor}`}>
              {value}
            </span>
            {subvalue && (
              <span className="text-xs text-slate-400 font-medium">
                {subvalue}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {Icon && (
            <div className={`w-11 h-11 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          {badge}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
