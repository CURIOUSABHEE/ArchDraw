// ── Single source of truth for all tutorial system types ────────────────────

/** Component reference — links to components.json */
export type ComponentRef = {
  id: string;        // must exist in components.json
  label: string;     // must match label in components.json
  searchHint: string; // what user types in ⌘K — defaults to label
};

/** Edge requirement for connection validation */
export type EdgeRequirement = {
  from: string;  // first meaningful word of source label
  to: string;    // first meaningful word of target label
  label?: string; // optional edge label shown on canvas
};

/** Single chat message in the guide panel */
export type TutorialMessage = {
  role: 'ai';
  content: string; // max 3 sentences
};

/** Validation config for a step */
export type StepValidation = {
  successMessage: string;
  errorMessage: string;
};

/** A single step inside a level */
export type TutorialStep = {
  id: number;              // sequential per level, starts at 1
  title: string;           // max 6 words
  explanation: string;     // 2-3 sentences, concept explanation
  action: string;          // add + connect + why
  why: string;             // 1-2 sentences, architectural reason
  component: ComponentRef; // what to add
  openingMessage: string;  // pre-written guide panel message
  celebrationMessage: string; // after node + edge confirmed
  connectingMessage?: string; // optional: specific instruction for connecting phase
  messages: TutorialMessage[]; // exactly 2-3 messages
  requiredNodes: string[];     // component IDs from components.json
  requiredEdges: EdgeRequirement[]; // connections to make
  validation: StepValidation;  // always present — no optional chaining needed
};

/** A single level inside a tutorial */
export type TutorialLevel = {
  level: 1 | 2 | 3;
  title: string;        // max 4 words
  subtitle: string;     // max 8 words
  description: string;  // 2-3 sentences
  stepCount: number;    // always equals steps.length — computed by factory
  estimatedTime: string; // format: '~XX mins'
  unlocks?: string;     // what next level is called
  prerequisite?: string; // for levels 2 and 3
  contextMessage: string; // opening message for this level
  steps: TutorialStep[];
};

/** Tutorial difficulty */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

/** Full tutorial object (leveled format) */
export type Tutorial = {
  id: string;           // kebab-case, ends in -architecture
  title: string;        // "How to Design X Architecture"
  description: string;  // 2 sentences max
  difficulty: Difficulty;
  category: string;
  isLive: boolean;      // true ONLY for netflix-architecture
  icon: string;         // valid Lucide icon name
  color: string;        // hex color
  tags: string[];       // 3-5 tags
  estimatedTime: string; // total across all levels
  levels: [TutorialLevel, TutorialLevel, TutorialLevel]; // exactly 3
};
