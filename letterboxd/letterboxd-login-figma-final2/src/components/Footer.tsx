import styles from "./Footer.module.css";

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
          <a>ABOUT US</a>
          <a>NEWS</a>
          <a>HELP</a>
          <a>TERMS</a>
          <a>CONTACTS</a>
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
        © 2025 Rewind. Made by students in Kyiv, Ukraine. Film data from IMDb
      </div>

    </footer>
  );
}
