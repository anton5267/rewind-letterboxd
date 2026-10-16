import { useEffect, useState } from "react";
import { getMovies, searchMovies } from "../api/search.api";
import { Link } from "react-router-dom";
import { useLocale } from "../i18n";

interface Movie {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export default function Search() {
  const { path, t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (term: string) => {
    setLoading(true);
    setError("");
    try {
      const response = term ? await searchMovies(term) : await getMovies();
      setResults(response.data.content);
    } catch {
      setError(t("loadFilmsError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load("");
  }, []);

  return (
    <main style={{ background: "#151515", color: "#fff", minHeight: "70vh", padding: "110px 5% 32px", fontFamily: "Arial, sans-serif" }}>
      <h1>{t("films")}</h1>
      <form onSubmit={(event) => { event.preventDefault(); void load(query.trim()); }}>
        <input
          aria-label={t("searchFilms")}
          placeholder={t("searchFilms")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #777", marginRight: 8 }}
        />
        <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, cursor: "pointer" }}>{t("search")}</button>
      </form>
      {loading && <p>{t("loadingFilms")}</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && results.length === 0 && <p>{t("noFilms")}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20, marginTop: 24 }}>
        {results.map((movie) => (
          <article key={movie.id}>
            {movie.photoUrl && <img src={movie.photoUrl} alt={movie.title} style={{ width: "100%", borderRadius: 8 }} />}
            <h2 style={{ fontSize: 16 }}><Link to={path(`/films/${movie.id}`)} style={{ color: "#fff" }}>{movie.title}</Link></h2>
            <p>{movie.releaseDate?.slice(0, 4) ?? t("unknownYear")}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
