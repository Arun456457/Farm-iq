import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  recovered: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    recovered: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, recovered: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('FarmiQ state self-healing triggered:', error, errorInfo);
    // Automatically purge any corrupted session keys quietly
    try {
      localStorage.removeItem('farmiq_token');
      localStorage.removeItem('farmiq_user');
      sessionStorage.clear();
    } catch {}

    // Attempt automatic self-healing recovery once
    if (!this.state.recovered) {
      setTimeout(() => {
        this.setState({ hasError: false, error: null, recovered: true });
      }, 50);
    }
  }

  private handleEnter = () => {
    try {
      localStorage.removeItem('farmiq_token');
      localStorage.removeItem('farmiq_user');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError && !this.state.recovered) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-emerald-100 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mx-auto border-2 border-emerald-400 bg-emerald-950 flex items-center justify-center">
              <img src="/farmiq-logo.png" alt="FarmiQ Logo" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-stone-900 font-['Outfit'] tracking-tight">
                FarmiQ
              </h1>
              <p className="text-xs text-stone-600 font-medium">
                Direct Farmer ↔ Customer Agriculture Platform
              </p>
            </div>

            <button
              onClick={this.handleEnter}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Enter FarmiQ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
