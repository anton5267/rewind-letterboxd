import os
import requests
from pathlib import Path

TMDB_API_KEY = os.environ.get("TMDB_API_KEY")
LANG = "en-US"
MOVIES_NEEDED = 50

# скільки акторів брати в таблицю movie_actors
ACTORS_PER_MOVIE = 8

def esc(s: str) -> str:
    if s is None:
        return ""
    return s.replace("\\", "\\\\").replace("'", "''")

def person_value(name: str, photo: str | None) -> str:
    photo_sql = "NULL" if photo is None else f"'{esc(photo)}'"
    return f"('{esc(name)}', {photo_sql})"

def tmdb_get(url, params=None):
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    params["language"] = LANG
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def main():
    if not TMDB_API_KEY:
        raise RuntimeError("Set TMDB_API_KEY before generating the seed")

    # 1) TMDb image configuration (base_url + sizes)
    # Як будувати URL картинки описано в TMDb image basics. :contentReference[oaicite:6]{index=6}
    cfg = tmdb_get("https://api.themoviedb.org/3/configuration")
    secure_base = cfg["images"]["secure_base_url"]
    poster_size = "w500" if "w500" in cfg["images"]["poster_sizes"] else cfg["images"]["poster_sizes"][-1]
    backdrop_size = "w1280" if "w1280" in cfg["images"]["backdrop_sizes"] else cfg["images"]["backdrop_sizes"][-1]
    profile_size = "w185" if "w185" in cfg["images"]["profile_sizes"] else cfg["images"]["profile_sizes"][-1]

    def img_url(size, path):
        if not path:
            return None
        return f"{secure_base}{size}{path}"

    # 2) Збираємо 50 різних фільмів з /movie/popular (можна і /discover/movie)
    # Popular endpoint: :contentReference[oaicite:7]{index=7}
    movie_ids = []
    page = 1
    seen = set()

    while len(movie_ids) < MOVIES_NEEDED:
        data = tmdb_get("https://api.themoviedb.org/3/movie/popular", params={"page": page})
        for m in data.get("results", []):
            mid = m["id"]
            if mid not in seen:
                seen.add(mid)
                movie_ids.append(mid)
                if len(movie_ids) >= MOVIES_NEEDED:
                    break
        page += 1
        if page > data.get("total_pages", 1):
            break

    # 3) Для кожного фільму тягнемо details + credits (актори/режисери)
    # credits endpoint: :contentReference[oaicite:8]{index=8}
    movies = []
    all_genres = {}    # name -> True
    all_actors = {}    # name -> photo_url
    all_directors = {} # name -> photo_url

    for mid in movie_ids:
        details = tmdb_get(f"https://api.themoviedb.org/3/movie/{mid}")
        credits = tmdb_get(f"https://api.themoviedb.org/3/movie/{mid}/credits")

        imdb_id = details.get("imdb_id") or f"tmdb:{mid}"  # fallback щоб було унікально
        title = details.get("title") or details.get("original_title") or f"TMDb Movie {mid}"
        overview = details.get("overview") or ""
        release_date = details.get("release_date") or None
        runtime = details.get("runtime")
        vote_avg = details.get("vote_average")  # це НЕ твій user-average, а external rating
        vote_count = details.get("vote_count")

        poster = img_url(poster_size, details.get("poster_path"))
        backdrop = img_url(backdrop_size, details.get("backdrop_path"))

        # genres
        genres = []
        for g in details.get("genres", []):
            gname = g["name"]
            all_genres[gname] = True
            genres.append(gname)

        # directors (crew job=Director)
        directors = []
        for c in credits.get("crew", []):
            if c.get("job") == "Director":
                dname = c.get("name")
                dphoto = img_url(profile_size, c.get("profile_path"))
                all_directors[dname] = dphoto
                directors.append(dname)

        # actors (cast)
        cast = []
        for idx, a in enumerate(credits.get("cast", [])[:ACTORS_PER_MOVIE], start=1):
            aname = a.get("name")
            aphoto = img_url(profile_size, a.get("profile_path"))
            character = a.get("character") or None
            all_actors[aname] = aphoto
            cast.append((aname, character, idx))  # (name, character_name, cast_order)

        movies.append({
            "tmdb_id": mid,
            "imdb_id": imdb_id,
            "title": title,
            "runtime": runtime,
            "release_date": release_date,
            "overview": overview,
            "poster": poster,
            "backdrop": backdrop,
            "directors": directors,
            "genres": genres,
            "cast": cast,
            "tmdb_vote_avg": vote_avg,
            "tmdb_vote_count": vote_count
        })

    # 4) Генеруємо SQL
    out = []
    out.append("USE rewind;")
    out.append("SET FOREIGN_KEY_CHECKS=0;")
    out.append("SET FOREIGN_KEY_CHECKS=1;")
    out.append("")

    # genres
    out.append("-- genres")
    out.append("INSERT INTO genres(name) VALUES\n" +
               ",\n".join([f"('{esc(n)}')" for n in sorted(all_genres.keys())]) +
               "\nON DUPLICATE KEY UPDATE name=VALUES(name);\n")

    # actors
    out.append("-- actors")
    out.append("INSERT INTO actors(name, photo_url) VALUES\n" +
               ",\n".join(person_value(n, p) for n, p in sorted(all_actors.items())) +
               ";\n")

    # directors
    out.append("-- directors")
    out.append("INSERT INTO directors(name, photo_url) VALUES\n" +
               ",\n".join(person_value(n, p) for n, p in sorted(all_directors.items())) +
               ";\n")

    # movies
    out.append("-- movies (rating залишаємо NULL: твоє середнє по користувачах рахується з ratings)")
    vals = []
    for m in movies:
        rd = "NULL" if not m["release_date"] else f"'{m['release_date']}'"
        rt = "NULL" if m["runtime"] is None else str(int(m["runtime"]))
        plot = esc(m["overview"])[:5000]
        poster = "NULL" if not m["poster"] else f"'{esc(m['poster'])}'"
        backdrop = "NULL" if not m["backdrop"] else f"'{esc(m['backdrop'])}'"
        vals.append(
            f"('{esc(m['imdb_id'])}','{esc(m['title'])}',{rt},{rd},NULL,NULL,'{plot}',{poster},{backdrop},NULL)"
        )

    out.append(
        "INSERT INTO movies(imdb_id, title, duration_minutes, release_date, age_rating, rating, short_plot, photo_url, backdrop_url, trailer_url)\n"
        "VALUES\n" + ",\n".join(vals) + "\n"
        "ON DUPLICATE KEY UPDATE title=VALUES(title), duration_minutes=VALUES(duration_minutes), "
        "release_date=VALUES(release_date), short_plot=VALUES(short_plot), photo_url=VALUES(photo_url), backdrop_url=VALUES(backdrop_url);\n"
    )

    # links movie_genres / movie_directors / movie_actors
    out.append("-- movie_genres")
    for m in movies:
        if not m["genres"]:
            continue
        in_list = ",".join([f"'{esc(g)}'" for g in m["genres"]])
        out.append(
            "INSERT IGNORE INTO movie_genres(movie_id, genre_id)\n"
            "SELECT mv.id, g.id FROM movies mv JOIN genres g\n"
            f"WHERE mv.imdb_id='{esc(m['imdb_id'])}' AND g.name IN ({in_list});\n"
        )

    out.append("-- movie_directors")
    for m in movies:
        for d in m["directors"]:
            out.append(
                "INSERT IGNORE INTO movie_directors(movie_id, director_id)\n"
                "SELECT mv.id, d.id FROM movies mv JOIN directors d\n"
                f"WHERE mv.imdb_id='{esc(m['imdb_id'])}' AND d.name='{esc(d)}';\n"
            )

    out.append("-- movie_actors")
    for m in movies:
        for aname, character, order in m["cast"]:
            char_sql = "NULL" if not character else f"'{esc(character)[:150]}'"
            out.append(
                "INSERT IGNORE INTO movie_actors(movie_id, actor_id, character_name, cast_order)\n"
                "SELECT mv.id, a.id, "
                f"{char_sql}, {order}\n"
                "FROM movies mv JOIN actors a\n"
                f"WHERE mv.imdb_id='{esc(m['imdb_id'])}' AND a.name='{esc(aname)}';\n"
            )

    # external_ratings (як “зовнішнє”, щоб показувати на деталях)
    out.append("-- external_ratings (TMDB as external source)")
    for m in movies:
        if m["tmdb_vote_avg"] is None:
            continue
        rating = float(m["tmdb_vote_avg"])
        votes = int(m["tmdb_vote_count"] or 0)
        out.append(
            "INSERT INTO external_ratings(movie_id, source, rating, votes_count)\n"
            "SELECT mv.id, 'TMDB', "
            f"{rating}, {votes} FROM movies mv WHERE mv.imdb_id='{esc(m['imdb_id'])}'\n"
            "ON DUPLICATE KEY UPDATE rating=VALUES(rating), votes_count=VALUES(votes_count), last_updated_at=CURRENT_TIMESTAMP;\n"
        )

    # similar_movies (optional) через endpoint /movie/{id}/similar :contentReference[oaicite:9]{index=9}
    # Щоб не робити 50*додаткових запитів — для демо можна пропустити або додати окремим кроком.

    output_path = Path(__file__).resolve().parents[1] / "backend" / "src" / "main" / "resources" / "seed_50_real.sql"
    with output_path.open("w", encoding="utf-8") as f:
        f.write("\n".join(out))

    print(f"Generated {output_path}")

if __name__ == "__main__":
    main()
