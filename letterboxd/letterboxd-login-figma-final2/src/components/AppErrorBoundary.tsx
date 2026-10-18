import { Component, type ErrorInfo, type ReactNode } from "react";

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
      <main role="alert" style={{ minHeight: "100vh", padding: "120px 6% 48px", background: "#151515", color: "white" }}>
        <h1>{english ? "Something went wrong" : "Сталася помилка"}</h1>
        <p>{english ? "Reload the page and try again." : "Перезавантажте сторінку та спробуйте ще раз."}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {english ? "Reload" : "Перезавантажити"}
        </button>
      </main>
    );
  }
}
