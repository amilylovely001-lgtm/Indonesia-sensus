import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Building2, 
  Server, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Trash2, 
  Clock, 
  RefreshCw,
  Search,
  CheckCircle,
  Database,
  ArrowRight,
  User,
  AlertTriangle,
  Lightbulb,
  MapPin,
  Sliders,
  Gauge,
  Layers,
  Landmark,
  ShieldCheck,
  Zap,
  Activity,
  Eye,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Check,
  Info,
  Flame,
  Newspaper
} from "lucide-react";
import { GovStats, LogEntry, Vote, AIAnalysisReport } from "../types";

interface GovernmentDashboardProps {
  stats: GovStats;
  logs: LogEntry[];
  eventStore: Vote[];
  aiReport: AIAnalysisReport | null;
  onRefresh: () => void;
  onClear: () => void;
}

const COLORS = ["#06b6d4", "#a855f7", "#eab308", "#10b981", "#ef4444"];

export default function GovernmentDashboard({ 
  stats, 
  logs, 
  eventStore, 
  aiReport: initialAiReport, 
  onRefresh, 
  onClear 
}: GovernmentDashboardProps) {
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(initialAiReport);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");

  // Dashboard Active Tab
  const [dashboardTab, setDashboardTab] = useState<"icos" | "analytics" | "simulation" | "architecture" | "social">("icos");
  const [architectureSubTab, setArchitectureSubTab] = useState<string>("topology");

  // Social Intelligence Pipeline Local States
  const [socialSampleSize, setSocialSampleSize] = useState<number>(500000);
  const [socialWeights, setSocialWeights] = useState({
    x: 30,
    tiktok: 25,
    instagram: 20,
    youtube: 15,
    facebook: 10
  });
  const [socialFilter, setSocialFilter] = useState<string>("Semua");
  const [isCrawlingPipeline, setIsCrawlingPipeline] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    "[SYSTEM] Pipeline diinisialisasi dengan konfigurasi bobot standar.",
    "[SYSTEM] Data stream dari 5 platform utama Indonesia terhubung secara pasif."
  ]);

  // IC-OS Digital Twin States
  const [activeLayer, setActiveLayer] = useState<number>(6); // Layer 1 to 6 focus
  const [selectedIcosScenario, setSelectedIcosScenario] = useState<string>("hybrid");
  const [bbmSlider, setBbmSlider] = useState<number>(0); // -20% to +20%
  const [mbgScaleSlider, setMbgScaleSlider] = useState<number>(100); // 0% to 100%
  const [activePulseFeed, setActivePulseFeed] = useState<string>("all");
  const [isIcosRecalibrating, setIsIcosRecalibrating] = useState<boolean>(false);

  // Policy Simulation States
  const [taxRate, setTaxRate] = useState(0);
  const [subsidy, setSubsidy] = useState(150);
  const [educationBudget, setEducationBudget] = useState(20);
  const [economicIntervention, setEconomicIntervention] = useState<"low" | "mid" | "high">("mid");
  
  const [isSimulatingPolicy, setIsSimulatingPolicy] = useState(false);
  const [policyResults, setPolicyResults] = useState<{
    gdpImpact: number;
    povertyImpact: number;
    inflationImpact: number;
    stabilityScore: number;
    commentary: string;
  } | null>(null);

  // Search & Filter state for 38 provinces
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<"Semua" | "Sumatera" | "Jawa" | "Kalimantan" | "Sulawesi" | "BaliNusa" | "Maluku" | "Papua">("Semua");

  const loadingMessages = [
    "Mengumpulkan paket data sensus terenkripsi...",
    "Membaca append-only log dari Neuro Event Bus...",
    "Memvalidasi IID identitas terhadap anomali tanda tangan...",
    "Mengkalkulasi distribusi demografi nusantara...",
    "Mengekstrak anomali menggunakan Gemini 3.5 Flash...",
    "Merumuskan rekomendasi kebijakan publik nasional..."
  ];

  // Rotate loading messages during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      let idx = 0;
      setLoadingMsg(loadingMessages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[idx]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Sync state report
  useEffect(() => {
    setAiReport(initialAiReport);
  }, [initialAiReport]);

  const handleTriggerAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError("");
    setAiReport(null);

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menghubungkan ke Gemini");
      }

      const report = await response.json();
      setAiReport(report);
      onRefresh(); // Refresh general state to fetch updated report
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Gagal menghasilkan laporan AI. Pastikan GEMINI_API_KEY Anda valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Live simulation handler for any specific province
  const handleSimulateSingleProvince = async (code: string) => {
    try {
      const response = await fetch("/api/simulate-province", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, count: 1 })
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Gagal melakukan simulasi:", err);
    }
  };

  // Policy Simulation trigger
  const handleSimulatePolicy = async () => {
    setIsSimulatingPolicy(true);
    try {
      const response = await fetch("/api/gemini/simulate-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxRate, subsidy, educationBudget, economicIntervention })
      });
      if (!response.ok) throw new Error("Gagal melakukan simulasi kebijakan");
      const data = await response.json();
      setPolicyResults(data);
    } catch (err) {
      console.error(err);
      // Fallback local calculations if anything fails
      const baseGdp = parseFloat(( (subsidy / 100) * 0.6 + (educationBudget - 20) * 0.12 - (taxRate * 0.15) ).toFixed(2));
      const basePoverty = parseFloat(( -(subsidy / 100) * 1.8 - (educationBudget - 20) * 0.22 + (taxRate * 0.08) - (economicIntervention === "high" ? 2.5 : economicIntervention === "mid" ? 1.0 : 0.3) ).toFixed(2));
      const baseInflation = parseFloat(( (subsidy / 100) * 1.1 + (taxRate * 0.05) + (economicIntervention === "high" ? 2.8 : 1.0) ).toFixed(2));
      const baseStability = Math.min(100, Math.max(10, Math.round(82 + (subsidy / 100) * 3 + (educationBudget - 20) * 1.1 - Math.abs(taxRate) * 1.2)));

      setPolicyResults({
        gdpImpact: baseGdp,
        povertyImpact: basePoverty,
        inflationImpact: baseInflation,
        stabilityScore: baseStability,
        commentary: `Analisis prediktif terhitung secara deterministik oleh engine lokal NCIS v1.0. Penyaluran subsidi Rp ${subsidy}T serta dukungan pendidikan ${educationBudget}% memicu pertumbuhan positif sebesar ${baseGdp}% dengan resiliensi kemiskinan yang membaik (${basePoverty}%). Ketahanan nasional tetap stabil.`
      });
    } finally {
      setIsSimulatingPolicy(false);
    }
  };

  // Filter provinces list based on user selections
  const filteredProvinces = (stats.provinces || []).filter(prov => {
    const matchesSearch = prov.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prov.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster = selectedCluster === "Semua" || prov.cluster === selectedCluster;
    return matchesSearch && matchesCluster;
  });

  return (
    <div className="flex-1 flex flex-col gap-5 p-4 lg:p-6 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md">
      
      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-cyan-400" size={20} />
            <h1 className="text-lg font-bold text-white tracking-tight font-sans">
              PUSAT KEDALATAN DATA FEDERASI NASIONAL
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sistem Pemantau NeuroSphere Sphere Architecture (NEB) Republik Indonesia
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={onRefresh}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-850 border border-slate-750 text-slate-300 text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer font-mono"
            title="Muat Ulang Data"
          >
            <RefreshCw size={13} />
            REFRESH
          </button>
          
          <button 
            onClick={onClear}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer font-mono"
            title="Setel Ulang Data ke Default"
          >
            <Trash2 size={13} />
            RESET DATA
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-800 p-0.5 gap-1 font-mono text-[10px] sm:text-[11px] mb-2">
        <button
          onClick={() => setDashboardTab("icos")}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
            dashboardTab === "icos"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
          }`}
        >
          <Activity size={12} className="text-emerald-450 animate-pulse" />
          ✅ IC-OS DIGITAL TWIN v2.0
        </button>

        <button
          onClick={() => setDashboardTab("analytics")}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
            dashboardTab === "analytics"
              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
          }`}
        >
          <Database size={12} />
          ANALITIK SENSUS & PROVINSI
        </button>

        <button
          onClick={() => setDashboardTab("social")}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
            dashboardTab === "social"
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
          }`}
        >
          <TrendingUp size={12} />
          📡 SOSIAL PULSE PIPELINE
        </button>

        <button
          onClick={() => setDashboardTab("simulation")}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
            dashboardTab === "simulation"
              ? "bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
          }`}
        >
          <Sliders size={12} />
          POLICY SIMULATION ENGINE
        </button>

        <button
          onClick={() => setDashboardTab("architecture")}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
            dashboardTab === "architecture"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
          }`}
        >
          <Layers size={12} />
          ARSITEKTUR IC-OS v2.0
        </button>
      </div>

      {/* Grid: Government Key-Performance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-3.5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Proyeksi Populasi Terhitung</span>
          <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono block mt-1">
            {stats.population.toLocaleString("id-ID")}
          </span>
          <span className="text-[8px] text-slate-500 font-mono block mt-1">
            Nasional Proyeksi (Simulasi Skala)
          </span>
          <div className="absolute right-2 bottom-2 text-cyan-500/5">
            <Cpu size={40} />
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-3.5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Total Suara Ter-Konsensus</span>
          <span className="text-xl sm:text-2xl font-extrabold text-purple-400 font-mono block mt-1">
            {stats.totalVotes.toLocaleString("id-ID")} Suara
          </span>
          <span className="text-[8px] text-slate-500 font-mono block mt-1">
            Hasil Pemungutan Suara 24/7
          </span>
          <div className="absolute right-2 bottom-2 text-purple-500/5">
            <Cpu size={40} />
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-3.5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Indeks Kepuasan Layanan</span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono block mt-1">
            {stats.avgSatisfaction} / 10
          </span>
          <span className="text-[8px] text-slate-500 font-mono block mt-1">
            Rata-rata Penilaian Kepuasan Sipil
          </span>
          <div className="absolute right-2 bottom-2 text-amber-500/5">
            <Cpu size={40} />
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-3.5 relative overflow-hidden">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Rasio Kemiskinan Terhitung</span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono block mt-1">
            {stats.poverty_index}%
          </span>
          <span className="text-[8px] text-slate-500 font-mono block mt-1">
            Sensus Kualifikasi Ekonomi Rendah
          </span>
          <div className="absolute right-2 bottom-2 text-emerald-500/5">
            <Cpu size={40} />
          </div>
        </div>
      </div>

      {/* Tab Contents: ✅ IC-OS DIGITAL TWIN v2.0 */}
      {dashboardTab === "icos" && (() => {
        // Dynamic feedback loop math based on citizen mobile sync inputs
        const satisfactionVal = stats.avgSatisfaction || 7.2;
        const povertyVal = stats.poverty_index || 9.36;
        const totalVotesVal = stats.totalVotes || 0;
        const totalSurveysVal = stats.totalSurveys || 0;
        const totalEventsSynced = totalVotesVal + totalSurveysVal;

        // Baseline indicators
        let baseTrust = 0.52 + (satisfactionVal - 7.2) * 0.08 - (povertyVal - 9.36) * 0.03;
        let baseInflation = 4.76 + (povertyVal - 9.36) * 0.15;
        let baseProtestDki = 0.81 - (satisfactionVal - 7.2) * 0.12;
        let baseProtestJabar = 0.78 - (satisfactionVal - 7.2) * 0.10;

        // Adjustments based on active scenario selection
        let scenarioName = "Hybrid MBG + Transparansi + BLT";
        let recommendationAlert = "SANGAT DIREKOMENDASIKAN (Auralang Confidence: 94.2%)";
        let econIndicator = "+0.12% GDP Growth";
        let socialIndicator = "Tinggi (Stabilitas Terkendali)";
        let polIndicator = "Medium-Low (Aksi Damai Terurai)";
        let scoreVal = 84;

        if (selectedIcosScenario === "status_quo") {
          scenarioName = "Status Quo (MBG Full Terpusat)";
          recommendationAlert = "TIDAK DIREKOMENDASIKAN (Defisit APBN Kritis)";
          baseTrust -= 0.06;
          baseInflation += 0.8;
          baseProtestDki += 0.08;
          baseProtestJabar += 0.07;
          econIndicator = "-0.30% GDP Impact";
          socialIndicator = "Sedang (Keresahan Transparansi)";
          polIndicator = "High (Potensi Eskalasi Massa)";
          scoreVal = 58;
        } else if (selectedIcosScenario === "bbm_subsidy") {
          scenarioName = "BBM Subsidi Dikurangi 20% (Austeritas)";
          recommendationAlert = "BERBAHAYA (Kepanikan Pasar Pangan)";
          baseTrust -= 0.22;
          baseInflation += 2.4;
          baseProtestDki += 0.16;
          baseProtestJabar += 0.15;
          econIndicator = "-0.55% GDP Impact";
          socialIndicator = "Rendah (Pukulan Kelas Menengah)";
          polIndicator = "Critical (Darurat Aksi Nasional)";
          scoreVal = 41;
        } else if (selectedIcosScenario === "eval_redirect") {
          scenarioName = "Evaluasi Total & Penundaan MBG";
          recommendationAlert = "ALTERNATIF FISKAL (Skeptisisme Sosial)";
          baseTrust += 0.04;
          baseInflation -= 0.4;
          baseProtestDki -= 0.04;
          baseProtestJabar -= 0.03;
          econIndicator = "-0.10% GDP Impact";
          socialIndicator = "Sedang-Tinggi (Kecewa Sektor Mikro)";
          polIndicator = "Medium-Low (Fokus Dialog Nasional)";
          scoreVal = 79;
        }

        // Apply sliders adjustments
        const bbmImpact = bbmSlider * 0.012; // each percent change
        baseTrust -= bbmImpact * 0.8;
        baseInflation += bbmSlider * 0.08;
        baseProtestDki += bbmImpact * 1.2;

        const mbgImpact = (mbgScaleSlider - 100) / 100; // deviation from full
        if (mbgImpact < 0) {
          // reduction in MBG scale reduces inflation but also slightly reduces trust
          baseInflation += mbgImpact * 0.5;
          baseTrust += mbgImpact * 0.05;
        } else {
          baseInflation += mbgImpact * 0.3;
          baseTrust += mbgImpact * 0.08;
        }

        // Clamp values to realistic ranges
        const finalTrust = Math.max(0.1, Math.min(0.99, baseTrust));
        const finalInflation = Math.max(0.5, Math.min(12.0, baseInflation));
        const finalProtestDki = Math.max(0.05, Math.min(0.99, baseProtestDki));
        const finalProtestJabar = Math.max(0.05, Math.min(0.99, baseProtestJabar));
        const finalProtestAvg = (finalProtestDki + finalProtestJabar) / 2;

        // Social Pulse Database entries (June 24-25, 2026 Indonesia Social Intelligence)
        const pulseDatabase = [
          { id: 1, platform: "tiktok", author: "@merahputih_news", content: "Koperasi Desa Merah Putih (KDMP) resmi ditunjuk jadi penyuplai bahan pangan pokok program MBG di Jabar! Sayuran segar langsung diserap dari petani lokal. #MBG #IndonesiaDigitalTwin", sentiment: "positive", date: "Hari ini, 14:20" },
          { id: 2, platform: "x", author: "@aliansi_sipil_id", content: "Aksi Damai Mahasiswa di Bundaran HI menuntut transparansi anggaran APBN! Jangan sampai program Makan Gratis jadi alat pemborosan & bancakan proyek. Jamin kebebasan sipil! #DemoMahasiswa #SupremasiSipil", sentiment: "negative", date: "Hari ini, 13:45" },
          { id: 3, platform: "news", author: "Harian Kompas", content: "Sensus Mandiri Berbasis Sovereign Identity (IID) Nusantara Sukses Cegah Duplikasi Penyaluran Bantuan Sosial di Jawa Timur. Presisi Data Diklaim Capai 99.8%.", sentiment: "positive", date: "Hari ini, 12:10" },
          { id: 4, platform: "tiktok", author: "@budi_sujatmiko", content: "BBM subsidi dibatasi lagi per Juli? Duh sembako makin gila harganya. Tolong lah kami rakyat kecil di desa, boro-boro mikir kurikulum AI kalau perut masih lapar. #HargaBBM #BerasMahal", sentiment: "negative", date: "Hari ini, 11:30" },
          { id: 5, platform: "x", author: "@ekonom_muda", content: "Defisit fiskal APBN makin tertekan imbas subsidi ganda. Opsi 'Hybrid MBG + BLT Sasaran IID' rasanya paling masuk akal buat jaga kestabilan makro & redam demo. #APBN #KebijakanFiskal", sentiment: "neutral", date: "Hari ini, 10:15" },
          { id: 6, platform: "bps", author: "Bank Indonesia OpenData", content: "Laporan Tekanan Inflasi Juni 2026 terkendali di kisaran 4.76% YoY, didorong oleh kelancaran distribusi rantai pasok pangan daerah.", sentiment: "positive", date: "Kemarin, 17:00" },
          { id: 7, platform: "news", author: "Detik Finance", content: "Badan Gizi Nasional Pastikan Distribusi MBG Menggunakan Verifikasi Gawai Warga Guna Hindari Kebocoran Anggaran.", sentiment: "positive", date: "Kemarin, 15:30" },
          { id: 8, platform: "x", author: "@nurhayati_jkt", content: "Demo di depan gedung DPR sempat bikin macet total sore tadi. Tuntutannya macem-macem dari cabut komersialisasi pendidikan sampe bebasin aktivis mahasiswa.", sentiment: "negative", date: "Kemarin, 14:15" },
        ];

        // Filtered social intelligence pulse
        const filteredPulse = pulseDatabase.filter(item => {
          if (activePulseFeed === "all") return true;
          return item.platform === activePulseFeed;
        });

        // Trigger probabilistic scenario runs (Monte Carlo simulator UI helper)
        const handleIcosRecalibrate = () => {
          setIsIcosRecalibrating(true);
          setTimeout(() => {
            setIsIcosRecalibrating(false);
          }, 1500);
        };

        return (
          <div className="space-y-6 animate-fade-in">
            
            {/* Layers Pipeline Header Flow (NASA CONTROL ROOM DESIGN) */}
            <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block mb-2 text-center sm:text-left">
                PIPELINE CLOSED-LOOP INTELLIGENCE NASIONAL (IC-OS SYSTEM LAYERS)
              </span>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center font-mono text-[10px]">
                {[
                  { l: 1, name: "1. Data Ingest", desc: "Pulse + Sensus + BPS", color: "text-cyan-400 border-cyan-500/20 bg-cyan-950/5" },
                  { l: 2, name: "2. State Engine", desc: "Digital Twin Core", color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/5" },
                  { l: 3, name: "3. Policy Gen", desc: "Scenario Drafting", color: "text-purple-400 border-purple-500/20 bg-purple-950/5" },
                  { l: 4, name: "4. Crisis Sim", desc: "Monte Carlo Prob", color: "text-amber-400 border-amber-500/20 bg-amber-950/5" },
                  { l: 5, name: "5. Feedback Loop", desc: "Recalibration Loop", color: "text-rose-400 border-rose-500/20 bg-rose-950/5" },
                  { l: 6, name: "6. Control Room", desc: "Unified Command", color: "text-blue-400 border-blue-500/20 bg-blue-950/5" },
                ].map(layer => (
                  <button
                    key={layer.l}
                    onClick={() => setActiveLayer(layer.l)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      activeLayer === layer.l 
                        ? "bg-slate-850 border-slate-700 shadow-md shadow-slate-950/80 scale-[1.03] ring-1 ring-cyan-500/30" 
                        : "bg-slate-900/40 border-slate-850 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-center gap-1">
                      {activeLayer === layer.l && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>}
                      <span className={layer.color.split(" ")[0]}>{layer.name}</span>
                    </div>
                    <div className="text-[8px] text-slate-500 mt-0.5">{layer.desc}</div>
                  </button>
                ))}
              </div>

              {/* Layer explanation box */}
              <div className="mt-3 bg-slate-900/60 border border-slate-850 rounded-xl p-3 text-[11px] font-mono leading-relaxed text-slate-300 flex items-start gap-2.5">
                <Info size={14} className="text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  {activeLayer === 1 && (
                    <p>
                      <strong className="text-white">LAYER 1 (Real-World Ingestion):</strong> Sistem menyaring data harian dari 5 sumber utama: X/Twitter, TikTok Indonesia, Berita Nasional, Sensus Mandiri IID, dan data makro BPS/BI secara kontinu.
                    </p>
                  )}
                  {activeLayer === 2 && (
                    <p>
                      <strong className="text-white">LAYER 2 (National State Engine / Digital Twin Core):</strong> Memetakan kondisi rill kependudukan (~280M jiwa), inflasi, indeks kepuasan, dan tingkat ketegangan sosial di 38 provinsi secara real-time.
                    </p>
                  )}
                  {activeLayer === 3 && (
                    <p>
                      <strong className="text-white">LAYER 3 (Policy Generator Engine):</strong> Menyusun opsi regulasi fiskal dan belanja negara serta menilai dampaknya terhadap ketahanan APBN serta stabilitas sosial.
                    </p>
                  )}
                  {activeLayer === 4 && (
                    <p>
                      <strong className="text-white">LAYER 4 (Crisis Simulator Engine):</strong> Menguji scenarios ekstrem seperti kenaikan harga BBM atau boikot program nasional lewat simulasi probabilistik untuk menghindari huru-hara sipil.
                    </p>
                  )}
                  {activeLayer === 5 && (
                    <p>
                      <strong className="text-white">LAYER 5 (Feedback Loop & Continuous Learning):</strong> Suara & survei warga dari Tab IID (layar kiri) secara offline-first dikumpulkan lewat API Gateway dan dikalibrasi balik untuk memutakhirkan parameter model AI.
                    </p>
                  )}
                  {activeLayer === 6 && (
                    <p>
                      <strong className="text-white">LAYER 6 (Control Room Dashboard):</strong> Konsol terpadu Command Center (NASA-Style) guna memvisualisasikan seluruh anomali nasional, tren kepuasan sipil, dan meluncurkan keputusan operasional.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Twin State Metrics Row (State Core) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Social Sentiment Index</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-xl sm:text-2xl font-extrabold font-mono ${finalTrust >= 0.55 ? "text-emerald-400" : finalTrust >= 0.45 ? "text-amber-400" : "text-rose-400"}`}>
                    {finalTrust >= 0.55 ? "🟢 POSITIF" : finalTrust >= 0.45 ? "🟡 MODERAT" : "🔴 NEGATIF"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({(finalTrust * 100).toFixed(1)}%)</span>
                </div>
                <span className="text-[8px] text-slate-500 font-mono block mt-1">
                  Rata-rata Nasional (Recalibrated Live)
                </span>
                <div className="absolute right-2 bottom-2 text-slate-700/5">
                  <Activity size={32} />
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Indeks Kepercayaan Sipil</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono">
                    {(finalTrust).toFixed(2)} / 1.0
                  </span>
                </div>
                <span className="text-[8px] text-slate-500 font-mono block mt-1">
                  Auralang Trust Score (KYC Level 2 verified)
                </span>
                <div className="absolute right-2 bottom-2 text-slate-700/5">
                  <ShieldCheck size={32} />
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Tekanan Unjuk Rasa (Nasional)</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-xl sm:text-2xl font-extrabold font-mono ${finalProtestAvg >= 0.7 ? "text-rose-500 animate-pulse" : finalProtestAvg >= 0.5 ? "text-amber-400" : "text-emerald-400"}`}>
                    {(finalProtestAvg * 100).toFixed(0)}%
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono ml-1">Probabilitas</span>
                </div>
                <span className="text-[8px] text-slate-500 font-mono block mt-1">
                  Eskalasi di Wilayah Urban Utama
                </span>
                <div className="absolute right-2 bottom-2 text-slate-700/5">
                  <Flame size={32} />
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Proyeksi Inflasi Pangan</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-xl sm:text-2xl font-extrabold font-mono ${finalInflation > 6.0 ? "text-red-400" : finalInflation > 4.5 ? "text-amber-400" : "text-emerald-400"}`}>
                    {finalInflation.toFixed(2)}%
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono ml-1">YoY</span>
                </div>
                <span className="text-[8px] text-slate-500 font-mono block mt-1">
                  Model Prediksi Dampak Fiskal
                </span>
                <div className="absolute right-2 bottom-2 text-slate-700/5">
                  <TrendingUp size={32} />
                </div>
              </div>

            </div>

            {/* Split Screen Grid: Left (Socioeconomic Pulse) & Right (Interactive Policy Twin Simulator) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Social Intelligence Pulse (Layer 1 & 2 Ingested) */}
              <div className="xl:col-span-5 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col h-[520px]">
                <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <Newspaper size={14} className="text-cyan-400" />
                      🇮🇩 INDONESIA SOCIAL PULSE (24/7 LIVE)
                    </h3>
                    <p className="text-[8px] text-slate-500 font-mono uppercase mt-0.5">Media monitoring & open data pipeline</p>
                  </div>
                  
                  {/* Total Event Sync Count Bubble */}
                  <span className="text-[9px] font-mono bg-cyan-950/30 border border-cyan-850 text-cyan-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Database size={10} />
                    {totalEventsSynced} Feed Node
                  </span>
                </div>

                {/* Filter Feed Category Buttons */}
                <div className="flex gap-1 mb-3 overflow-x-auto pb-1 text-[9px] font-mono">
                  {[
                    { id: "all", label: "SEMUA FEED" },
                    { id: "tiktok", label: "TIKTOK" },
                    { id: "x", label: "X / TWITTER" },
                    { id: "news", label: "BERITA" },
                    { id: "bps", label: "BPS / BI" },
                  ].map(feedTab => (
                    <button
                      key={feedTab.id}
                      onClick={() => setActivePulseFeed(feedTab.id)}
                      className={`px-2 py-1 rounded-lg border cursor-pointer transition-all shrink-0 ${
                        activePulseFeed === feedTab.id
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold"
                          : "bg-slate-900/30 border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {feedTab.label}
                    </button>
                  ))}
                </div>

                {/* Feed Stream List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-[10px]">
                  {filteredPulse.map(item => (
                    <div 
                      key={item.id} 
                      className="p-3 rounded-xl bg-slate-900/50 border border-slate-850 hover:border-slate-800 transition-all flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] uppercase px-1.5 py-0.2 rounded font-bold ${
                            item.platform === "tiktok" ? "bg-pink-500/10 text-pink-400 border border-pink-500/10" :
                            item.platform === "x" ? "bg-slate-800 text-white border border-slate-700" :
                            item.platform === "news" ? "bg-blue-500/10 text-blue-400 border border-blue-500/10" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                          }`}>
                            {item.platform}
                          </span>
                          <span className="font-bold text-slate-300 text-[9px]">{item.author}</span>
                        </div>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.sentiment === "positive" ? "bg-emerald-500" :
                          item.sentiment === "negative" ? "bg-rose-500" :
                          "bg-slate-500"
                        }`} title={`Sentimen: ${item.sentiment}`}></span>
                      </div>
                      
                      <p className="text-slate-300 leading-normal text-[9.5px]">
                        {item.content}
                      </p>
                      
                      <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-slate-900 pt-1 mt-0.5">
                        <span>{item.date}</span>
                        <span className="text-slate-600 uppercase">Auralang L2 Logged</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hot Triggers Warning */}
                <div className="mt-3 p-2 rounded-xl bg-rose-950/10 border border-rose-500/15">
                  <span className="text-[8px] uppercase font-bold text-rose-400 font-mono block mb-1">
                    ⚠️ DETEKSI HOT TRIGGERS (TREN KRISIS)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { word: "MBG boros", action: "status_quo" },
                      { word: "demo mahasiswa", action: "eval_redirect" },
                      { word: "BBM naik", action: "bbm_subsidy" },
                      { word: "APBN defisit", action: "status_quo" }
                    ].map((trig, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedIcosScenario(trig.action);
                          handleIcosRecalibrate();
                        }}
                        className="text-[8.5px] px-2 py-0.5 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 border border-rose-500/20 rounded-md font-mono cursor-pointer transition-all"
                        title={`Klik untuk memuat skenario dampak dari isu: "${trig.word}"`}
                      >
                        #{trig.word}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Crisis Simulator & Decision Engine (Layer 3 & 4) */}
              <div className="xl:col-span-7 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col h-[520px] justify-between relative overflow-hidden">
                
                {/* Micro-sparkle decor */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <div>
                      <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Sliders size={14} className="text-purple-400" />
                        🧠 DECISION TWIN SIMULATOR v2.0
                      </h3>
                      <p className="text-[8px] text-slate-500 font-mono uppercase mt-0.5">Layer 3 & 4: POLICY SCENARIO PROJECTIONS</p>
                    </div>
                    
                    <span className="text-[9px] font-mono bg-purple-950/30 border border-purple-850 text-purple-300 px-2 py-0.5 rounded-full">
                      APBN Target: deficit &lt; 3%
                    </span>
                  </div>

                  {/* Scenario selection Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    {[
                      { id: "hybrid", name: "3. Hybrid MBG + Transparansi + BLT", desc: "Makan gratis didistribusikan via koperasi desa (KDMP) didukung BLT bersasaran IID.", border: "border-emerald-500/30", color: "text-emerald-400" },
                      { id: "status_quo", name: "1. Status Quo (MBG Full Terpusat)", desc: "Makan gratis didorong serentak tanpa reformasi penargetan IID lokal.", border: "border-slate-800", color: "text-slate-400" },
                      { id: "bbm_subsidy", name: "2. Kurangi Subsidi BBM 20%", desc: "Pemangkasan subsidi BBM sepihak demi menyeimbangkan kas negara secara cepat.", border: "border-rose-500/10", color: "text-rose-400" },
                      { id: "eval_redirect", name: "4. Evaluasi & Penundaan MBG", desc: "Menunda MBG dan mengalihkan anggaran ke infrastruktur daerah & BPJS.", border: "border-purple-500/20", color: "text-purple-400" },
                    ].map(sc => (
                      <button
                        key={sc.id}
                        onClick={() => {
                          setSelectedIcosScenario(sc.id);
                          handleIcosRecalibrate();
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[85px] ${
                          selectedIcosScenario === sc.id
                            ? `bg-slate-900/90 border-purple-500 text-white shadow-lg ring-1 ring-purple-500/20`
                            : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/60"
                        }`}
                      >
                        <span className={`font-bold truncate text-[9.5px] ${sc.color}`}>{sc.name}</span>
                        <p className="text-[8px] text-slate-400 leading-normal mt-1 line-clamp-2">{sc.desc}</p>
                        {selectedIcosScenario === sc.id && (
                          <span className="text-[7.5px] text-purple-400 font-bold self-end bg-purple-950/50 px-1 py-0.1 border border-purple-850 rounded">TERPILIH</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Selected Scenario Dynamic advisory card */}
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-slate-400">STATUS MODEL AKTIF:</span>
                      <span className={`font-bold uppercase ${selectedIcosScenario === "hybrid" ? "text-emerald-400" : "text-amber-400"}`}>
                        {recommendationAlert}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono pt-1">
                      <div className="bg-slate-950 p-2 rounded-lg">
                        <span className="text-slate-500 text-[8px] uppercase">Pertumbuhan Riil</span>
                        <span className="font-bold text-white block mt-0.5">{econIndicator}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg">
                        <span className="text-slate-500 text-[8px] uppercase">Stabilitas Sosial</span>
                        <span className="font-bold text-white block mt-0.5">{socialIndicator}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg">
                        <span className="text-slate-500 text-[8px] uppercase">Ketegangan Politik</span>
                        <span className="font-bold text-white block mt-0.5">{polIndicator}</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro sliders adjustment */}
                  <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-3 space-y-2.5">
                    <span className="text-[8.5px] uppercase font-bold text-purple-400 font-mono block">
                      STRESS-TEST MICRO PARAMETERS (KRISIS SIMULATOR)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
                      {/* BBM Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[9px]">Suhu Harga BBM Subsidi</span>
                          <span className={`font-bold ${bbmSlider > 0 ? "text-rose-400" : bbmSlider < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                            {bbmSlider > 0 ? `+${bbmSlider}%` : `${bbmSlider}%`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          step="5"
                          value={bbmSlider}
                          onChange={(e) => {
                            setBbmSlider(parseInt(e.target.value));
                            handleIcosRecalibrate();
                          }}
                          className="w-full accent-purple-500 bg-slate-950 h-1 rounded cursor-pointer"
                        />
                      </div>

                      {/* MBG Scale Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[9px]">Penetrasi Anggaran MBG</span>
                          <span className="text-purple-300 font-bold">{mbgScaleSlider}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="150"
                          step="25"
                          value={mbgScaleSlider}
                          onChange={(e) => {
                            setMbgScaleSlider(parseInt(e.target.value));
                            handleIcosRecalibrate();
                          }}
                          className="w-full accent-purple-500 bg-slate-950 h-1 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Recalibrating state or Execute button */}
                <div className="mt-4 border-t border-slate-900 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[8.5px] font-mono text-slate-500">
                    * Perubahan parameter secara langsung melatih balik weights model Bayesian di latar belakang.
                  </div>
                  
                  <button
                    onClick={handleIcosRecalibrate}
                    disabled={isIcosRecalibrating}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center cursor-pointer ${
                      isIcosRecalibrating
                        ? "bg-purple-500/20 border border-purple-500/40 text-purple-400 cursor-wait animate-pulse"
                        : "bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 active:scale-95"
                    }`}
                  >
                    <Zap size={12} className={isIcosRecalibrating ? "animate-bounce text-purple-400" : "text-purple-300"} />
                    {isIcosRecalibrating ? "RE-CALIBRATING TWIN STATE..." : "JALANKAN MONTE CARLO"}
                  </button>
                </div>

              </div>

            </div>

            {/* Bottom Section: Layer 5 Feedback Loop telemetry */}
            <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 font-mono text-[10px]">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-2">
                🔄 LAYER 5 TELEMETRY: CONTINUOUS RETRAINING & LEARNING ENGINE
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Database size={16} />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] uppercase block">Synced Citizen Nodes (IID)</span>
                    <strong className="text-white text-xs">{totalEventsSynced.toLocaleString()} Perangkat Ter-sertifikasi</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Activity size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] uppercase block">Recalibration Event Rate</span>
                    <strong className="text-white text-xs">{(totalEventsSynced * 1.5 + 42).toFixed(0)} events / mnt</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-850 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Sliders size={16} />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] uppercase block">Auralang Recalibration Confidence</span>
                    <strong className="text-white text-xs">{(92.4 + (satisfactionVal - 7.2) * 1.1).toFixed(1)}% (Bayesian posterior)</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Tab Contents: Analytics tab */}
      {dashboardTab === "analytics" && (
        <>
          {/* Grid: Charts & Event Logs */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            
            {/* Real-time Ingestion Stream Logs */}
            <div className="xl:col-span-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Server size={14} className="text-cyan-400" />
                  NEUROSPHERE SPHERE FEED
                </h3>
                <span className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  Active Nodes
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px] font-mono">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-center p-4">
                    Menunggu kiriman event dari device...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-2 rounded-lg bg-slate-900/85 border border-slate-850 hover:border-slate-800 transition-all text-slate-300"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                          log.type === "VALIDATED" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : log.type === "DEDUPLICATED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : log.type === "REJECTED"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                          <Clock size={8} />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-[9px] font-bold text-slate-200">{log.message}</p>
                      
                      {log.details && (
                        <div className="mt-1 bg-slate-950 p-1 rounded text-[8px] text-slate-500 truncate max-w-full font-mono">
                          {log.details}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recharts Analytics Distributions */}
            <div className="xl:col-span-8 bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col min-h-[320px]">
              <h3 className="text-xs font-bold text-white font-mono mb-4 flex items-center gap-1.5">
                <Database size={14} className="text-purple-400" />
                SOVEREIGN PARTICIPATION VAULT (ACTIVE RECIPIENTS: {stats.totalHouseholds} IID)
              </h3>

              {eventStore.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-600 text-sm font-mono text-center">
                  Data kosong. Harap simulasikan data di telepon seluler.
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Education Chart (Bar) */}
                  <div className="flex flex-col h-[230px]">
                    <span className="text-[10px] font-mono text-slate-400 mb-1.5 text-center block">
                      DISTRIBUSI PENDIDIKAN TERAKHIR
                    </span>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.educationDistribution} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 8 }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 8 }} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontSize: 10, fontFamily: "monospace" }} 
                            labelStyle={{ color: "#ffffff" }}
                          />
                          <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                            {stats.educationDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Income Distribution (Pie) */}
                  <div className="flex flex-col h-[230px]">
                    <span className="text-[10px] font-mono text-slate-400 mb-1.5 text-center block">
                      KATEGORI PENDAPATAN BULANAN
                    </span>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-[140px] h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.incomeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={55}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {stats.incomeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontSize: 10, fontFamily: "monospace" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Custom legend */}
                      <div className="flex flex-col gap-1 text-[8px] font-mono text-slate-400 ml-2">
                        {stats.incomeDistribution.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }}></span>
                            <span className="truncate max-w-[130px]">{entry.name}: {entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* SECTION: 38 Provinces Real-time Federation Grid */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-400" />
                  🌐 FEDERASI DATA REAL-TIME 38 PROVINSI (MODEL JUNI 2026)
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Status Sinkronisasi Edge Nodes Republik Indonesia secara Real-time. Klik provinsi untuk mensimulasikan aliran aliran data sensus!
                </p>
              </div>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/simulate-province", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ all: true })
                    });
                    if (response.ok) {
                      onRefresh();
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer w-full lg:w-auto justify-center"
              >
                <Sparkles size={12} className="animate-spin text-purple-400" />
                SIMULASI MASSAL (38 PROVINSI)
              </button>
            </div>

            {/* Filter & Search Panel */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={13} />
                <input 
                  type="text"
                  placeholder="Cari nama provinsi atau kode wilayah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
              </div>

              {/* Cluster Filter Buttons */}
              <div className="flex flex-wrap gap-1">
                {(["Semua", "Sumatera", "Jawa", "Kalimantan", "Sulawesi", "BaliNusa", "Maluku", "Papua"] as const).map(cluster => (
                  <button
                    key={cluster}
                    onClick={() => setSelectedCluster(cluster)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all border cursor-pointer ${
                      selectedCluster === cluster 
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 font-bold" 
                        : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {cluster === "BaliNusa" ? "Bali & Nusa" : cluster}
                  </button>
                ))}
              </div>
            </div>

            {/* Provinces Grid Scroll Area */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[350px] overflow-y-auto pr-1">
              {filteredProvinces && filteredProvinces.map((prov) => {
                const hasData = prov.submissionsCount > 0;
                return (
                  <div
                    key={prov.id}
                    onClick={() => handleSimulateSingleProvince(prov.code)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none relative group overflow-hidden ${
                      hasData 
                        ? "bg-slate-900/95 border-cyan-500/30 shadow-lg shadow-cyan-950/20 hover:border-cyan-500/60" 
                        : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/50 hover:border-slate-800"
                    }`}
                    title={`Klik untuk mengirimkan simulasi data kependudukan ke Node ${prov.edgeNode}`}
                  >
                    {/* Glow for synchronized nodes */}
                    {hasData && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/10 rounded-full blur-md"></div>
                    )}

                    <div className="flex justify-between items-start mb-1 relative z-10">
                      <span className="text-[9px] font-mono text-slate-500 font-bold">
                        #{String(prov.id).padStart(2, '0')}
                      </span>
                      
                      {/* Status beacon indicator */}
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        hasData ? "bg-cyan-400 animate-pulse" : "bg-slate-700"
                      }`}></span>
                    </div>

                    <h4 className="text-[11px] font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors truncate">
                      {prov.name}
                    </h4>

                    <div className="flex justify-between items-center mt-1 text-[8px] font-mono">
                      <span className="text-slate-400 uppercase tracking-wider">{prov.code}</span>
                      <span className="text-slate-500">{prov.cluster === "BaliNusa" ? "Bali/Nusa" : prov.cluster}</span>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-850 flex items-center justify-between">
                      <span className="text-[8px] text-slate-500 font-mono font-medium">Events:</span>
                      <span className={`text-[10px] font-bold font-mono ${hasData ? "text-cyan-300" : "text-slate-600"}`}>
                        {prov.submissionsCount}
                      </span>
                    </div>

                    {hasData && (
                      <div className="mt-1 flex items-center justify-between text-[7px] font-mono text-slate-400">
                        <span>Kepuasan:</span>
                        <span className="font-bold text-slate-300">{prov.avgSatisfaction}/10</span>
                      </div>
                    )}

                    {/* Simulated action overlay */}
                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[8px] font-mono text-cyan-400 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        + Injeksi Data
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[9px] text-slate-500 font-mono flex flex-col sm:flex-row items-start sm:items-center gap-1.5 border-t border-slate-900 pt-2 justify-between">
              <span>* Klik sembarang provinsi di atas untuk mensimulasikan aliran data kepala keluarga dari edge device langsung ke node tersebut.</span>
              <span className="text-cyan-400 font-bold shrink-0">Total ter-federasi: {stats.provinces?.length || 0} Nodes</span>
            </div>
          </div>

          {/* Dynamic Gemini-powered AI Demographics Insights Auditor */}
          <div className="bg-slate-950/60 border border-cyan-950 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
            
            {/* Glow effect */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-cyan-400 animate-pulse" size={16} />
                <div>
                  <h3 className="text-xs font-bold text-white font-mono">
                    AI CENSUS AUDITOR (INTELLIGENCE REPORT)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Menganalisis anomali kependudukan & pemalsuan IID secara real-time via Gemini 3.5 Flash
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerAIAnalysis}
                disabled={isAnalyzing || eventStore.length === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  eventStore.length === 0 
                    ? "bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed"
                    : isAnalyzing
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 cursor-wait animate-pulse"
                    : "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 active:scale-95 shadow-md shadow-cyan-950/40"
                }`}
              >
                <Cpu size={13} />
                {isAnalyzing ? "MENGANALISIS..." : "JALANKAN AI AUDIT"}
              </button>
            </div>

            {/* AI Report Body */}
            <div className="relative z-10 min-h-[100px] flex flex-col justify-center">
              
              {isAnalyzing && (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin"></div>
                  </div>
                  <p className="text-xs font-mono text-cyan-400 animate-pulse">{loadingMsg}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">Menggunakan model gemini-3.5-flash</p>
                </div>
              )}

              {analysisError && (
                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs font-mono flex items-start gap-2">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Gagal Menghasilkan AI Audit</p>
                    <p className="text-[10px] text-slate-400 mt-1">{analysisError}</p>
                    <p className="text-[9px] text-slate-500 mt-1.5">
                      Tips: Tambahkan/perbarui kunci rahasia <strong className="text-slate-400">GEMINI_API_KEY</strong> Anda di menu <strong className="text-slate-400">Settings &gt; Secrets</strong> pada editor untuk mengaktifkan AI Auditor secara penuh.
                    </p>
                  </div>
                </div>
              )}

              {!isAnalyzing && !analysisError && !aiReport && (
                <div className="py-6 text-center text-slate-500 font-mono text-[10px]">
                  {eventStore.length === 0 ? (
                    "Harap simulasikan data kepala keluarga terlebih dahulu sebelum menjalankan audit."
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Sparkles size={16} className="text-slate-750" />
                      <span>Tekan tombol 'JALANKAN AI AUDIT' di atas untuk meluncurkan analisis prediktif Gemini.</span>
                    </div>
                  )}
                </div>
              )}

              {!isAnalyzing && aiReport && (
                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Executive Summary */}
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-mono block mb-1">
                      Ringkasan Eksekutif Sensus
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-900 font-mono text-[11px]">
                      {aiReport.summary}
                    </p>
                  </div>

                  {/* Anomalies & Risk Flags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-red-950/10 border border-red-500/15 p-3 rounded-xl">
                      <span className="text-[9px] uppercase tracking-wider text-red-400 font-mono font-bold flex items-center gap-1 mb-2">
                        <AlertTriangle size={11} />
                        Deteksi Anomali & Risiko Data
                      </span>
                      {aiReport.anomalies && aiReport.anomalies.length > 0 ? (
                        <ul className="space-y-1.5">
                          {aiReport.anomalies.map((item, idx) => (
                            <li key={idx} className="text-[10px] text-slate-300 font-mono flex items-start gap-1.5">
                              <span className="text-red-500 mt-1 shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-mono">Tidak ada anomali terdeteksi dalam dataset aktif.</p>
                      )}
                    </div>

                    {/* Strategic Policy Recommendations */}
                    <div className="bg-emerald-950/10 border border-emerald-500/15 p-3 rounded-xl">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-bold flex items-center gap-1 mb-2">
                        <Lightbulb size={11} />
                        Rekomendasi Kebijakan Publik
                      </span>
                      {aiReport.recommendations && aiReport.recommendations.length > 0 ? (
                        <ul className="space-y-1.5">
                          {aiReport.recommendations.map((item, idx) => (
                            <li key={idx} className="text-[10px] text-slate-300 font-mono flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-1 shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-mono">Belum ada rekomendasi kebijakan dirumuskan.</p>
                      )}
                    </div>
                  </div>

                  {/* Timestamp footer */}
                  <div className="text-[8px] text-slate-600 font-mono text-right">
                    Laporan dibuat oleh AI Auditor pada {new Date(aiReport.timestamp).toLocaleString("id-ID")}
                  </div>

                </div>
              )}

            </div>

          </div>
        </>
      )}

      {/* Tab Contents: Policy Simulation Tab */}
      {dashboardTab === "simulation" && (
        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 lg:p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Sliders className="text-purple-400" size={18} />
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Interactive Policy Simulation Engine (ARGI Core)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Simulasikan pengaruh langsung dari modifikasi regulasi nasional terhadap indikator kependudukan makro.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sliders Area (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-5">
              <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                Parameter Kebijakan Nasional
              </h4>

              {/* Slider 1: Pajak */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Penyesuaian Pajak Penghasilan</span>
                  <span className={`font-bold ${taxRate > 0 ? "text-red-400" : taxRate < 0 ? "text-emerald-400" : "text-slate-400"}`}>
                    {taxRate > 0 ? `+${taxRate}%` : `${taxRate}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>-10% (Insentif Pajak)</span>
                  <span>+10% (Retribusi Maksimal)</span>
                </div>
              </div>

              {/* Slider 2: Subsidi */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Subsidi Sektor Sosial & UMKM</span>
                  <span className="text-purple-400 font-bold">
                    Rp {subsidy} Triliun
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={subsidy}
                  onChange={(e) => setSubsidy(parseInt(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Rp 0T (Austeritas)</span>
                  <span>Rp 500T (Ekspansi Maksimal)</span>
                </div>
              </div>

              {/* Slider 3: Anggaran Pendidikan */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Alokasi Anggaran Pendidikan</span>
                  <span className="text-purple-400 font-bold">
                    {educationBudget}% dari APBN
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  value={educationBudget}
                  onChange={(e) => setEducationBudget(parseInt(e.target.value))}
                  className="w-full accent-purple-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>10% (Alokasi Dasar)</span>
                  <span>35% (Reformasi Pendidikan)</span>
                </div>
              </div>

              {/* Select 4: Intervensi Ekonomi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-300 block">Intensitas Intervensi Ekonomi Sektoral</label>
                <select
                  value={economicIntervention}
                  onChange={(e: any) => setEconomicIntervention(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500/50 font-mono"
                >
                  <option value="low">Rendah (Laissez-Faire / Pasar Bebas)</option>
                  <option value="mid">Sedang (Intervensi Regulasi Seimbang)</option>
                  <option value="high">Tinggi (Kedaulatan Ekonomi Penuh / Proteksionisme)</option>
                </select>
                <p className="text-[9px] text-slate-500 font-mono leading-relaxed">
                  Memandu cara Auralang Protocol memvalidasi keseimbangan sirkulasi insentif di setiap Neuro Nodes.
                </p>
              </div>

              <button
                onClick={handleSimulatePolicy}
                disabled={isSimulatingPolicy}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSimulatingPolicy
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-400 cursor-wait animate-pulse"
                    : "bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 shadow-md shadow-purple-950/20"
                }`}
              >
                <Cpu size={13} className={isSimulatingPolicy ? "animate-spin" : ""} />
                {isSimulatingPolicy ? "MENGALIRKAN SIMULASI..." : "JALANKAN SIMULASI MODEL"}
              </button>
            </div>

            {/* Results Area (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900/20 border border-slate-850 rounded-2xl p-4 min-h-[350px]">
              {policyResults ? (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
                      Hasil Simulasi Perekonomian & Ketahanan Nasional
                    </h4>

                    {/* Indicators meters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* GDP */}
                      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 text-center">
                        <span className="text-[8px] uppercase text-slate-400 font-mono block">GDP Impact</span>
                        <span className={`text-lg font-extrabold font-mono block mt-1 ${policyResults.gdpImpact >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {policyResults.gdpImpact >= 0 ? `+${policyResults.gdpImpact}%` : `${policyResults.gdpImpact}%`}
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono">Dampak PDB Tahunan</span>
                      </div>

                      {/* Poverty */}
                      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 text-center">
                        <span className="text-[8px] uppercase text-slate-400 font-mono block">Kemiskinan</span>
                        <span className={`text-lg font-extrabold font-mono block mt-1 ${policyResults.povertyImpact <= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {policyResults.povertyImpact > 0 ? `+${policyResults.povertyImpact}%` : `${policyResults.povertyImpact}%`}
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono">Perubahan Rasio</span>
                      </div>

                      {/* Inflation */}
                      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 text-center">
                        <span className="text-[8px] uppercase text-slate-400 font-mono block">Inflasi</span>
                        <span className={`text-lg font-extrabold font-mono block mt-1 ${policyResults.inflationImpact > 2.5 ? "text-amber-400" : "text-cyan-400"}`}>
                          +{policyResults.inflationImpact}%
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono">Perkiraan Kenaikan</span>
                      </div>

                      {/* Social Stability */}
                      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 text-center">
                        <span className="text-[8px] uppercase text-slate-400 font-mono block">Skor Stabilitas</span>
                        <span className="text-lg font-extrabold font-mono text-purple-400 block mt-1">
                          {policyResults.stabilityScore}/100
                        </span>
                        <span className="text-[7px] text-slate-500 font-mono">Tingkat Kondusifitas</span>
                      </div>
                    </div>

                    {/* Commentary */}
                    <div className="bg-slate-950/60 border border-purple-950/40 p-4 rounded-xl space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
                      <span className="text-[9px] uppercase tracking-wider text-purple-400 font-mono font-bold flex items-center gap-1">
                        <Sparkles size={11} className="text-purple-400" />
                        Analisis Dampak ARGI Guard Core
                      </span>
                      <p className="text-[11px] text-slate-300 font-mono leading-relaxed relative z-10">
                        {policyResults.commentary}
                      </p>
                    </div>
                  </div>

                  <div className="text-[8px] text-slate-600 font-mono text-right border-t border-slate-850 pt-2">
                    * Simulasi dieksekusi secara real-time berdasarkan data sensus warga ter-konsensus.
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Gauge size={32} className="text-slate-700 animate-pulse" />
                  <h4 className="text-xs font-bold text-slate-400 font-mono">Model Belum Dieksekusi</h4>
                  <p className="text-[10px] text-slate-500 font-mono max-w-sm leading-normal">
                    Atur parameter kebijakan publik di panel sebelah kiri lalu jalankan simulasi model AI untuk melihat dampaknya langsung pada stabilitas dan perekonomian nasional.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Architecture Blueprints */}
      {dashboardTab === "architecture" && (
        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 lg:p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <Layers className="text-amber-400" size={18} />
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                NeuroSphere Civic Intelligence & Policy Operating System (NCIP-OS v2.0) Blueprints
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Arsitektur sistem kepemerintahan digital skala nasional (300M+ warga) tahan-uji, terdistribusi, dan zero-trust.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Nav within tab */}
            <div className="md:col-span-3 bg-slate-900/30 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1 text-[10px] font-mono h-fit">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-2 py-1.5 border-b border-slate-850 mb-1">
                LAYER ARSITEKTUR v2.0
              </span>
              
              <button
                type="button"
                onClick={() => setArchitectureSubTab("topology")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "topology"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Layers size={12} className="shrink-0" />
                <span>1. Topology Flow</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("datamodels")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "datamodels"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Database size={12} className="shrink-0" />
                <span>2. Data Models (SQL)</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("apispec")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "apispec"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Sliders size={12} className="shrink-0" />
                <span>3. API Gateway Spec</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("aiml")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "aiml"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Cpu size={12} className="shrink-0" />
                <span>4. AI/ML Engine Specs</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("kubernetes")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "kubernetes"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Server size={12} className="shrink-0" />
                <span>5. Kubernetes YAML</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("observability")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "observability"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Gauge size={12} className="shrink-0" />
                <span>6. Observability Stack</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("security")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "security"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <ShieldAlert size={12} className="shrink-0" />
                <span>7. Security Model</span>
              </button>

              <button
                type="button"
                onClick={() => setArchitectureSubTab("flow")}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                  architectureSubTab === "flow"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold"
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/20"
                }`}
              >
                <Clock size={12} className="shrink-0" />
                <span>8. End-to-End Flow</span>
              </button>
            </div>

            {/* Blueprints Display Panel */}
            <div className="md:col-span-9 bg-slate-900/20 border border-slate-850 rounded-xl p-4 text-[11px] font-mono leading-relaxed max-h-[500px] overflow-y-auto pr-2">
              
              {/* Section 1: Topology */}
              {architectureSubTab === "topology" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={13} className="text-amber-400" />
                    1. Core System Topology Diagram (NCIP-OS v2.0)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Sistem arsitektur dari Edge (mobile warga) hingga ke Core Cloud (analitik & simulasi kebijakan makro) secara real-time.
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg text-[9px] text-cyan-400 overflow-x-auto leading-normal border border-slate-850">
{`+-------------------------------------------------------------+
|                      EDGE LAYER                             |
|  Citizen Mobile App ---> Encrypted Local Storage (AES-256) |
|                            |                                |
|                            +--> Sovereign Identity (IID)    |
+----------------------------|--------------------------------+
                             v
+-------------------------------------------------------------+
|                     API GATEWAY (Kong)                      |
|         TLS 1.3 / IID Cryptographic Auth & Rate Limiting   |
+----------------------------|--------------------------------+
                             v
+-------------------------------------------------------------+
|               EVENT STREAMING BACKBONE                      |
|       Redpanda / Kafka Event Streams (10M/sec telemetry)    |
+----------------------------|--------------------------------+
                             v
              +--------------+--------------+
              |                             |
              v                             v
+---------------------------+ +-------------------------------+
|         AI LAYER          | |          DATA LAYER           |
|  ARGI Validation Engine   | |     Single Source of Truth    |
|   (Confidence scoring,    | |     - PostgreSQL (Structured) |
|    demographic anomalies, | |     - ClickHouse (OLAP engine)|
|    fraud detection filters) | |    - GCS Data Lake (Immutable)|
+-------------|-------------+ +-------------|-----------------+
              |                             |
              +--------------+--------------+
                             v
+-------------------------------------------------------------+
|                 POLICY SIMULATION ENGINE                    |
|        Dynamic Subsidy & Tax Optimization Scenarios (ARGI)  |
+----------------------------|--------------------------------+
                             v
+-------------------------------------------------------------+
|                     CIVIC OPERATIONS                        |
|   Real-Time Government Dashboard (NCIP-OS v2.0 Console)     |
|   Feedback Loop -> Automated Continuous AI Retraining       |
+-------------------------------------------------------------+`}
                  </pre>
                </div>
              )}

              {/* Section 2: Data Models */}
              {architectureSubTab === "datamodels" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Database size={13} className="text-amber-400" />
                    2. Hybrid Database Schema Design
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Definisi skema PostgreSQL untuk kedaulatan data transaksional warga dan skema analitik ClickHouse untuk agregasi real-time.
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg text-[9px] text-purple-400 overflow-x-auto leading-normal border border-slate-850">
{`-- SQL Hybrid Schema for NCIP-OS v2.0 SSOT Layer
CREATE TABLE households (
  id VARCHAR(64) PRIMARY KEY, -- Hash ID dari cluster wilayah
  members_count INT NOT NULL DEFAULT 1,
  address_registered TEXT NOT NULL,
  housing_type VARCHAR(32) NOT NULL -- OWNED, RENT, LEASE
);

CREATE TABLE citizens (
  iid VARCHAR(64) PRIMARY KEY, -- Sovereign Identity KYC L2 Hash
  name VARCHAR(128) NOT NULL,
  province_code VARCHAR(16) NOT NULL,
  household_id VARCHAR(64) REFERENCES households(id),
  employment_status VARCHAR(32) NOT NULL, -- EMPLOYED, UNEMPLOYED, INFORMAL
  education_level VARCHAR(32) NOT NULL, -- PRIMARY, SECONDARY, UNIVERSITY, NONE
  income_range VARCHAR(16) NOT NULL, -- LOW, MID, HIGH
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE population_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iid VARCHAR(64) REFERENCES citizens(iid),
  event_type VARCHAR(32) NOT NULL, -- INCOME_CHANGE, MOBILITY_EVENT, HOUSEHOLD_UPDATE
  payload JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  signature VARCHAR(256) NOT NULL, -- Cryptographic signature from mobile key
  source VARCHAR(32) DEFAULT 'mobile'
);

-- ClickHouse Columnar Table definition for fast analytical telemetry
CREATE TABLE analytics.citizen_telemetry (
  iid String,
  province LowCardinality(String),
  income_range LowCardinality(String),
  employment UInt8,
  education_level LowCardinality(String),
  timestamp DateTime
) ENGINE = MergeTree()
ORDER BY (province, education_level, timestamp);`}
                  </pre>
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase mb-1">JSON SPEC: IDENTITY META (IID)</span>
                    <pre className="text-[8.5px] text-slate-300">
{`{
  "iid": "IID-REG-IDN-98A8F2C7",
  "status": "ACTIVE",
  "verification_level": "KYC_L2",
  "signature_proof": "0x3f5b721869e9c3da7...",
  "hardware_attestation": "secure_element_android_v4"
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Section 3: REST API Gateway */}
              {architectureSubTab === "apispec" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sliders size={13} className="text-amber-400" />
                    3. Gateway API Endpoint Specifications
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Definisi core endpoints REST + WebSocket dengan tingkat pengamanan zero-trust untuk menampung data dari 38 edge nodes.
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg text-[9px] text-amber-400 overflow-x-auto leading-normal border border-slate-850">
{`/* NCIP-OS API Gateway Routing Spec */

// 1. Ingestion of Citizen Profile Updates
POST /api/v2/citizen/update
Headers: {
  "Authorization": "IID-Signature <sha256_proof>",
  "X-Device-Attestation": "hardware_provable"
}
Body: {
  "iid": "IID-REG-IDN-98A8F2C7",
  "name": "Arka Putra",
  "province_code": "JABAR",
  "employment_status": "EMPLOYED",
  "education_level": "UNIVERSITY",
  "income_range": "MID",
  "household_id": "HH-WESTJAVA-99214"
}
Response: 202 Accepted { "job_id": "ingest_job_77218", "status": "queued" }


// 2. Direct Kafka Event Ingestion Stream
POST /api/v2/event/ingest
Body: {
  "event_id": "b18ca094-1182-4161-9da2-a391fb023241",
  "iid": "IID-REG-IDN-98A8F2C7",
  "type": "INCOME_CHANGE",
  "payload": { "previous_range": "LOW", "new_range": "MID" },
  "timestamp": 1782299402,
  "source": "mobile"
}


// 3. Retrieve Crytographically Verified Citizen
GET /api/v2/citizen/IID-REG-IDN-98A8F2C7
Response: 200 OK
{
  "iid": "IID-REG-IDN-98A8F2C7",
  "status": "ACTIVE",
  "verification_level": "KYC_L2"
}


// 4. Live Telemetry metrics for dashboard
GET /api/v2/dashboard/live
WebSocket: ws://api.neurosphere.gov/v2/live-telemetry
Payload Output: { "rate_per_sec": 12891, "active_validators": 38 }


// 5. ClickHouse Analytics Data Query
GET /api/v2/analytics/population?province=DKI
Response: 200 OK { "avg_household_size": 3.4, "employment_rate": 92.1 }


// 6. Policy Simulation Engine Model Trigger
POST /api/v2/policy/simulate
Body: {
  "taxRate": 2,
  "subsidy": 250,
  "educationBudget": 22,
  "economicIntervention": "mid"
}`}
                  </pre>
                </div>
              )}

              {/* Section 4: AI/ML Architecture Design */}
              {architectureSubTab === "aiml" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Cpu size={13} className="text-amber-400" />
                    4. AI/ML Deep Intelligence Layer Design
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Sistem peramalan sosio-ekonomi dan deteksi anomali fraud kependudukan terdistribusi (ARGI Core).
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-cyan-400 font-bold block uppercase mb-1">A. Socioeconomic & Mobility Models</span>
                      <p className="text-[8px] text-slate-400 leading-normal mb-1">
                        - <strong>Poverty Prediction:</strong> Model XGBoost terlatih memetakan kemiskinan regional per sub-sektor di 38 provinsi.
                      </p>
                      <p className="text-[8px] text-slate-400 leading-normal mb-1">
                        - <strong>Mobility & Urban Pressure:</strong> Jaringan syaraf LSTM menganalisis data aliran migrasi untuk memprediksi tekanan infrastruktur urbanisasi.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-purple-400 font-bold block uppercase mb-1">B. Fraud Detection & Policy Sim</span>
                      <p className="text-[8px] text-slate-400 leading-normal mb-1">
                        - <strong>Cross-Source Fraud AI:</strong> Deteksi deviasi abnormal antara data pendapatan terlaporkan dengan profil kepemilikan aset warga.
                      </p>
                      <p className="text-[8px] text-slate-400 leading-normal mb-1">
                        - <strong>Policy Simulation AI:</strong> Engine Transformer memodelkan dampak multivariat fiskal dari pajak & anggaran pendidikan terhadap tingkat inflasi.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2">
                    <span className="text-[9px] text-amber-400 font-bold block uppercase">5.1 - 5.3 MLOps Pipeline Specification</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[8px]">
                      <div className="border border-slate-800 p-2 rounded bg-slate-900/40">
                        <strong className="text-white block mb-0.5">5.1 Training Pipeline</strong>
                        Hadoop/Spark batch training + Kafka Streaming Feature Store dengan model registry MLflow terpusat.
                      </div>
                      <div className="border border-slate-800 p-2 rounded bg-slate-900/40">
                        <strong className="text-white block mb-0.5">5.2 Inference Pipeline</strong>
                        Triton Inference Server mem-hosting bobot model terkompilasi TensorRT. Latency target &lt;150ms.
                      </div>
                      <div className="border border-slate-800 p-2 rounded bg-slate-900/40">
                        <strong className="text-white block mb-0.5">5.3 Feedback Loop</strong>
                        Penyimpangan hasil prediksi model vs realitas sensus memicu otomatisasi pipelines retraining dVC.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Kubernetes Deployment */}
              {architectureSubTab === "kubernetes" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Server size={13} className="text-amber-400" />
                    5. Kubernetes Production Infrastructure Manifests
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Definisi manifest k8s berstandar tinggi untuk deployment API gateway, StatefulSet Kafka, AI Pods, dan autoscaler.
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg text-[9px] text-green-400 overflow-x-auto leading-normal border border-slate-850">
{`# NCIP-OS Production Infrastructure Declarations
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ncip-api-gateway
  namespace: ncip-system
spec:
  replicas: 4
  selector:
    matchLabels:
      app: ncip-api-gateway
  template:
    metadata:
      labels:
        app: ncip-api-gateway
        sidecar.istio.io/inject: "true"
    spec:
      containers:
      - name: kong-gateway
        image: kong:3.4-alpine
        ports:
        - containerPort: 8000
        resources:
          limits: { cpu: "4", memory: "8Gi" }
          requests: { cpu: "1", memory: "2Gi" }
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ncip-kafka-eventbus
  namespace: ncip-system
spec:
  serviceName: kafka-service
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels: { app: kafka }
    spec:
      containers:
      - name: kafka-broker
        image: confluentinc/cp-kafka:7.4.0
        ports:
        - containerPort: 9092
        volumeMounts:
        - name: kafka-storage
          mountPath: /var/lib/kafka/data
  volumeClaimTemplates:
  - metadata: { name: kafka-storage }
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources: { requests: { storage: "100Gi" } }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ncip-argi-ai-pods
  namespace: ncip-system
spec:
  replicas: 8
  selector:
    matchLabels:
      app: argi-ai-inference
  template:
    metadata:
      labels: { app: argi-ai-inference }
    spec:
      containers:
      - name: ai-engine
        image: gcr.io/neurosphere/argi-core:v2.0
        resources:
          limits: { nvidia.com/gpu: "1", memory: "16Gi" }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ncip-gateway-hpa
  namespace: ncip-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ncip-api-gateway
  minReplicas: 4
  maxReplicas: 40
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }`}
                  </pre>
                </div>
              )}

              {/* Section 6: Observability */}
              {architectureSubTab === "observability" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Gauge size={13} className="text-amber-400" />
                    6. Observability, Telemetry & Monitoring Stack
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Konfigurasi multi-region prometheus scraper dan target visualisasi metrik sirkulasi event bus di dashboard Grafana.
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg text-[9px] text-red-400 overflow-x-auto leading-normal border border-slate-850">
{`# Prometheus Scrape Target Configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ncip-kafka-brokers'
    static_configs:
      - targets: ['kafka-0.kafka-service.ncip-system.svc.cluster.local:7071']
        labels:
          tier: 'event-backbone'

  - job_name: 'ncip-argi-inference'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: argi-ai-inference

# Grafana Dashboard Config Block
dashboard:
  panels:
    - title: "Event Ingestion Throughput"
      type: "timeseries"
      targets:
        - expr: "sum(rate(kafka_server_brokertopicmetrics_messagesin_total[5m]))"
          legendFormat: "events/sec"
    - title: "ARGI Inference Latency"
      type: "gauge"
      targets:
        - expr: "histogram_quantile(0.99, sum(rate(argi_inference_latency_seconds_bucket[5m])) by (le))"
          legendFormat: "p99 latency"`}
                  </pre>
                </div>
              )}

              {/* Section 7: Security Model */}
              {architectureSubTab === "security" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert size={13} className="text-amber-400" />
                    7. Security & Cryptographic Architecture
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Sistem proteksi kedaulatan data nasional dari hulu ke hilir berprinsip Zero-Trust Security.
                  </p>
                  
                  <div className="space-y-2 text-[9px] text-slate-300">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                      <strong className="text-white block mb-0.5">A. Cryptographic Sovereign Identity (IID)</strong>
                      Setiap warga memegang pasangan kunci asimetris pada secure element gawai mereka. Pembaruan data sensus wajib ditandatangani menggunakan algoritma Ed25519 untuk menolak pemalsuan identitas sipil.
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                      <strong className="text-white block mb-0.5">B. Transport Layer Security & REST Encryption</strong>
                      Seluruh komunikasi data dienkripsi dengan standar TLS 1.3 dalam transit. Payload pada Sovereign Data Vault dienkripsi lokal menggunakan standard industri AES-256 GCM dengan dekripsi terkontrol hanya di dalam Secure Guard core AI.
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                      <strong className="text-white block mb-0.5">C. Role-Based Access Control (RBAC) & Immutable Logs</strong>
                      Akses personil kepemerintahan dibatasi ketat melalui RBAC. Setiap tindakan administrasi dicatat pada append-only log digital nasional yang tidak dapat dimanipulasi untuk tujuan audit ketat.
                    </div>
                  </div>
                </div>
              )}

              {/* Section 8: Flow explanation */}
              {architectureSubTab === "flow" && (
                <div className="space-y-3 animate-fade-in">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-400" />
                    8. End-to-End System Data Flow Explanation
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Siklus hidup pergerakan data sensus terdistribusi secara lengkap dari awal hingga feedback loop pelatihan model:
                  </p>

                  <ol className="space-y-2 text-[9px] text-slate-300 list-decimal pl-4">
                    <li>
                      <strong className="text-white">Citizen Mobile App:</strong> Warga memperbarui profil (pendapatan, lokasi, pendidikan) di gawai mereka secara offline-first.
                    </li>
                    <li>
                      <strong className="text-white">Edge Encrypted Storage:</strong> Data disimpan sementara dalam format terenkripsi asimetris di database SQLite lokal perangkat.
                    </li>
                    <li>
                      <strong className="text-white">API Gateway:</strong> Ketika jaringan tersambung, batch data ditransmisikan lewat TLS 1.3 ke Kong API Gateway untuk validasi tanda tangan kependudukan.
                    </li>
                    <li>
                      <strong className="text-white">Event Stream (Kafka/Redpanda):</strong> Ingestion gateway menaruh event ke Kafka queue dengan kecepatan jutaan paket per detik.
                    </li>
                    <li>
                      <strong className="text-white">AI Validation Layer:</strong> Pods ARGI memilah event dari Kafka, menjalankan validasi duplikasi, deteksi anomali fraud, dan melabeli skor konfidensi.
                    </li>
                    <li>
                      <strong className="text-white">SSOT Database:</strong> Record divalidasi disimpan di PostgreSQL (canonical) dan ClickHouse (OLAP analitik).
                    </li>
                    <li>
                      <strong className="text-white">Analytics Engine:</strong> Kueri analitik cepat berjalan di atas tabel columnar ClickHouse untuk konsumsi visual real-time.
                    </li>
                    <li>
                      <strong className="text-white">Policy Simulation Engine:</strong> Data analitik dievaluasi oleh simulator model AI makro guna mengukur efisiensi subsidi dan pajak.
                    </li>
                    <li>
                      <strong className="text-white">Government Dashboard:</strong> Pemimpin negara memantau anomali nasional, tren demografi, dan mensimulasikan reformasi APBN secara visual.
                    </li>
                    <li>
                      <strong className="text-white">Feedback Loop:</strong> Penyimpangan metrik proyeksi vs kenyataan memicu retraining model AI secara kontinu demi presisi kebijakan mendatang.
                    </li>
                  </ol>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Sovereign Social Media Intelligence Pipeline */}
      {dashboardTab === "social" && (() => {
        const socialData = stats.socialIntelligence || {
          config: {
            sampleSize: 500000,
            weights: { x: 30, tiktok: 25, instagram: 20, youtube: 15, facebook: 10 },
            activeFilter: "Semua"
          },
          issues: [],
          metrics: {
            totalCrawled: 500000,
            pipelineConfidence: 0.94,
            averageSentiment: 0.58,
            lastRunTimestamp: Date.now() - 3600000
          }
        };

        const currentWeights = socialData.config.weights;
        const weightsSum = socialWeights.x + socialWeights.tiktok + socialWeights.instagram + socialWeights.youtube + socialWeights.facebook;

        // Handler to execute pipeline
        const handleTriggerPipeline = async () => {
          if (isCrawlingPipeline) return;
          setIsCrawlingPipeline(true);
          setPipelineProgress(10);
          
          const logsQueue = [
            `[${new Date().toLocaleTimeString()}] [PIPELINE] Memulai siklus penyerapan data media sosial Indonesia...`,
            `[${new Date().toLocaleTimeString()}] [INGESTION] Menghubungkan ke API X Stream Indonesia (Active Filter: "${socialFilter}")...`,
            `[${new Date().toLocaleTimeString()}] [INGESTION] Mengaktifkan TikTok Trending ID API Scraper...`,
            `[${new Date().toLocaleTimeString()}] [INGESTION] Mengunduh riwayat Reels & Hashtags Instagram (ID)...`,
            `[${new Date().toLocaleTimeString()}] [INGESTION] Menyelaraskan feed trending YouTube ID & diskusi Facebook Public Pages...`,
            `[${new Date().toLocaleTimeString()}] [PROCESSING] Berhasil menyerap postingan kasar. Memulai sampling koefisien kependudukan...`,
            `[${new Date().toLocaleTimeString()}] [PROCESSING] Menerapkan Bayesian Sentiment Analysis & pembobotan platform (X: ${socialWeights.x}%, TikTok: ${socialWeights.tiktok}%, IG: ${socialWeights.instagram}%, YT: ${socialWeights.youtube}%, FB: ${socialWeights.facebook}%)...`,
            `[${new Date().toLocaleTimeString()}] [PROCESSING] Mengkalkulasi polaritas emosional sentimen publik Nusantara...`,
            `[${new Date().toLocaleTimeString()}] [PIPELINE] Rekalibrasi National Digital Twin v2.0 berhasil diselesaikan.`
          ];

          setPipelineLogs([logsQueue[0]]);

          const addNextLog = (idx: number, progress: number) => {
            setTimeout(() => {
              setPipelineProgress(progress);
              setPipelineLogs(prev => [...prev, logsQueue[idx]]);
              
              if (idx < logsQueue.length - 1) {
                addNextLog(idx + 1, progress + 11);
              } else {
                // Complete on backend
                executeBackendPipeline();
              }
            }, 300);
          };

          const executeBackendPipeline = async () => {
            try {
              const response = await fetch("/api/social-intelligence/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sampleSize: socialSampleSize,
                  weights: socialWeights,
                  activeFilter: socialFilter
                })
              });
              if (response.ok) {
                onRefresh(); // fetch new computed stats
                setPipelineProgress(100);
                setTimeout(() => {
                  setIsCrawlingPipeline(false);
                }, 500);
              } else {
                setPipelineLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Gagal menyinkronkan data dengan pusat kependudukan.`]);
                setIsCrawlingPipeline(false);
              }
            } catch (err) {
              setPipelineLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] Gangguan koneksi API Gateway: Gagal menghubungi server.`]);
              setIsCrawlingPipeline(false);
            }
          };

          addNextLog(1, 20);
        };

        const platformColors: { [key: string]: string } = {
          X: "#0284c7", // blue
          TikTok: "#ec4899", // pink
          Instagram: "#a855f7", // purple
          YouTube: "#ef4444", // red
          Facebook: "#3b82f6" // indigo
        };

        const platformColorText: { [key: string]: string } = {
          X: "text-sky-400 border-sky-500/20 bg-sky-500/5",
          TikTok: "text-pink-400 border-pink-500/20 bg-pink-500/5",
          Instagram: "text-purple-400 border-purple-500/20 bg-purple-500/5",
          YouTube: "text-rose-400 border-rose-500/20 bg-rose-500/5",
          Facebook: "text-blue-400 border-blue-500/20 bg-blue-500/5"
        };

        // Platform distribution data for chart
        const platformPieData = [
          { name: "X (Twitter)", value: Math.round(socialSampleSize * (socialWeights.x / Math.max(1, weightsSum))), fill: "#0284c7" },
          { name: "TikTok ID", value: Math.round(socialSampleSize * (socialWeights.tiktok / Math.max(1, weightsSum))), fill: "#ec4899" },
          { name: "Instagram ID", value: Math.round(socialSampleSize * (socialWeights.instagram / Math.max(1, weightsSum))), fill: "#a855f7" },
          { name: "YouTube ID", value: Math.round(socialSampleSize * (socialWeights.youtube / Math.max(1, weightsSum))), fill: "#ef4444" },
          { name: "Facebook ID", value: Math.round(socialSampleSize * (socialWeights.facebook / Math.max(1, weightsSum))), fill: "#3b82f6" }
        ];

        return (
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 lg:p-6 flex flex-col gap-6">
            
            {/* Tab header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-sky-400" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Sovereign Social Media Intelligence Pipeline
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Model kecerdasan opini publik berbasis sampling terbobot platform sosial Indonesia (Indonesia-First).
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-[9px]">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Uptime Scrapers: 96.4%
                </div>
                <div className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-md">
                  Confidence Score: {Math.round(socialData.metrics.pipelineConfidence * 100)}%
                </div>
              </div>
            </div>

            {/* Layout grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Config Panel */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-350 font-mono border-b border-slate-900 pb-2 flex items-center gap-1.5">
                    <Sliders size={13} className="text-sky-400" />
                    KONFIGURASI PIPELINE & SAMPLING
                  </h4>

                  {/* Sample size */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-450">Sample Size (Jumlah Post)</span>
                      <span className="text-sky-400 font-bold">{socialSampleSize.toLocaleString("id-ID")} Posts</span>
                    </div>
                    <input 
                      type="range" 
                      min={100000} 
                      max={2000000} 
                      step={10000}
                      value={socialSampleSize}
                      disabled={isCrawlingPipeline}
                      onChange={(e) => setSocialSampleSize(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-[8px] text-slate-500 font-mono">
                      Makin besar sample, makin akurat statistik (proses crawling memakan waktu CPU).
                    </span>
                  </div>

                  {/* Active filter category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-slate-450">Filter Keyword / Kategori</label>
                    <select
                      value={socialFilter}
                      disabled={isCrawlingPipeline}
                      onChange={(e) => setSocialFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-mono px-3 py-2 text-slate-300 focus:outline-none focus:border-sky-500 w-full disabled:opacity-50"
                    >
                      <option value="Semua">Semua Isu Nasional</option>
                      <option value="Ekonomi">Sektor Ekonomi & Pangan</option>
                      <option value="Politik">Aktivitas Politik & Hukum</option>
                      <option value="Pendidikan">Sektor Pendidikan & AI</option>
                      <option value="Infrastruktur">Sektor Infrastruktur & Air Bersih</option>
                      <option value="Sosial">Isu Sosial & Kesejahteraan</option>
                    </select>
                  </div>

                  {/* Platform Weights Sliders */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-[10px] font-mono">
                      <span className="text-slate-450">Bobot Distribusi Platform (Total: {weightsSum}%)</span>
                      {weightsSum !== 100 && (
                        <span className="text-amber-500 text-[8px] uppercase animate-pulse">Akan di-normalisasi</span>
                      )}
                    </div>

                    {/* X Weight */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-sky-400">X (Twitter Stream)</span>
                        <span>{socialWeights.x}%</span>
                      </div>
                      <input 
                        type="range" min={0} max={100} value={socialWeights.x}
                        disabled={isCrawlingPipeline}
                        onChange={(e) => setSocialWeights(prev => ({ ...prev, x: Number(e.target.value) }))}
                        className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    {/* TikTok Weight */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-pink-400">TikTok Trending</span>
                        <span>{socialWeights.tiktok}%</span>
                      </div>
                      <input 
                        type="range" min={0} max={100} value={socialWeights.tiktok}
                        disabled={isCrawlingPipeline}
                        onChange={(e) => setSocialWeights(prev => ({ ...prev, tiktok: Number(e.target.value) }))}
                        className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    {/* Instagram Weight */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-purple-400">Instagram Reels & Hashtags</span>
                        <span>{socialWeights.instagram}%</span>
                      </div>
                      <input 
                        type="range" min={0} max={100} value={socialWeights.instagram}
                        disabled={isCrawlingPipeline}
                        onChange={(e) => setSocialWeights(prev => ({ ...prev, instagram: Number(e.target.value) }))}
                        className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    {/* YouTube Weight */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-rose-400">YouTube Trends</span>
                        <span>{socialWeights.youtube}%</span>
                      </div>
                      <input 
                        type="range" min={0} max={100} value={socialWeights.youtube}
                        disabled={isCrawlingPipeline}
                        onChange={(e) => setSocialWeights(prev => ({ ...prev, youtube: Number(e.target.value) }))}
                        className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    {/* Facebook Weight */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-blue-400">Facebook Public Discourse</span>
                        <span>{socialWeights.facebook}%</span>
                      </div>
                      <input 
                        type="range" min={0} max={100} value={socialWeights.facebook}
                        disabled={isCrawlingPipeline}
                        onChange={(e) => setSocialWeights(prev => ({ ...prev, facebook: Number(e.target.value) }))}
                        className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Run pipeline button */}
                  <button
                    onClick={handleTriggerPipeline}
                    disabled={isCrawlingPipeline}
                    className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold font-mono text-[10px] py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCrawlingPipeline ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        RUNNING SOCIAL PIPELINE ({pipelineProgress}%)
                      </>
                    ) : (
                      <>
                        <RefreshCw size={12} />
                        CRAWL & RUN STATISTICAL WEIGHTING
                      </>
                    )}
                  </button>

                  {/* Progress bar */}
                  {isCrawlingPipeline && (
                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-sky-500 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${pipelineProgress}%` }}
                      ></div>
                    </div>
                  )}

                </div>

                {/* Cyber Terminal Logging block */}
                <div className="bg-black/90 border border-slate-900 rounded-xl p-3 flex flex-col gap-2 font-mono text-[8px] text-emerald-400">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 text-[7px] text-slate-500 uppercase">
                    <span>Active Pipeline Terminal Log</span>
                    <span className="animate-pulse">● LIVE CONNECTION</span>
                  </div>
                  <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1 scrollbar-thin scrollbar-thumb-slate-900">
                    {pipelineLogs.map((log, lIdx) => (
                      <div key={lIdx} className="leading-relaxed whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                    {isCrawlingPipeline && (
                      <div className="text-sky-400 animate-pulse">
                        [SYSTEM] Menunggu respons validasi saringan kedaulatan...
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Weighted Top 10 trends list */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                
                {/* Sentiment summary & metrics row */}
                <div className="grid grid-cols-3 gap-3 bg-slate-900/10 border border-slate-900 rounded-xl p-3 font-mono">
                  <div className="text-center border-r border-slate-900">
                    <span className="text-[8px] text-slate-500 uppercase block">Total Crawled</span>
                    <span className="text-xs font-bold text-white block mt-0.5">
                      {socialData.metrics.totalCrawled.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="text-center border-r border-slate-900">
                    <span className="text-[8px] text-slate-500 uppercase block">Rata-Rata Sentimen</span>
                    <span className={`text-xs font-bold block mt-0.5 ${
                      socialData.metrics.averageSentiment >= 0.55 ? "text-emerald-400" : socialData.metrics.averageSentiment <= 0.45 ? "text-rose-400" : "text-amber-400"
                    }`}>
                      {Math.round(socialData.metrics.averageSentiment * 100)}% POSITIVE
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] text-slate-500 uppercase block">Sinkron Twin</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                      {socialData.metrics.lastRunTimestamp ? new Date(socialData.metrics.lastRunTimestamp).toLocaleTimeString("id-ID") : "Belum"}
                    </span>
                  </div>
                </div>

                {/* Top 10 weighted trends */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <h4 className="text-xs font-bold text-slate-350 font-mono uppercase flex items-center gap-1.5">
                      <Flame size={13} className="text-amber-500" />
                      TOP 10 ISU PALING RAMAI DI MEDIA SOSIAL INDONESIA (REAL-TIME)
                    </h4>
                    <span className="text-[8px] text-slate-500 font-mono uppercase">Indonesia-First</span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {socialData.issues.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs font-mono">
                        Belum ada data. Silakan atur bobot dan klik "CRAWL & RUN STATISTICAL WEIGHTING".
                      </div>
                    ) : (
                      socialData.issues
                        .filter(issue => socialFilter === "Semua" || issue.category === socialFilter)
                        .map((issue, idx) => {
                          const maxWeightedScore = Math.max(...socialData.issues.map(i => i.weightedScore)) || 1;
                          const fillPercent = Math.min(100, Math.round((issue.weightedScore / maxWeightedScore) * 100));
                          
                          return (
                            <div key={issue.id} className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 flex flex-col gap-1.5 relative overflow-hidden group hover:border-slate-800 transition-all">
                              
                              {/* Background relative loading bar */}
                              <div 
                                className="absolute left-0 bottom-0 top-0 bg-sky-500/5 transition-all duration-500 rounded-r-md"
                                style={{ width: `${fillPercent}%` }}
                              ></div>

                              {/* Title line */}
                              <div className="flex items-start justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono text-slate-500 w-4 block text-center font-bold">
                                    {idx + 1}
                                  </span>
                                  <h5 className="text-[10px] font-bold text-slate-200 tracking-tight group-hover:text-white transition-all leading-normal">
                                    {issue.topic}
                                  </h5>
                                </div>

                                <div className="flex items-center gap-1 font-mono text-[8px] shrink-0">
                                  {/* Platform badge */}
                                  <span className={`px-1.5 py-0.5 rounded border ${platformColorText[issue.primaryPlatform]}`}>
                                    {issue.primaryPlatform}
                                  </span>
                                  {/* Sentiment badge */}
                                  <span className={`px-1.5 py-0.5 rounded border ${
                                    issue.sentiment === "POSITIVE" 
                                      ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                                      : issue.sentiment === "NEGATIVE"
                                      ? "text-rose-400 border-rose-500/20 bg-rose-500/5"
                                      : "text-slate-400 border-slate-800 bg-slate-900"
                                  }`}>
                                    {issue.sentimentScore}% {issue.sentiment}
                                  </span>
                                </div>
                              </div>

                              {/* Metrics Line */}
                              <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 relative z-10 pl-5.5">
                                <span>Kategori: <strong>{issue.category}</strong></span>
                                <div className="flex items-center gap-3">
                                  <span>Volume Kasar: <strong className="text-slate-400">{issue.rawVolume.toLocaleString("id-ID")}</strong></span>
                                  <span>Skor Terbobot: <strong className="text-sky-400">{issue.weightedScore.toLocaleString("id-ID")}</strong></span>
                                </div>
                              </div>

                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Platform share PieChart */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/30 border border-slate-900 rounded-xl p-4">
                  
                  <div className="md:col-span-4 flex flex-col justify-center text-center md:text-left">
                    <h5 className="text-[10px] font-bold text-slate-300 font-mono uppercase">
                      Platform Share (Raw)
                    </h5>
                    <p className="text-[8px] text-slate-500 font-mono mt-1 leading-normal">
                      Porsi sebaran data sampling yang disaring berdasarkan bobot kedaulatan platform.
                    </p>
                  </div>

                  <div className="md:col-span-8 h-[100px] relative flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={platformPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {platformPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "8px" }}
                          itemStyle={{ fontSize: "8px", fontFamily: "monospace" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Custom legends inline */}
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-1 font-mono text-[7px] text-slate-400">
                      {platformPieData.map((d, dIdx) => (
                        <div key={dIdx} className="flex items-center gap-1 text-[7px]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.fill }}></span>
                          <span>{d.name}: <strong>{weightsSum > 0 ? Math.round((socialWeights[Object.keys(socialWeights)[dIdx] as keyof typeof socialWeights] / weightsSum) * 100) : 0}%</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        );
      })()}

    </div>
  );
}
