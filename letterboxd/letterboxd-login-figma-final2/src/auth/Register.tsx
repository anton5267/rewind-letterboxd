import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import { register } from "../api/auth.api";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await register(email, password, nickname);
      setSuccess(true);
    } catch {
      setError("Registration failed");
    }
  };

  // ✅ SUCCESS SCREEN
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.title}>Account created ✅</h2>

          <button
            className={styles.button}
            onClick={() => navigate("/login")}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  // ✅ REGISTER FORM
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>

        <form onSubmit={submit}>
          <input
            className={styles.input}
            placeholder="Enter username"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.button} type="submit">
            Create Account
          </button>
        </form>

        {/* ✅ BACK TO LOGIN */}
        <p
          className={styles.footer}
          onClick={() => navigate("/login")}
          style={{ cursor: "pointer", marginTop: "25px" }}
        >
          Already have an account? <span>Log in</span>
        </p>
      </div>
    </div>
  );
}