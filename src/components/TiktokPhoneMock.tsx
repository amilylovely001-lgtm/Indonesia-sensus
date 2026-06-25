import React, { useState, useEffect } from "react";
import { 
  Fingerprint, 
  Send, 
  Wifi, 
  WifiOff, 
  Database, 
  Coins, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Plus, 
  RotateCcw, 
  Sparkles,
  Users,
  MapPin,
  Home,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
  Trash2,
  Globe
} from "lucide-react";
import { Vote, SurveySubmission, VotingTopic, GovStats, SelfCensusSubmission } from "../types";

interface PhoneMockProps {
  onSyncComplete: () => void;
  networkOnline: boolean;
  setNetworkOnline: (online: boolean) => void;
  stats?: GovStats;
}

// Fallback topics to use in UI if stats has not loaded them
const DEFAULT_TOPICS_STATIC = [
  { id: "topic-1", title: "Harga beras & pangan pokok" },
  { id: "topic-2", title: "Subsidi energi & BBM tepat sasaran" },
  { id: "topic-3", title: "Reformasi Pajak & Defisit APBN" },
  { id: "topic-4", title: "Program Makan Bergizi Gratis (MBG)" },
  { id: "topic-5", title: "Aksi Massa & Supremasi Sipil" },
  { id: "topic-6", title: "Kurikulum Pendidikan Berbasis AI" },
  { id: "topic-7", title: "Hilirisasi Komoditas Daerah" },
  { id: "topic-8", title: "Akses Air Bersih Terdistribusi" },
  { id: "topic-9", title: "Kesejahteraan Guru & Beasiswa" },
  { id: "topic-10", title: "Bantuan Permodalan UMKM Desa" }
];

// Fallback all 38 Indonesian provinces to prevent half-empty lists on first mount
const DEFAULT_PROVINCES_STATIC = [
  { id: 1, name: "Aceh", code: "ACEH", cluster: "Sumatera", edgeNode: "NODE-ACEH-01", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 2, name: "Sumatera Utara", code: "SUMUT", cluster: "Sumatera", edgeNode: "NODE-SUMUT-02", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 3, name: "Sumatera Barat", code: "SUMBAR", cluster: "Sumatera", edgeNode: "NODE-SUMBAR-03", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 4, name: "Riau", code: "RIAU", cluster: "Sumatera", edgeNode: "NODE-RIAU-04", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 5, name: "Kepulauan Riau", code: "KEPRI", cluster: "Sumatera", edgeNode: "NODE-KEPRI-05", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 6, name: "Jambi", code: "JAMBI", cluster: "Sumatera", edgeNode: "NODE-JAMBI-06", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 7, name: "Sumatera Selatan", code: "SUMSEL", cluster: "Sumatera", edgeNode: "NODE-SUMSEL-07", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 8, name: "Bangka Belitung", code: "BABEL", cluster: "Sumatera", edgeNode: "NODE-BABEL-08", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 9, name: "Bengkulu", code: "BENGKULU", cluster: "Sumatera", edgeNode: "NODE-BENGKULU-09", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 10, name: "Lampung", code: "LAMPUNG", cluster: "Sumatera", edgeNode: "NODE-LAMPUNG-10", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 11, name: "DKI Jakarta", code: "DKI", cluster: "Jawa", edgeNode: "NODE-DKI-11", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 12, name: "Banten", code: "BANTEN", cluster: "Jawa", edgeNode: "NODE-BANTEN-12", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 13, name: "Jawa Barat", code: "JABAR", cluster: "Jawa", edgeNode: "NODE-JABAR-13", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 14, name: "Jawa Tengah", code: "JATENG", cluster: "Jawa", edgeNode: "NODE-JATENG-14", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 15, name: "DI Yogyakarta", code: "DIY", cluster: "Jawa", edgeNode: "NODE-DIY-15", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 16, name: "Jawa Timur", code: "JATIM", cluster: "Jawa", edgeNode: "NODE-JATIM-16", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 17, name: "Kalimantan Barat", code: "KALBAR", cluster: "Kalimantan", edgeNode: "NODE-KALBAR-17", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 18, name: "Kalimantan Tengah", code: "KALTENG", cluster: "Kalimantan", edgeNode: "NODE-KALTENG-18", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 19, name: "Kalimantan Selatan", code: "KALSEL", cluster: "Kalimantan", edgeNode: "NODE-KALSEL-19", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 20, name: "Kalimantan Timur", code: "KALTIM", cluster: "Kalimantan", edgeNode: "NODE-KALTIM-20", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 21, name: "Kalimantan Utara", code: "KALTARA", cluster: "Kalimantan", edgeNode: "NODE-KALTARA-21", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 22, name: "Sulawesi Utara", code: "SULUT", cluster: "Sulawesi", edgeNode: "NODE-SULUT-22", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 23, name: "Gorontalo", code: "GORONTALO", cluster: "Sulawesi", edgeNode: "NODE-GORONTALO-23", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 24, name: "Sulawesi Tengah", code: "SULTENG", cluster: "Sulawesi", edgeNode: "NODE-SULTENG-24", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 25, name: "Sulawesi Barat", code: "SULBAR", cluster: "Sulawesi", edgeNode: "NODE-SULBAR-25", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 26, name: "Sulawesi Selatan", code: "SULSEL", cluster: "Sulawesi", edgeNode: "NODE-SULSEL-26", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 27, name: "Sulawesi Tenggara", code: "SULTRA", cluster: "Sulawesi", edgeNode: "NODE-SULTRA-27", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 28, name: "Bali", code: "BALI", cluster: "BaliNusa", edgeNode: "NODE-BALI-28", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 29, name: "Nusa Tenggara Barat", code: "NTB", cluster: "BaliNusa", edgeNode: "NODE-NTB-29", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 30, name: "Nusa Tenggara Timur", code: "NTT", cluster: "BaliNusa", edgeNode: "NODE-NTT-30", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 31, name: "Maluku", code: "MALUKU", cluster: "Maluku", edgeNode: "NODE-MALUKU-31", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 32, name: "Maluku Utara", code: "MALUT", cluster: "Maluku", edgeNode: "NODE-MALUT-32", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 33, name: "Papua", code: "PAPUA", cluster: "Papua", edgeNode: "NODE-PAPUA-33", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 34, name: "Papua Selatan", code: "PAPSEL", cluster: "Papua", edgeNode: "NODE-PAPSEL-34", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 35, name: "Papua Tengah", code: "PAPTEG", cluster: "Papua", edgeNode: "NODE-PAPTEG-35", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 36, name: "Papua Pegunungan", code: "PAPPEG", cluster: "Papua", edgeNode: "NODE-PAPPEG-36", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 37, name: "Papua Barat", code: "PAPBAR", cluster: "Papua", edgeNode: "NODE-PAPBAR-37", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const },
  { id: 38, name: "Papua Barat Daya", code: "PAPBDY", cluster: "Papua", edgeNode: "NODE-PAPBDY-38", submissionsCount: 0, votesCount: 0, surveysCount: 0, avgSatisfaction: 7.2, fraudAttemptsCount: 0, syncStatus: "ONLINE" as const }
];

export default function TiktokPhoneMock({ onSyncComplete, networkOnline, setNetworkOnline, stats }: PhoneMockProps) {
  // Mobile app tabs
  const [activeTab, setActiveTab] = useState<"auth" | "form" | "indonesia" | "queue" | "wallet">("auth");
  
  // Voting vs Survey vs Census sub-tab in the "form" screen
  const [formSubTab, setFormSubTab] = useState<"vote" | "survey" | "census">("vote");

  // Citizen Sovereign Identity state
  const [citizenName, setCitizenName] = useState("");
  const [region, setRegion] = useState("DKI");
  const [userSeed, setUserSeed] = useState("");
  const [deviceId] = useState(() => "DEV-" + Math.floor(1000 + Math.random() * 9000));
  const [iid, setIid] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // Voting Selection State
  const [selectedTopicId, setSelectedTopicId] = useState("topic-1");
  const [selectedChoice, setSelectedChoice] = useState("A");

  // Survey State
  const [householdEconomy, setHouseholdEconomy] = useState<"LOW" | "MID" | "HIGH">("MID");
  const [staplePrices, setStaplePrices] = useState<"STABLE" | "INCREASING" | "DECREASING">("STABLE");
  const [satisfaction, setSatisfaction] = useState(7);
  const [consent, setConsent] = useState(true);

  // Sensus Mandiri State
  const [censusOccupation, setCensusOccupation] = useState<"Karyawan" | "UMKM" | "Tani" | "Lepas" | "Nganggur">("Karyawan");
  const [censusWaterSource, setCensusWaterSource] = useState<"PDAM" | "Sumur" | "Sungai">("Sumur");
  const [censusIncome, setCensusIncome] = useState<"LOW" | "MID" | "HIGH">("MID");
  const [censusAgeBracket, setCensusAgeBracket] = useState<"GENZ" | "MILLENNIAL" | "GENX" | "BOOMER">("MILLENNIAL");
  const [censusHouseholdSize, setCensusHouseholdSize] = useState<number>(3);
  const [censusConsent, setConsentCensus] = useState(true);

  // Local device offline holding vaults
  const [localVotes, setLocalVotes] = useState<Vote[]>([]);
  const [localSurveys, setLocalSurveys] = useState<SurveySubmission[]>([]);
  const [localSelfCensus, setLocalSelfCensus] = useState<SelfCensusSubmission[]>([]);
  
  // Wallet / LUV technology money balance
  const [luvBalance, setLuvBalance] = useState(0);
  const [rewardsHistory, setRewardsHistory] = useState<{ label: string; amount: number; time: string }[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Indonesia grid filters
  const [indonesiaSearch, setIndonesiaSearch] = useState("");
  const [selectedIndoCluster, setSelectedIndoCluster] = useState<"Semua" | "Sumatera" | "Jawa" | "Kalimantan" | "Sulawesi" | "BaliNusa" | "Maluku" | "Papua">("Semua");
  const [isSimulatingNode, setIsSimulatingNode] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  // Initialize secure cryptographic phrase generator on start
  useEffect(() => {
    const adjectives = ["Merdeka", "Gotong", "Sakti", "Bhineka", "Pancasila"];
    const nouns = ["Garuda", "Komodo", "Rafflesia", "Badak", "Candi"];
    const randAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randNoun = nouns[Math.floor(Math.random() * nouns.length)];
    setUserSeed(`${randAdj}${randNoun}${Math.floor(Math.random() * 99)}`);
  }, []);

  // Sync state defaults when statistics are loaded
  useEffect(() => {
    if (stats?.topics && stats.topics.length > 0) {
      const ids = stats.topics.map(t => t.id);
      if (!ids.includes(selectedTopicId)) {
        setSelectedTopicId(stats.topics[0].id);
      }
    }
  }, [stats]);

  // Generate verifiable cryptographic IID
  const handleGenerateIID = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim()) return;
    
    // Mimic secure offline IID generation
    const hashChars = "0123456789ABCDEF";
    let hash = "";
    const combinedString = region + "ID" + deviceId + userSeed + citizenName;
    for (let i = 0; i < 8; i++) {
      const charIndex = combinedString.charCodeAt((i * 3) % combinedString.length) % 16;
      hash += hashChars[charIndex];
    }
    
    const generatedIid = `${region}-ID-${hash}-${deviceId}`;
    setIid(generatedIid);
    setIsRegistered(true);
    
    // Auto add registration reward log to history
    setRewardsHistory(prev => [
      { label: "Sovereign IID Verification Reward", amount: 15, time: new Date().toLocaleTimeString() },
      ...prev
    ]);
    setLuvBalance(prev => prev + 15);

    setActiveTab("form");
  };

  // Add individual items to offline vaults
  const handleAddVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iid) return;

    // Get selected topic level details
    const activeTopic = stats?.topics?.find(t => t.id === selectedTopicId) || { level: 6 };

    const newVote: Vote = {
      vote_id: "VOTE-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      iid,
      topic_id: selectedTopicId,
      choice: selectedChoice,
      timestamp: Date.now(),
      location: region,
      tier: activeTopic.level || 6,
      confidence_score: 0.99,
      fraud_flagged: false,
      fingerprint: "fingerprint-human-" + deviceId
    };

    // Append to local offline holding list
    setLocalVotes(prev => {
      const updated = [...prev];
      // Skip local duplicate in queue to keep it clean
      const existingIdx = updated.findIndex(v => v.topic_id === selectedTopicId);
      if (existingIdx !== -1) {
        updated[existingIdx] = newVote;
      } else {
        updated.push(newVote);
      }
      return updated;
    });

    setActiveTab("queue");
  };

  const handleAddSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iid) return;

    const newSurvey: SurveySubmission = {
      submission_id: "SURV-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      iid,
      timestamp: Date.now(),
      location: region,
      household_economy: householdEconomy,
      staple_prices: staplePrices,
      public_service_satisfaction: satisfaction,
      confidence_score: 0.98,
      fraud_flagged: false
    };

    // Append to local queue
    setLocalSurveys(prev => {
      const updated = [...prev];
      const existingIdx = updated.findIndex(s => s.iid === iid);
      if (existingIdx !== -1) {
        updated[existingIdx] = newSurvey;
      } else {
        updated.push(newSurvey);
      }
      return updated;
    });

    setActiveTab("queue");
  };

  const handleAddCensus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iid) return;

    const newCensus: SelfCensusSubmission = {
      submission_id: "CENS-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      iid,
      timestamp: Date.now(),
      location: region,
      household_size: censusHouseholdSize,
      occupation: censusOccupation,
      water_source: censusWaterSource,
      monthly_income: censusIncome,
      age_bracket: censusAgeBracket,
      confidence_score: 0.99,
      fraud_flagged: false
    };

    setLocalSelfCensus(prev => {
      const updated = [...prev];
      const existingIdx = updated.findIndex(c => c.iid === iid);
      if (existingIdx !== -1) {
        updated[existingIdx] = newCensus;
      } else {
        updated.push(newCensus);
      }
      return updated;
    });

    setActiveTab("queue");
  };

  // Sync Local Queue to Neuro Event Bus (NEB) Backend via REST Ingestion
  const handleSyncQueue = async () => {
    const totalCount = localVotes.length + localSurveys.length + localSelfCensus.length;
    if (totalCount === 0) return;
    
    if (!networkOnline) {
      setSyncStatusMsg("Gagal: Sinyal Terputus. Aktifkan sinyal seluler untuk sinkronisasi.");
      setTimeout(() => setSyncStatusMsg(""), 4000);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg("Melakukan enkripsi kedaulatan warga...");

    // Simulate batch crypto packetization lag
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSyncStatusMsg("Mentransmisikan paket ke Neuro Nodes...");

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          votes: localVotes,
          surveys: localSurveys,
          selfCensus: localSelfCensus
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsSyncing(false);
        
        // Clear local queue arrays
        setLocalVotes([]);
        setLocalSurveys([]);
        setLocalSelfCensus([]);
        
        // Calculate dynamic reward LUV tokens earned (20 LUV per census, 10 per survey, 5 per vote)
        const earnedTokens = (data.votesProcessed * 5) + (data.surveysProcessed * 10) + (data.selfCensusProcessed * 20);
        if (earnedTokens > 0) {
          setLuvBalance(prev => prev + earnedTokens);
          setRewardsHistory(prev => [
            { 
              label: `Geo-Consensus Sync (${data.votesProcessed} Suara, ${data.surveysProcessed} Survei, ${data.selfCensusProcessed} Sensus)`, 
              amount: earnedTokens, 
              time: new Date().toLocaleTimeString() 
            },
            ...prev
          ]);
        }

        setSyncStatusMsg(`Sukses! ${data.processed} paket diverifikasi. Mengalirkan +${earnedTokens} TM (LUV).`);
        setShowSyncSuccess(true);
        onSyncComplete(); // Trigger dashboard refresh
        
        setTimeout(() => {
          setShowSyncSuccess(false);
          setSyncStatusMsg("");
          setActiveTab("wallet");
        }, 3000);
      } else {
        throw new Error("Penolakan dari Event Bus: Node sibuk atau terdeteksi fraud");
      }
    } catch (err: any) {
      setIsSyncing(false);
      setSyncStatusMsg(`Koneksi Gagal: ${err.message}`);
      setTimeout(() => setSyncStatusMsg(""), 4000);
    }
  };

  const handleRemoveVoteItem = (index: number) => {
    setLocalVotes(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSurveyItem = (index: number) => {
    setLocalSurveys(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger simulated node activity in 38-provinces matrix
  const handleInjectProvinceEvent = async (code: string) => {
    setIsSimulatingNode(code);
    try {
      const response = await fetch("/api/simulate-province", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, count: 1 })
      });
      if (response.ok) {
        onSyncComplete();
        setLuvBalance(prev => prev + 5);
        setRewardsHistory(prev => [
          { label: `Simulated Edge Ingress Node (${code})`, amount: 5, time: new Date().toLocaleTimeString() },
          ...prev
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSimulatingNode(null);
    }
  };

  const handlePingMasterHub = async () => {
    setPingStatus("MENGIRIM PING INTEGRITI PUSAT...");
    await new Promise(resolve => setTimeout(resolve, 600));
    setPingStatus("ONLINE - RESPONSE 11MS - INGRESS AMAN");
    setTimeout(() => setPingStatus(null), 3000);
  };

  const handleAutoSimulateAll = async () => {
    setPingStatus("MENGAKTIFKAN INGRESS SERENTAK...");
    try {
      const response = await fetch("/api/simulate-province", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ all: true, count: 1 })
      });
      if (response.ok) {
        onSyncComplete();
        setLuvBalance(prev => prev + 25);
        setRewardsHistory(prev => [
          { label: "Nusantara Federation Ingress Stream", amount: 25, time: new Date().toLocaleTimeString() },
          ...prev
        ]);
        setPingStatus("DITERIMA: 38 PAKET MASUK KE DATALAKE!");
      } else {
        setPingStatus("INGRESS GAGAL: NODE PADAT");
      }
    } catch (error) {
      setPingStatus("KONEKSI ERROR");
    }
    setTimeout(() => setPingStatus(null), 3500);
  };

  // Get options label for topic ID selection
  const activeTopicObj = stats?.topics?.find(t => t.id === selectedTopicId) || {
    title: "Harga Beras & Pangan Pokok",
    options: [
      { key: "A", label: "Tambah Subsidi Pangan" },
      { key: "B", label: "Lakukan Impor Segera" },
      { key: "C", label: "Operasi Pasar Murah" },
      { key: "D", label: "Sektor Lokal Mandiri" }
    ]
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-slate-400 mb-2 font-mono flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        CITIZEN NODE MOBILE MOCK (NS-SVOS v1.0)
      </div>

      <div 
        id="tiktok-phone-container"
        className="w-[360px] h-[640px] rounded-[36px] border-8 border-slate-800 bg-slate-950 relative overflow-hidden flex flex-col shadow-2xl transition-all duration-300"
        style={{
          boxShadow: "0 25px 50px -12px rgba(6, 182, 212, 0.15)"
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-16 h-1 bg-slate-800 rounded-full mb-1"></div>
        </div>

        {/* Status bar */}
        <div className="h-7 px-5 pt-1.5 flex justify-between items-center text-[10px] text-slate-400 font-mono z-40 bg-slate-950/80 backdrop-blur-sm relative">
          <span className="font-semibold text-[8px]">24/7 ONLINE</span>
          <div className="flex items-center gap-2">
            <span className="text-[7.5px] text-cyan-400 font-bold">NS-SECURE CELLULAR</span>
            <button 
              onClick={() => setNetworkOnline(!networkOnline)} 
              className={`flex items-center gap-0.5 cursor-pointer p-0.5 rounded transition-all duration-300 ${
                networkOnline ? "text-emerald-400" : "text-rose-400 font-bold"
              }`}
            >
              {networkOnline ? (
                <Wifi size={10} />
              ) : (
                <WifiOff size={10} />
              )}
            </button>
            <div className="flex items-center gap-0.5">
              <span className="text-[7.5px]">96%</span>
              <div className="w-4 h-2 border border-slate-600 rounded-sm p-0.5">
                <div className="h-full w-[90%] bg-slate-400 rounded-2xs"></div>
              </div>
            </div>
          </div>
        </div>

        {/* App Content */}
        <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-20 pt-2 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center font-bold text-white text-[11px] shadow-md shadow-cyan-900/40">
                NS
              </div>
              <div>
                <h2 className="text-[10px] font-bold text-white tracking-wide font-mono leading-none">CIVIC PARTICIPATION</h2>
                <span className="text-[8px] text-cyan-400 font-mono">SOVEREIGN NETWORK</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Coins size={10} className="text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400 font-mono">{luvBalance} LUV</span>
            </div>
          </div>

          {/* TAB 1: sovereign credentials registration */}
          {activeTab === "auth" && (
            <div className="flex-1 flex flex-col justify-between py-2">
              <div>
                <div className="bg-gradient-to-br from-cyan-950/20 to-purple-950/20 border border-cyan-500/15 rounded-2xl p-4 text-center mb-3 relative overflow-hidden">
                  <Fingerprint size={32} className="text-cyan-400 mx-auto mb-2 animate-pulse" />
                  <h3 className="text-xs font-semibold text-white font-mono">Sovereign Identity (IID)</h3>
                  <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                    Daftarkan identitas siber kependudukan mandiri KTP terenkripsi Anda secara lokal untuk berpartisipasi 24/7.
                  </p>
                </div>

                <form onSubmit={handleGenerateIID} className="space-y-3">
                  <div>
                    <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">NAMA LENGKAP WARGA</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Masukkan nama lengkap (KTP)"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">PROVINSI DOMISILI</label>
                      <select 
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono cursor-pointer"
                      >
                        {(stats?.provinces && stats.provinces.length > 0 ? stats.provinces : DEFAULT_PROVINCES_STATIC).map((prov) => (
                          <option key={prov.code} value={prov.code}>
                            {prov.name} ({prov.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">DEVICE IDENTIFIER</label>
                      <input 
                        type="text" 
                        disabled
                        value={deviceId}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono select-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">CRYPTOGRAPHIC KEY ENTROPY SEED</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={userSeed}
                        onChange={(e) => setUserSeed(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => setUserSeed("Seed" + Math.floor(Math.random() * 10000))}
                        className="absolute right-2 top-1.5 p-1 text-slate-500 hover:text-cyan-400 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-3 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Fingerprint size={13} />
                    AKTIFKAN SOVEREIGN IID (VERIFIKASI)
                  </button>
                </form>
              </div>

              {isRegistered && (
                <div className="mt-3 p-2 bg-slate-900/50 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-1.5 text-[8px] text-emerald-400 font-bold mb-1">
                    <CheckCircle2 size={10} />
                    IID SOVEREIGN VALID: READY
                  </div>
                  <div className="text-[7.5px] font-mono break-all bg-slate-950/80 p-1 rounded text-cyan-300 border border-cyan-950">
                    {iid}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: secure vote and survey submission forms */}
          {activeTab === "form" && (
            <div className="flex-1 flex flex-col justify-between py-1">
              {!isRegistered ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Fingerprint size={40} className="text-slate-700 mb-2 animate-bounce" />
                  <p className="text-xs text-slate-400 font-mono">Silakan buat Sovereign Identity (IID) warga terlebih dahulu pada tab pertama.</p>
                  <button 
                    onClick={() => setActiveTab("auth")}
                    className="mt-4 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-xl text-xs font-mono cursor-pointer"
                  >
                    Masuk Ke Pembuatan IID
                  </button>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  {/* Form Sub Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl mb-3">
                    <button
                      onClick={() => setFormSubTab("vote")}
                      className={`py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        formSubTab === "vote" 
                          ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      🗳️ VOTE
                    </button>
                    <button
                      onClick={() => setFormSubTab("survey")}
                      className={`py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        formSubTab === "survey" 
                          ? "bg-purple-500/10 border border-purple-500/30 text-purple-400" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📊 SURVEI
                    </button>
                    <button
                      onClick={() => setFormSubTab("census")}
                      className={`py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        formSubTab === "census" 
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📋 SENSUS
                    </button>
                  </div>

                  {/* Form Step A: Cast Vote */}
                  {formSubTab === "vote" && (
                    <form onSubmit={handleAddVote} className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="bg-cyan-950/20 border border-cyan-500/15 p-2.5 rounded-xl">
                          <h4 className="text-[10px] font-bold text-white font-mono flex items-center gap-1">
                            <span>Sovereign Vote Engine</span>
                          </h4>
                          <p className="text-[8px] text-slate-400 font-mono mt-0.5">Satu suara per isu. Semua suara di-hash secara desentralisasi.</p>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">PILIH ISU KEBIJAKAN AKTIF (2026)</label>
                          <select
                            value={selectedTopicId}
                            onChange={(e) => {
                              setSelectedTopicId(e.target.value);
                              setSelectedChoice("A");
                            }}
                            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none font-mono cursor-pointer"
                          >
                            {(stats?.topics || DEFAULT_TOPICS_STATIC).map((topic) => (
                              <option key={topic.id} value={topic.id}>
                                {topic.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">OPSI JAWABAN ANDA</label>
                          <div className="space-y-2">
                            {(activeTopicObj.options || []).map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => setSelectedChoice(opt.key)}
                                className={`w-full text-left p-2 rounded-xl text-[10px] font-mono border transition-all flex items-center justify-between cursor-pointer ${
                                  selectedChoice === opt.key
                                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold"
                                    : "bg-slate-900/30 border-slate-800/80 text-slate-400 hover:border-slate-700"
                                }`}
                              >
                                <span>{opt.key}. {opt.label}</span>
                                {selectedChoice === opt.key && <CheckCircle2 size={12} className="text-cyan-400" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-4 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-400 py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send size={12} /> ENKRIPSI & SIMPAN KE VAULT LOKAL
                      </button>
                    </form>
                  )}

                  {/* Form Step B: Survey Submission */}
                  {formSubTab === "survey" && (
                    <form onSubmit={handleAddSurvey} className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="bg-purple-950/20 border border-purple-500/15 p-2.5 rounded-xl">
                          <h4 className="text-[10px] font-bold text-white font-mono">Pemetaan Sosial Ekonomi Rakyat</h4>
                          <p className="text-[8px] text-slate-400 font-mono mt-0.5">Survei sirkulasi ekonomi pangan dan kepuasan pelayanan sipil.</p>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1.5 font-mono">RENTANG EKONOMI RUMAH TANGGA</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["LOW", "MID", "HIGH"] as const).map((eco) => (
                              <button
                                key={eco}
                                type="button"
                                onClick={() => setHouseholdEconomy(eco)}
                                className={`py-1.5 px-1 text-[9px] font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                                  householdEconomy === eco 
                                    ? "bg-purple-500/10 border-purple-500/40 text-purple-400 font-extrabold" 
                                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700"
                                }`}
                              >
                                {eco === "LOW" ? "Bawah (<2jt)" : eco === "MID" ? "Menengah (2-10jt)" : "Atas (>10jt)"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1.5 font-mono">KONDISI HARGA PANGAN POKOK DAERAH</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["STABLE", "INCREASING", "DECREASING"] as const).map((pri) => (
                              <button
                                key={pri}
                                type="button"
                                onClick={() => setStaplePrices(pri)}
                                className={`py-1.5 px-1 text-[9px] font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                                  staplePrices === pri 
                                    ? "bg-purple-500/10 border-purple-500/40 text-purple-400 font-extrabold" 
                                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700"
                                }`}
                              >
                                {pri === "STABLE" ? "Stabil" : pri === "INCREASING" ? "Naik Berat" : "Turun"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                            <span>INDEKS KEPUASAN PELAYANAN PUBLIK</span>
                            <span className="text-purple-400 font-bold">{satisfaction} / 10</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="10"
                            value={satisfaction}
                            onChange={(e) => setSatisfaction(parseInt(e.target.value))}
                            className="w-full accent-purple-400 cursor-pointer"
                          />
                        </div>

                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 flex gap-2 items-start mt-2">
                          <input 
                            type="checkbox"
                            id="survey_consent"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-0.5 rounded accent-purple-400 cursor-pointer"
                          />
                          <label htmlFor="survey_consent" className="text-[8px] text-slate-400 leading-normal font-mono select-none cursor-pointer">
                            Saya bersedia data ini disinkronkan secara anonim demi kepentingan ketahanan sosial nasional Republik Indonesia.
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!consent}
                        className={`w-full mt-4 py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          consent 
                            ? "bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-400" 
                            : "bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed"
                        }`}
                      >
                        <Send size={12} /> SIMPAN SURVEI KE VAULT LOKAL
                      </button>
                    </form>
                  )}

                  {/* Form Step C: Self Census */}
                  {formSubTab === "census" && (
                    <form onSubmit={handleAddCensus} className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
                        <div className="bg-emerald-950/20 border border-emerald-500/15 p-2 rounded-xl">
                          <h4 className="text-[10px] font-bold text-white font-mono">Sensus Penduduk Mandiri RI</h4>
                          <p className="text-[8px] text-slate-400 font-mono mt-0.5">Pendataan kependudukan terdaulat langsung oleh kepala keluarga.</p>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">KELOMPOK USIA (DEMOGRAFI)</label>
                          <div className="grid grid-cols-2 gap-1">
                            {([
                              { key: "GENZ", label: "Gen Z (10-25)" },
                              { key: "MILLENNIAL", label: "Millennial (26-41)" },
                              { key: "GENX", label: "Gen X (42-57)" },
                              { key: "BOOMER", label: "Boomer (58+)" }
                            ] as const).map((age) => (
                              <button
                                key={age.key}
                                type="button"
                                onClick={() => setCensusAgeBracket(age.key)}
                                className={`py-1 text-[8.5px] font-mono rounded-lg border transition-all cursor-pointer ${
                                  censusAgeBracket === age.key 
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold" 
                                    : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                                }`}
                              >
                                {age.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">SEKTOR MATA PENCAHARIAN UTAMA</label>
                          <div className="grid grid-cols-3 gap-1">
                            {([
                              { key: "Karyawan", label: "Karyawan" },
                              { key: "UMKM", label: "UMKM" },
                              { key: "Tani", label: "Tani/Laut" },
                              { key: "Lepas", label: "Lepas" },
                              { key: "Nganggur", label: "Belum/Tidak" }
                            ] as const).map((occ) => (
                              <button
                                key={occ.key}
                                type="button"
                                onClick={() => setCensusOccupation(occ.key)}
                                className={`py-1 text-[8px] font-mono rounded-lg border transition-all cursor-pointer ${
                                  censusOccupation === occ.key 
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold" 
                                    : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                                }`}
                              >
                                {occ.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">SUMBER AIR BERSIH</label>
                            <select
                              value={censusWaterSource}
                              onChange={(e) => setCensusWaterSource(e.target.value as any)}
                              className="w-full bg-slate-900/60 border border-slate-850 rounded-xl px-2 py-1 text-xs text-white focus:outline-none font-mono cursor-pointer"
                            >
                              <option value="PDAM">PDAM Saluran</option>
                              <option value="Sumur">Sumur Tanah/Bor</option>
                              <option value="Sungai">Hujan/Sungai</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-1">
                              <span>ANGGOTA KK</span>
                              <span className="text-emerald-400 font-bold">{censusHouseholdSize} Orang</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="8"
                              value={censusHouseholdSize}
                              onChange={(e) => setCensusHouseholdSize(parseInt(e.target.value))}
                              className="w-full accent-emerald-400 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] uppercase tracking-wider text-slate-400 mb-1 font-mono">PENGHASILAN BULANAN KK</label>
                          <div className="grid grid-cols-3 gap-1">
                            {(["LOW", "MID", "HIGH"] as const).map((inc) => (
                              <button
                                key={inc}
                                type="button"
                                onClick={() => setCensusIncome(inc)}
                                className={`py-1 text-[8px] font-mono rounded-lg border transition-all cursor-pointer ${
                                  censusIncome === inc 
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold" 
                                    : "bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800"
                                }`}
                              >
                                {inc === "LOW" ? "< Rp2 Juta" : inc === "MID" ? "2M - 10M" : "> Rp10 Juta"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-2 flex gap-2 items-start">
                          <input 
                            type="checkbox"
                            id="census_consent"
                            checked={censusConsent}
                            onChange={(e) => setConsentCensus(e.target.checked)}
                            className="mt-0.5 rounded accent-emerald-400 cursor-pointer"
                          />
                          <label htmlFor="census_consent" className="text-[8px] text-slate-400 leading-normal font-mono select-none cursor-pointer">
                            Sensus mandiri ini di-hash dengan Sovereign IID saya secara anonim dan aman.
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!censusConsent}
                        className={`w-full mt-3 py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          censusConsent 
                            ? "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400" 
                            : "bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed"
                        }`}
                      >
                        <Send size={12} /> AMANKAN SENSUS KE VAULT LOKAL
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: edge nodes simulation map */}
          {activeTab === "indonesia" && (
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-white font-mono flex items-center gap-1.5">
                    <Globe size={12} className="text-cyan-400 animate-pulse" />
                    INDONESIA EDGE ARCHITECTURE
                  </h3>
                  <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full uppercase">
                    38 NODES
                  </span>
                </div>

                <p className="text-[9px] text-slate-400 font-mono mb-3 leading-relaxed">
                  Layar kontrol federasi edge 38 provinsi RI. Simulasikan pengiriman jajak pendapat warga langsung dari daerah.
                </p>

                {/* Floating translucent control center */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md mb-3 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[7px] font-mono uppercase text-slate-400 font-semibold tracking-wider">Federation Controls</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePingMasterHub}
                      className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl py-2 px-1 text-[8.5px] font-mono font-bold text-white tracking-tight flex items-center justify-center gap-1 cursor-pointer transition-all duration-200"
                    >
                      <Wifi size={10} className="text-cyan-400" />
                      PING MASTERNODE
                    </button>

                    <button
                      onClick={handleAutoSimulateAll}
                      className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl py-2 px-1 text-[8.5px] font-mono font-bold text-white tracking-tight flex items-center justify-center gap-1 cursor-pointer transition-all duration-200"
                    >
                      <Sparkles size={10} className="text-amber-400" />
                      AUTO STREAM (38 PROV)
                    </button>
                  </div>

                  {pingStatus && (
                    <div className="mt-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl py-1 text-center text-[7.5px] font-mono text-cyan-400 animate-fade-in">
                      {pingStatus}
                    </div>
                  )}
                </div>

                {/* Search input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Filter provinsi / kode..."
                    value={indonesiaSearch}
                    onChange={(e) => setIndonesiaSearch(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-800/80 rounded-xl px-3 py-1.5 text-[9px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                  />
                </div>

                {/* Provinces Matrix Grid scroll list */}
                <div className="space-y-1 max-h-[175px] overflow-y-auto pr-1">
                  {(stats?.provinces && stats.provinces.length > 0 ? stats.provinces : DEFAULT_PROVINCES_STATIC)
                    .filter((p) => {
                      const matchesSearch = p.name.toLowerCase().includes(indonesiaSearch.toLowerCase()) || p.code.toLowerCase().includes(indonesiaSearch.toLowerCase());
                      const matchesCluster = selectedIndoCluster === "Semua" || p.cluster === selectedIndoCluster;
                      return matchesSearch && matchesCluster;
                    })
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-between gap-2 hover:bg-slate-900/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9px] font-mono font-bold text-white truncate">{p.name}</span>
                            <span className="text-[7px] font-mono text-slate-500 uppercase">({p.code})</span>
                          </div>
                          <span className="text-[7.5px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            Total Activity: <strong className="text-cyan-400">{p.submissionsCount || 0}</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInjectProvinceEvent(p.code)}
                          disabled={isSimulatingNode !== null}
                          className="bg-white/10 hover:bg-white/20 border border-white/10 px-2 py-0.5 rounded-lg text-[7.5px] font-mono font-bold text-white cursor-pointer transition-all"
                        >
                          {isSimulatingNode === p.code ? "INJECTING..." : "INJECT"}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: citizen local offline database vault */}
          {activeTab === "queue" && (
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-white font-mono flex items-center gap-1.5">
                    <Database size={11} className="text-cyan-400" /> 
                    SOVEREIGN VAULT LOKAL
                  </h3>
                  <span className="text-[8px] font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                    {localVotes.length + localSurveys.length + localSelfCensus.length} Paket
                  </span>
                </div>

                <p className="text-[9px] text-slate-400 font-mono mb-3 leading-relaxed">
                  Semua suara, survei harian, dan sensus mandiri tersimpan secara lokal dan terenkripsi AES-256 di dalam ponsel. Lakukan sinkronisasi ketika terhubung jaringan.
                </p>

                {/* Queue display */}
                {localVotes.length === 0 && localSurveys.length === 0 && localSelfCensus.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500">
                    <Database size={20} className="mx-auto text-slate-700 mb-1.5" />
                    <span className="text-[9px] font-mono block">Vault Kosong</span>
                    <span className="text-[8px] font-mono block mt-0.5">Isi suara, survei, atau sensus mandiri untuk mengisi antrian lokal.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {/* Votes section */}
                    {localVotes.map((item, idx) => (
                      <div 
                        key={`v-${idx}`} 
                        className="bg-slate-900/60 border border-cyan-950 rounded-xl p-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono font-bold text-white leading-none">🗳️ Suara: {item.topic_id}</span>
                            <span className="text-[6.5px] font-mono uppercase bg-cyan-500/10 text-cyan-400 px-1 py-0.2 rounded border border-cyan-500/20">VOTE</span>
                          </div>
                          <p className="text-[8px] text-slate-500 font-mono truncate mt-1">
                            Pilihan: <strong className="text-cyan-400">{item.choice}</strong> | Region: {item.location}
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => handleRemoveVoteItem(idx)}
                          className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}

                    {/* Surveys section */}
                    {localSurveys.map((item, idx) => (
                      <div 
                        key={`s-${idx}`} 
                        className="bg-slate-900/60 border border-purple-950 rounded-xl p-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono font-bold text-white leading-none">📊 Survei Harian</span>
                            <span className="text-[6.5px] font-mono uppercase bg-purple-500/10 text-purple-400 px-1 py-0.2 rounded border border-purple-500/20">SURVEY</span>
                          </div>
                          <p className="text-[8px] text-slate-500 font-mono truncate mt-1">
                            Kepuasan: <strong className="text-purple-400">{item.public_service_satisfaction}/10</strong> | Harga: {item.staple_prices}
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => handleRemoveSurveyItem(idx)}
                          className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}

                    {/* Self Census section */}
                    {localSelfCensus.map((item, idx) => (
                      <div 
                        key={`c-${idx}`} 
                        className="bg-slate-900/60 border border-emerald-950 rounded-xl p-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono font-bold text-white leading-none">📋 Sensus Mandiri</span>
                            <span className="text-[6.5px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/20">CENSUS</span>
                          </div>
                          <p className="text-[8px] text-slate-500 font-mono truncate mt-1">
                            Usia: <strong className="text-emerald-400">{item.age_bracket}</strong> | Sektor: {item.occupation} | Air: {item.water_source}
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => setLocalSelfCensus(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sync controls */}
              <div className="mt-3 pt-2 border-t border-slate-900 space-y-1.5">
                {syncStatusMsg && (
                  <div className={`p-1.5 rounded-lg text-[8.5px] font-mono border text-center ${
                    syncStatusMsg.startsWith("Sukses") 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : syncStatusMsg.startsWith("Gagal") || syncStatusMsg.startsWith("Koneksi")
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse"
                  }`}>
                    {syncStatusMsg}
                  </div>
                )}

                <button
                  onClick={handleSyncQueue}
                  disabled={(localVotes.length === 0 && localSurveys.length === 0 && localSelfCensus.length === 0) || isSyncing}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    (localVotes.length === 0 && localSurveys.length === 0 && localSelfCensus.length === 0) 
                      ? "bg-slate-900/30 border border-slate-850 text-slate-500 cursor-not-allowed" 
                      : isSyncing
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 cursor-wait"
                      : "bg-cyan-500/15 backdrop-blur-md border border-cyan-500/45 text-cyan-400 hover:bg-cyan-500/25"
                  }`}
                >
                  <Send size={11} className={isSyncing ? "animate-bounce" : ""} />
                  {isSyncing ? "PROSES SINKRONISASI..." : "KIRIM BATCH (EDGE → PUSAT)"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: LUV token and rewards vault */}
          {activeTab === "wallet" && (
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-amber-600/10 to-yellow-600/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                  <Coins size={30} className="text-amber-400 mx-auto mb-1 animate-bounce" />
                  <span className="text-[8.5px] text-slate-400 font-mono block uppercase">SALDO DOMPET INSENTIF LUV</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight block mt-0.5">{luvBalance} <span className="text-xs">LUV</span></span>
                  <span className="text-[7.5px] text-slate-500 font-mono mt-0.5 block">Kompensasi Kedaulatan Digital Warga</span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-mono font-bold uppercase text-slate-400">RIWAYAT ALIRAN TM (LUV)</h4>
                  
                  {rewardsHistory.length === 0 ? (
                    <div className="text-center p-4 border border-dashed border-slate-900 text-slate-600 rounded-xl">
                      <Coins size={14} className="mx-auto text-slate-800 mb-1" />
                      <span className="text-[8px] font-mono">Belum ada sirkulasi rewards</span>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[145px] overflow-y-auto pr-1">
                      {rewardsHistory.map((item, idx) => (
                        <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between font-mono text-[8px]">
                          <div>
                            <span className="text-white font-bold block">{item.label}</span>
                            <span className="text-slate-500 text-[7px]">{item.time}</span>
                          </div>
                          <span className="text-amber-400 font-bold">+{item.amount} LUV</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Floating Nav tabs */}
        <div className="absolute bottom-3 left-4 right-4 h-12 bg-slate-900/45 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-around px-1 z-40">
          <button 
            onClick={() => setActiveTab("auth")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === "auth" ? "text-cyan-400 bg-white/5 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Fingerprint size={14} />
            <span className="text-[7px] font-mono mt-0.5">IID</span>
          </button>

          <button 
            onClick={() => setActiveTab("form")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === "form" ? "text-cyan-400 bg-white/5 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers size={14} />
            <span className="text-[7px] font-mono mt-0.5">SUARA</span>
          </button>

          <button 
            onClick={() => setActiveTab("indonesia")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === "indonesia" ? "text-cyan-400 bg-white/5 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe size={14} className={activeTab === "indonesia" ? "animate-spin-slow" : ""} />
            <span className="text-[7px] font-mono mt-0.5">NUSA</span>
          </button>

          <button 
            onClick={() => setActiveTab("queue")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative cursor-pointer ${
              activeTab === "queue" ? "text-cyan-400 bg-white/5 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Database size={14} />
            {(localVotes.length > 0 || localSurveys.length > 0 || localSelfCensus.length > 0) && (
              <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            )}
            <span className="text-[7px] font-mono mt-0.5">VAULT</span>
          </button>

          <button 
            onClick={() => setActiveTab("wallet")}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === "wallet" ? "text-cyan-400 bg-white/5 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins size={14} />
            <span className="text-[7px] font-mono mt-0.5">LUV</span>
          </button>
        </div>

        {/* Bottom bar indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-800 rounded-full z-45"></div>

      </div>
    </div>
  );
}
