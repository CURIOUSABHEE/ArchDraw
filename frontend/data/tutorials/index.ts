export type { TutorialData, TutorialStep, TutorialMessage, StepValidation } from './chatgpt-architecture';
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
import type { TutorialData } from './chatgpt-architecture';

/** tutorialId → whether this tutorial uses live Groq AI */
export const LIVE_TUTORIALS = new Set(['netflix-architecture']);

export function isLiveTutorial(id: string): boolean {
  return LIVE_TUTORIALS.has(id);
}

export const TUTORIALS: TutorialData[] = [
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

export function getTutorialById(id: string): TutorialData | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
