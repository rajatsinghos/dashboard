/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Server, Activity, AlertTriangle, RefreshCw, Cpu, Gauge } from "lucide-react";
import { PerformanceMetric, Environment } from "../types";

interface PerformanceMonitorProps {
  performanceMetrics: PerformanceMetric[];
  environments: Environment[];
  onTriggerSimulation: () => void;
}

export default function PerformanceMonitor({
  performanceMetrics,
  environments,
  onTriggerSimulation,
}: PerformanceMonitorProps) {
  const [selectedEnvId, setSelectedEnvId] = useState<string>("all");

  const filteredMetrics = selectedEnvId === "all"
    ? performanceMetrics
    : performanceMetrics.filter(m => m.environment_id === selectedEnvId);

  // Take the most recent 35 entries to maintain a readable high-density timescale
  const plotData = filteredMetrics.slice(-35).map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Latency: m.latency,
    Throughput: m.throughput,
    "Error Rate": m.error_rate,
    endpoint: m.endpoint
  }));

  // Calculations for average latency, load rates & error peaks
  const totalLatency = filteredMetrics.reduce((sum, m) => sum + m.latency, 0);
  const avgLatency = filteredMetrics.length > 0 ? Math.round(totalLatency / filteredMetrics.length) : 0;

  const maxLatency = filteredMetrics.length > 0 ? Math.max(...filteredMetrics.map(m => m.latency)) : 0;
  
  const totalErrors = filteredMetrics.reduce((sum, m) => sum + m.error_rate, 0);
  const avgErrorRate = filteredMetrics.length > 0 ? parseFloat((totalErrors / filteredMetrics.length).toFixed(2)) : 0.0;

  return (
    <div className="space-y-5 overflow-y-auto max-h-full pb-8 font-sans text-slate-700 select-none">
      
      {/* 1. Controlling toolbars */}
      <div className="bg-white border border-[#EAECF0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-[#101828]">Core Infrastructure Latency Grid</h3>
          <p className="text-[10px] text-gray-400">Microservice endpoint SLA threshold compliance</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Environment selects */}
          <select
            value={selectedEnvId}
            onChange={(e) => setSelectedEnvId(e.target.value)}
            className="border border-[#D0D5DD] bg-white rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">SLA: All Environments</option>
            {environments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Trigger active compiler traffic simulation */}
          <button
            onClick={onTriggerSimulation}
            className="flex items-center gap-1.5 border border-[#D0D5DD] hover:bg-slate-50 text-slate-700 font-bold text-[10.5px] px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={11} className="animate-spin-slow" /> Trigger Load Ping
          </button>
        </div>
      </div>

      {/* 2. Micro metrics indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Avg Response SLA */}
        <div className="bg-white border border-[#EAECF0] p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average SLA Response</span>
            <span className="text-xl font-extrabold text-[#101828] font-mono block mt-1">{avgLatency}ms</span>
            <span className="text-[8.5px] text-emerald-600 font-bold block mt-0.5 font-mono">Limit: 350ms SLA Compliant</span>
          </div>
          <div className="p-2 bg-blue-50 text-[#3B82F6] rounded-lg">
            <Gauge size={16} />
          </div>
        </div>

        {/* Apex Spike latency */}
        <div className="bg-white border border-[#EAECF0] p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Apex Peak Latency</span>
            <span className="text-xl font-extrabold text-[#101828] font-mono block mt-1">{maxLatency}ms</span>
            <span className="text-[8.5px] text-amber-600 font-bold block mt-0.5 font-mono">Simulated trace recorded</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Cpu size={16} />
          </div>
        </div>

        {/* Live average error rates */}
        <div className="bg-white border border-[#EAECF0] p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average Error Rates</span>
            <span className="text-xl font-extrabold text-[#F04438] font-mono block mt-1">{avgErrorRate}%</span>
            <span className="text-[8.5px] text-rose-600 font-bold block mt-0.5 font-mono">Target: &lt;1.5% Failure rate</span>
          </div>
          <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>

      {/* 3. Three charts displaying performance: Line, Area, Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Area chart for Latency timeline */}
        <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm flex flex-col h-[280px]">
          <div>
            <h4 className="text-xs font-bold text-[#101828]">Response Latency Area Graph (ms)</h4>
            <p className="text-[9px] text-[#667085]">Monitors response thresholds on HTTP processes</p>
          </div>
          <div className="flex-1 w-full text-[9px] font-mono mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={plotData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                <XAxis dataKey="time" stroke="#98A2B3" tickLine={false} />
                <YAxis stroke="#98A2B3" tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                <Area type="monotone" dataKey="Latency" stroke="#3B82F6" fillOpacity={1} fill="url(#latencyGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bar chart for throughput */}
        <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm flex flex-col h-[280px]">
          <div>
            <h4 className="text-xs font-bold text-[#101828]">Gateway Throughput (req/sec)</h4>
            <p className="text-[9px] text-[#667085]">Volumetric transaction index on container ingress</p>
          </div>
          <div className="flex-1 w-full text-[9px] font-mono mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plotData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12B76A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#12B76A" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                <XAxis dataKey="time" stroke="#98A2B3" tickLine={false} />
                <YAxis stroke="#98A2B3" tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                <Bar dataKey="Throughput" fill="url(#throughputGrad)" radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Line chart for Error Rates */}
        <div className="bg-white border border-[#EAECF0] rounded-xl p-4 shadow-sm flex flex-col h-[250px] lg:col-span-2">
          <div>
            <h4 className="text-xs font-bold text-[#101828]">HTTP Error rate index percentage (%)</h4>
            <p className="text-[9px] text-[#667085]">Tracks API fail response multipliers</p>
          </div>
          <div className="flex-1 w-full text-[9px] font-mono mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plotData} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2F4F7" />
                <XAxis dataKey="time" stroke="#98A2B3" tickLine={false} />
                <YAxis stroke="#98A2B3" tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                <Line type="step" dataKey="Error Rate" stroke="#F04438" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
