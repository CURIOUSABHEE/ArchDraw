// ── Factory Tutorial format (new canonical type) ────────────────────────────────
export type { Tutorial } from '@/lib/tutorial/types';
export type { TutorialStep, TutorialMessage, StepValidation, TutorialLevel as TutorialLevelData } from '@/lib/tutorial/types';

// ── Flat Tutorial format (legacy — used by non-refactored tutorials) ────────────
import type { TutorialStep } from '@/lib/tutorial/types';

export type FlatTutorial = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  estimatedTime: string;
  nodeCount: number;
  stepCount: number;
  icon: string;
  color: string;
  tags: string[];
  steps: TutorialStep[];
};

// Re-export FlatTutorial as TutorialData for backward compatibility with old flat tutorials
export type { FlatTutorial as TutorialData };

// ── Union type for the TUTORIALS array ────────────────────────────────────────
import type { Tutorial } from '@/lib/tutorial/types';
export type AnyTutorial = FlatTutorial | Tutorial;

export { chatgptTutorial } from './chatgpt-architecture';
export { instagramTutorial } from './instagram-architecture';
export { openclawTutorial } from './openclaw-architecture';
export { netflixTutorial } from './netflix-architecture';
export { uberTutorial } from './uber-architecture';
export { whatsappTutorial } from './whatsapp-architecture';
export { stripeTutorial } from './stripe-architecture';
export { youtubeTutorial } from './youtube-architecture';
export { notionTutorial } from './notion-architecture';
export { twitterTutorial } from './twitter-architecture';
export { airbnbTutorial } from './airbnb-architecture';
export { discordTutorial } from './discord-architecture';
export { zoomTutorial } from './zoom-architecture';
export { spotifyTutorial } from './spotify-architecture';
export { linkedinTutorial } from './linkedin-architecture';
export { figmaTutorial } from './figma-architecture';
export { shopifyTutorial } from './shopify-architecture';
export { doordashTutorial } from './doordash-architecture';
export { githubTutorial } from './github-architecture';
export { urlShortenerTutorial } from './url-shortener-architecture';
export { ragTutorial } from './rag-application-architecture';
export { aiAgentTutorial } from './ai-agent-system-architecture';

import { chatgptTutorial } from './chatgpt-architecture';
import { instagramTutorial } from './instagram-architecture';
import { openclawTutorial } from './openclaw-architecture';
import { netflixTutorial } from './netflix-architecture';
import { uberTutorial } from './uber-architecture';
import { whatsappTutorial } from './whatsapp-architecture';
import { stripeTutorial } from './stripe-architecture';
import { youtubeTutorial } from './youtube-architecture';
import { notionTutorial } from './notion-architecture';
import { twitterTutorial } from './twitter-architecture';
import { airbnbTutorial } from './airbnb-architecture';
import { discordTutorial } from './discord-architecture';
import { zoomTutorial } from './zoom-architecture';
import { spotifyTutorial } from './spotify-architecture';
import { linkedinTutorial } from './linkedin-architecture';
import { figmaTutorial } from './figma-architecture';
import { shopifyTutorial } from './shopify-architecture';
import { doordashTutorial } from './doordash-architecture';
import { githubTutorial } from './github-architecture';
import { urlShortenerTutorial } from './url-shortener-architecture';
import { ragTutorial } from './rag-application-architecture';
import { aiAgentTutorial } from './ai-agent-system-architecture';
import { validateAllTutorials } from '@/lib/tutorial/validators';

// Validate the refactored tutorials at startup (dev-only, no-op in prod)
validateAllTutorials([chatgptTutorial, instagramTutorial, openclawTutorial, netflixTutorial, uberTutorial]);

/** tutorialId → whether this tutorial uses live Groq AI */
// Netflix moved to static — no live tutorials currently
export const LIVE_TUTORIALS = new Set<string>([]);

export function isLiveTutorial(id: string): boolean {
  return LIVE_TUTORIALS.has(id);
}

/** tutorialId → whether this tutorial uses the 3-level progressive format */
export const LEVELED_TUTORIALS = new Set([
  'chatgpt-architecture',
  'instagram-architecture',
  'netflix-architecture',
  'openclaw-architecture',
  'uber-architecture',
]);

export function isLeveledTutorial(id: string): boolean {
  return LEVELED_TUTORIALS.has(id);
}

export const TUTORIALS: AnyTutorial[] = [
  chatgptTutorial,
  instagramTutorial,
  openclawTutorial,
  netflixTutorial,
  uberTutorial,
  whatsappTutorial,
  stripeTutorial,
  youtubeTutorial,
  notionTutorial,
  twitterTutorial,
  airbnbTutorial,
  discordTutorial,
  zoomTutorial,
  spotifyTutorial,
  linkedinTutorial,
  figmaTutorial,
  shopifyTutorial,
  doordashTutorial,
  githubTutorial,
  urlShortenerTutorial,
  ragTutorial,
  aiAgentTutorial,
];

export function getTutorialById(id: string): AnyTutorial | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
