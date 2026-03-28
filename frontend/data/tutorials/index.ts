// ── Factory Tutorial format (new canonical type) ────────────────────────────────
export type { Tutorial, TutorialStep, TutorialLevel } from '@/lib/tutorial/types';
export type { TutorialMessage, StepValidation } from '@/lib/tutorial/types';

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

// ── Import all tutorials ────────────────────────────────────────────────────────
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

// Re-export all tutorials
export {
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
};

// Validate the refactored tutorials at startup (dev-only, no-op in prod)
validateAllTutorials([chatgptTutorial, instagramTutorial, openclawTutorial, netflixTutorial, uberTutorial]);

export const LIVE_TUTORIALS = new Set<string>([]);

export function isLiveTutorial(id: string): boolean {
  return LIVE_TUTORIALS.has(id);
}

export const LEVELED_TUTORIALS = new Set([
  'chatgpt-architecture',
  'instagram-architecture',
  'netflix-architecture',
  'openclaw-architecture',
  'uber-architecture',
  'whatsapp-architecture',
  'stripe-architecture',
  'youtube-architecture',
  'notion-architecture',
  'twitter-architecture',
  'airbnb-architecture',
  'discord-architecture',
  'zoom-architecture',
  'spotify-architecture',
  'linkedin-architecture',
  'figma-architecture',
  'shopify-architecture',
  'doordash-architecture',
  'github-architecture',
  'url-shortener-architecture',
  'rag-application-architecture',
  'ai-agent-system-architecture',
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
