/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, UserSettings } from "../types";
import { Settings, Shield, Bell, Check, KeySquare, HelpCircle, Save, Flame, Cloud, LogIn, LogOut, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFirebase } from "../context/FirebaseContext";

interface SettingsPanelProps {
  currentUser: User;
  onUpdateUser: (id: string, updates: any) => Promise<any>;
}

export default function SettingsPanel({
  currentUser,
  onUpdateUser,
}: SettingsPanelProps) {
  const { 
    firebaseUser, 
    connectionStatus, 
    errorDetail, 
    firebaseDataActive, 
    setFirebaseDataActive, 
    signInWithGoogle, 
    signOutUser,
    testCloudConnection
  } = useFirebase();

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    avatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    email: currentUser.email || ""
  });

  const [settingsForm, setSettingsForm] = useState<UserSettings>({
    email_alerts: true,
    slack_alerts: true,
    weekly_reports: false,
    mfa_enabled: false,
    session_timeout_mins: 30,
    theme: "Light"
  });

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPassword: "",
    confirm: ""
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isPassSaved, setIsPassSaved] = useState(false);

  // Sync state if currentUser swaps
  useEffect(() => {
    setProfileForm({
      name: currentUser.name,
      avatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      email: currentUser.email || ""
    });

    // Fetch user settings
    fetch(`/api/settings/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setSettingsForm(data);
      })
      .catch((err) => console.error("Error loading user settings:", err));
  }, [currentUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;

    try {
      // 1. Save general profile updates to user
      await onUpdateUser(currentUser.id, {
        name: profileForm.name,
        avatar: profileForm.avatar,
        email: profileForm.email
      });

      // 2. Save settings adjustments to DB
      await fetch(`/api/settings/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm)
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2400);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword) return;
    if (passwordForm.newPassword !== passwordForm.confirm) {
      alert("New and confirmation passwords do not match.");
      return;
    }

    setIsPassSaved(true);
    setPasswordForm({ current: "", newPassword: "", confirm: "" });
    setTimeout(() => setIsPassSaved(false), 2400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto max-h-full pb-8 font-sans text-slate-700 select-none">
      
      {/* 1. Profile and UI Configurations */}
      <div className="lg:col-span-2 bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-[#EAECF0] bg-slate-50 flex items-center gap-2">
          <Settings size={14} className="text-slate-600" />
          <h4 className="font-bold text-xs text-slate-800">Aesthetic Profile Settings</h4>
        </div>

        <form onSubmit={handleProfileSubmit} className="p-5 space-y-4 text-xs">
          
          {/* User ID card indicator */}
          <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
            <img
              src={profileForm.avatar}
              alt="Avatar Profile"
              className="w-12 h-12 rounded-full border border-[#D0D5DD] shadow-sm flex-shrink-0 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-[10px] font-bold text-blue-600 font-mono tracking-tight uppercase">Active Identity</span>
              <p className="text-xs font-bold text-slate-800 leading-snug">{currentUser.name}</p>
              <p className="text-[9.5px] text-[#667085] leading-none capitalize font-medium mt-1">Access Role: {currentUser.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Impersonated Display Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Email Address Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Authorized Email Coordinates</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Avatar selector slider link */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Avatar Picture URL Link</label>
            <input
              type="text"
              value={profileForm.avatar}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Trigger Alert configs inside form */}
          <div className="border-t border-slate-100 pt-3.5 space-y-3">
            <div className="flex items-center gap-1.5 mb-1 bg-slate-50 px-2 py-1 rounded w-fit">
              <Bell size={12} className="text-[#3b82f6]" />
              <span className="text-[10px] uppercase font-bold text-[#667085] font-mono leading-none">Notification Routing Channels</span>
            </div>

            <div className="space-y-2 text-[11px] font-semibold text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settingsForm.email_alerts}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, email_alerts: e.target.checked }))}
                  className="rounded border-[#D0D5DD] text-[#3B82F6] focus:ring-[#3B82F6]"
                />
                Configure Email Summaries for Pipeline Failures
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settingsForm.slack_alerts}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, slack_alerts: e.target.checked }))}
                  className="rounded border-[#D0D5DD] text-[#3B82F6] focus:ring-[#3B82F6]"
                />
                Dispatch Microservice Outage logs to Slack Webhook
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settingsForm.weekly_reports}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, weekly_reports: e.target.checked }))}
                  className="rounded border-[#D0D5DD] text-[#3B82F6] focus:ring-[#3B82F6]"
                />
                Automate Weekly PDF Security audit breakdowns
              </label>
            </div>
          </div>

          {/* Save buttons */}
          <div className="pt-4 border-t border-[#EAECF0] flex items-center justify-between">
            {isSaved ? (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 font-mono uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <Check size={11} /> Saved Profiles Successfully!
              </span>
            ) : (
              <span className="text-[9px] text-[#667085] font-sans font-medium">Writes directly into primary DB transaction file</span>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold text-[10.5px] px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Save size={12} /> Save Profiles
            </button>
          </div>

        </form>
      </div>

      {/* 2. Security and System Rules */}
      <div className="space-y-5 flex flex-col">
        {/* Passwords */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden text-xs">
          <div className="px-5 py-3.5 border-b border-[#EAECF0] bg-slate-50 flex items-center gap-2">
            <KeySquare size={13} className="text-slate-600" />
            <h4 className="font-bold text-slate-800">Credential Auth Configs</h4>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-4 space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Current Private Key</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
                className="w-full bg-white border border-[#D0D5DD] rounded-lg p-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Authorize New Key</label>
              <input
                type="password"
                required
                placeholder="Insert alphanumeric code..."
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full bg-white border border-[#D0D5DD] rounded-lg p-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#667085] uppercase block font-sans">Confirm Authorization code</label>
              <input
                type="password"
                required
                placeholder="..."
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {isPassSaved && (
                <span className="text-[9.5px] font-bold text-emerald-600 font-mono">
                  Success!
                </span>
              )}
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all ml-auto cursor-pointer"
              >
                Modify Auth Keys
              </button>
            </div>
          </form>
        </div>

        {/* Firebase Cloud Sync Control */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden text-xs">
          <div className="px-5 py-3.5 border-b border-[#EAECF0] bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={13} className="text-orange-500 animate-pulse" />
              <h4 className="font-bold text-slate-800">Firebase Cloud Core</h4>
            </div>
            <span className="text-[9.5px] text-gray-400 font-mono">v9 Web SDK</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Authenticated Firebase User Info */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Firebase Auth Session</span>
              
              {firebaseUser ? (
                <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || "Firebase")}`}
                      alt="Firebase profile" 
                      className="w-7 h-7 rounded-full border border-sky-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="font-bold text-slate-800 leading-tight">{firebaseUser.displayName || "Google User"}</h5>
                      <p className="text-[9.5px] text-slate-500 font-mono leading-none">{firebaseUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={signOutUser}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-200 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-center space-y-2">
                  <p className="text-[10.5px] text-slate-500 font-medium">No active cloud account linked.</p>
                  <button
                    onClick={signInWithGoogle}
                    className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg font-bold text-[#444] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors text-[10px]"
                  >
                    <LogIn size={11} className="text-blue-500" /> Link Google Account
                  </button>
                </div>
              )}
            </div>

            {/* Connection Health status */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                <span>Firestore Connection</span>
                <button 
                  onClick={testCloudConnection}
                  className="hover:text-blue-600 flex items-center gap-1 font-mono hover:underline cursor-pointer"
                >
                  <RefreshCw size={9} /> ping
                </button>
              </div>

              {connectionStatus === "testing" ? (
                <div className="py-2 px-3 bg-slate-50 border border-slate-200 text-slate-500 flex items-center gap-2 font-medium rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                  Polling active channels...
                </div>
              ) : connectionStatus === "online" ? (
                <div className="py-2 px-3 bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-between rounded-lg font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Cloud Sync Ready</span>
                  </div>
                  <span className="text-[8px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 rounded px-1 font-mono">Live</span>
                </div>
              ) : (
                <div className="py-2 px-3 bg-rose-50 border border-rose-150 text-rose-700 flex flex-col gap-1 rounded-lg">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle size={13} className="text-rose-600" />
                    <span>Connection Rejected</span>
                  </div>
                  {errorDetail && <p className="text-[9px] leading-tight text-rose-500">{errorDetail}</p>}
                </div>
              )}
            </div>

            {/* Cloud Persistence Switch */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 font-sans">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="pr-4">
                  <span className="font-bold text-slate-800 text-[11px] block">Active Firestore Replication</span>
                  <p className="text-[9.5px] text-gray-400 leading-normal font-medium mt-0.5">Stream pipeline actions & defects to cloud</p>
                </div>
                <input
                  type="checkbox"
                  checked={firebaseDataActive}
                  onChange={(e) => setFirebaseDataActive(e.target.checked)}
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Read-Only Configuration Params */}
            <div className="bg-slate-50/50 border border-slate-200/40 p-2.5 rounded-lg space-y-1 text-[9.5px] font-mono text-slate-500">
              <div className="flex justify-between">
                <span className="font-bold">Project ID:</span>
                <span>dauntless-abode-sszp9</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Database:</span>
                <span className="truncate max-w-[140px]" title="ai-studio-cbd57bef-6487-463f-aabe-868449d00603">
                  ai-studio-cbd...
                </span>
              </div>
              <p className="text-[8px] leading-snug text-gray-400 pt-1 font-sans">
                Permissions enforced synchronously in the cloud based on your Attribute-Based Access Control matrix.
              </p>
            </div>
          </div>
        </div>

        {/* Support Help Block */}
        <div className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 text-[11.5px] leading-relaxed text-[#344054] space-y-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle size={15} className="text-[#3B82F6]" />
            <h5 className="font-bold text-[#101828]">Security Token Warning</h5>
          </div>
          <p>
            Your current platform environment runs under high-density private credentials.
            All audit activities and data operations recorded reflect standard SLA criteria.
          </p>
        </div>
      </div>

    </div>
  );
}
