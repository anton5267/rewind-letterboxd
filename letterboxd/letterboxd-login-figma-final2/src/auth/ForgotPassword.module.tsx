import { useState } from "react";
import styles from "./ForgotPassword.module.css";
import { forgotPassword } from "../api/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await forgotPassword(email);
      setMessage("Recovery link has been sent to your email");
    } catch {
      setError("Failed to reset password");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <button className={styles.back}>← Return</button>

        <div className={styles.icon}>🔒</div>

        <h1 className={styles.title}>Forgot your password?</h1>

        <p className={styles.text}>
          Enter your email address and we will send you a link to reset your
          password.
        </p>

        <form onSubmit={submit}>
          <input
            className={styles.input}
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit">
            Reset password
          </button>
        </form>

        <div className={styles.divider}>Or</div>

        <p className={styles.create}>Create new account</p>
      </div>
    </div>
  );
}