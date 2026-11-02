export type Post = { uri: string; did: string; handle: string; text: string; created_at: string; collected_at: string; langs: string[]; links: string[]; topic: string; origin: string; url: string | null; reply_to: string | null; quote_of: string | null; context_only?:boolean; matched_keywords?:string[]; excerpted?:boolean; project_id?:string };
export type Cluster = { id: string; label: string; rule: string; authors: number; posts: number; span_seconds: number; topic: string; evidence: Post[]; author_ids: string[]; start: string };
export type Overview = { posts: number; authors: number; topics: number; clusters: number; series: { time: string; posts: number }[]; topic_counts: { topic: string; count: number }[]; latest: Post[]; coverage: string; range_start: string | null; range_end: string | null; mode: string; context_posts?:number; series_unit?:string; active_project?: TopicProject | null };
export type Brief = { id: string; title: string; summary: string; status: string; mode: string; provider: string; created_at: string; findings: { text: string; citations: string[] }[]; limitations: string[]; next_steps: string[]; evidence: Post[]; project_id?: string; project_name?: string };
export type Sources = { mode: 'demo' | 'live' | 'snapshot'; settings: { keywords: string[]; languages: string[]; retention_days: number }; collector: { running: boolean; connected: boolean; received: number; accepted: number; deleted: number; reconnects: number; last_event: string | null; error: string | null }; endpoint: string; live_posts: number; gemini_configured: boolean; gemini_project?: string | null; gemini_client_email?: string | null; gemini_model?: string | null; cursor: number | null; limit: number };
export type Simulation = { actors: number; total_posts: number; detected: number; flagged: number; recall: number; precision: number; false_positives: number; series: { actor: number; seconds: number }[]; clusters: Cluster[]; note: string };
export type CollectionEdge={id:string;source:string;target:string;weight:number;evidence:{kind:string;post:Post;parent:Post}[]};
export type CollectionGraph={mode:string;nodes:{id:string;label:string;posts:number;references:number}[];edges:CollectionEdge[];posts:number;connected_accounts:number;isolates:number;unresolved:number;method:string;active_project?:TopicProject|null};

export type TopicProjectMetrics = {
  total_posts: number;
  unique_authors: number;
  coordination_clusters: number;
  flagged_posts: number;
  network_connections: number;
  connected_accounts: number;
  alert_level: 'HIGH SIGNAL' | 'ELEVATED' | 'NORMAL';
  alert_reason: string;
  latest_post_at: string | null;
};

export type TopicProject = {
  id: string;
  code: string;
  name: string;
  topic: string;
  description: string;
  keywords: string[];
  languages: string[];
  status: 'active' | 'monitoring' | 'paused';
  created_at: string;
  last_synced_at: string;
  metrics: TopicProjectMetrics;
  keyword_hits: { keyword: string; count: number }[];
  recent_posts: Post[];
  top_clusters: { id: string; label: string; rule: string; authors: number; posts: number; span_seconds: number }[];
};

export type ProjectsResponse = {
  active_project_id: string | null;
  items: TopicProject[];
  total_global_posts: number;
  created?: TopicProject;
};
