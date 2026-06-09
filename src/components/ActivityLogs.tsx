/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Search, Terminal, Calendar, User as UserIcon } from "lucide-react";
import { Activity } from "../types";

interface ActivityLogsProps {
  activityLogs: Activity[];
}

export default function ActivityLogs({ activityLogs }: ActivityLogsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" ? true : log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#EAECF0] overflow-hidden font-sans text-slate-700 select-none">
      
      {/* Search and Filters */}
      <div className="px-5 py-3 border-b border-[#EAECF0] bg-slate-50/50 flex flex-wrap sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-slate-800">Historical Audit Trails</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Live index of all write actions and state evaluations</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Query search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Query log criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 w-52 bg-white"
            />
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={11} />
          </div>

          {/* Action types filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Category: All Types</option>
            <option value="Defect">Defects</option>
            <option value="Test">Testing</option>
            <option value="Auth">Security/Auth</option>
            <option value="Settings">Settings</option>
            <option value="Project">Projects</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const dateStr = new Date(log.created_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            const categoryColors = {
              Defect: "bg-rose-50 text-rose-700 border-rose-150",
              Test: "bg-blue-50 text-blue-700 border-blue-150",
              Auth: "bg-purple-50 text-purple-700 border-purple-150",
              Settings: "bg-amber-50 text-amber-700 border-amber-150",
              Project: "bg-emerald-50 text-emerald-700 border-emerald-150"
            }[log.category] || "bg-slate-50 text-slate-700 border-slate-200";

            return (
              <div
                key={log.id}
                className="p-3 bg-slate-50/25 border border-slate-200/50 hover:bg-slate-50 rounded-lg text-xs leading-none transition-all"
              >
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[8.5px] uppercase font-bold font-mono px-1.5 py-0.2 rounded border ${categoryColors}`}>
                        {log.category}
                      </span>
                      <span className="text-slate-800 font-bold font-sans">
                        {log.action}
                      </span>
                    </div>

                    {log.description && (
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 whitespace-pre-line max-w-2xl">
                        {log.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex sm:flex-col items-end gap-1 font-mono text-[9px] text-[#667085]">
                    <div className="flex items-center gap-1">
                      <UserIcon size={10} className="text-gray-400" />
                      <span className="font-bold text-slate-705">{log.user_name}</span>
                    </div>
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center text-gray-400 font-medium font-sans italic">
            No matching trail activity matched category filters.
          </div>
        )}
      </div>

    </div>
  );
}
