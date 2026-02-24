PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  license TEXT,
  version_label TEXT,
  retrieved_at TEXT,
  checksum_sha256 TEXT,
  attribution TEXT
);

CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  display_name TEXT,
  body_system TEXT,
  risk_level TEXT,
  allowed_topic INTEGER NOT NULL DEFAULT 1,
  summary TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS condition_synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  condition_id TEXT NOT NULL,
  synonym TEXT NOT NULL,
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
  UNIQUE (condition_id, synonym)
);

CREATE TABLE IF NOT EXISTS symptoms (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  normalized_term TEXT,
  severity_hint TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS symptom_synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symptom_id TEXT NOT NULL,
  synonym TEXT NOT NULL,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE,
  UNIQUE (symptom_id, synonym)
);

CREATE TABLE IF NOT EXISTS condition_symptom_links (
  condition_id TEXT NOT NULL,
  symptom_id TEXT NOT NULL,
  evidence_level TEXT,
  weight REAL DEFAULT 1.0,
  PRIMARY KEY (condition_id, symptom_id),
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS red_flags (
  id TEXT PRIMARY KEY,
  trigger_text TEXT NOT NULL,
  context_json TEXT,
  recommended_action TEXT NOT NULL,
  emergency_level TEXT NOT NULL,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS triage_rules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  condition_id TEXT,
  min_age INTEGER,
  max_age INTEGER,
  pregnancy_required INTEGER,
  urgency TEXT NOT NULL,
  rule_logic_json TEXT NOT NULL,
  rationale TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (condition_id) REFERENCES conditions(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS guidance_snippets (
  id TEXT PRIMARY KEY,
  topic_type TEXT NOT NULL,
  topic_id TEXT,
  locale TEXT NOT NULL DEFAULT 'en-US',
  audience TEXT NOT NULL DEFAULT 'patient',
  snippet_type TEXT NOT NULL,
  text TEXT NOT NULL,
  citation_url TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS allowed_topics (
  id TEXT PRIMARY KEY,
  topic_name TEXT NOT NULL,
  topic_group TEXT,
  is_allowed INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  scope_notes TEXT
);

CREATE TABLE IF NOT EXISTS topic_policy_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_is_allowed INTEGER,
  new_is_allowed INTEGER,
  previous_enabled INTEGER,
  new_enabled INTEGER,
  changed_by TEXT,
  change_note TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (topic_id) REFERENCES allowed_topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  active_version TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS prompt_template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  version TEXT NOT NULL,
  label TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  change_note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_by TEXT,
  approved_at TEXT,
  FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE,
  UNIQUE (template_id, version)
);

CREATE TABLE IF NOT EXISTS prompt_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,
  version_id TEXT,
  action TEXT NOT NULL,
  actor TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES prompt_template_versions(id)
);

CREATE TABLE IF NOT EXISTS topic_condition_links (
  topic_id TEXT NOT NULL,
  condition_id TEXT NOT NULL,
  PRIMARY KEY (topic_id, condition_id),
  FOREIGN KEY (topic_id) REFERENCES allowed_topics(id) ON DELETE CASCADE,
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drugs (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_name TEXT,
  rxnorm_code TEXT,
  atc_code TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS drug_synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drug_id TEXT NOT NULL,
  synonym TEXT NOT NULL,
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
  UNIQUE (drug_id, synonym)
);

CREATE TABLE IF NOT EXISTS drug_warnings (
  id TEXT PRIMARY KEY,
  drug_id TEXT NOT NULL,
  warning_type TEXT NOT NULL,
  severity TEXT,
  text TEXT NOT NULL,
  citation_url TEXT,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS contraindications (
  id TEXT PRIMARY KEY,
  drug_id TEXT NOT NULL,
  condition_id TEXT,
  context_json TEXT,
  severity TEXT NOT NULL,
  text TEXT NOT NULL,
  source_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
  FOREIGN KEY (condition_id) REFERENCES conditions(id),
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS update_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  manifest_url TEXT NOT NULL,
  status TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  details TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS guardrails_fts USING fts5(
  entity_id,
  entity_type,
  title,
  body,
  tokenize='unicode61'
);

CREATE INDEX IF NOT EXISTS idx_conditions_name ON conditions(canonical_name);
CREATE INDEX IF NOT EXISTS idx_symptoms_term ON symptoms(term);
CREATE INDEX IF NOT EXISTS idx_red_flags_level ON red_flags(emergency_level);
CREATE INDEX IF NOT EXISTS idx_triage_urgency ON triage_rules(urgency);
CREATE INDEX IF NOT EXISTS idx_guidance_type_locale ON guidance_snippets(snippet_type, locale);
CREATE INDEX IF NOT EXISTS idx_drugs_generic ON drugs(generic_name);
