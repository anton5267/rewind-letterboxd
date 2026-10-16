import styles from "./Footer.module.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>

      {/* TOP LINE */}
      <div className={styles.top}>

        {/* LOGO */}
        <div className={styles.logo}>
          <img src="/logo.png.png" alt="REWIND" />
        </div>

        {/* NAV */}
        <nav className={styles.nav}>
          <Link to="/about">ABOUT US</Link>
        </nav>

      </div>

      {/* SOCIAL — */}
      <div className={styles.socialCenter}>
        <i className="fa-brands fa-x-twitter"></i>
        <i className="fa-brands fa-instagram"></i>
        <i className="fa-brands fa-youtube"></i>
      </div>

      {/* BOTTOM */}
      <div className={styles.bottom}>
        © {new Date().getFullYear()} Rewind. Made by students in Kyiv, Ukraine. Film data from TMDB. <Link to="/about">Credits</Link>
      </div>

    </footer>
  );
}
