/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Bug, PlayCircle, LineChart, Terminal, ShieldCheck, Settings } from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  defectCount: number;
}

export default function Sidebar({ currentTab, setCurrentTab, currentUser, defectCount }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "defects", label: "Defects", icon: Bug, badge: defectCount > 0 ? defectCount : undefined },
    { id: "suites", label: "Test Suites", icon: PlayCircle },
    { id: "performance", label: "Performance", icon: LineChart },
    { id: "logs", label: "System Logs", icon: Terminal },
    { id: "admin", label: "Admin Panel", icon: ShieldCheck },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#14161A] text-white flex flex-col border-r border-[#2D3139] shrink-0 font-sans select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-[#2D3139]">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-lg italic tracking-wider text-white shadow-sm shadow-blue-500/20">
          QP
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">QA Pulse</h1>
          <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">SaaS Enterprise Suite</p>
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#3B82F6] text-white shadow-sm font-semibold"
                  : "text-[#98A2B3] hover:text-white hover:bg-[#20242B]"
              }`}
            >
              <IconComponent size={14} className={isActive ? "text-white" : "text-[#98A2B3] group-hover:text-white"} />
              <span className="truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto bg-[#F04438] text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-sm leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Card Footer */}
      <div className="p-4 border-t border-[#2D3139] bg-[#0E1012] mt-auto">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            onError={(e) => {
              // fallback placeholder if image cannot load
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`;
            }}
            className="w-8 h-8 rounded-full border border-[#2D3139] flex-shrink-0 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate leading-snug">{currentUser.name}</p>
            <p className="text-[10px] text-[#98A2B3] font-mono leading-none truncate capitalize mt-0.5">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
