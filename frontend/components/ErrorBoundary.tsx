'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[Archflow] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Something went wrong</p>
              <p className="text-white/50 text-sm mt-1">
                {this.state.error?.message ?? 'An unexpected error occurred.'}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
