export default function About() {
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>About Rewind</h1>
    <p>Rewind is a film diary and community project built by students in Kyiv, Ukraine.</p>
    <section aria-labelledby="credits-heading">
      <h2 id="credits-heading">Film data and images</h2>
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
        <img src="/tmdb-logo.svg" alt="TMDB" style={{ width: 150, maxWidth: "100%" }} />
      </a>
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </section>
  </main>;
}
