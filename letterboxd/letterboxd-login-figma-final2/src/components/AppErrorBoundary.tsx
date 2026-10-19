import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./AppErrorBoundary.module.css";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected application render error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const english = document.documentElement.lang === "en";
    return (
      <main className={styles.page} role="alert" aria-labelledby="app-error-title">
        <h1 className={styles.title} id="app-error-title">{english ? "Something went wrong" : "Сталася помилка"}</h1>
        <p className={styles.message}>{english ? "Reload the page and try again." : "Перезавантажте сторінку та спробуйте ще раз."}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {english ? "Reload" : "Перезавантажити"}
        </button>
      </main>
    );
  }
}
