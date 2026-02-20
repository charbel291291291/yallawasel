import React from "react";
import { logger } from "@/services/logger";
import {
  classifyError,
  isValidationError,
  type ValidationErrorCategory,
} from "@/validation";

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
    title: "Data Error",
    message:
      "We received unexpected data from the server. This has been logged and will be investigated.",
    icon: "⚠️",
    color: "amber",
  },
  NETWORK: {
    title: "Connection Issue",
    message:
      "Unable to reach the server. Please check your connection and try again.",
    icon: "🌐",
    color: "blue",
  },
  AUTH: {
    title: "Authentication Error",
    message:
      "Your session may have expired. Please refresh the page or log in again.",
    icon: "🔒",
    color: "purple",
  },
  UNKNOWN: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Our team has been notified.",
    icon: "❌",
    color: "red",
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

    // Structured error logging
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
      // Use custom fallback if provided
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

      // Default error UI
      const config = ERROR_CONFIG[this.state.category];

      return (
        <div
          className={`bg-${config.color}-50 border border-${config.color}-200 rounded-lg p-6 m-4`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">
              {config.icon}
            </span>
            <div className="flex-1">
              <h3
                className={`text-${config.color}-800 font-bold text-lg mb-1`}
              >
                {config.title}
              </h3>
              <p className={`text-${config.color}-600 text-sm mb-4`}>
                {config.message}
              </p>

              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 transition-colors text-sm font-medium`}
                  onClick={this.handleReset}
                >
                  Try Again
                </button>
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
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
