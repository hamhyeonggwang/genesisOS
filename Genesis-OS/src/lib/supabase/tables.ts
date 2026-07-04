// docs/Architecture.md §7.1 — 공유 Supabase 프로젝트의 기존 스키마와 충돌을 피하기 위해
// 실제 테이블명은 genesis_ 접두사를 쓴다. 접두사는 이 파일에서만 다룬다.

export const TABLES = {
  projects: "genesis_projects",
  projectPhases: "genesis_project_phases",
  contextEntries: "genesis_context_entries",
  documents: "genesis_documents",
  documentVersions: "genesis_document_versions",
  handoffPackages: "genesis_handoff_packages",
  retrospectives: "genesis_retrospectives",
  promptTemplates: "genesis_prompt_templates",
  memoryAssets: "genesis_memory_assets",
} as const;
