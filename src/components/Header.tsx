/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Bell, Search, ShieldCheck, Check, MessageSquare } from "lucide-react";
import { User, Notification } from "../types";

interface HeaderProps {
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  onSearchSelect: (tab: string, item: any) => void;
  defects: any[];
  testSuites: any[];
  testRuns: any[];
}

export default function Header({
  users,
  currentUser,
  setCurrentUser,
  notifications,
  onMarkRead,
  onMarkAllRead,
  globalSearchQuery,
  setGlobalSearchQuery,
  onSearchSelect,
  defects,
  testSuites,
  testRuns,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter global search results across defects, suites, and runs
  const filteredDefects = defects
    .filter((d) =>
      d.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      d.defect_id.toLowerCase().includes(globalSearchQuery.toLowerCase())
    )
    .slice(0, 4);

  const filteredSuites = testSuites
    .filter((s) => s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    .slice(0, 3);

  const filteredRuns = testRuns
    .filter((r) => r.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    .slice(0, 3);

  const hasSearchResults =
    globalSearchQuery.length > 0 &&
    (filteredDefects.length > 0 || filteredSuites.length > 0 || filteredRuns.length > 0);

  return (
    <header className="h-16 bg-white border-b border-[#EAECF0] flex items-center justify-between px-6 z-10 shrink-0 select-none">
      {/* Search Input Controls */}
      <div className="relative w-96 font-sans" ref={searchRef}>
        <input
          type="text"
          placeholder="Global search across Defects, Suites, Runs..."
          value={globalSearchQuery}
          onChange={(e) => {
            setGlobalSearchQuery(e.target.value);
            setShowSearchDropdown(true);
          }}
          onFocus={() => setShowSearchDropdown(true)}
          className="w-full pl-9 pr-4 py-1.5 border border-[#D0D5DD] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#3B82F6] bg-[#F9FAFB] text-gray-900 transition-all font-sans"
        />
        <div className="absolute left-3 top-2 text-[#667085]">
          <Search size={14} />
        </div>

        {/* Global Search Expandable Result panel */}
        {showSearchDropdown && globalSearchQuery.length > 0 && (
          <div className="absolute left-0 mt-1 w-[480px] bg-white border border-[#EAECF0] rounded-lg shadow-lg max-h-[400px] overflow-y-auto p-2 z-50 text-xs text-slate-800">
            {hasSearchResults ? (
              <div className="space-y-3">
                {/* Defects results */}
                {filteredDefects.length > 0 && (
                  <div>
                    <h4 className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider border-b border-gray-100">
                      Defects
                    </h4>
                    <div className="mt-1 space-y-0.5">
                      {filteredDefects.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => {
                            onSearchSelect("defects", d);
                            setShowSearchDropdown(false);
                            setGlobalSearchQuery("");
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#F9FAFB] rounded flex items-center justify-between transition-colors"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono font-bold text-blue-600 mr-2">{d.defect_id}</span>
                            <span className="font-medium text-gray-700">{d.title}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-amber-50 text-amber-700 font-mono scale-90 border border-amber-200 shrink-0">
                            {d.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Suites results */}
                {filteredSuites.length > 0 && (
                  <div>
                    <h4 className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider border-b border-gray-100">
                      Test Suites
                    </h4>
                    <div className="mt-1 space-y-0.5">
                      {filteredSuites.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSearchSelect("suites", s);
                            setShowSearchDropdown(false);
                            setGlobalSearchQuery("");
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#F9FAFB] rounded flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-gray-700 truncate pr-2">{s.name}</span>
                          <span className="text-[10px] text-gray-500 shrink-0">Suite</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Runs Results */}
                {filteredRuns.length > 0 && (
                  <div>
                    <h4 className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider border-b border-gray-100">
                      Test Runs
                    </h4>
                    <div className="mt-1 space-y-0.5">
                      {filteredRuns.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            onSearchSelect("suites", r); // Navigates to suite tab for executions
                            setShowSearchDropdown(false);
                            setGlobalSearchQuery("");
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#F9FAFB] rounded flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-gray-700 truncate pr-2">{r.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold font-mono shrink-0 ${
                            r.status === "Passed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {r.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-gray-400">
                No matching indexes found matching "{globalSearchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action panel & Impersonator Picker */}
      <div className="flex items-center gap-4">
        {/* Realtime database status badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#ECFDF3] border border-[#ABEFC6] rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse"></span>
          <span className="text-[10px] font-semibold text-[#027A48] tracking-tight">Realtime Feed: Connected</span>
        </div>

        {/* Role Custom Impersonator dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <span className="text-[10px] text-slate-500 font-mono font-semibold px-2 uppercase tracking-wide">
            Test Access Model:
          </span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const matched = users.find((usr) => usr.id === e.target.value);
              if (matched) setCurrentUser(matched);
            }}
            className="text-[11px] font-bold text-slate-700 border-none bg-transparent hover:text-blue-600 focus:outline-none focus:ring-none cursor-pointer pr-1"
          >
            {users.map((usr) => (
              <option key={usr.id} value={usr.id}>
                {usr.name} ({usr.role})
              </option>
            ))}
          </select>
        </div>

        {/* Notification bell triggers */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 text-[#667085] hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#F04438] text-[9px] text-white font-bold rounded-full border border-white flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications List POPUP Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-[#EAECF0] rounded-xl shadow-xl z-50 text-xs text-slate-800 font-sans overflow-hidden">
              <div className="p-3 border-b border-[#EAECF0] flex items-center justify-between bg-slate-50">
                <span className="font-bold text-slate-800">Alert Center</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onMarkAllRead();
                    }}
                    className="text-[10px] text-[#3B82F6] hover:text-blue-800 font-semibold"
                  >
                    Mark All Read
                  </button>
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 relative hover:bg-slate-50 transition-colors ${
                        !notif.read ? "bg-blue-50/40 font-medium" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1 pb-1">
                        <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                          notif.type.includes("Alert") 
                            ? "bg-rose-50 text-rose-700 border border-rose-100" 
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {notif.type}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-800 font-bold leading-tight mt-1">{notif.title}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">{notif.message}</p>
                      {!notif.read && (
                        <button
                          onClick={() => onMarkRead(notif.id)}
                          className="mt-2 text-[10px] text-[#3B82F6] hover:underline font-semibold flex items-center gap-1"
                        >
                          <Check size={11} /> Mark as Read
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    No notifications to show. All caught up!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
