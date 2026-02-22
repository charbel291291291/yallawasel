import React from "react";
import { logger } from "@/services/logger";
import {
  classifyError,
  isValidationError,
  type ValidationErrorCategory,
} from "@/utils/validation";

// ============================================
// TYPES
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  category: ValidationErrorCategory;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    category: ValidationErrorCategory;
    onReset: () => void;
  }>;
}

// ============================================
// ERROR MESSAGES BY CATEGORY
// ============================================

const ERROR_CONFIG: Record<
  ValidationErrorCategory,
  { title: string; message: string; icon: string; color: string }
> = {
  VALIDATION: {
    title: "Artifact Breach",
    message:
      "We detected an inconsistency in the digital artifact stream. Our technicians have been alerted.",
    icon: "fa-triangle-exclamation",
    color: "text-primary",
  },
  NETWORK: {
    title: "Terminal Isolation",
    message:
      "Your link to the central node has been severed. Check your uplink status.",
    icon: "fa-satellite-dish",
    color: "text-blue-400",
  },
  AUTH: {
    title: "Credential Denial",
    message:
      "Your high-clearance session has expired. Re-verification required for entry.",
    icon: "fa-vault",
    color: "text-primary",
  },
  UNKNOWN: {
    title: "System Disruption",
    message: "A critical anomaly has halted this module. Self-repair in progress.",
    icon: "fa-skull-crossbones",
    color: "text-red-500",
  },
};

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined, category: "UNKNOWN" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const category = classifyError(error);
    return { hasError: true, error, category };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const category = classifyError(error);

    const logPayload = {
      category,
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: errorInfo.componentStack?.slice(0, 500),
      timestamp: new Date().toISOString(),
      ...(isValidationError(error) && {
        validationIssues: error.issues.slice(0, 5).map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      }),
    };

    logger.error(
      `[ErrorBoundary] ${category} error caught:`,
      logPayload
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, category: "UNKNOWN" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            category={this.state.category}
            onReset={this.handleReset}
          />
        );
      }

      const config = ERROR_CONFIG[this.state.category];

      return (
        <div className="flex items-center justify-center p-6 w-full min-h-[400px]">
          <div className="relative luxury-card p-12 w-full max-w-xl bg-luxury-glow overflow-hidden animate-entrance" role="alert">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <i className={`fas ${config.icon} text-9xl`}></i>
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 bg-white/5 border border-white/10 ${config.color}`}>
                <i className={`fas ${config.icon} text-3xl`}></i>
              </div>

              <h3 className="font-luxury text-3xl font-black text-white mb-4 italic tracking-tight uppercase">
                {config.title}
              </h3>

              <p className="text-white/40 text-sm font-medium mb-10 max-w-sm leading-relaxed tracking-wider">
                {config.message}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                  className="px-8 py-4 bg-gold-gradient text-black rounded-2xl transition-all font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:opacity-90 active:scale-95"
                  onClick={this.handleReset}
                >
                  Initiate Recovery
                </button>
                <button
                  className="px-8 py-4 bg-white/5 text-white/60 border border-white/5 rounded-2xl transition-all font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10"
                  onClick={() => window.location.reload()}
                >
                  Network Re-sync
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
