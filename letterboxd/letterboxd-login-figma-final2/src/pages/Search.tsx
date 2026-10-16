import { useEffect, useState } from "react";
import { getMovies, searchMovies } from "../api/search.api";
import { Link } from "react-router-dom";

interface Movie {
  id: number;
  title: string;
  releaseDate: string | null;
  rating: number | null;
  photoUrl: string | null;
}

export default function Search() {
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
      setError("Could not load films. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load("");
  }, []);

  return (
    <main style={{ background: "#151515", color: "#fff", minHeight: "70vh", padding: "110px 5% 32px", fontFamily: "Arial, sans-serif" }}>
      <h1>Films</h1>
      <form onSubmit={(event) => { event.preventDefault(); void load(query.trim()); }}>
        <input
          aria-label="Film title"
          placeholder="Search films"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "1px solid #777", marginRight: 8 }}
        />
        <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, cursor: "pointer" }}>Search</button>
      </form>
      {loading && <p>Loading films...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && results.length === 0 && <p>No films found.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20, marginTop: 24 }}>
        {results.map((movie) => (
          <article key={movie.id}>
            {movie.photoUrl && <img src={movie.photoUrl} alt={movie.title} style={{ width: "100%", borderRadius: 8 }} />}
            <h2 style={{ fontSize: 16 }}><Link to={`/films/${movie.id}`} style={{ color: "#fff" }}>{movie.title}</Link></h2>
            <p>{movie.releaseDate?.slice(0, 4) ?? "Year unknown"}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
