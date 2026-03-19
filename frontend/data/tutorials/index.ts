export type { TutorialData, TutorialStep, TutorialMessage, StepValidation } from './chatgpt-architecture';
export { chatgptTutorial } from './chatgpt-architecture';
export { instagramTutorial } from './instagram-architecture';
export { openclawTutorial } from './openclaw-architecture';
export { netflixTutorial } from './netflix-architecture';

import { chatgptTutorial } from './chatgpt-architecture';
import { instagramTutorial } from './instagram-architecture';
import { openclawTutorial } from './openclaw-architecture';
import { netflixTutorial } from './netflix-architecture';
import type { TutorialData } from './chatgpt-architecture';

export const TUTORIALS: TutorialData[] = [chatgptTutorial, instagramTutorial, openclawTutorial, netflixTutorial];

export function getTutorialById(id: string): TutorialData | undefined {
  return TUTORIALS.find((t) => t.id === id);
}
