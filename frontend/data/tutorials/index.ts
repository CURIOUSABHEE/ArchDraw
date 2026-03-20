// Legacy types (used by 15 non-refactored tutorials)
export type { TutorialData, TutorialStep, TutorialMessage, StepValidation, TutorialLevelData } from './chatgpt-architecture';

// New canonical type (used by 4 refactored tutorials)
export type { Tutorial } from '@/lib/tutorial/types';

// Union type for the TUTORIALS array
import type { TutorialData } from './chatgpt-architecture';
import type { Tutorial } from '@/lib/tutorial/types';
export type AnyTutorial = TutorialData | Tutorial;

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
import { validateAllTutorials } from '@/lib/tutorial/validators';

// Validate the 4 refactored tutorials at startup (dev-only, no-op in prod)
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
];

export function getTutorialById(id: string): AnyTutorial | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
