export interface Vote {
  vote_id: string;
  iid: string;
  topic_id: string;
  choice: string; // "A" | "B" | "C" | "D"
  timestamp: number;
  location: string; // province code, e.g. "DKI" or "JABAR"
  tier: number; // 1 to 6 (RT/RW to Nasional)
  confidence_score: number; // calculated by AI Validation Layer (0.0 - 1.0)
  fraud_flagged: boolean;
  fingerprint: string;
}

export interface SurveySubmission {
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

export interface SelfCensusSubmission {
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

export interface CensusRecord {
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

export interface VotingTopic {
  id: string;
  title: string;
  description: string;
  levelName: "RT/RW" | "Desa / Kelurahan" | "Kecamatan" | "Kota / Kabupaten" | "Provinsi" | "Nasional";
  level: number; // 1 to 6
  category: "Nasional" | "Daerah" | "Sosial";
  options: { key: string; label: string }[];
  totalVotes: number;
  votesDistribution: { [optionKey: string]: number }; // option key -> count
}

export interface ProvinceStats {
  id: number;
  name: string;
  code: string;
  cluster: "Sumatera" | "Jawa" | "Kalimantan" | "Sulawesi" | "BaliNusa" | "Maluku" | "Papua";
  edgeNode: string;
  submissionsCount: number; // total activity (votes + surveys)
  votesCount: number;
  surveysCount: number;
  selfCensusCount: number; // mobile self-census submissions
  avgSatisfaction: number; // 1.0 - 10.0
  fraudAttemptsCount: number;
  syncStatus: "ONLINE" | "SYNCHRONIZED" | "PENDING";
  lastSyncTime?: number;
}

export interface SocialIssue {
  id: string;
  topic: string;
  category: "Ekonomi" | "Politik" | "Pendidikan" | "Infrastruktur" | "Sosial";
  rawVolume: number;
  weightedScore: number;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  sentimentScore: number; // percentage (e.g. 78% negative or positive)
  primaryPlatform: "X" | "TikTok" | "Instagram" | "YouTube" | "Facebook";
}

export interface SocialPipelineConfig {
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

export interface SocialIntelligenceState {
  config: SocialPipelineConfig;
  issues: SocialIssue[];
  metrics: {
    totalCrawled: number;
    pipelineConfidence: number;
    averageSentiment: number; // 0.0 - 1.0 (positive-ness)
    lastRunTimestamp: number;
  };
}

export interface GovStats {
  population: number; // Projected representation
  totalVotes: number;
  totalSurveys: number;
  totalSelfCensus: number;
  avgSatisfaction: number;
  poverty_index: number; // derived from surveys
  totalHouseholds: number; // active users / IIDs
  totalLuvDistributed: number;
  fraudFlaggedCount: number;
  provinces: ProvinceStats[];
  topics: VotingTopic[];
  censusBaseline: CensusRecord[];
  
  // Dynamic census profile metrics
  censusNationalProfile: {
    ageDistribution: { name: string; value: number }[];
    sectorDistribution: { name: string; value: number }[];
    infrastructureAccess: { name: string; value: number }[];
  };

  // Keep some legacy metrics for Recharts compatibility or transition them beautifully
  educationDistribution: { name: string; value: number }[];
  incomeDistribution: { name: string; value: number }[];
  employmentDistribution: { name: string; value: number }[];

  // Social Intelligence State
  socialIntelligence?: SocialIntelligenceState;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  iid: string;
  type: "SYNC_RECEIVED" | "VALIDATED" | "DEDUPLICATED" | "REJECTED" | "FRAUD_DETECTED" | "VOTE_CAST" | "SURVEY_SUBMITTED" | "CENSUS_SUBMITTED";
  message: string;
  details?: string;
}

export interface AIAnalysisReport {
  summary: string;
  anomalies: string[];
  recommendations: string[];
  timestamp: number;
}
