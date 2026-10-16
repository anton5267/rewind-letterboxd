import styles from "./Header.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.header}>

      {/* LOGO */}
      <Link to="/films" className={styles.logo}>
        <img
          src="/logo.png.png"
          alt="REWIND"
          className={styles.logoImage}
        />
      </Link>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link to="/films">Films</Link>
        {isAuth ? (
          <>
            <Link to="/lists">My lists</Link>
            <Link to="/profile">Profile</Link>
            <button type="button" onClick={() => { logout(); navigate("/login"); }}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      {/* SEARCH */}
      <Link to="/films" className={styles.search} aria-label="Browse films">
        <i className="fa-solid fa-magnifying-glass"></i>
      </Link>

    </header>
  );
}
