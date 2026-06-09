/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, MessageSquare, Paperclip, ChevronRight, X, User as UserIcon, Calendar, CheckSquare } from "lucide-react";
import { Defect, User, Project, Environment, DefectComment, FileAttachment } from "../types";

interface DefectManagerProps {
  defects: Defect[];
  users: User[];
  projects: Project[];
  environments: Environment[];
  currentUser: User;
  onAddDefect: (defectData: any) => Promise<void>;
  onUpdateDefect: (id: string, updates: any) => Promise<void>;
  onDeleteDefect: (id: string) => Promise<void>;
  selectedDefectFromDashboard?: Defect | null;
  clearDashboardSelection?: () => void;
}

export default function DefectManager({
  defects,
  users,
  projects,
  environments,
  currentUser,
  onAddDefect,
  onUpdateDefect,
  onDeleteDefect,
  selectedDefectFromDashboard,
  clearDashboardSelection,
}: DefectManagerProps) {
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [comments, setComments] = useState<DefectComment[]>([]);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Attachments simulation
  const [simulatedFileName, setSimulatedFileName] = useState("");
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDefectForm, setNewDefectForm] = useState({
    title: "",
    description: "",
    severity: "High",
    priority: "High",
    status: "Open",
    project_id: "",
    environment_id: "",
    assignee_id: "",
  });

  // Handle selected defect triggers from dashboard clicks
  useEffect(() => {
    if (selectedDefectFromDashboard) {
      setSelectedDefect(selectedDefectFromDashboard);
      if (clearDashboardSelection) clearDashboardSelection();
    }
  }, [selectedDefectFromDashboard]);

  // Load comments & attachments whenever active selected defect changes
  useEffect(() => {
    if (selectedDefect) {
      fetch(`/api/defects/${selectedDefect.id}/comments`)
        .then((res) => res.json())
        .then((data) => setComments(data))
        .catch((err) => console.error("Error loading comments:", err));

      fetch(`/api/defects/${selectedDefect.id}/attachments`)
        .then((res) => res.json())
        .then((data) => setAttachments(data))
        .catch((err) => console.error("Error loading attachments:", err));
    } else {
      setComments([]);
      setAttachments([]);
    }
  }, [selectedDefect]);

  // Sync state if defects list refreshes
  useEffect(() => {
    if (selectedDefect) {
      const refreshed = defects.find((d) => d.id === selectedDefect.id);
      if (refreshed) {
        setSelectedDefect(refreshed);
      } else {
        setSelectedDefect(null);
      }
    }
  }, [defects]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedDefect) return;

    try {
      const res = await fetch(`/api/defects/${selectedDefect.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_id: currentUser.id,
          comment: newCommentText,
        }),
      });
      const data = await res.json();
      setComments((prev) => [...prev, data]);
      setNewCommentText("");

      // Trigger defect refresh to load logs/activities (happens main state reload)
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedFileName.trim() || !selectedDefect) return;

    try {
      const res = await fetch(`/api/defects/${selectedDefect.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: simulatedFileName,
          url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60",
          size: Math.floor(Math.random() * 80000) + 12000,
          mime_type: "text/plain",
          uploaded_by_id: currentUser.id,
        }),
      });
      const data = await res.json();
      setAttachments((prev) => [...prev, data]);
      setSimulatedFileName("");
    } catch (err) {
      console.error("Error committing attachment:", err);
    }
  };

  const handleCreateDefectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDefectForm.title.trim() || !newDefectForm.project_id || !newDefectForm.environment_id) {
      alert("Please provide defect title, parent project, and environment.");
      return;
    }

    await onAddDefect({
      ...newDefectForm,
      reporter_id: currentUser.id,
    });

    setNewDefectForm({
      title: "",
      description: "",
      severity: "High",
      priority: "High",
      status: "Open",
      project_id: projects[0]?.id || "",
      environment_id: environments[0]?.id || "",
      assignee_id: users[0]?.id || "",
    });
    setShowCreateModal(false);
  };

  // Perform client-side filtering matching queries
  const filteredList = defects.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.defect_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" ? true : d.status === statusFilter;
    const matchesSeverity = severityFilter === "all" ? true : d.severity === severityFilter;
    const matchesProject = projectFilter === "all" ? true : d.project_id === projectFilter;

    return matchesSearch && matchesStatus && matchesSeverity && matchesProject;
  });

  // Action authorizations
  const canModifyDefect = currentUser.role !== "Viewer";

  return (
    <div className="flex h-full gap-5 overflow-hidden font-sans select-none relative">
      
      {/* 1. Left Section: Filters & Defect List */}
      <div className={`flex-1 flex flex-col h-full bg-white rounded-xl border border-[#EAECF0] overflow-hidden ${
        selectedDefect ? "max-w-[62%]" : "w-full"
      } transition-all duration-300`}>
        
        {/* Toolbar Header */}
        <div className="px-5 py-3 border-b border-[#EAECF0] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800">Defects Board</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full font-mono">
              {filteredList.length} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canModifyDefect && (
              <button
                onClick={() => {
                  setNewDefectForm((prev) => ({
                    ...prev,
                    project_id: projects[0]?.id || "",
                    environment_id: environments[0]?.id || "",
                    assignee_id: users[0]?.id || "",
                  }));
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
              >
                <Plus size={12} /> Log New Defect
              </button>
            )}
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div className="p-3 border-b border-[#EAECF0] grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white text-xs">
          {/* A. Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by title, desc, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={11} />
          </div>

          {/* B. Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-[11px] font-medium text-slate-700 bg-white"
          >
            <option value="all">Status: All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* C. Severity select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-[11px] font-medium text-slate-700 bg-white"
          >
            <option value="all">Severity: All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* D. Project Select */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-[11px] font-medium text-slate-700 bg-white truncate"
          >
            <option value="all">Project: All</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* List Space */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EAECF0]">
          {filteredList.length > 0 ? (
            filteredList.map((defect) => {
              const isSelected = selectedDefect?.id === defect.id;
              
              const sevStyles = {
                Critical: "bg-red-50 text-red-700 border-red-200",
                High: "bg-amber-50 text-amber-700 border-amber-200",
                Medium: "bg-blue-50 text-blue-700 border-blue-200",
                Low: "bg-slate-50 text-slate-600 border-slate-200"
              }[defect.severity] || "bg-slate-50 text-slate-700";

              return (
                <div
                  key={defect.id}
                  onClick={() => setSelectedDefect(defect)}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-all ${
                    isSelected ? "bg-blue-50/25 border-l-4 border-[#3B82F6]" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#3B82F6]">
                        {defect.defect_id}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase border ${sevStyles}`}>
                        {defect.severity}
                      </span>
                      <span className={`text-[9.5px] font-semibold font-mono text-gray-400 capitalize`}>
                        {defect.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 truncate mt-1 group-hover:underline">
                      {defect.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {defect.description}
                    </p>
                  </div>

                  {/* Assignee Information */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-700">
                        {defect.assignee_name || "Unassigned"}
                      </p>
                      <p className="text-[8.5px] text-[#667085] truncate max-w-[120px]">
                        {defect.project_name || "All Core Module"}
                      </p>
                    </div>
                    {defect.assignee_avatar ? (
                      <img
                        src={defect.assignee_avatar}
                        alt="assignee"
                        className="w-6 h-6 rounded-full border border-gray-100 flex-shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-700 shrink-0">
                        <UserIcon size={11} />
                      </div>
                    )}
                    <ChevronRight size={13} className="text-gray-300" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center text-gray-400 font-medium">
              No matching defect indices correspond to selection rules.
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Section: Defect details Drawer (Expands to absolute layout on smaller devices, next to list on large screen) */}
      {selectedDefect && (
        <div className="w-[38%] bg-white border border-[#EAECF0] rounded-xl flex flex-col h-full shadow-lg overflow-hidden shrink-0 z-10 transition-transform duration-300">
          
          {/* Drawer Title */}
          <div className="p-4 border-b border-[#EAECF0] bg-slate-50 flex items-center justify-between">
            <div className="min-w-0">
              <span className="font-mono font-bold text-[10.5px] text-blue-600">
                {selectedDefect.defect_id} details
              </span>
              <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                {selectedDefect.title}
              </h4>
            </div>
            <button
              onClick={() => setSelectedDefect(null)}
              className="p-1 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans text-slate-700">
            {/* Status Modification Toggles */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wide">
                <span>Manage Triaging</span>
                {currentUser.role === "Admin" && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete defect ${selectedDefect.defect_id}? All comments/attachments will be pruned.`)) {
                        await onDeleteDefect(selectedDefect.id);
                        setSelectedDefect(null);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 font-bold lowercase scale-90 border border-red-100 bg-red-50 px-1 rounded hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 size={10} /> delete
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Status selector */}
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold font-sans">Status State</label>
                  <select
                    disabled={!canModifyDefect}
                    value={selectedDefect.status}
                    onChange={(e) => onUpdateDefect(selectedDefect.id, { status: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Severity selector */}
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold font-sans">Severity Limit</label>
                  <select
                    disabled={!canModifyDefect}
                    value={selectedDefect.severity}
                    onChange={(e) => onUpdateDefect(selectedDefect.id, { severity: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Assignee Selector Box */}
              <div className="mt-2 space-y-1 text-[10px]">
                <label className="text-slate-500 font-semibold font-sans block">Assign Specialist</label>
                <select
                  disabled={!canModifyDefect}
                  value={selectedDefect.assignee_id}
                  onChange={(e) => onUpdateDefect(selectedDefect.id, { assignee_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded p-1 font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {users
                    .filter((u) => u.role !== "Viewer")
                    .map((usr) => (
                      <option key={usr.id} value={usr.id}>
                        {usr.name} ({usr.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Core Metrics Context Block */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-sky-50/20 border border-slate-100 p-2.5 rounded-lg">
              <div>
                <p className="text-slate-400 font-medium">Project</p>
                <p className="font-bold text-slate-700">{selectedDefect.project_name || "General Server"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Environment Environment</p>
                <p className="font-bold text-slate-700">{selectedDefect.environment_name || "Staging Relay"}</p>
              </div>
              <div className="mt-2">
                <p className="text-slate-400 font-medium">Reporter</p>
                <p className="font-bold text-slate-700">{selectedDefect.reporter_name || "Authorized SRE"}</p>
              </div>
              <div className="mt-2">
                <p className="text-slate-400 font-medium font-sans">Created Date</p>
                <p className="font-bold text-slate-700 font-mono">
                  {new Date(selectedDefect.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Description</span>
              <div className="bg-slate-50 border border-slate-200/50 rounded-lg p-3 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-800 font-sans max-h-40 overflow-y-auto">
                {selectedDefect.description}
              </div>
            </div>

            {/* File attachments Drawer section */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Attachments ({attachments.length})</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={11} className="text-[#3B82F6] shrink-0" />
                      <span className="font-medium text-[10px] text-slate-700 truncate">{file.name}</span>
                    </div>
                    <span className="text-[8.5px] text-gray-400 font-mono font-bold">
                      {Math.round(file.size / 1024)} KB
                    </span>
                  </div>
                ))}
              </div>

              {/* Upload Simulation triggers */}
              {canModifyDefect && (
                <form onSubmit={handleAddAttachment} className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter file name (e.g. stacktrace.log)"
                    value={simulatedFileName}
                    onChange={(e) => setSimulatedFileName(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-[#3b82f6] hover:bg-blue-600 font-semibold text-white px-2.5 py-1 text-[10px] rounded shrink-0 cursor-pointer"
                  >
                    Simulate Attach
                  </button>
                </form>
              )}
            </div>

            {/* Live Comment Strings Panel */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Comments Thread</span>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.length > 0 ? (
                  comments.map((comm) => (
                    <div key={comm.id} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 font-mono">
                        <span className="text-slate-800">{comm.author_name}</span>
                        <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-700 mt-1 leading-snug font-sans">
                        {comm.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-400 italic py-2 text-center">
                    No researcher threads added to defect logs yet.
                  </p>
                )}
              </div>

              {/* Form Input comment box */}
              {canModifyDefect && (
                <form onSubmit={handlePostComment} className="mt-3 flex gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Contribute comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-[10.5px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-3 py-1.5 text-[10px] rounded cursor-pointer shrink-0"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW DEFECT FORM MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#EAECF0] shadow-2xl max-w-lg w-full overflow-hidden text-xs text-slate-700 font-sans">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-[#EAECF0] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 font-sans">Initialize QA Defect Pipeline</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Define metadata to route triage assignments</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-slate-800 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateDefectSubmit} className="p-5 space-y-3">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Title Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSRF invalidation loops on high views checkout"
                  value={newDefectForm.title}
                  onChange={(e) => setNewDefectForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Replication Details</label>
                <textarea
                  rows={3}
                  placeholder="Insert steps to reproduce and stack trace alerts..."
                  value={newDefectForm.description}
                  onChange={(e) => setNewDefectForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Severity & Priority Row */}
              <div className="grid grid-cols-2 gap-3 pb-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Severity level</label>
                  <select
                    value={newDefectForm.severity}
                    onChange={(e) => setNewDefectForm((prev) => ({ ...prev, severity: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 font-medium text-slate-800"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Priority Range</label>
                  <select
                    value={newDefectForm.priority}
                    onChange={(e) => setNewDefectForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-white border border-[#D0D5DD] rounded p-1.5 font-medium text-slate-800"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Project & Environment Row */}
              <div className="grid grid-cols-2 gap-3 pb-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Project Target</label>
                  <select
                    required
                    value={newDefectForm.project_id}
                    onChange={(e) => setNewDefectForm((prev) => ({ ...prev, project_id: e.target.value }))}
                    className="w-full bg-white border border-[#D0D5DD] rounded p-1.5 font-medium text-slate-800"
                  >
                    <option value="" disabled>Select project...</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Environment Environment</label>
                  <select
                    required
                    value={newDefectForm.environment_id}
                    onChange={(e) => setNewDefectForm((prev) => ({ ...prev, environment_id: e.target.value }))}
                    className="w-full bg-white border border-[#D0D5DD] rounded p-1.5 font-medium text-slate-800"
                  >
                    <option value="" disabled>Select environment...</option>
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee Selection block */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#667085] block">Allocate Tester</label>
                <select
                  value={newDefectForm.assignee_id}
                  onChange={(e) => setNewDefectForm((prev) => ({ ...prev, assignee_id: e.target.value }))}
                  className="w-full bg-white border border-[#D0D5DD] rounded p-1.5 font-medium text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {users
                    .filter((u) => u.role !== "Viewer")
                    .map((usr) => (
                      <option key={usr.id} value={usr.id}>
                        {usr.name} ({usr.role})
                      </option>
                    ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#EAECF0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#3B82F6] hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Authorize Creation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
