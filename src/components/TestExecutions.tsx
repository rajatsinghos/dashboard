/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Play, Plus, BookOpen, Trash2, Calendar, Clock, Layers, ArrowRight, X, AlertOctagon, CheckCircle2 } from "lucide-react";
import { TestSuite, TestCase, TestRun, TestRunResult, Environment, User } from "../types";

interface TestExecutionsProps {
  testSuites: TestSuite[];
  testRuns: TestRun[];
  environments: Environment[];
  currentUser: User;
  onAddSuite: (suiteData: any) => Promise<TestSuite>;
  onDeleteSuite: (id: string) => Promise<void>;
  onAddCase: (suiteId: string, caseData: any) => Promise<void>;
  onExecuteRun: (suiteId: string, envId: string, creatorId: string) => Promise<any>;
}

export default function TestExecutions({
  testSuites,
  testRuns,
  environments,
  currentUser,
  onAddSuite,
  onDeleteSuite,
  onAddCase,
  onExecuteRun,
}: TestExecutionsProps) {
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [suiteCases, setSuiteCases] = useState<TestCase[]>([]);
  const [activeRunResults, setActiveRunResults] = useState<TestRunResult[]>([]);
  const [viewingRun, setViewingRun] = useState<TestRun | null>(null);

  // Runner States
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [selectedRunEnvId, setSelectedRunEnvId] = useState<string>("");

  // Create Suite / Case states
  const [showSuiteModal, setShowSuiteModal] = useState(false);
  const [newSuiteForm, setNewSuiteForm] = useState({ name: "", description: "", project_id: "" });

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    title: "",
    description: "",
    expected_result: "",
    priority: "Medium",
    automation_status: "Automated"
  });

  // Load cases whenever suite selection shifts
  useEffect(() => {
    if (selectedSuite) {
      loadCases(selectedSuite.id);
    } else {
      setSuiteCases([]);
    }
  }, [selectedSuite, testSuites]);

  const loadCases = (id: string) => {
    fetch(`/api/test-suites/${id}/cases`)
      .then((res) => res.json())
      .then((data) => setSuiteCases(data))
      .catch((err) => console.error("Error loading test cases:", err));
  };

  // Load results whenever viewing standard historical runs shifts
  useEffect(() => {
    if (viewingRun) {
      fetch(`/api/test-runs/${viewingRun.id}/results`)
        .then((res) => res.json())
        .then((data) => setActiveRunResults(data))
        .catch((err) => console.error("Error loading run results:", err));
    } else {
      setActiveRunResults([]);
    }
  }, [viewingRun]);

  const handleCreateSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuiteForm.name.trim() || !newSuiteForm.project_id) return;

    try {
      const created = await onAddSuite(newSuiteForm);
      setSelectedSuite(created);
      setShowSuiteModal(false);
      setNewSuiteForm({ name: "", description: "", project_id: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuite || !newCaseForm.title.trim()) return;

    try {
      await onAddCase(selectedSuite.id, newCaseForm);
      loadCases(selectedSuite.id);
      setShowCaseModal(false);
      setNewCaseForm({
        title: "",
        description: "",
        expected_result: "",
        priority: "Medium",
        automation_status: "Automated"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const triggerExecutionRun = async (suiteId: string) => {
    const envId = selectedRunEnvId || environments[0]?.id;
    if (!envId) {
      alert("Please ensure at least one active test environment matches target criteria.");
      return;
    }

    setRunningSuiteId(suiteId);
    // Artificially simulate process queue for 1.8 seconds to establish automated feedback rhythms
    setTimeout(async () => {
      try {
        const result = await onExecuteRun(suiteId, envId, currentUser.id);
        setViewingRun(result); // Autoload execution results for premium user-experience
      } catch (err: any) {
        alert(err.message || "An error occurred during automated compilations.");
      } finally {
        setRunningSuiteId(null);
      }
    }, 1800);
  };

  const isViewer = currentUser.role === "Viewer";

  return (
    <div className="flex flex-col xl:flex-row h-full gap-5 overflow-hidden select-none font-sans">
      
      {/* 1. LEFT PANEL: SUITES AND CASES EXPLORER */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-xl border border-[#EAECF0] overflow-hidden">
        
        {/* Panel Toolbar */}
        <div className="px-5 py-3 border-b border-[#EAECF0] bg-slate-50/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Design Registry ({testSuites.length})</h3>
          </div>
          {!isViewer && (
            <button
              onClick={() => {
                // Auto-hook first project on load
                setNewSuiteForm((prev) => ({ ...prev, project_id: testSuites[0]?.project_id || "" }));
                setShowSuiteModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
            >
              <Plus size={12} /> Create Test Suite
            </button>
          )}
        </div>

        {/* Suites Row/Grid selection items */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-[#EAECF0] max-h-52 overflow-y-auto">
          {testSuites.map((suite) => {
            const isSelected = selectedSuite?.id === suite.id;
            const casesMatch = suite.case_count || 0;
            return (
              <div
                key={suite.id}
                onClick={() => setSelectedSuite(suite)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex flex-col justify-between hover:bg-slate-50 relative ${
                  isSelected ? "border-[#3B82F6] bg-blue-50/15" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                      {suite.name}
                    </h4>
                    {currentUser.role === "Admin" && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Prune test suite "${suite.name}" and all corresponding cases?`)) {
                            await onDeleteSuite(suite.id);
                            if (selectedSuite?.id === suite.id) setSelectedSuite(null);
                          }
                        }}
                        className="text-red-400 hover:text-red-700 p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{suite.description}</p>
                </div>

                <div className="flex justify-between mt-3 text-[9px] text-[#667085] border-t border-slate-100 pt-1.5 font-mono">
                  <span>{suite.project_name || "General Server"}</span>
                  <span className="font-bold">{casesMatch} Registered Cases</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Case Lists */}
        <div className="flex-1 flex flex-col min-h-[180px] overflow-hidden">
          {selectedSuite ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header inside cases space */}
              <div className="px-5 py-2 border-b border-[#EAECF0] bg-slate-50 flex items-center justify-between text-[10.5px]">
                <div className="flex items-center gap-1">
                  <BookOpen size={12} className="text-[#3B82F6]" />
                  <span className="font-semibold text-slate-700">TestCase steps for "{selectedSuite.name}"</span>
                </div>

                <div className="flex items-center gap-3">
                  {!isViewer && (
                    <button
                      onClick={() => setShowCaseModal(true)}
                      className="text-[10px] text-[#3B82F6] hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} /> Add Case index
                    </button>
                  )}
                  {/* Select environment and execute runner in header */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-1 py-0.5 rounded">
                    <span className="text-[8.5px] scale-90 uppercase font-mono text-gray-400 font-bold px-1 shrink-0">Run On:</span>
                    <select
                      value={selectedRunEnvId}
                      onChange={(e) => setSelectedRunEnvId(e.target.value)}
                      className="text-[10px] font-bold text-slate-700 bg-transparent border-none pr-1 focus:outline-none focus:ring-none cursor-pointer"
                    >
                      {environments.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name.split(" ")[0]}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={runningSuiteId !== null || isViewer}
                      onClick={() => triggerExecutionRun(selectedSuite.id)}
                      className={`text-[9.5px] font-bold text-white px-2 py-0.5 rounded-sm flex items-center gap-1 cursor-pointer shadow-sm ${
                        runningSuiteId === selectedSuite.id 
                          ? "bg-slate-400" 
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {runningSuiteId === selectedSuite.id ? "compiling..." : "Run Engine"}
                      <Play size={8} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Case Scrollable space */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#EAECF0] p-2 space-y-2">
                {suiteCases.length > 0 ? (
                  suiteCases.map((tc, idx) => (
                    <div key={tc.id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 rounded-lg text-xs font-sans">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[9px] font-bold font-mono uppercase bg-blue-50 border border-blue-200 text-blue-700 px-1 py-0.2 rounded mr-2">
                            {tc.automation_status}
                          </span>
                          <span className="font-mono text-slate-400 font-semibold">TC-0{idx + 1}</span>
                          <h5 className="font-bold text-slate-800 mt-1 leading-snug">{tc.title}</h5>
                        </div>
                        <span className={`text-[9px] border px-1.5 py-0.2 font-mono font-bold rounded ${
                          tc.priority === "High" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {tc.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{tc.description}</p>
                      
                      {tc.steps && tc.steps.length > 0 && (
                        <div className="mt-2.5 space-y-1 bg-white border border-slate-100 p-2 rounded-md">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Sequenced steps</p>
                          {tc.steps.map((step, sIdx) => (
                            <div key={sIdx} className="text-[9.5px] text-slate-700 flex gap-2">
                              <span className="font-bold font-mono text-gray-400 shrink-0">{sIdx + 1}.</span>
                              <span className="leading-snug">{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-[9.5px] font-medium text-[#12B76A] flex items-center gap-1 border-t border-slate-100/50 pt-2 font-mono">
                        <span className="text-slate-400 text-[8.5px] uppercase font-mono font-bold">Expects:</span>
                        {tc.expected_result}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-10 text-gray-400 italic">
                    TestCase steps list is empty. Add matching test scopes in header!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-gray-400 italic text-center">
              Select any design registry test suite card above to configure test specifications.
            </div>
          )}
        </div>

      </div>

      {/* 2. RIGHT PANEL: HISTORICAL EXECUTIONS */}
      <div className="w-full xl:w-96 bg-white border border-[#EAECF0] rounded-xl overflow-hidden flex flex-col shrink-0 h-full">
        <div className="px-5 py-3 border-b border-[#EAECF0] bg-slate-50/50">
          <h4 className="font-bold text-xs text-slate-800">Historical Executions Logs</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Automated compilation history status</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#EAECF0]">
          {testRuns.map((run) => {
            const dateStr = new Date(run.created_at).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const statusColors = {
              Passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
              Failed: "bg-rose-50 text-rose-700 border-rose-200",
              Partial: "bg-amber-50 text-amber-700 border-amber-200",
              Running: "bg-blue-50 text-blue-700 border-blue-200"
            }[run.status] || "bg-slate-50 text-slate-700";

            return (
              <div
                key={run.id}
                onClick={() => setViewingRun(run)}
                className="p-3.5 hover:bg-slate-50 transition-all cursor-pointer relative flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-800 leading-tight text-[11px] truncate">
                      {run.name}
                    </h5>
                    <p className="text-[9.5px] text-slate-400 mt-0.5 truncate uppercase font-mono tracking-tight">
                      {run.suite_name || "Auth Suite"}
                    </p>
                  </div>
                  <span className={`text-[9px] border px-1.5 py-0.2 font-mono font-bold rounded uppercase whitespace-nowrap ${statusColors}`}>
                    {run.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-slate-50/10 pt-2 font-mono text-gray-500">
                  <div className="flex items-center gap-1 text-[8.5px]">
                    <Clock size={10} className="text-gray-400" />
                    <span>Duration: {run.duration}s</span>
                  </div>
                  <div className="text-right">
                    <span>Passed: {run.passed_cases}/{run.total_cases}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono font-semibold text-gray-400 mt-1">
                  <span className="text-blue-600 font-bold">{run.environment_name || "Staging"}</span>
                  <span>{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE NEW SUITE SCHEMA DIALOG */}
      {showSuiteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#EAECF0] shadow-2xl max-w-sm w-full overflow-hidden text-xs text-slate-700 font-sans">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-[#EAECF0] flex items-center justify-between">
              <span className="font-bold text-slate-900">Define Test Suite</span>
              <button onClick={() => setShowSuiteModal(false)} className="text-gray-400 hover:text-slate-800 cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateSuite} className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Suite Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. distributed-auth-ledger-handshake"
                  value={newSuiteForm.name}
                  onChange={(e) => setNewSuiteForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Aesthetic Summary</label>
                <input
                  type="text"
                  required
                  placeholder="Insert core module validation rules description..."
                  value={newSuiteForm.description}
                  onChange={(e) => setNewSuiteForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Allocate Project Context</label>
                <select
                  required
                  value={newSuiteForm.project_id}
                  onChange={(e) => setNewSuiteForm((prev) => ({ ...prev, project_id: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 font-medium text-slate-800"
                >
                  <option value="" disabled>Select project...</option>
                  {testSuites.map((s) => (
                    <option key={s.project_id} value={s.project_id}>
                      {s.project_name || "General Core Project"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowSuiteModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CASE MODAL DIALOG */}
      {showCaseModal && selectedSuite && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#EAECF0] shadow-2xl max-w-sm w-full overflow-hidden text-xs text-slate-700 font-sans">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-[#EAECF0] flex items-center justify-between">
              <span className="font-bold text-slate-900">Add test spec for "{selectedSuite.name.split(" ")[0]}"</span>
              <button onClick={() => setShowCaseModal(false)} className="text-gray-400 hover:text-slate-800 cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Title spec</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TC-4: Validate ledger token validation ratios"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Requirements description</label>
                <input
                  type="text"
                  required
                  placeholder="Core process parameters checklist instructions..."
                  value={newCaseForm.description}
                  onChange={(e) => setNewCaseForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Expectation string</label>
                <input
                  type="text"
                  required
                  placeholder="Expect zero token validation rounding drift results."
                  value={newCaseForm.expected_result}
                  onChange={(e) => setNewCaseForm((prev) => ({ ...prev, expected_result: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Task Priority</label>
                  <select
                    value={newCaseForm.priority}
                    onChange={(e) => setNewCaseForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-semibold text-slate-800"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Automation</label>
                  <select
                    value={newCaseForm.automation_status}
                    onChange={(e) => setNewCaseForm((prev) => ({ ...prev, automation_status: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded p-1 font-semibold text-slate-800"
                  >
                    <option value="Automated">Automated</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Addition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RUN RESULTS MODAL popup */}
      {viewingRun && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-slate-700">
          <div className="bg-white rounded-xl border border-[#EAECF0] shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col text-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-[#EAECF0] flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-tight">Run compile results list</span>
                <h4 className="font-extrabold text-slate-900">{viewingRun.name}</h4>
              </div>
              <button onClick={() => setViewingRun(null)} className="text-gray-400 hover:text-slate-800 cursor-pointer">
                <X size={15} />
              </button>
            </div>

            {/* Run details inside dialog */}
            <div className="p-4 grid grid-cols-3 gap-3 border-b border-gray-100 bg-[#EFF8FF]/15 text-[10.5px]">
              <div>
                <span className="text-slate-400 font-medium">Status</span>
                <p className="font-bold text-slate-800 italic uppercase mt-0.5">{viewingRun.status}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium font-sans">Execution Duration</span>
                <p className="font-bold text-slate-800 mt-0.5 font-mono">{viewingRun.duration} seconds</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Passed ratio</span>
                <p className="font-bold text-slate-850 mt-0.5 font-mono">{viewingRun.passed_cases} passed of {viewingRun.total_cases}</p>
              </div>
            </div>

            {/* Results items scrolling content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/20">
              {activeRunResults.map((res, index) => {
                const isFailed = res.status === "Failed";
                return (
                  <div key={res.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[8.5px] text-gray-400">Step {index + 1}</span>
                        <h5 className="font-bold text-slate-800 leading-snug">{res.case_title}</h5>
                      </div>

                      <span className={`text-[9px] border px-2 py-0.2 font-mono font-bold rounded uppercase flex items-center gap-1 ${
                        isFailed ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}>
                        {isFailed ? <AlertOctagon size={10} /> : <CheckCircle2 size={10} />}
                        {res.status}
                      </span>
                    </div>

                    {res.error_message && (
                      <div className="bg-rose-50/50 border border-rose-100 p-2 rounded text-[10px] font-mono leading-relaxed text-rose-700 whitespace-pre-wrap">
                        {res.error_message}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[8.5px] font-mono font-semibold text-gray-400 border-t border-slate-100/30 pt-1.5">
                      <span>Evaluated duration: {res.duration}ms</span>
                      <span>Verified: Rajat (Admin)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setViewingRun(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
