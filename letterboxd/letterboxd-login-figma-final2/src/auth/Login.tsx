import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/films");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Enter email"
            aria-label="Email"
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div className={styles.row}>
            <Link className={styles.forgot} to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          {error && <p role="alert">{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className={styles.footer}>
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
