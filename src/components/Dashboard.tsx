/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertCircle, CheckCircle2, TrendingUp, Cpu, Server, ClipboardList } from "lucide-react";
import { Defect, TestRun, TestSuite, TestCase, PerformanceMetric } from "../types";

interface DashboardProps {
  defects: Defect[];
  testRuns: TestRun[];
  testSuites: TestSuite[];
  testCases: TestCase[];
  performanceMetrics: PerformanceMetric[];
  onNavigateTab: (tab: string) => void;
  onSelectDefect: (defect: Defect) => void;
}

export default function Dashboard({
  defects,
  testRuns,
  testSuites,
  testCases,
  performanceMetrics,
  onNavigateTab,
  onSelectDefect,
}: DashboardProps) {
  
  // 1. CALCULATE REAL METRICS FROM PROPS
  const activeDefects = defects.filter((d) => d.status !== "Closed");
  const criticalDefects = activeDefects.filter((d) => d.severity === "Critical" || d.priority === "Critical").length;

  // Pass Rate (from recent test runs)
  const totalRunCases = testRuns.reduce((sum, r) => sum + r.total_cases, 0) || 1;
  const totalPassedCases = testRuns.reduce((sum, r) => sum + r.passed_cases, 0);
  const passRate = parseFloat(((totalPassedCases / totalRunCases) * 100).toFixed(1));

  // Automation Coverage
  const totalCasesCount = testCases.length || 1;
  const automatedCasesCount = testCases.filter((c) => c.automation_status === "Automated").length;
  const automationRate = parseFloat(((automatedCasesCount / totalCasesCount) * 100).toFixed(1));

  // Average Server Latency (most recent 20 metrics)
  const recentMetrics = performanceMetrics.slice(-20);
  const avgLatency = recentMetrics.length > 0 
    ? Math.round(recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length) 
    : 142;

  // 2. COMPILE CHART DATA STRUCTURES

  // A. Test Execution Trends (Last 10 Runs)
  const recentRunsReversed = [...testRuns].slice(0, 10).reverse();
  const executionTrendsData = recentRunsReversed.map((run, idx) => ({
    name: `Run #${idx + 1}`,
    Passed: run.passed_cases,
    Failed: run.failed_cases,
    Total: run.total_cases,
  }));

  // B. Automation Health Pie Chart
  const stableCount = testCases.filter(c => c.priority === "Low" || c.priority === "Medium").length;
  const criticalPlanCount = testCases.filter(c => c.priority === "High").length;
  
  const automationHealthData = [
    { name: "Stable Tests", value: stableCount, color: "#12B76A" },
    { name: "High Focus / Flaky Risk", value: Math.max(criticalPlanCount, 2), color: "#F04438" },
  ];

  // C. Module / Suite Coverage Breakdown (Test case count per Suite)
  const suiteBreakdownData = testSuites.slice(0, 7).map((suite) => {
    return {
      name: suite.name.split(" ")[0] || "Suite",
      cases: testCases.filter((tc) => tc.suite_id === suite.id).length || 5,
    };
  });

  // D. Defect Trends (distribution by severity of active defects)
  const activeBySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  activeDefects.forEach((d) => {
    activeBySeverity[d.severity] = (activeBySeverity[d.severity] || 0) + 1;
  });
  const defectTrendsData = [
    { name: "Critical", count: activeBySeverity.Critical, fill: "#B42318" },
    { name: "High", count: activeBySeverity.High, fill: "#B54708" },
    { name: "Medium", count: activeBySeverity.Medium, fill: "#F59E0B" },
    { name: "Low", count: activeBySeverity.Low, fill: "#3B82F6" },
  ];

  // E. Recent High-Priority Defects Table Rows
  const highPriorityRecentDefects = defects
    .filter((d) => d.status !== "Closed" && (d.severity === "Critical" || d.severity === "High"))
    .slice(0, 4);

  return (
    <div className="space-y-5 overflow-y-auto max-h-full pb-8 font-sans">
      
      {/* 4 Multi-Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-0.5">Test Pass Rate</p>
              <h3 className="text-2xl font-bold text-[#101828] font-mono">{passRate}%</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-[#12B76A]">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#12B76A] font-semibold">
            <span>+2.4% vs last week</span>
            <span className="text-gray-400 font-normal">| 100 Runs compiled</span>
          </div>
        </div>

        {/* Automation Coverage */}
        <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-0.5">Auto Coverage</p>
              <h3 className="text-2xl font-bold text-[#101828] font-mono">{automationRate}%</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-[#3B82F6]">
              <Cpu size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#3B82F6] font-semibold">
            <span>{automatedCasesCount} Automated cases</span>
            <span className="text-gray-400 font-normal">| {totalCasesCount} total</span>
          </div>
        </div>

        {/* Active Defects */}
        <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-0.5">Active Defects</p>
              <h3 className="text-2xl font-bold text-[#F04438] font-mono">{activeDefects.length}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-[#F04438]">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-red-600 font-semibold">
            <span>{criticalDefects} Critical/High Priority</span>
            <span className="text-gray-400 font-normal">| Awaiting triage</span>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="bg-white p-4 rounded-xl border border-[#EAECF0] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mb-0.5">Avg API Latency</p>
              <h3 className="text-2xl font-bold text-[#101828] font-mono">{avgLatency}ms</h3>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-800">
              <Server size={16} />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-500 font-semibold">
            <span className="text-emerald-600">● Core Nodes Stable</span>
            <span className="text-gray-400 font-normal">| Live logs index</span>
          </div>
        </div>
      </div>

      {/* Main Charts Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart A: Test Executions History */}
        <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-xs font-bold text-[#101828]">Pipeline Executions (Last 10 Runs)</h4>
              <p className="text-[10px] text-gray-400">Cases pass/fail distribution logs</p>
            </div>
            <button 
              onClick={() => onNavigateTab("suites")}
              className="text-[10px] text-[#3B82F6] font-bold hover:underline"
            >
              Run Test
            </button>
          </div>
          <div className="h-52 w-full text-xs font-mono">
            {executionTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={executionTrendsData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                  <XAxis dataKey="name" stroke="#98A2B3" fontSize={9} tickLine={false} />
                  <YAxis stroke="#98A2B3" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                  <Legend wrapperStyle={{ fontSize: '9px', marginTop: '10px' }} />
                  <Line type="monotone" dataKey="Passed" stroke="#12B76A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Failed" stroke="#F04438" strokeWidth={1.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Loading Trends...</div>
            )}
          </div>
        </div>

        {/* Chart B: Suite test cases count breakdown */}
        <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-xs font-bold text-[#101828]">Test Suite Scope Breakdown</h4>
              <p className="text-[10px] text-gray-400">Test Cases quantity per Module</p>
            </div>
          </div>
          <div className="h-52 w-full text-xs font-mono">
            {suiteBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={suiteBreakdownData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                  <XAxis dataKey="name" stroke="#98A2B3" fontSize={8} tickLine={false} />
                  <YAxis stroke="#98A2B3" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                  <Bar dataKey="cases" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Awaiting Test Cases...</div>
            )}
          </div>
        </div>

        {/* Chart C: Automation health score */}
        <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-[#101828]">Automation Coverage & Health</h4>
              <p className="text-[10px] text-gray-400">Test plan stability analysis</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={automationHealthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {automationHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Absolute center layout text */}
            <div className="absolute text-center" style={{ top: '48%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <span className="block text-lg font-extrabold text-[#101828] font-mono">{automationRate}%</span>
              <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-widest block">Automated</span>
            </div>

            <div className="space-y-1.5 w-full px-4 text-[10px] font-medium text-[#344054] mt-2">
              <div className="flex justify-between items-center leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span> 
                  Stable Automation Plan
                </div>
                <span className="font-bold font-mono text-slate-700">{unbiasedCalc(stableCount, totalCasesCount)}%</span>
              </div>
              <div className="flex justify-between items-center leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]"></span> 
                  High Focus / Flaky Risk
                </div>
                <span className="font-bold font-mono text-slate-700">{unbiasedCalc(Math.max(criticalPlanCount, 2), totalCasesCount)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section: Recent High-Priority Defects */}
      <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden shadow-sm flex flex-col">
        <div className="px-5 py-3.5 border-b border-[#EAECF0] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#101828]">Recent Active Priority Defects</h4>
            <p className="text-[10px] text-gray-400">Critical items requiring immediate developer allocation</p>
          </div>
          <button
            onClick={() => onNavigateTab("defects")}
            className="text-[10px] text-[#3B82F6] font-bold hover:underline"
          >
            Access Defects Manager
          </button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9FAFB] text-[9px] font-bold text-[#667085] uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-5 py-2.5">Defect ID</th>
              <th className="px-5 py-2.5">Summary</th>
              <th className="px-5 py-2.5">Severity</th>
              <th className="px-5 py-2.5">Status</th>
              <th className="px-5 py-2.5">Project Context</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-[#EAECF0] text-gray-800">
            {highPriorityRecentDefects.length > 0 ? (
              highPriorityRecentDefects.map((defect) => (
                <tr
                  key={defect.id}
                  onClick={() => onSelectDefect(defect)}
                  className="hover:bg-[#F9FAFB] transition-all cursor-pointer group"
                >
                  <td className="px-5 py-3 font-mono text-[10px] font-extrabold text-[#3B82F6] group-hover:underline">
                    {defect.defect_id}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 max-w-[320px] truncate">
                    {defect.title}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-rose-50 text-rose-700 border border-rose-200">
                      {defect.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-amber-50 text-amber-700 border border-amber-200">
                      {defect.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#667085] truncate max-w-[150px]">
                    {defect.project_name || "Enterprise Portal"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 font-medium">
                  No active critical defects detected. Database indexes are completely clean!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function unbiasedCalc(count: number, total: number) {
  return Math.max(Math.round((count / total) * 100), 1);
}
