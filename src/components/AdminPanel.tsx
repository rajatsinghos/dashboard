/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User } from "../types";
import { ShieldCheck, Users, Activity, HardDrive, Database, Server, RefreshCw } from "lucide-react";

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateUser: (id: string, updates: any) => Promise<any>;
}

export default function AdminPanel({
  users,
  currentUser,
  onUpdateUser,
}: AdminPanelProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState("");
  
  // Simulated hardware metrics
  const [hardwareMetrics, setHardwareMetrics] = useState({
    cpu: 18,
    memory: 42,
    disk: 29,
    traffic: "2.4k req/m"
  });

  const handleUpdateRole = async (userId: string) => {
    try {
      await onUpdateUser(userId, { role: editingRole });
      setEditingUserId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshHardware = () => {
    // Introduce micro variance in container monitoring checks
    setHardwareMetrics({
      cpu: Math.floor(Math.random() * 25) + 12,
      memory: Math.floor(Math.random() * 10) + 38,
      disk: 29,
      traffic: `${(Math.random() * 1.5 + 1.8).toFixed(1)}k req/m`
    });
  };

  const isAdmin = currentUser.role === "Admin";

  return (
    <div className="space-y-5 overflow-y-auto max-h-full pb-8 font-sans text-slate-700 select-none">
      
      {/* 1. Admin restricted layout alert */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-700">
          <span className="font-bold flex items-center gap-1">
            ⚠️ Restricted view model (View Only Mode)
          </span>
          <p className="mt-1 leading-relaxed">
            Your current simulated role is <strong>{currentUser.role}</strong>. You can browse team parameters and container SLA stats, but editing roles requires a <strong>Admin</strong> access keys. Tap the upper right impersonator selector to swap.
          </p>
        </div>
      )}

      {/* 2. System Hardware cluster health */}
      <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h4 className="font-bold text-xs text-slate-800">Cluster Container Telemetry Metrics</h4>
            <p className="text-[10px] text-gray-400">Isolated Virtual Machine Host Core diagnostics</p>
          </div>
          <button
            onClick={handleRefreshHardware}
            className="p-1 px-2 border border-slate-200 hover:bg-slate-50 rounded text-[9.5px] font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={10} /> ping nodes
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-[10.5px]">
          {/* CPU Core load */}
          <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-tight">CPU Core Load</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-extrabold text-[#101828] font-mono">{hardwareMetrics.cpu}%</span>
              <span className="text-emerald-600 font-bold text-[8px] uppercase tracking-wider">Nominal</span>
            </div>
            {/* simple visual percentage loader graph */}
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${hardwareMetrics.cpu}%` }}></div>
            </div>
          </div>

          {/* Micro Memory cache allocation */}
          <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-tight">Memory Cache allocation</span>
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-xl font-extrabold text-[#101828]">{hardwareMetrics.memory}%</span>
              <span className="text-slate-500 font-bold text-[8.5px]">1.8 GB / 4.0 GB</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${hardwareMetrics.memory}%` }}></div>
            </div>
          </div>

          {/* Disk space metrics */}
          <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-tight">EBS Block Store Volume</span>
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-xl font-extrabold text-[#101828]">{hardwareMetrics.disk}%</span>
              <span className="text-slate-500 text-[8px] uppercase font-bold text-emerald-600">Secure</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${hardwareMetrics.disk}%` }}></div>
            </div>
          </div>

          {/* Ingress traffic metrics */}
          <div className="space-y-1.5 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-tight">Container Ingress Traffic</span>
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-xl font-extrabold text-[#101828]">{hardwareMetrics.traffic}</span>
              <span className="text-slate-500 font-bold text-[8px] uppercase tracking-wider text-emerald-600">nominal Load</span>
            </div>
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: "35%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Team membership & credentials management */}
      <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <div>
            <h4 className="font-bold text-slate-800">Team Authorization Matrix</h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Edit member access levels and system permissions</p>
          </div>
          <span className="text-[9.5px] font-bold py-0.5 px-2 bg-slate-100 rounded-full border border-slate-200 font-mono text-slate-700">
            {users.length} authorized users
          </span>
        </div>

        <table className="w-full text-left border-collapse text-xs text-slate-800">
          <thead className="bg-[#F9FAFB] text-[9.5px] font-bold text-[#667085] uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-5 py-2.5">User Member</th>
              <th className="px-5 py-2.5">Designation (Role)</th>
              <th className="px-5 py-2.5">Email</th>
              <th className="px-5 py-2.5">Access Scope Permissions</th>
              <th className="px-5 py-2.5 text-right">Edit Options</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0]">
            {users.map((usr) => {
              const permissions = {
                Admin: "Complete read, create, update, delete, configuration authorizations across all namespaces & metrics",
                "QA Lead": "Audit and review metrics graphs, create database suites, trigger execution loads, assign defects",
                "QA Engineer": "Generate defects logging checklist, perform execution loads, provide comment replies",
                Viewer: "View logs indexes, review analytics charts, receive critical notification alerts"
              }[usr.role] || "Pruned privileges";

              return (
                <tr key={usr.id} className="hover:bg-[#F9FAFB] transition-colors">
                  {/* user column info */}
                  <td className="px-5 py-3.5 flex items-center gap-2.5">
                    <img
                      src={usr.avatar}
                      alt={usr.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(usr.name)}`;
                      }}
                      className="w-7 h-7 rounded-full border border-gray-100 flex-shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900">{usr.name}</h5>
                      <span className="text-[8.5px] text-gray-400 font-mono">{usr.id}</span>
                    </div>
                  </td>

                  {/* Role column info */}
                  <td className="px-5 py-3.5">
                    {editingUserId === usr.id ? (
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        className="bg-white border rounded px-1.5 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="Admin">Admin</option>
                        <option value="QA Lead">QA Lead</option>
                        <option value="QA Specialist">QA Specialist</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="px-1.5 py-0.5 font-bold uppercase font-mono text-[9px] bg-sky-50 border border-sky-100 text-sky-700 rounded-sm">
                        {usr.role}
                      </span>
                    )}
                  </td>

                  {/* Email column */}
                  <td className="px-5 py-3.5 font-mono text-[10px] text-[#667085]">
                    {usr.email || `${usr.name.toLowerCase().replace(/[^a-z]/g, "")}@pulseqa.com`}
                  </td>

                  {/* Permissions breakdown description column */}
                  <td className="px-5 py-3.5 max-w-[280px] text-slate-500 leading-snug text-[10px]">
                    {permissions}
                  </td>

                  {/* Edit access actions */}
                  <td className="px-5 py-3.5 text-right font-semibold">
                    {editingUserId === usr.id ? (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-600 font-semibold cursor-pointer"
                        >
                          cancel
                        </button>
                        <button
                          onClick={() => handleUpdateRole(usr.id)}
                          className="px-2.5 py-1 bg-[#12B76A] text-white rounded text-[10px] hover:bg-emerald-600 font-bold cursor-pointer"
                        >
                          save
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={!isAdmin || usr.id === currentUser.id}
                        onClick={() => {
                          setEditingUserId(usr.id);
                          setEditingRole(usr.role);
                        }}
                        className={`text-[10px] font-bold ${
                          isAdmin && usr.id !== currentUser.id
                            ? "text-[#3B82F6] hover:underline hover:text-blue-700 cursor-pointer"
                            : "text-gray-300 pointer-events-none"
                        }`}
                      >
                        Alter Role
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
