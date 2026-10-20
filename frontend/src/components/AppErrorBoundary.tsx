import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocale } from "../i18n";
import styles from "./AppErrorBoundary.module.css";

interface Props { children: ReactNode }
interface ErrorCopy { title: string; message: string; reload: string }
interface BoundaryProps extends Props { copy: ErrorCopy }
interface State { hasError: boolean }

class ErrorBoundary extends Component<BoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected application render error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className={styles.page} role="alert" aria-labelledby="app-error-title">
        <h1 className={styles.title} id="app-error-title">{this.props.copy.title}</h1>
        <p className={styles.message}>{this.props.copy.message}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {this.props.copy.reload}
        </button>
      </main>
    );
  }
}

export default function AppErrorBoundary({ children }: Props) {
  const { t } = useLocale();
  return <ErrorBoundary copy={{ title: t("appErrorTitle"), message: t("appErrorMessage"), reload: t("reload") }}>{children}</ErrorBoundary>;
}
