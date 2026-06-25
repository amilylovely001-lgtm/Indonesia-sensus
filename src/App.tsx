import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  Info
} from "lucide-react";
import TiktokPhoneMock from "./components/TiktokPhoneMock";
import GovernmentDashboard from "./components/GovernmentDashboard";
import { GovStats, LogEntry, Vote, AIAnalysisReport } from "./types";

export default function App() {
  const [stats, setStats] = useState<GovStats>({
    population: 275142800,
    totalVotes: 0,
    totalSurveys: 0,
    avgSatisfaction: 7.2,
    poverty_index: 9.36,
    totalHouseholds: 0,
    totalLuvDistributed: 0,
    fraudFlaggedCount: 0,
    provinces: [],
    topics: [],
    educationDistribution: [],
    incomeDistribution: [],
    employmentDistribution: []
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [eventStore, setEventStore] = useState<Vote[]>([]);
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(null);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stats and logs from full-stack backend
  const fetchStatsAndLogs = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLogs(data.logs);
        setEventStore(data.eventStore);
        setAiReport(data.aiReport);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari server:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStatsAndLogs();
  }, []);

  // Admin clear/reset DB handler
  const handleClearDatabase = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menyetel ulang seluruh database Data Lake dan mengembalikan data seed awal?")) {
      return;
    }
    
    try {
      const response = await fetch("/api/clear", {
        method: "POST"
      });
      if (response.ok) {
        await fetchStatsAndLogs();
      }
    } catch (error) {
      console.error("Gagal menyetel ulang database:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Visual cybernetic header background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-6 relative z-10">
        
        {/* Main Application Title / Masthead */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-sans">
                  NEUROSPHERE CIVIC SURVEY & VOTING SYSTEM
                </h1>
                <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  NS-SVOS v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 max-w-2xl leading-relaxed">
                Platform Jajak Pendapat & Pemungutan Suara 24/7 Nasional Terdistribusi Berbasis Sovereign Identity (IID) Nusantara.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[10px] text-slate-300">
              <Database size={11} className="text-cyan-400" />
              <span>Architecture: <strong>SPHERE FRACTAL</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[10px] text-slate-300">
              <ShieldCheck size={11} className="text-emerald-400" />
              <span>Identity: <strong>SOVEREIGN (IID)</strong></span>
            </div>
          </div>
        </div>

        {/* Informative Header Prompt */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3 flex gap-2.5 items-start">
          <Info size={15} className="text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            <strong>Petunjuk Alur End-to-End:</strong> Buat IID warga di layar ponsel sebelah kiri (<span className="text-cyan-300">Tab IID</span>) &rarr; Berikan suara & isi survei harian (<span className="text-cyan-300">Tab SUARA / SURVEI</span>) &rarr; Simpan data ke Sovereign Vault lokal (<span className="text-cyan-300">Tab VAULT</span>) &rarr; Klik <strong>SINKRONISASI BATCH</strong> untuk mengirimkan data secara offline-first ke Neuro Nodes pusat. Platform otomatis melacak ketepatan koordinat & mencegah duplikasi suara secara real-time! Jalankan <strong>AI Audit</strong> di dashboard kanan untuk merangkum sentimen kedaulatan warga.
          </p>
        </div>

        {/* Double-Pane Responsive Sandbox Layout */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (TikTok Aspect Ratio Phone Interface) */}
          <section className="xl:col-span-4 flex justify-center sticky top-6">
            <TiktokPhoneMock 
              onSyncComplete={fetchStatsAndLogs}
              networkOnline={networkOnline}
              setNetworkOnline={setNetworkOnline}
              stats={stats}
            />
          </section>

          {/* Right Column (National Centralized Government Analytics Dashboard) */}
          <section className="xl:col-span-8 flex flex-col gap-6">
            {isLoading ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-cyan-500 animate-spin mb-4"></div>
                <p className="text-sm font-mono text-slate-400">Menghubungkan ke pusat data nasional...</p>
              </div>
            ) : (
              <GovernmentDashboard 
                stats={stats}
                logs={logs}
                eventStore={eventStore}
                aiReport={aiReport}
                onRefresh={fetchStatsAndLogs}
                onClear={handleClearDatabase}
              />
            )}
          </section>

        </div>

      </main>

      {/* Government Footer Specs */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-5 px-6 font-mono text-[9px] text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <span>SISTEM KEPENDUDUKAN DAN PENCATATAN SIPIL © 2026 REPUBLIK INDONESIA</span>
            <span className="hidden md:inline text-slate-800">|</span>
            <span className="text-cyan-500/60">INTELLIGENT EDGE EVENT-DRIVEN NETWORK</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-center md:text-right">
            <Cpu size={10} className="text-slate-600" />
            <span>POWERED BY GEMINI-3.5-FLASH ON SERVER-SIDE INGRESS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
