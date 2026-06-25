import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Domain Interfaces from src/types.ts
interface Vote {
  vote_id: string;
  iid: string;
  topic_id: string;
  choice: string; // "A" | "B" | "C" | "D"
  timestamp: number;
  location: string; // province code
  tier: number; // 1 to 6
  confidence_score: number; // 0.0 - 1.0
  fraud_flagged: boolean;
  fingerprint: string;
}

interface SurveySubmission {
  submission_id: string;
  iid: string;
  timestamp: number;
  location: string; // province code
  household_economy: "LOW" | "MID" | "HIGH";
  staple_prices: "STABLE" | "INCREASING" | "DECREASING";
  public_service_satisfaction: number; // 1 to 10
  confidence_score: number;
  fraud_flagged: boolean;
}

interface SelfCensusSubmission {
  submission_id: string;
  iid: string;
  timestamp: number;
  location: string; // province code
  household_size: number;
  occupation: "Karyawan" | "UMKM" | "Tani" | "Lepas" | "Nganggur";
  water_source: "PDAM" | "Sumur" | "Sungai";
  monthly_income: "LOW" | "MID" | "HIGH";
  age_bracket: "GENZ" | "MILLENNIAL" | "GENX" | "BOOMER";
  confidence_score: number;
  fraud_flagged: boolean;
}

interface CensusRecord {
  provinceCode: string;
  provinceName: string;
  population: number;
  hdi: number; // Indeks Pembangunan Manusia (0-100)
  povertyRate: number; // % BPS
  unemploymentRate: number; // % BPS
  waterAccess: number; // % BPS
  electricityAccess: number; // % BPS
  internetPenetration: number; // % BPS
  mainSector: "Pertanian" | "Industri" | "Jasa";
  genZPercent: number;
  millennialPercent: number;
  genXPercent: number;
  boomerPercent: number;
  selfCensusCount: number; // Count of verified mobile self-census
}

interface VotingTopic {
  id: string;
  title: string;
  description: string;
  levelName: "RT/RW" | "Desa / Kelurahan" | "Kecamatan" | "Kota / Kabupaten" | "Provinsi" | "Nasional";
  level: number; // 1 to 6
  category: "Nasional" | "Daerah" | "Sosial";
  options: { key: string; label: string }[];
  totalVotes: number;
  votesDistribution: { [optionKey: string]: number };
}

interface ProvinceStats {
  id: number;
  name: string;
  code: string;
  cluster: "Sumatera" | "Jawa" | "Kalimantan" | "Sulawesi" | "BaliNusa" | "Maluku" | "Papua";
  edgeNode: string;
  submissionsCount: number; // total activity (votes + surveys)
  votesCount: number;
  surveysCount: number;
  avgSatisfaction: number;
  fraudAttemptsCount: number;
  syncStatus: "ONLINE" | "SYNCHRONIZED" | "PENDING";
  lastSyncTime?: number;
}

interface SocialIssue {
  id: string;
  topic: string;
  category: "Ekonomi" | "Politik" | "Pendidikan" | "Infrastruktur" | "Sosial";
  rawVolume: number;
  weightedScore: number;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  sentimentScore: number; // percentage (e.g. 78% negative or positive)
  primaryPlatform: "X" | "TikTok" | "Instagram" | "YouTube" | "Facebook";
}

interface SocialPipelineConfig {
  sampleSize: number;
  weights: {
    x: number;
    tiktok: number;
    instagram: number;
    youtube: number;
    facebook: number;
  };
  activeFilter: string;
}

interface SocialIntelligenceState {
  config: SocialPipelineConfig;
  issues: SocialIssue[];
  metrics: {
    totalCrawled: number;
    pipelineConfidence: number;
    averageSentiment: number; // 0.0 - 1.0 (positive-ness)
    lastRunTimestamp: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: number;
  iid: string;
  type: "SYNC_RECEIVED" | "VALIDATED" | "DEDUPLICATED" | "REJECTED" | "FRAUD_DETECTED" | "VOTE_CAST" | "SURVEY_SUBMITTED" | "CENSUS_SUBMITTED" | "PIPELINE_RUN";
  message: string;
  details?: string;
}

interface AIAnalysisReport {
  summary: string;
  anomalies: string[];
  recommendations: string[];
  timestamp: number;
}

// Global In-Memory Stores
let VOTES_STORE: Vote[] = [];
let SURVEYS_STORE: SurveySubmission[] = [];
let SELF_CENSUS_STORE: SelfCensusSubmission[] = [];
let CENSUS_STORE: CensusRecord[] = [];
let TOPICS_STORE: VotingTopic[] = [];
let LOGS: LogEntry[] = [];
let AI_REPORT: AIAnalysisReport | null = null;
let SOCIAL_STORE: SocialIntelligenceState | null = null;

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11).toUpperCase();

// Log Helper
function addLog(iid: string, type: LogEntry["type"], message: string, details?: string) {
  LOGS.unshift({
    id: generateId(),
    timestamp: Date.now(),
    iid,
    type,
    message,
    details
  });
  // Keep logs at max 100 entries
  if (LOGS.length > 100) {
    LOGS.pop();
  }
}

// Complete list of 38 Provinces of Indonesia (June 2026 Model)
const PROVINCES_MASTER = [
  // Sumatera Cluster (10)
  { id: 1, name: "Aceh", code: "ACEH", cluster: "Sumatera", edgeNode: "NODE-ACEH-01" },
  { id: 2, name: "Sumatera Utara", code: "SUMUT", cluster: "Sumatera", edgeNode: "NODE-SUMUT-02" },
  { id: 3, name: "Sumatera Barat", code: "SUMBAR", cluster: "Sumatera", edgeNode: "NODE-SUMBAR-03" },
  { id: 4, name: "Riau", code: "RIAU", cluster: "Sumatera", edgeNode: "NODE-RIAU-04" },
  { id: 5, name: "Kepulauan Riau", code: "KEPRI", cluster: "Sumatera", edgeNode: "NODE-KEPRI-05" },
  { id: 6, name: "Jambi", code: "JAMBI", cluster: "Sumatera", edgeNode: "NODE-JAMBI-06" },
  { id: 7, name: "Sumatera Selatan", code: "SUMSEL", cluster: "Sumatera", edgeNode: "NODE-SUMSEL-07" },
  { id: 8, name: "Bangka Belitung", code: "BABEL", cluster: "Sumatera", edgeNode: "NODE-BABEL-08" },
  { id: 9, name: "Bengkulu", code: "BENGKULU", cluster: "Sumatera", edgeNode: "NODE-BENGKULU-09" },
  { id: 10, name: "Lampung", code: "LAMPUNG", cluster: "Sumatera", edgeNode: "NODE-LAMPUNG-10" },

  // Jawa Cluster (6)
  { id: 11, name: "DKI Jakarta", code: "DKI", cluster: "Jawa", edgeNode: "NODE-DKI-11" },
  { id: 12, name: "Banten", code: "BANTEN", cluster: "Jawa", edgeNode: "NODE-BANTEN-12" },
  { id: 13, name: "Jawa Barat", code: "JABAR", cluster: "Jawa", edgeNode: "NODE-JABAR-13" },
  { id: 14, name: "Jawa Tengah", code: "JATENG", cluster: "Jawa", edgeNode: "NODE-JATENG-14" },
  { id: 15, name: "DI Yogyakarta", code: "DIY", cluster: "Jawa", edgeNode: "NODE-DIY-15" },
  { id: 16, name: "Jawa Timur", code: "JATIM", cluster: "Jawa", edgeNode: "NODE-JATIM-16" },

  // Kalimantan Cluster (5)
  { id: 17, name: "Kalimantan Barat", code: "KALBAR", cluster: "Kalimantan", edgeNode: "NODE-KALBAR-17" },
  { id: 18, name: "Kalimantan Tengah", code: "KALTENG", cluster: "Kalimantan", edgeNode: "NODE-KALTENG-18" },
  { id: 19, name: "Kalimantan Selatan", code: "KALSEL", cluster: "Kalimantan", edgeNode: "NODE-KALSEL-19" },
  { id: 20, name: "Kalimantan Timur", code: "KALTIM", cluster: "Kalimantan", edgeNode: "NODE-KALTIM-20" },
  { id: 21, name: "Kalimantan Utara", code: "KALTARA", cluster: "Kalimantan", edgeNode: "NODE-KALTARA-21" },

  // Sulawesi Cluster (6)
  { id: 22, name: "Sulawesi Utara", code: "SULUT", cluster: "Sulawesi", edgeNode: "NODE-SULUT-22" },
  { id: 23, name: "Gorontalo", code: "GORONTALO", cluster: "Sulawesi", edgeNode: "NODE-GORONTALO-23" },
  { id: 24, name: "Sulawesi Tengah", code: "SULTENG", cluster: "Sulawesi", edgeNode: "NODE-SULTENG-24" },
  { id: 25, name: "Sulawesi Barat", code: "SULBAR", cluster: "Sulawesi", edgeNode: "NODE-SULBAR-25" },
  { id: 26, name: "Sulawesi Selatan", code: "SULSEL", cluster: "Sulawesi", edgeNode: "NODE-SULSEL-26" },
  { id: 27, name: "Sulawesi Tenggara", code: "SULTRA", cluster: "Sulawesi", edgeNode: "NODE-SULTRA-27" },

  // Bali & Nusa Tenggara (3)
  { id: 28, name: "Bali", code: "BALI", cluster: "BaliNusa", edgeNode: "NODE-BALI-28" },
  { id: 29, name: "Nusa Tenggara Barat", code: "NTB", cluster: "BaliNusa", edgeNode: "NODE-NTB-29" },
  { id: 30, name: "Nusa Tenggara Timur", code: "NTT", cluster: "BaliNusa", edgeNode: "NODE-NTT-30" },

  // Maluku Cluster (2)
  { id: 31, name: "Maluku", code: "MALUKU", cluster: "Maluku", edgeNode: "NODE-MALUKU-31" },
  { id: 32, name: "Maluku Utara", code: "MALUT", cluster: "Maluku", edgeNode: "NODE-MALUT-32" },

  // Papua Cluster (6)
  { id: 33, name: "Papua", code: "PAPUA", cluster: "Papua", edgeNode: "NODE-PAPUA-33" },
  { id: 34, name: "Papua Selatan", code: "PAPSEL", cluster: "Papua", edgeNode: "NODE-PAPSEL-34" },
  { id: 35, name: "Papua Tengah", code: "PAPTEG", cluster: "Papua", edgeNode: "NODE-PAPTEG-35" },
  { id: 36, name: "Papua Pegunungan", code: "PAPPEG", cluster: "Papua", edgeNode: "NODE-PAPPEG-36" },
  { id: 37, name: "Papua Barat", code: "PAPBAR", cluster: "Papua", edgeNode: "NODE-PAPBAR-37" },
  { id: 38, name: "Papua Barat Daya", code: "PAPBDY", cluster: "Papua", edgeNode: "NODE-PAPBDY-38" }
];

// Top 10 Topics (Simulated June 2026)
const SEED_TOPICS: VotingTopic[] = [
  {
    id: "topic-1",
    title: "Harga beras & pangan pokok",
    description: "Evaluasi intervensi harga beras nasional dan ketersediaan pasokan pangan pokok.",
    levelName: "Nasional",
    level: 6,
    category: "Nasional",
    options: [
      { key: "A", label: "Tambah Subsidi Pangan Nasional" },
      { key: "B", label: "Lakukan Impor Beras Segera" },
      { key: "C", label: "Operasi Pasar Murah Massal" },
      { key: "D", label: "Dorong Sektor Lokal Mandiri" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-2",
    title: "Subsidi energi & BBM tepat sasaran",
    description: "Penyaluran subsidi BBM dan LPG tepat sasaran menggunakan verifikasi Sovereign Identity (IID).",
    levelName: "Nasional",
    level: 6,
    category: "Nasional",
    options: [
      { key: "A", label: "Subsidi Tepat Sasaran via IID" },
      { key: "B", label: "Pertahankan Harga BBM Subsidi" },
      { key: "C", label: "Naikkan Anggaran Subsidi Fiskal" },
      { key: "D", label: "Alihkan Subsidi ke Energi Baru" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-3",
    title: "Reformasi Pajak & Defisit APBN",
    description: "Penyelarasan defisit anggaran APBN dan wacana penerapan Wealth Tax bagi wajib pajak kelas atas.",
    levelName: "Nasional",
    level: 6,
    category: "Nasional",
    options: [
      { key: "A", label: "Terapkan Wealth Tax Progresif" },
      { key: "B", label: "Pangkas Belanja Birokrasi" },
      { key: "C", label: "Pertahankan Struktur Fiskal" },
      { key: "D", label: "Naikkan Rasio Utang Produktif" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-4",
    title: "Program Makan Bergizi Gratis (MBG)",
    description: "Penerapan MBG nasional dan integrasi KDMP (Koperasi Desa Merah Putih) demi kedaulatan pangan anak.",
    levelName: "Nasional",
    level: 6,
    category: "Nasional",
    options: [
      { key: "A", label: "MBG Mandiri dikelola Koperasi Desa" },
      { key: "B", label: "MBG Sentralisasi via Badan Gizi" },
      { key: "C", label: "Evaluasi Skala & Lakukan Pilot" },
      { key: "D", label: "Alihkan ke BLT Pendidikan/Gizi" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-5",
    title: "Aksi Massa & Supremasi Sipil",
    description: "Menyikapi gelombang demonstrasi mahasiswa atas tuntutan kebebasan berekspresi dan reformasi aparat.",
    levelName: "Nasional",
    level: 6,
    category: "Nasional",
    options: [
      { key: "A", label: "Jamin Hak Unjuk Rasa & Bebaskan Tahanan" },
      { key: "B", label: "Kedepankan Restorative Justice Sipil" },
      { key: "C", label: "Tingkatkan Patroli Keamanan Tertib" },
      { key: "D", label: "Gelar Audiensi Terbuka di Istana" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-6",
    title: "Kurikulum Pendidikan Berbasis AI",
    description: "Reformasi dan adaptasi kurikulum nasional tingkat menengah-tinggi untuk kompetensi AI terdistribusi.",
    levelName: "Provinsi",
    level: 5,
    category: "Daerah",
    options: [
      { key: "A", label: "Wajibkan Lab AI & Pemrograman" },
      { key: "B", label: "Pelatihan AI Masif Guru Sekolah" },
      { key: "C", label: "Sertifikasi Kompetensi Digital" },
      { key: "D", label: "Kerja Sama Inkubator Teknologi" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-7",
    title: "Hilirisasi Komoditas Daerah",
    description: "Mendorong pembangunan smelter atau pabrik pengolahan lokal untuk komoditas unggulan provinsi.",
    levelName: "Provinsi",
    level: 5,
    category: "Daerah",
    options: [
      { key: "A", label: "Smelter Daerah Milik BUMD" },
      { key: "B", label: "Insentif Pajak Investor Lokal" },
      { key: "C", label: "Fokus Hilirisasi Agroindustri" },
      { key: "D", label: "Batasi Ekspor Bahan Mentah" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-8",
    title: "Akses Air Bersih Terdistribusi",
    description: "Penyediaan instalasi air minum bersih layak konsumsi di wilayah krisis iklim kota/kabupaten.",
    levelName: "Kota / Kabupaten",
    level: 4,
    category: "Daerah",
    options: [
      { key: "A", label: "Bangun Instalasi Pipa PDAM Baru" },
      { key: "B", label: "Beri Subsidi Air Bersih Darurat" },
      { key: "C", label: "Program Sumur Bor Rakyat Terpadu" },
      { key: "D", label: "Konservasi Alami Hulu Air" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-9",
    title: "Kesejahteraan Guru & Beasiswa",
    description: "Tunjangan daerah terpencil bagi pengajar honorer dan beasiswa KIP-Kuliah berkelanjutan.",
    levelName: "Kecamatan",
    level: 3,
    category: "Daerah",
    options: [
      { key: "A", label: "Sertifikasi & Angkat Honorer Guru" },
      { key: "B", label: "Perbanyak Kuota KIP-Kuliah Lokal" },
      { key: "C", label: "Alokasikan APBD untuk Guru 3T" },
      { key: "D", label: "Sediakan Layanan Transportasi Sekolah" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  },
  {
    id: "topic-10",
    title: "Bantuan Permodalan UMKM Desa",
    description: "Distribusi kredit bunga mikro, fasilitasi legalitas, dan digitalisasi usaha desa.",
    levelName: "RT/RW",
    level: 1,
    category: "Sosial",
    options: [
      { key: "A", label: "Penyaluran Bantuan Modal Tunai" },
      { key: "B", label: "Pelatihan Digital Marketing & AI" },
      { key: "C", label: "Bangun Sentra Promosi Produk Lokal" },
      { key: "D", label: "Bebaskan Biaya Legalitas & Sertifikasi" }
    ],
    totalVotes: 0,
    votesDistribution: { A: 0, B: 0, C: 0, D: 0 }
  }
];

// Seed databases
function resetAndSeedDB() {
  VOTES_STORE = [];
  SURVEYS_STORE = [];
  SELF_CENSUS_STORE = [];
  TOPICS_STORE = JSON.parse(JSON.stringify(SEED_TOPICS));
  LOGS = [];
  AI_REPORT = null;

  // Initialize high-fidelity Census Database for all 38 provinces
  CENSUS_STORE = PROVINCES_MASTER.map((p, idx) => {
    // Determine realistic province values
    let population = 1200000; // default for smaller provinces
    let hdi = 71.5;
    let povertyRate = 9.5;
    let unemploymentRate = 5.2;
    let waterAccess = 74.0;
    let electricityAccess = 98.2;
    let internetPenetration = 68.0;
    let mainSector: "Pertanian" | "Industri" | "Jasa" = "Pertanian";

    // Customize major provinces for extreme high-fidelity
    if (p.code === "DKI") {
      population = 10600000;
      hdi = 83.5;
      povertyRate = 4.4;
      unemploymentRate = 6.5;
      waterAccess = 94.5;
      electricityAccess = 100.0;
      internetPenetration = 89.2;
      mainSector = "Jasa";
    } else if (p.code === "JABAR") {
      population = 49800000;
      hdi = 73.1;
      povertyRate = 7.6;
      unemploymentRate = 7.9;
      waterAccess = 82.3;
      electricityAccess = 99.4;
      internetPenetration = 78.5;
      mainSector = "Industri";
    } else if (p.code === "JATENG") {
      population = 37200000;
      hdi = 72.8;
      povertyRate = 10.7;
      unemploymentRate = 5.1;
      waterAccess = 80.1;
      electricityAccess = 99.1;
      internetPenetration = 72.4;
      mainSector = "Pertanian";
    } else if (p.code === "JATIM") {
      population = 41100000;
      hdi = 73.5;
      povertyRate = 10.3;
      unemploymentRate = 4.8;
      waterAccess = 84.6;
      electricityAccess = 99.5;
      internetPenetration = 74.8;
      mainSector = "Pertanian";
    } else if (p.code === "SUMUT") {
      population = 15300000;
      hdi = 72.5;
      povertyRate = 8.1;
      unemploymentRate = 5.8;
      waterAccess = 78.0;
      electricityAccess = 97.5;
      internetPenetration = 71.2;
      mainSector = "Industri";
    } else if (p.code === "SULSEL") {
      population = 9200000;
      hdi = 72.9;
      povertyRate = 8.6;
      unemploymentRate = 4.9;
      waterAccess = 75.5;
      electricityAccess = 98.0;
      internetPenetration = 73.0;
      mainSector = "Pertanian";
    } else if (p.code === "BALI") {
      population = 4400000;
      hdi = 77.4;
      povertyRate = 4.2;
      unemploymentRate = 3.5;
      waterAccess = 88.0;
      electricityAccess = 99.9;
      internetPenetration = 81.5;
      mainSector = "Jasa";
    } else if (p.code === "PAPUA") {
      population = 1000000;
      hdi = 61.3;
      povertyRate = 26.1;
      unemploymentRate = 5.9;
      waterAccess = 41.5;
      electricityAccess = 76.0;
      internetPenetration = 38.5;
      mainSector = "Pertanian";
    } else {
      // Procedural generation based on cluster
      if (p.cluster === "Sumatera") {
        population = Math.round(2500000 + idx * 800000);
        hdi = 71.0 + (idx % 4) * 0.8;
        povertyRate = 11.2 - (idx % 3) * 1.5;
        unemploymentRate = 4.5 + (idx % 3) * 0.6;
        mainSector = idx % 2 === 0 ? "Pertanian" : "Industri";
      } else if (p.cluster === "Kalimantan") {
        population = Math.round(1600000 + idx * 400000);
        hdi = 72.5 + (idx % 3) * 0.7;
        povertyRate = 6.2 + (idx % 3) * 0.8;
        unemploymentRate = 4.2 + (idx % 2) * 0.5;
        mainSector = "Industri"; // Mining / Hilirisasi
      } else if (p.cluster === "Sulawesi") {
        population = Math.round(1400000 + idx * 500000);
        hdi = 71.2 + (idx % 3) * 0.9;
        povertyRate = 12.0 - (idx % 4) * 1.1;
        unemploymentRate = 4.0 + (idx % 3) * 0.4;
        mainSector = "Pertanian";
      } else if (p.cluster === "BaliNusa") {
        population = Math.round(2200000 + idx * 1000000);
        hdi = p.code === "NTT" ? 65.9 : 69.8;
        povertyRate = p.code === "NTT" ? 19.9 : 13.8;
        unemploymentRate = 3.2;
        waterAccess = p.code === "NTT" ? 52.0 : 70.0;
        mainSector = p.code === "BALI" ? "Jasa" : "Pertanian";
      } else if (p.cluster === "Maluku" || p.cluster === "Papua") {
        population = Math.round(900000 + idx * 150000);
        hdi = 66.5 - (idx % 3) * 1.2;
        povertyRate = 18.5 + (idx % 3) * 2.5;
        unemploymentRate = 4.8 + (idx % 2) * 0.6;
        waterAccess = 48.0 + (idx % 3) * 5.0;
        mainSector = "Pertanian";
      }
    }

    return {
      provinceCode: p.code,
      provinceName: p.name,
      population,
      hdi,
      povertyRate,
      unemploymentRate,
      waterAccess,
      electricityAccess,
      internetPenetration,
      mainSector,
      genZPercent: 27 + (p.id % 4),
      millennialPercent: 29 - (p.id % 3),
      genXPercent: 24 + (p.id % 2),
      boomerPercent: 20 - (p.id % 4),
      selfCensusCount: 0
    };
  });

  // Generate around 60 default votes, surveys, and self-census submissions distributed across some provinces
  PROVINCES_MASTER.slice(0, 15).forEach((p, idx) => {
    // Generate 2 valid citizens per province
    for (let c = 0; c < 2; c++) {
      const iid = `${p.code}-ID-X100${idx}${c}-DEV${Math.floor(10 + Math.random() * 89)}`;
      const loc = p.code;
      
      // Vote on a random topic
      const randomTopics = ["topic-1", "topic-2", "topic-6", "topic-9", "topic-10"];
      const tId = randomTopics[(idx + c) % randomTopics.length];
      const choices = ["A", "B", "C", "D"];
      const choice = choices[(idx * c) % choices.length];
      
      VOTES_STORE.push({
        vote_id: "VOTE-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        iid,
        topic_id: tId,
        choice,
        timestamp: Date.now() - (3600000 * (12 - idx)),
        location: loc,
        tier: tId === "topic-1" || tId === "topic-2" ? 6 : tId === "topic-6" ? 5 : tId === "topic-9" ? 2 : 1,
        confidence_score: parseFloat((0.85 + Math.random() * 0.14).toFixed(2)),
        fraud_flagged: false,
        fingerprint: "fp-device-" + Math.random().toString(36).substring(2, 6)
      });

      // Vote on another topic (Nasional)
      VOTES_STORE.push({
        vote_id: "VOTE-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        iid,
        topic_id: "topic-3",
        choice: choices[(idx + c + 1) % choices.length],
        timestamp: Date.now() - (3600000 * (11 - idx)),
        location: loc,
        tier: 6,
        confidence_score: parseFloat((0.88 + Math.random() * 0.11).toFixed(2)),
        fraud_flagged: false,
        fingerprint: "fp-device-" + Math.random().toString(36).substring(2, 6)
      });

      // Survey submission
      const economies: ("LOW" | "MID" | "HIGH")[] = ["LOW", "MID", "HIGH"];
      const prices: ("STABLE" | "INCREASING" | "DECREASING")[] = ["STABLE", "INCREASING", "DECREASING"];
      SURVEYS_STORE.push({
        submission_id: "SURV-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        iid,
        timestamp: Date.now() - (3600000 * (12 - idx)),
        location: loc,
        household_economy: economies[(idx + c) % economies.length],
        staple_prices: prices[(idx * c + 2) % prices.length],
        public_service_satisfaction: (idx % 4) + 6, // 6 to 9
        confidence_score: parseFloat((0.90 + Math.random() * 0.09).toFixed(2)),
        fraud_flagged: false
      });

      // Self Census submission
      const occupations: ("Karyawan" | "UMKM" | "Tani" | "Lepas" | "Nganggur")[] = ["Karyawan", "UMKM", "Tani", "Lepas", "Nganggur"];
      const waterSources: ("PDAM" | "Sumur" | "Sungai")[] = ["PDAM", "Sumur", "Sungai"];
      const ageBrackets: ("GENZ" | "MILLENNIAL" | "GENX" | "BOOMER")[] = ["GENZ", "MILLENNIAL", "GENX", "BOOMER"];
      
      SELF_CENSUS_STORE.push({
        submission_id: "CENS-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        iid,
        timestamp: Date.now() - (3600000 * (12 - idx)),
        location: loc,
        household_size: (idx % 3) + 2, // 2 to 4 members
        occupation: occupations[(idx + c) % occupations.length],
        water_source: waterSources[(idx * c) % waterSources.length],
        monthly_income: economies[(idx + c) % economies.length],
        age_bracket: ageBrackets[(idx + c) % ageBrackets.length],
        confidence_score: parseFloat((0.92 + Math.random() * 0.07).toFixed(2)),
        fraud_flagged: false
      });
    }

    // Add simulated fraud to every 4th province to populate alerts
    if (idx % 4 === 0) {
      const botIid = `BOT-IID-FAKE-${p.code}`;
      const loc = p.code;
      
      // Duplicate vote
      VOTES_STORE.push({
        vote_id: "VOTE-FRAUD-A-" + p.code,
        iid: botIid,
        topic_id: "topic-1",
        choice: "A",
        timestamp: Date.now() - 3600000,
        location: loc,
        tier: 6,
        confidence_score: 0.18,
        fraud_flagged: true,
        fingerprint: "bot-pattern-xyz"
      });

      VOTES_STORE.push({
        vote_id: "VOTE-FRAUD-B-" + p.code,
        iid: botIid,
        topic_id: "topic-1",
        choice: "A",
        timestamp: Date.now() - 359000, // duplicate within seconds
        location: loc,
        tier: 6,
        confidence_score: 0.12,
        fraud_flagged: true,
        fingerprint: "bot-pattern-xyz"
      });

      addLog(botIid, "FRAUD_DETECTED", `Anomali Terdeteksi: Upaya voting ganda (Double Voting) teridentifikasi pada Topik 1.`, `Metode deteksi: IID Collision Rule. Status: REJECTED.`);
    }
  });

  // Initialize Social Intelligence Pipeline state
  SOCIAL_STORE = {
    config: {
      sampleSize: 500000,
      weights: { x: 30, tiktok: 25, instagram: 20, youtube: 15, facebook: 10 },
      activeFilter: "Semua"
    },
    issues: [
      { id: "s-1", topic: "Aksi Demo Reformasi Kebebasan Sipil di Bundaran HI", category: "Politik", rawVolume: 154200, weightedScore: 46260, sentiment: "NEGATIVE", sentimentScore: 72, primaryPlatform: "X" },
      { id: "s-2", topic: "Implementasi Perdana Program Makan Gratis (MBG) Nasional", category: "Sosial", rawVolume: 245100, weightedScore: 61275, sentiment: "POSITIVE", sentimentScore: 64, primaryPlatform: "TikTok" },
      { id: "s-3", topic: "Wacana Pembatasan Pembelian BBM Pertalite & Solar Bersubsidi", category: "Ekonomi", rawVolume: 110400, weightedScore: 11040, sentiment: "NEGATIVE", sentimentScore: 85, primaryPlatform: "Facebook" },
      { id: "s-4", topic: "Kenaikan Harga Beras & Sembako di Pasar Tradisional", category: "Ekonomi", rawVolume: 98200, weightedScore: 19640, sentiment: "NEGATIVE", sentimentScore: 78, primaryPlatform: "Instagram" },
      { id: "s-5", topic: "Pelatihan Kurikulum AI Nasional untuk Siswa SMA/SMK", category: "Pendidikan", rawVolume: 84300, weightedScore: 12645, sentiment: "POSITIVE", sentimentScore: 88, primaryPlatform: "YouTube" },
      { id: "s-6", topic: "Hilirisasi Nikel Daerah & Pembatasan Ekspor Bahan Mentah", category: "Ekonomi", rawVolume: 72500, weightedScore: 21750, sentiment: "POSITIVE", sentimentScore: 54, primaryPlatform: "X" },
      { id: "s-7", topic: "Defisit Fiskal APBN & Tuntutan Penerapan Pajak Kekayaan (Wealth Tax)", category: "Ekonomi", rawVolume: 63100, weightedScore: 18930, sentiment: "NEUTRAL", sentimentScore: 50, primaryPlatform: "X" },
      { id: "s-8", topic: "Kelangkaan Air Bersih & Distribusi PDAM Kabupaten Pasifik", category: "Infrastruktur", rawVolume: 48900, weightedScore: 9780, sentiment: "NEGATIVE", sentimentScore: 59, primaryPlatform: "Instagram" },
      { id: "s-9", topic: "Keadilan Insentif Kesejahteraan Guru Honorer Sektor 3T", category: "Pendidikan", rawVolume: 41500, weightedScore: 6225, sentiment: "POSITIVE", sentimentScore: 71, primaryPlatform: "YouTube" },
      { id: "s-10", topic: "Pendanaan Digitalisasi Kredit Mikro UMKM Koperasi Desa", category: "Ekonomi", rawVolume: 38400, weightedScore: 9600, sentiment: "POSITIVE", sentimentScore: 82, primaryPlatform: "TikTok" }
    ],
    metrics: {
      totalCrawled: 500000,
      pipelineConfidence: 0.94,
      averageSentiment: 0.58,
      lastRunTimestamp: Date.now() - 3600000
    }
  };

  // Log reseeding completion
  addLog("SYSTEM", "VALIDATED", "Database disetel ulang. 10 Topik Kebijakan Aktif Juni 2026 dan Log Anti-Fraud di-reseed.");
}

// Initial build reseed
resetAndSeedDB();

// Lazy loader for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is required and has not been configured in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Statistics Aggregation Engine
function computeStats() {
  const totalVotes = VOTES_STORE.filter(v => !v.fraud_flagged).length;
  const totalSurveys = SURVEYS_STORE.filter(s => !s.fraud_flagged).length;
  const totalSelfCensus = SELF_CENSUS_STORE.filter(sc => !sc.fraud_flagged).length;

  let sumSatisfaction = 0;
  let lowIncomeCount = 0;
  let midIncomeCount = 0;
  let highIncomeCount = 0;

  SURVEYS_STORE.filter(s => !s.fraud_flagged).forEach(s => {
    sumSatisfaction += s.public_service_satisfaction;
    if (s.household_economy === "LOW") lowIncomeCount++;
    else if (s.household_economy === "MID") midIncomeCount++;
    else if (s.household_economy === "HIGH") highIncomeCount++;
  });

  const avgSatisfaction = totalSurveys > 0 ? parseFloat((sumSatisfaction / totalSurveys).toFixed(1)) : 7.2;

  // Poverty index heuristic based on LOW economic status + INCREASING staple prices
  const lowEcoSurveys = SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "LOW");
  const lowAndIncreasing = lowEcoSurveys.filter(s => s.staple_prices === "INCREASING").length;
  const povertyRate = SURVEYS_STORE.filter(s => !s.fraud_flagged).length > 0
    ? (SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "LOW").length / SURVEYS_STORE.filter(s => !s.fraud_flagged).length) * 24.5
    : 9.36;

  // Total LUV Rewards Distributed (5 points per vote, 10 points per survey, 20 points per self-census)
  const totalLuvDistributed = (totalVotes * 5) + (totalSurveys * 10) + (totalSelfCensus * 20);

  // Total fraudulent packets blocked
  const fraudFlaggedCount = VOTES_STORE.filter(v => v.fraud_flagged).length + 
                            SURVEYS_STORE.filter(s => s.fraud_flagged).length +
                            SELF_CENSUS_STORE.filter(sc => sc.fraud_flagged).length;

  // Unique households/citizens active
  const activeIids = new Set([
    ...VOTES_STORE.filter(v => !v.fraud_flagged).map(v => v.iid),
    ...SURVEYS_STORE.filter(s => !s.fraud_flagged).map(s => s.iid),
    ...SELF_CENSUS_STORE.filter(sc => !sc.fraud_flagged).map(sc => sc.iid)
  ]);
  const totalHouseholds = activeIids.size || 12;

  // Compute province stats list
  const provinceStatsList = PROVINCES_MASTER.map(p => {
    const pVotes = VOTES_STORE.filter(v => v.location === p.code);
    const pSurveys = SURVEYS_STORE.filter(s => s.location === p.code);
    const pSelfCensus = SELF_CENSUS_STORE.filter(sc => sc.location === p.code && !sc.fraud_flagged);
    const totalActivity = pVotes.length + pSurveys.length + pSelfCensus.length;

    let pSatSum = 0;
    let pValidSurveysCount = pSurveys.filter(s => !s.fraud_flagged).length;
    pSurveys.filter(s => !s.fraud_flagged).forEach(s => {
      pSatSum += s.public_service_satisfaction;
    });
    const avgSat = pValidSurveysCount > 0 ? parseFloat((pSatSum / pValidSurveysCount).toFixed(1)) : 7.2;
    const pFraudCount = pVotes.filter(v => v.fraud_flagged).length + 
                        pSurveys.filter(s => s.fraud_flagged).length +
                        pSelfCensus.filter(sc => sc.fraud_flagged).length;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      cluster: p.cluster as any,
      edgeNode: p.edgeNode,
      submissionsCount: totalActivity,
      votesCount: pVotes.filter(v => !v.fraud_flagged).length,
      surveysCount: pValidSurveysCount,
      selfCensusCount: pSelfCensus.length,
      avgSatisfaction: avgSat,
      fraudAttemptsCount: pFraudCount,
      syncStatus: (totalActivity > 0 ? "SYNCHRONIZED" : "ONLINE") as any,
      lastSyncTime: totalActivity > 0 ? Date.now() : undefined
    };
  });

  // Re-calculate vote distribution dynamically for Top 10 Topics
  const updatedTopics = TOPICS_STORE.map(topic => {
    const topicVotes = VOTES_STORE.filter(v => v.topic_id === topic.id && !v.fraud_flagged);
    const dist: { [key: string]: number } = {};
    topic.options.forEach(opt => {
      dist[opt.key] = 0;
    });
    topicVotes.forEach(v => {
      if (dist[v.choice] !== undefined) {
        dist[v.choice]++;
      }
    });

    return {
      ...topic,
      totalVotes: topicVotes.length,
      votesDistribution: dist
    };
  });

  // Dynamically recalculate selfCensusCount in CENSUS_STORE
  const updatedCensusStore = CENSUS_STORE.map(rec => {
    const scCount = SELF_CENSUS_STORE.filter(sc => sc.location === rec.provinceCode && !sc.fraud_flagged).length;
    return {
      ...rec,
      selfCensusCount: scCount
    };
  });

  // Compile Dynamic National Census Profile using baseline weights + live incoming self-census streams
  const totalGenz = SELF_CENSUS_STORE.filter(sc => sc.age_bracket === "GENZ" && !sc.fraud_flagged).length;
  const totalMillennial = SELF_CENSUS_STORE.filter(sc => sc.age_bracket === "MILLENNIAL" && !sc.fraud_flagged).length;
  const totalGenx = SELF_CENSUS_STORE.filter(sc => sc.age_bracket === "GENX" && !sc.fraud_flagged).length;
  const totalBoomer = SELF_CENSUS_STORE.filter(sc => sc.age_bracket === "BOOMER" && !sc.fraud_flagged).length;
  const liveSCWeight = Math.max(1, totalSelfCensus);

  const censusNationalProfile = {
    ageDistribution: [
      { name: "Gen Z (10-25)", value: Math.round((27.8 * 10 + (totalGenz / liveSCWeight) * 100) / 11) },
      { name: "Millennial (26-41)", value: Math.round((25.8 * 10 + (totalMillennial / liveSCWeight) * 100) / 11) },
      { name: "Gen X (42-57)", value: Math.round((21.9 * 10 + (totalGenx / liveSCWeight) * 100) / 11) },
      { name: "Baby Boomer (58+)", value: Math.round((24.5 * 10 + (totalBoomer / liveSCWeight) * 100) / 11) }
    ],
    sectorDistribution: [
      { name: "Pertanian & Kelautan", value: Math.round((29.8 * 10 + (SELF_CENSUS_STORE.filter(sc => sc.occupation === "Tani" && !sc.fraud_flagged).length / liveSCWeight) * 100) / 11) },
      { name: "Industri & Manufaktur", value: Math.round((21.5 * 10 + (SELF_CENSUS_STORE.filter(sc => sc.occupation === "Karyawan" && !sc.fraud_flagged).length / liveSCWeight) * 100) / 11) },
      { name: "Sektor Jasa & UMKM", value: Math.round((34.2 * 10 + (SELF_CENSUS_STORE.filter(sc => (sc.occupation === "UMKM" || sc.occupation === "Lepas") && !sc.fraud_flagged).length / liveSCWeight) * 100) / 11) },
      { name: "Belum/Tidak Bekerja", value: Math.round((14.5 * 10 + (SELF_CENSUS_STORE.filter(sc => sc.occupation === "Nganggur" && !sc.fraud_flagged).length / liveSCWeight) * 100) / 11) }
    ],
    infrastructureAccess: [
      { name: "Akses Air Bersih (BPS)", value: Math.round(CENSUS_STORE.reduce((acc, curr) => acc + curr.waterAccess, 0) / CENSUS_STORE.length) },
      { name: "Akses Listrik Nasional", value: Math.round(CENSUS_STORE.reduce((acc, curr) => acc + curr.electricityAccess, 0) / CENSUS_STORE.length) },
      { name: "Penetrasi Internet Seluler", value: Math.round(CENSUS_STORE.reduce((acc, curr) => acc + curr.internetPenetration, 0) / CENSUS_STORE.length) }
    ]
  };

  // Legacy distributions to keep Recharts fully operational on dashboard
  const totalS = Math.max(1, totalSurveys);
  const educationDistribution = [
    { name: "SD / SMP / Sederajat", value: Math.round((SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "LOW").length / totalS) * 45) + 10 },
    { name: "SMA / SMK / Diploma", value: Math.round((SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "MID").length / totalS) * 55) + 20 },
    { name: "Universitas (S1/S2/S3)", value: Math.round((SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "HIGH").length / totalS) * 40) + 15 }
  ];

  const incomeDistribution = [
    { name: "Bawah (< Rp2 Juta)", value: lowIncomeCount || 4 },
    { name: "Menengah (Rp2M - 10M)", value: midIncomeCount || 8 },
    { name: "Atas (> Rp10 Juta)", value: highIncomeCount || 3 }
  ];

  const employmentDistribution = [
    { name: "Sektor Karyawan Tetap", value: Math.round((SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "HIGH").length / totalS) * 50) + 10 },
    { name: "Sektor Tidak Bekerja", value: Math.round((SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "LOW").length / totalS) * 35) + 5 },
    { name: "Sektor Informal / UMKM", value: Math.round((SURVEYS_STORE.filter(s => !s.fraud_flagged && s.household_economy === "MID").length / totalS) * 45) + 15 }
  ];

  // Recalculate Social Intelligence weights and scores
  if (SOCIAL_STORE) {
    const weights = SOCIAL_STORE.config.weights;
    SOCIAL_STORE.issues = SOCIAL_STORE.issues.map(issue => {
      let weightShare = 0.2;
      if (issue.primaryPlatform === "X") weightShare = weights.x / 100;
      else if (issue.primaryPlatform === "TikTok") weightShare = weights.tiktok / 100;
      else if (issue.primaryPlatform === "Instagram") weightShare = weights.instagram / 100;
      else if (issue.primaryPlatform === "YouTube") weightShare = weights.youtube / 100;
      else if (issue.primaryPlatform === "Facebook") weightShare = weights.facebook / 100;

      return {
        ...issue,
        weightedScore: Math.round(issue.rawVolume * weightShare)
      };
    });
    // Sort issues by weighted score descending to maintain the correct rank
    SOCIAL_STORE.issues.sort((a, b) => b.weightedScore - a.weightedScore);
  }

  return {
    population: Math.round(275142800 + (totalVotes * 12.5) + (totalSurveys * 8.4) + (totalSelfCensus * 15.2)),
    totalVotes,
    totalSurveys,
    totalSelfCensus,
    avgSatisfaction,
    poverty_index: parseFloat(povertyRate.toFixed(2)),
    totalHouseholds,
    totalLuvDistributed,
    fraudFlaggedCount,
    provinces: provinceStatsList,
    educationDistribution,
    incomeDistribution,
    employmentDistribution,
    topics: updatedTopics,
    censusBaseline: updatedCensusStore,
    censusNationalProfile,
    socialIntelligence: SOCIAL_STORE || undefined
  };
}

// 1. Live Ingestion: Simulate Single Province Action
app.post("/api/simulate-province", (req, res) => {
  try {
    const { code, all, count } = req.body;
    const simCount = count || 1;
    const generatedVotes: Vote[] = [];
    const generatedSurveys: SurveySubmission[] = [];

    const provincesToSimulate = all 
      ? PROVINCES_MASTER 
      : PROVINCES_MASTER.filter(p => p.code === code);

    if (provincesToSimulate.length === 0) {
      return res.status(404).json({ error: `Province code '${code}' not found` });
    }

    provincesToSimulate.forEach(p => {
      for (let i = 0; i < simCount; i++) {
        // Random citizen details
        const randId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const devId = "DEV-" + Math.floor(1000 + Math.random() * 9000);
        const iid = `${p.code}-ID-${randId}-${devId}`;
        const loc = p.code;

        // Randomly simulate a potential anti-fraud scenario with 8% probability
        const isBotAlert = Math.random() < 0.08;
        const fraudFlagged = isBotAlert;
        const choices = ["A", "B", "C", "D"];

        // Select random active topic
        const randTopic = SEED_TOPICS[Math.floor(Math.random() * SEED_TOPICS.length)];
        const choice = choices[Math.floor(Math.random() * choices.length)];

        const v: Vote = {
          vote_id: "VOTE-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
          iid,
          topic_id: randTopic.id,
          choice,
          timestamp: Date.now(),
          location: loc,
          tier: randTopic.level,
          confidence_score: fraudFlagged ? parseFloat((0.10 + Math.random() * 0.15).toFixed(2)) : parseFloat((0.85 + Math.random() * 0.14).toFixed(2)),
          fraud_flagged: fraudFlagged,
          fingerprint: fraudFlagged ? "fingerprint-bot-match-999" : "fingerprint-human-" + randId
        };
        VOTES_STORE.push(v);
        generatedVotes.push(v);

                // Also push a survey
        const economies: ("LOW" | "MID" | "HIGH")[] = ["LOW", "MID", "HIGH"];
        const prices: ("STABLE" | "INCREASING" | "DECREASING")[] = ["STABLE", "INCREASING", "DECREASING"];
        const s: SurveySubmission = {
          submission_id: "SURV-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
          iid,
          timestamp: Date.now(),
          location: loc,
          household_economy: economies[Math.floor(Math.random() * economies.length)],
          staple_prices: prices[Math.floor(Math.random() * prices.length)],
          public_service_satisfaction: Math.floor(Math.random() * 5) + 5, // 5 to 9
          confidence_score: fraudFlagged ? 0.21 : parseFloat((0.89 + Math.random() * 0.10).toFixed(2)),
          fraud_flagged: fraudFlagged
        };
        SURVEYS_STORE.push(s);
        generatedSurveys.push(s);

        // Also push a self-census with 70% probability
        if (Math.random() < 0.70) {
          const occupations: ("Karyawan" | "UMKM" | "Tani" | "Lepas" | "Nganggur")[] = ["Karyawan", "UMKM", "Tani", "Lepas", "Nganggur"];
          const waterSources: ("PDAM" | "Sumur" | "Sungai")[] = ["PDAM", "Sumur", "Sungai"];
          const ageBrackets: ("GENZ" | "MILLENNIAL" | "GENX" | "BOOMER")[] = ["GENZ", "MILLENNIAL", "GENX", "BOOMER"];
          
          SELF_CENSUS_STORE.push({
            submission_id: "CENS-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
            iid,
            timestamp: Date.now(),
            location: loc,
            household_size: Math.floor(Math.random() * 4) + 1,
            occupation: occupations[Math.floor(Math.random() * occupations.length)],
            water_source: waterSources[Math.floor(Math.random() * waterSources.length)],
            monthly_income: economies[Math.floor(Math.random() * economies.length)],
            age_bracket: ageBrackets[Math.floor(Math.random() * ageBrackets.length)],
            confidence_score: fraudFlagged ? 0.15 : parseFloat((0.92 + Math.random() * 0.07).toFixed(2)),
            fraud_flagged: fraudFlagged
          });
        }

        if (fraudFlagged) {
          addLog(iid, "FRAUD_DETECTED", `Anti-Fraud Alert: Bot-fingerprint pattern match on Node ${p.edgeNode}. Packet quarantined.`, `IID: ${iid}, Fingerprint Match: bot-pattern`);
        } else {
          addLog(iid, "VOTE_CAST", `Partisipasi Nasional: Vote tersalurkan pada isu '${randTopic.title}' via Node ${p.edgeNode}.`, `Pilihan: ${choice}. Reward 5 Poin LUV dialirkan.`);
          addLog(iid, "SURVEY_SUBMITTED", `Survei Harian: Partisipasi data survei harian diproses pada Node ${p.edgeNode}.`, `Ekonomi: ${s.household_economy}, Kepuasan: ${s.public_service_satisfaction}/10. Reward 10 Poin LUV dialirkan.`);
        }
      }
    });

    res.json({
      status: "ok",
      simulatedVotesCount: generatedVotes.length,
      simulatedSurveysCount: generatedSurveys.length,
      stats: computeStats()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Client Queue Synchronization & Anti-Fraud Real-Time Evaluation
app.post("/api/sync", (req, res) => {
  try {
    const { votes, surveys, selfCensus } = req.body as { 
      votes: Vote[], 
      surveys: SurveySubmission[], 
      selfCensus: SelfCensusSubmission[] 
    };

    let processedVotes = 0;
    let processedSurveys = 0;
    let processedSelfCensus = 0;
    let rejectedCount = 0;
    let fraudBlockedCount = 0;

    addLog("BATCH", "SYNC_RECEIVED", `Menerima paket sinkronisasi dari edge device: ${votes?.length || 0} suara, ${surveys?.length || 0} survei, & ${selfCensus?.length || 0} sensus mandiri.`, `Total Payload: ${((votes?.length || 0) + (surveys?.length || 0) + (selfCensus?.length || 0))} sub-objek.`);

    // A. Process Votes
    if (votes && Array.isArray(votes)) {
      votes.forEach(v => {
        // Validation Checks
        if (!v.iid || !v.topic_id || !v.choice || !v.location) {
          rejectedCount++;
          addLog(v.iid || "ANONYMOUS", "REJECTED", "Gagal memproses suara. Metadata esensial kosong.", JSON.stringify(v));
          return;
        }

        // Anti-Fraud Evaluation Rule 1: One Person One Voice Rule
        const existingVote = VOTES_STORE.find(stored => stored.iid === v.iid && stored.topic_id === v.topic_id && !stored.fraud_flagged);
        if (existingVote) {
          fraudBlockedCount++;
          addLog(v.iid, "FRAUD_DETECTED", `Ditolak: Pelanggaran peraturan One-Person-One-Voice terdeteksi untuk isu '${v.topic_id}'.`, `IID ${v.iid} mencoba memberikan suara kedua.`);
          return;
        }

        // Anti-Fraud Evaluation Rule 2: Geo-coordinate Identity Fingerprint check
        // Check if IID region prefix matches the vote location
        const iidRegionPrefix = v.iid.split("-")[0];
        if (iidRegionPrefix && iidRegionPrefix !== v.location) {
          fraudBlockedCount++;
          addLog(v.iid, "FRAUD_DETECTED", `Anomali Lokasi: Deteksi pemalsuan koordinat. IID dari wilayah ${iidRegionPrefix} terdeteksi mengirim suara di wilayah ${v.location}. Suara dikarantina.`, `Device Fingerprint: ${v.fingerprint}`);
          return;
        }

        // Passed checks, append!
        VOTES_STORE.push({
          ...v,
          fraud_flagged: false,
          confidence_score: 0.99
        });
        processedVotes++;
        addLog(v.iid, "VOTE_CAST", `Sovereign Vote berhasil diverifikasi dan dimasukkan ke Event Bus nasional.`, `Topik: ${v.topic_id}, Pilihan: ${v.choice}.`);
      });
    }

    // B. Process Surveys
    if (surveys && Array.isArray(surveys)) {
      surveys.forEach(s => {
        if (!s.iid || !s.location || !s.household_economy || !s.staple_prices) {
          rejectedCount++;
          addLog(s.iid || "ANONYMOUS", "REJECTED", "Gagal memproses survei. Atribut survei harian tidak lengkap.", JSON.stringify(s));
          return;
        }

        // Passed checks, append!
        SURVEYS_STORE.push({
          ...s,
          fraud_flagged: false,
          confidence_score: 0.98
        });
        processedSurveys++;
        addLog(s.iid, "SURVEY_SUBMITTED", `Survei Harian diverifikasi dan dimasukkan ke Data Lake nasional.`, `Indeks kepuasan: ${s.public_service_satisfaction}/10. Poin LUV ditambahkan.`);
      });
    }

    // C. Process Self Census
    if (selfCensus && Array.isArray(selfCensus)) {
      selfCensus.forEach(sc => {
        if (!sc.iid || !sc.location || !sc.occupation || !sc.water_source) {
          rejectedCount++;
          addLog(sc.iid || "ANONYMOUS", "REJECTED", "Gagal memproses Sensus Mandiri. Atribut sensus mandiri tidak lengkap.", JSON.stringify(sc));
          return;
        }

        // Anti-Fraud: One Person One Census submission
        const existingCensus = SELF_CENSUS_STORE.find(stored => stored.iid === sc.iid && !stored.fraud_flagged);
        if (existingCensus) {
          fraudBlockedCount++;
          addLog(sc.iid, "FRAUD_DETECTED", "Anomali Sensus: Warga teridentifikasi sudah tercatat pada Sensus Penduduk Mandiri.", `IID ${sc.iid} mencoba mengirim paket sensus ganda.`);
          return;
        }

        // Passed checks, append!
        SELF_CENSUS_STORE.push({
          ...sc,
          fraud_flagged: false,
          confidence_score: 0.99
        });
        processedSelfCensus++;
        addLog(sc.iid, "CENSUS_SUBMITTED", `Sensus Mandiri Berhasil Diverifikasi via Sovereign IID.`, `Pekerjaan: ${sc.occupation}, Air: ${sc.water_source}, Anggota Keluarga: ${sc.household_size}. Reward 20 LUV disalurkan.`);
      });
    }

    res.json({
      status: "accepted",
      count: (votes?.length || 0) + (surveys?.length || 0) + (selfCensus?.length || 0),
      processed: processedVotes + processedSurveys + processedSelfCensus,
      votesProcessed: processedVotes,
      surveysProcessed: processedSurveys,
      selfCensusProcessed: processedSelfCensus,
      rejected: rejectedCount,
      fraudBlocked: fraudBlockedCount,
      stats: computeStats()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch stats and logs
app.get("/api/stats", (req, res) => {
  res.json({
    stats: computeStats(),
    logs: LOGS,
    eventStore: VOTES_STORE, // Keep legacy name in transmission to ensure App.tsx doesn't crash on state bindings
    aiReport: AI_REPORT
  });
});

// Clear & reset database
app.post("/api/clear", (req, res) => {
  resetAndSeedDB();
  res.json({
    status: "reset_ok",
    stats: computeStats()
  });
});

// Run Social Intelligence Crawler Pipeline & Weighting Engine
app.post("/api/social-intelligence/run", (req, res) => {
  try {
    const { sampleSize, weights, activeFilter } = req.body;
    
    if (!SOCIAL_STORE) {
      return res.status(500).json({ error: "Social store is not initialized" });
    }

    SOCIAL_STORE.config = {
      sampleSize: sampleSize || 500000,
      weights: weights || { x: 30, tiktok: 25, instagram: 20, youtube: 15, facebook: 10 },
      activeFilter: activeFilter || "Semua"
    };

    // Simulate active crawlers by adding random Jitter (+/- 5-10%) to rawVolumes and sentiments
    SOCIAL_STORE.issues = SOCIAL_STORE.issues.map(issue => {
      const volumeMultiplier = 0.9 + Math.random() * 0.2; // 90% to 110%
      const sentimentChange = Math.floor(Math.random() * 9) - 4; // -4% to +4%
      
      const newVolume = Math.round(issue.rawVolume * volumeMultiplier);
      let newSentimentScore = issue.sentimentScore + sentimentChange;
      if (newSentimentScore > 100) newSentimentScore = 100;
      if (newSentimentScore < 0) newSentimentScore = 0;

      // Randomly change sentiment class if it passes threshold
      let newSentiment = issue.sentiment;
      if (newSentimentScore > 60) {
        newSentiment = "POSITIVE";
      } else if (newSentimentScore < 40) {
        newSentiment = "NEGATIVE";
      } else {
        newSentiment = "NEUTRAL";
      }

      return {
        ...issue,
        rawVolume: newVolume,
        sentiment: newSentiment,
        sentimentScore: newSentimentScore
      };
    });

    const totalWeightedScore = SOCIAL_STORE.issues.reduce((sum, item) => sum + item.weightedScore, 0);
    const sumWeightedSentiment = SOCIAL_STORE.issues.reduce((sum, item) => {
      const positivity = item.sentiment === "POSITIVE" ? item.sentimentScore : item.sentiment === "NEGATIVE" ? (100 - item.sentimentScore) : 50;
      return sum + (positivity * item.weightedScore);
    }, 0);

    SOCIAL_STORE.metrics = {
      totalCrawled: SOCIAL_STORE.config.sampleSize,
      pipelineConfidence: parseFloat((0.91 + Math.random() * 0.07).toFixed(2)),
      averageSentiment: totalWeightedScore > 0 ? parseFloat((sumWeightedSentiment / totalWeightedScore / 100).toFixed(2)) : 0.58,
      lastRunTimestamp: Date.now()
    };

    addLog("BATCH", "PIPELINE_RUN", `Social Intelligence Pipeline: Crawling selesai. Berhasil menyerap ${SOCIAL_STORE.config.sampleSize.toLocaleString('id-ID')} postingan dengan filter '${SOCIAL_STORE.config.activeFilter}'.`, `Bobot Bobot - X: ${weights.x}%, TikTok: ${weights.tiktok}%, IG: ${weights.instagram}%, YT: ${weights.youtube}%, FB: ${weights.facebook}%`);

    res.json({
      status: "ok",
      stats: computeStats()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. AI-Powered National Survey & Voting Audit (Gemini 3.5 Flash)
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const ai = getGeminiClient();

    const dataContext = {
      totalVotes: VOTES_STORE.length,
      totalSurveys: SURVEYS_STORE.length,
      aggregateStats: computeStats(),
      recentVotesSample: VOTES_STORE.slice(-20).map(v => ({
        iid: v.iid,
        topic_id: v.topic_id,
        choice: v.choice,
        location: v.location,
        fraud_flagged: v.fraud_flagged,
        confidence_score: v.confidence_score
      })),
      recentSurveysSample: SURVEYS_STORE.slice(-20).map(s => ({
        iid: s.iid,
        household_economy: s.household_economy,
        staple_prices: s.staple_prices,
        public_service_satisfaction: s.public_service_satisfaction,
        fraud_flagged: s.fraud_flagged
      })),
      recentLogs: LOGS.slice(0, 15).map(l => `[${l.type}] ${l.message}`)
    };

    const prompt = `
Anda adalah AI Audit & Civic Intelligence Engine untuk NeuroSphere Civic Survey & Voting System (NS-SVOS v1.0).
Tugas Anda adalah melakukan audit komprehensif terhadap dataset suara (votes) dan survei harian (surveys) nasional Indonesia secara real-time.

Patuhi aturan terminologi Manifesto Sphere secara ketat:
- JANGAN gunakan kata 'blockchain', 'chain', atau 'smart contract'.
- Gunakan 'Sovereign Identity (IID)' untuk mewakili identitas warga terverifikasi.
- Gunakan 'Sphere Architecture' atau 'Sphere Fractal' untuk merujuk pada struktur sistem terdistribusi.
- Gunakan 'Auralang Protocol' untuk logika penyerapan data otomatis / aturan data.
- Gunakan 'Geo-Consensus Scheduled Distribution' untuk sistem distribusi reward partisipasi.
- Gunakan 'TM (LUV)' atau 'Technology Money (LUV)' untuk merujuk pada nilai insentif LUV.
- Gunakan 'Neuro Nodes' untuk merujuk pada simpul validasi federasi provinsi.

Output Anda harus berupa format JSON murni dalam Bahasa Indonesia formal dengan struktur berikut:
{
  "summary": "Ringkasan eksekutif mendalam (2-3 paragraf) mengenai tingkat partisipasi sipil nasional, sentimen konsensus publik terhadap isu pangan/subsidi, kepuasan pelayanan, serta kesehatan keseluruhan platform NS-SVOS.",
  "anomalies": [
    "Analisis anomali spesifik (misal: tingkat penolakan fraud pada node tertentu, anomali siber, pola bot, atau ketimpangan koordinat IID)",
    "Anomali spesifik lainnya..."
  ],
  "recommendations": [
    "Rekomendasi kebijakan strategis nasional yang harus diambil pemerintah RI menyikapi suara terbanyak pada isu beras/subsidi",
    "Rekomendasi strategis lainnya..."
  ]
}

DATASET UNTUK DIANALISIS:
${JSON.stringify(dataContext, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Anda adalah AI Audit & Civic Intelligence Engine di bawah ekosistem NeuroSphere. Analisis data jajak pendapat dan deteksi penipuan dengan presisi tinggi menggunakan Bahasa Indonesia formal."
      }
    });

    const reportText = response.text;
    if (!reportText) {
      throw new Error("Empty report response from Gemini API.");
    }

    const report = JSON.parse(reportText.trim());
    AI_REPORT = {
      summary: report.summary || "Analisis jajak pendapat selesai.",
      anomalies: report.anomalies || [],
      recommendations: report.recommendations || [],
      timestamp: Date.now()
    };

    res.json(AI_REPORT);
  } catch (error: any) {
    console.error("Gemini Civic Audit failed:", error);
    res.status(500).json({ error: error.message || "Gagal menghubungi Gemini AI Auditor. Pastikan GEMINI_API_KEY Anda valid." });
  }
});

// 4. AI Policy Simulation Engine (ARGI Core)
app.post("/api/gemini/simulate-policy", async (req, res) => {
  try {
    const { taxRate, subsidy, educationBudget, economicIntervention } = req.body;

    // Mathematical projection model for fallbacks and stability guidelines
    const baseGdp = parseFloat(((subsidy / 100) * 0.45 + (educationBudget - 20) * 0.09 - (taxRate * 0.12)).toFixed(2));
    const basePoverty = parseFloat((-(subsidy / 100) * 1.5 - (educationBudget - 20) * 0.18 + (taxRate * 0.05) - (economicIntervention === "high" ? 2.0 : economicIntervention === "mid" ? 0.8 : 0.2)).toFixed(2));
    const baseInflation = parseFloat(((subsidy / 100) * 0.95 + (taxRate * 0.03) + (economicIntervention === "high" ? 2.2 : 0.8)).toFixed(2));
    const baseStability = Math.min(100, Math.max(10, Math.round(84 + (subsidy / 100) * 2.5 + (educationBudget - 20) * 1.0 - Math.abs(taxRate) * 1.0)));

    let gdp = baseGdp;
    let poverty = basePoverty;
    let inflation = baseInflation;
    let stability = baseStability;
    let analysis = "";

    try {
      const ai = getGeminiClient();
      const prompt = `
Anda adalah Policy Simulation Engine (ARGI Core) untuk NeuroSphere Civic Survey & Voting System (NS-SVOS v1.0).
Simulasikan hasil keputusan jika pemerintah menerapkan kebijakan sosial-ekonomi berikut pada sirkulasi kesejahteraan RI:

Parameter Kebijakan:
1. Penyesuaian Pajak Penghasilan: ${taxRate}% (perubahan relatif)
2. Anggaran Subsidi Sosial & UMKM: Rp ${subsidy} Triliun
3. Alokasi Anggaran Pendidikan: ${educationBudget}% dari total APBN
4. Tingkat Intervensi Ekonomi Sektoral: ${economicIntervention.toUpperCase()}

Analisis bagaimana warga IID akan merespons kebijakan ini berdasarkan dataset jajak pendapat nasional, lalu kembalikan format JSON murni berikut:
{
  "gdpImpact": <angka persen dampak PDB, misalnya 1.25>,
  "povertyImpact": <angka persen perubahan tingkat kemiskinan, misalnya -1.9>,
  "inflationImpact": <angka persen perubahan inflasi, misalnya 1.1>,
  "stabilityScore": <angka skor stabilitas sosial 0-100, misalnya 88>,
  "commentary": "<Ulasan mendalam 3-4 kalimat dalam Bahasa Indonesia formal mengenai dampak kebijakan ini terhadap keadilan fiskal, penerimaan masyarakat kelas menengah kebawah, dan kestabilan sirkulasi TM LUV sesuai Auralang Protocol.>"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Anda adalah Policy Simulation Engine yang cerdas untuk pemerintah digital Republik Indonesia. Tulis analisis Anda dalam Bahasa Indonesia formal berkualitas tinggi."
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsed = JSON.parse(resultText.trim());
        gdp = typeof parsed.gdpImpact === 'number' ? parsed.gdpImpact : baseGdp;
        poverty = typeof parsed.povertyImpact === 'number' ? parsed.povertyImpact : basePoverty;
        inflation = typeof parsed.inflationImpact === 'number' ? parsed.inflationImpact : baseInflation;
        stability = typeof parsed.stabilityScore === 'number' ? parsed.stabilityScore : baseStability;
        analysis = parsed.commentary || "";
      }
    } catch (apiErr) {
      console.warn("Gemini policy simulation fallback:", apiErr);
      analysis = `Simulasi kebijakan terhitung secara deterministik oleh NS-SVOS local predictive model. Penyaluran subsidi sebesar Rp ${subsidy}T serta alokasi anggaran pendidikan ${educationBudget}% diproyeksikan memberikan dorongan positif pada PDB sebesar +${baseGdp}% dengan penurunan kemiskinan sebesar ${basePoverty}%. Stabilitas sosial dinilai sangat kondusif pada skor ${baseStability}% seiring tingginya kepercayaan warga terhadap akuntabilitas berbasis IID.`;
    }

    res.json({
      gdpImpact: gdp,
      povertyImpact: poverty,
      inflationImpact: inflation,
      stabilityScore: stability,
      commentary: analysis
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite Middleware & production static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from production dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Neurosphere NS-SVOS server is booting up on http://localhost:${PORT}`);
  });
}

startServer();
