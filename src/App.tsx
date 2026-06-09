/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import DefectManager from "./components/DefectManager";
import TestExecutions from "./components/TestExecutions";
import PerformanceMonitor from "./components/PerformanceMonitor";
import ActivityLogs from "./components/ActivityLogs";
import SettingsPanel from "./components/SettingsPanel";
import AdminPanel from "./components/AdminPanel";
import { User, Defect, TestSuite, TestRun, PerformanceMetric, Notification, Activity, Environment, Project } from "./types";
import { Loader2 } from "lucide-react";
import { useFirebase } from "./context/FirebaseContext";

export default function App() {
  const [loading, setLoading] = useState(true);
  const { firebaseDataActive, saveDocumentToCloud } = useFirebase();

  // Core Data State Indexes
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<Activity[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Navigation / Focus States
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [selectedDefectForTriage, setSelectedDefectForTriage] = useState<Defect | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // 1. Initial application bootstrap load
  useEffect(() => {
    async function initLoad() {
      try {
        const [uData, pData, eData] = await Promise.all([
          fetch("/api/users").then((r) => r.json()),
          fetch("/api/projects").then((r) => r.json()),
          fetch("/api/environments").then((r) => r.json()),
        ]);

        setUsers(uData);
        setProjects(pData);
        setEnvironments(eData);

        // Pre-select 'Rajat' (QA Lead) or default user on start for immediate interactive experience
        const defaultUser = uData.find((u: User) => u.name.includes("Jane") || u.role === "Admin") || uData[0];
        if (defaultUser) {
          setCurrentUser(defaultUser);
        }
      } catch (err) {
        console.error("Critical error during application setup:", err);
      } finally {
        setLoading(false);
      }
    }
    initLoad();
  }, []);

  // 2. Real-time synchronizer (Refetches state periodically so live performance triggers instantly update graphs and feed stats)
  useEffect(() => {
    if (!currentUser) return;

    // Load static once and poll volatile arrays every 4.5 seconds
    const fetchVolatiles = async () => {
      try {
        const [defRes, suiteRes, runRes, perfRes, notifRes, actRes] = await Promise.all([
          fetch("/api/defects").then((r) => r.json()),
          fetch("/api/test-suites").then((r) => r.json()),
          fetch("/api/test-runs").then((r) => r.json()),
          fetch("/api/performance-metrics").then((r) => r.json()),
          fetch(`/api/notifications/${currentUser.id}`).then((r) => r.json()),
          fetch("/api/activities").then((r) => r.json()),
        ]);

        setDefects(defRes);
        setTestSuites(suiteRes);
        setTestRuns(runRes);
        setPerformanceMetrics(perfRes);
        setNotifications(notifRes);
        setActivityLogs(actRes);
      } catch (err) {
        console.error("Realtime sync interval failure:", err);
      }
    };

    fetchVolatiles();
    const interval = setInterval(fetchVolatiles, 4500);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 3. DATABASE CRUD WRITE TRANSACTIONS

  // A. Defect CRUD
  const handleAddDefect = async (defectData: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defectData),
      });
      const data = await res.json();
      setDefects((prev) => [data, ...prev]);

      // Replicate to Firebase Cloud
      if (firebaseDataActive) {
        await saveDocumentToCloud("defects", data.id, data);
      }

      // Trigger immediate logs refresh
      const actRes = await fetch("/api/activities").then((r) => r.json());
      setActivityLogs(actRes);
    } catch (err) {
      console.error("Error creating defect:", err);
    }
  };

  const handleUpdateDefect = async (id: string, updates: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/defects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      setDefects((prev) => prev.map((d) => (d.id === id ? data : d)));

      // Replicate to Firebase Cloud
      if (firebaseDataActive) {
        await saveDocumentToCloud("defects", id, data);
      }

      // Sync activities
      const actRes = await fetch("/api/activities").then((r) => r.json());
      setActivityLogs(actRes);
    } catch (err) {
      console.error("Error updating defect:", err);
    }
  };

  const handleDeleteDefect = async (id: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/defects/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id },
      });
      setDefects((prev) => prev.filter((d) => d.id !== id));

      const actRes = await fetch("/api/activities").then((r) => r.json());
      setActivityLogs(actRes);
    } catch (err) {
      console.error("Error pruning defect:", err);
    }
  };

  // B. Suite Actions
  const handleAddSuite = async (suiteForm: any) => {
    try {
      const res = await fetch("/api/test-suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suiteForm),
      });
      const data = await res.json();
      setTestSuites((prev) => [...prev, data]);

      // Replicate to Firebase Cloud
      if (firebaseDataActive) {
        await saveDocumentToCloud("test_suites", data.id, data);
      }

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteSuite = async (id: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/test-suites/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": currentUser.id },
      });
      setTestSuites((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTestCase = async (suiteId: string, caseForm: any) => {
    try {
      await fetch(`/api/test-suites/${suiteId}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseForm),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteRun = async (suiteId: string, envId: string, creatorId: string) => {
    try {
      const res = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suite_id: suiteId, environment_id: envId, creator_id: creatorId }),
      });
      const data = await res.json();
      setTestRuns((prev) => [data, ...prev]);

      // Replicate to Firebase Cloud
      if (firebaseDataActive) {
        await saveDocumentToCloud("test_runs", data.id, data);
      }

      // Load activities
      const actRes = await fetch("/api/activities").then((r) => r.json());
      setActivityLogs(actRes);

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // C. Notifications Actions
  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // D. General User Membership / settings update
  const handleUpdateUser = async (uId: string, updates: any) => {
    try {
      const res = await fetch(`/api/users/${uId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === uId ? { ...u, ...data } : u)));
      if (currentUser?.id === uId) {
        setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
      }

      // Replicate to Firebase Cloud
      if (firebaseDataActive) {
        await saveDocumentToCloud("users", uId, data);
      }

      return data;
    } catch (err) {
      console.error(err);
    }
  };

  // E. Manual diagnostic SLA metric spike loader
  const handleTriggerSimulation = async () => {
    if (environments.length === 0) return;
    const randEnv = environments[Math.floor(Math.random() * environments.length)];
    const endpoints = ["/api/v1/auth/token", "/api/v1/ledger/refund", "/api/v1/gateway/egress", "/api/v1/users/register"];
    
    try {
      const res = await fetch("/api/performance-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment_id: randEnv.id,
          endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
          latency: Math.floor(Math.random() * 220) + 90,
          throughput: Math.floor(Math.random() * 40) + 15,
          error_rate: Math.random() < 0.1 ? 2.5 : 0.0,
        }),
      });
      const data = await res.json();
      setPerformanceMetrics((prev) => [...prev, data]);

      // Replicate to Firebase Cloud
      if (firebaseDataActive) {
        await saveDocumentToCloud("performance_metrics", data.id, data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // F. Callback router for Instant Global Search Results clicks
  const handleSearchSelect = (tab: string, item: any) => {
    setCurrentTab(tab);
    if (tab === "defects") {
      setSelectedDefectForTriage(item);
    }
  };

  // 4. Loading Frame Boundary
  if (loading || !currentUser) {
    return (
      <div className="h-screen w-screen bg-[#F1F3F5] flex flex-col items-center justify-center font-sans gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold text-slate-800 tracking-tight">Syncing QA Pulse databases...</p>
      </div>
    );
  }

  // Header metric trackers
  const activeDefectCount = defects.filter((d) => d.status !== "Closed").length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1F3F5] text-slate-900 font-sans">
      {/* Visual Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedDefectForTriage(null);
        }}
        currentUser={currentUser}
        defectCount={activeDefectCount}
      />

      {/* Main viewport Container */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Global Control Header */}
        <Header
          users={users}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          onSearchSelect={handleSearchSelect}
          defects={defects}
          testSuites={testSuites}
          testRuns={testRuns}
        />

        {/* Dynamic Nav Viewport (with compact 5px gap styling matching design instructions) */}
        <main className="flex-1 overflow-hidden p-5 bg-[#F1F3F5]">
          {
            {
              dashboard: (
                <Dashboard
                  defects={defects}
                  testRuns={testRuns}
                  testSuites={testSuites}
                  testCases={testSuites.flatMap((s) => s.cases || [])}
                  performanceMetrics={performanceMetrics}
                  onNavigateTab={(tab) => {
                    setCurrentTab(tab);
                  }}
                  onSelectDefect={(d) => {
                    setCurrentTab("defects");
                    setSelectedDefectForTriage(d);
                  }}
                />
              ),
              defects: (
                <DefectManager
                  defects={defects}
                  users={users}
                  projects={projects}
                  environments={environments}
                  currentUser={currentUser}
                  onAddDefect={handleAddDefect}
                  onUpdateDefect={handleUpdateDefect}
                  onDeleteDefect={handleDeleteDefect}
                  selectedDefectFromDashboard={selectedDefectForTriage}
                  clearDashboardSelection={() => setSelectedDefectForTriage(null)}
                />
              ),
              suites: (
                <TestExecutions
                  testSuites={testSuites}
                  testRuns={testRuns}
                  environments={environments}
                  currentUser={currentUser}
                  onAddSuite={handleAddSuite}
                  onDeleteSuite={handleDeleteSuite}
                  onAddCase={handleAddTestCase}
                  onExecuteRun={handleExecuteRun}
                />
              ),
              performance: (
                <PerformanceMonitor
                  performanceMetrics={performanceMetrics}
                  environments={environments}
                  onTriggerSimulation={handleTriggerSimulation}
                />
              ),
              logs: (
                <ActivityLogs
                  activityLogs={activityLogs}
                />
              ),
              admin: (
                <AdminPanel
                  users={users}
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              ),
              settings: (
                <SettingsPanel
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              ),
            }[currentTab]
          }
        </main>

      </div>
    </div>
  );
}
