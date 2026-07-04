// Genesis OS 도메인 타입 — docs/Architecture.md §4 DDL과 1:1 대응 (any 금지)

export type PhaseName =
  | "discover"
  | "define"
  | "design"
  | "engineer"
  | "handoff";

export type PhaseStatus =
  | "locked"
  | "active"
  | "in_review"
  | "done"
  | "stale";

export type DocType = "prd" | "roadmap" | "ia" | "ux" | "architecture" | "api";

export type DocStatus = "draft" | "approved";

export type EntryStatus = "confirmed" | "pending" | "invalidated";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  idea: string;
  created_at: string;
  updated_at: string;
}

export interface PipelinePhase {
  id: string;
  user_id: string;
  project_id: string;
  phase: PhaseName;
  status: PhaseStatus;
  checklist: ChecklistItem[];
  approved_at: string | null;
}

export interface ChecklistItem {
  key: string;
  label: string;
  met: boolean;
}

/** M2 Project Memory의 단위 — 질문·답변·정착된 결정 */
export interface ContextEntry {
  id: string;
  user_id: string;
  project_id: string;
  phase: PhaseName;
  question: string;
  answer: string | null;
  decision: string | null;
  category: string;
  status: EntryStatus;
  created_at: string;
}

export interface GenesisDocument {
  id: string;
  user_id: string;
  project_id: string;
  type: DocType;
  status: DocStatus;
}

export interface DocumentVersion {
  id: string;
  user_id: string;
  document_id: string;
  version: number;
  content_md: string;
  source: "ai_generated" | "user_edited";
  created_at: string;
}

export interface HandoffPackage {
  id: string;
  user_id: string;
  project_id: string;
  claude_md: string;
  tasks_md: string;
  start_prompt: string;
  doc_version_ids: string[];
  created_at: string;
}

export interface Retrospective {
  id: string;
  user_id: string;
  project_id: string;
  went_well: string | null;
  design_gaps: string | null;
  new_questions: string | null;
  created_at: string;
}

export interface MemoryAsset {
  id: string;
  user_id: string;
  kind: "question" | "pattern" | "checklist" | "failure";
  content: string;
  source_project_id: string | null;
  created_at: string;
}
