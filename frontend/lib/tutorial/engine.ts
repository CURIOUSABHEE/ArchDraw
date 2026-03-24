import type { Node, Edge } from 'reactflow';
import type {
  Tutorial,
  TutorialLevel,
  TutorialStep,
  TutorialState,
  TutorialStatus,
  ValidationResult,
  ValidationError,
  CanvasEvent,
  ActionIntent,
  EventHandler,
} from './types';
import { createGraph, matchesMatcher, type ArchitectureGraph } from './graph';

type TutorialEventHandler = (
  event: CanvasEvent,
  state: TutorialState,
  graph: ArchitectureGraph
) => TutorialState | void;

export interface TutorialEngineConfig {
  tutorial: Tutorial;
  onStateChange?: (state: TutorialState) => void;
  onValidation?: (result: ValidationResult) => void;
  onStepComplete?: (step: TutorialStep) => void;
  onLevelComplete?: (level: TutorialLevel) => void;
  onTutorialComplete?: (tutorial: Tutorial) => void;
}

export class TutorialEngine {
  private tutorial: Tutorial;
  private state: TutorialState;
  private graph: ArchitectureGraph;
  private eventHandlers: Map<string, TutorialEventHandler[]> = new Map();
  private config: TutorialEngineConfig;

  constructor(config: TutorialEngineConfig) {
    this.tutorial = config.tutorial;
    this.config = config;
    this.state = this.createInitialState();
    this.graph = this.createEmptyGraph();
  }

  private createInitialState(): TutorialState {
    return {
      tutorialId: null,
      levelId: null,
      currentStepIndex: 0,
      status: 'idle',
      errors: [],
      hintsShown: 0,
      startedAt: null,
      completedAt: null,
    };
  }

  private createEmptyGraph(): ArchitectureGraph {
    return createGraph([], []);
  }

  getState(): TutorialState {
    return { ...this.state };
  }

  getGraph(): ArchitectureGraph {
    return this.graph;
  }

  getCurrentTutorial(): Tutorial {
    return this.tutorial;
  }

  getCurrentLevel(): TutorialLevel | null {
    if (!this.state.levelId) return null;
    return this.tutorial.levels.find(l => l.id === this.state.levelId) || null;
  }

  getCurrentStep(): TutorialStep | null {
    const level = this.getCurrentLevel();
    if (!level) return null;
    return level.steps[this.state.currentStepIndex] || null;
  }

  getNextStep(): TutorialStep | null {
    const level = this.getCurrentLevel();
    if (!level) return null;
    return level.steps[this.state.currentStepIndex + 1] || null;
  }

  updateGraph(nodes: Node[], edges: Edge[]): void {
    this.graph = createGraph(nodes, edges);
    this.validateCurrentStep();
  }

  private setState(newState: Partial<TutorialState>): void {
    this.state = { ...this.state, ...newState };
    this.config.onStateChange?.(this.state);
  }

  start(): void {
    if (this.state.status !== 'idle') return;
    
    this.setState({
      tutorialId: this.tutorial.id,
      status: 'starting',
      startedAt: Date.now(),
    });

    const firstLevel = this.tutorial.levels[0];
    if (firstLevel) {
      this.startLevel(firstLevel.id);
    }
  }

  startLevel(levelId: string): void {
    const level = this.tutorial.levels.find(l => l.id === levelId);
    if (!level) {
      console.error(`[TutorialEngine] Level not found: ${levelId}`);
      return;
    }

    this.setState({
      levelId: level.id,
      currentStepIndex: 0,
      status: 'in_progress',
      errors: [],
      hintsShown: 0,
    });
  }

  validateCurrentStep(): ValidationResult {
    const step = this.getCurrentStep();
    if (!step) {
      return { isValid: false, errors: [{ code: 'NO_STEP', message: 'No current step' }] };
    }

    const result = step.validation(this.graph);
    
    if (result.isValid) {
      this.setState({ status: 'step_complete', errors: [] });
      this.config.onValidation?.(result);
      this.config.onStepComplete?.(step);
    } else {
      this.setState({ status: 'in_progress', errors: result.errors });
      this.config.onValidation?.(result);
    }

    return result;
  }

  advanceStep(): void {
    const currentStep = this.getCurrentStep();
    const nextStep = this.getNextStep();
    const currentLevel = this.getCurrentLevel();

    if (!currentLevel) return;

    if (currentStep) {
      this.config.onStepComplete?.(currentStep);
    }

    if (nextStep) {
      this.setState({
        currentStepIndex: this.state.currentStepIndex + 1,
        status: 'in_progress',
        errors: [],
        hintsShown: 0,
      });
    } else {
      this.completeLevel();
    }
  }

  showHint(): string | null {
    const step = this.getCurrentStep();
    if (!step) return null;

    if (this.state.hintsShown < step.hints.length) {
      const hint = step.hints[this.state.hintsShown];
      this.setState({ hintsShown: this.state.hintsShown + 1 });
      return hint;
    }

    return null;
  }

  private completeLevel(): void {
    const currentLevel = this.getCurrentLevel();
    if (!currentLevel) return;

    this.setState({ status: 'level_complete' });
    this.config.onLevelComplete?.(currentLevel);

    const currentLevelIndex = this.tutorial.levels.findIndex(l => l.id === currentLevel.id);
    const nextLevel = this.tutorial.levels[currentLevelIndex + 1];

    if (nextLevel) {
      this.startLevel(nextLevel.id);
    } else {
      this.complete();
    }
  }

  complete(): void {
    this.setState({
      status: 'completed',
      completedAt: Date.now(),
    });
    this.config.onTutorialComplete?.(this.tutorial);
  }

  reset(): void {
    this.state = this.createInitialState();
    this.graph = this.createEmptyGraph();
    this.config.onStateChange?.(this.state);
  }

  pause(): void {
    if (this.state.status === 'in_progress' || this.state.status === 'step_complete') {
      this.setState({ status: 'paused' });
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.setState({ status: 'in_progress' });
    }
  }

  on(event: string, handler: TutorialEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: TutorialEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  handleEvent(event: CanvasEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      const result = handler(event, this.state, this.graph);
      if (result) {
        this.setState(result);
      }
    }
  }

  getFeedback(): string[] {
    const step = this.getCurrentStep();
    if (!step) return [];
    return step.feedback(this.graph);
  }
}

export function createTutorialEngine(config: TutorialEngineConfig): TutorialEngine {
  return new TutorialEngine(config);
}
