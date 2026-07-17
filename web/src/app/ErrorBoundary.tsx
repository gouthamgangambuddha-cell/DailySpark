import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this should also report to an error-tracking service (Sentry, etc.)
    // eslint-disable-next-line no-console
    console.error("Uncaught error in component tree:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center dark:bg-ink">
          <h1 className="text-2xl font-bold text-ink dark:text-paper">
            Something went wrong
          </h1>
          <p className="max-w-md text-ink/70 dark:text-paper/70">
            An unexpected error occurred. Try reloading the page, and if the
            problem persists, please contact support.
          </p>
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-spark-500 px-6 py-2.5 font-bold text-ink transition hover:bg-spark-600"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
