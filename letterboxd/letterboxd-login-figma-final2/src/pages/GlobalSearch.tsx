import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchGlobal, type GlobalSearchResponse } from "../api/search.api";
import ResilientImage from "../components/ResilientImage";
import { formatMovieCount, localizeJournalCategory, useLocale } from "../i18n";
import styles from "./GlobalSearch.module.css";

type SearchTab = "all" | "films" | "users" | "lists" | "tags" | "people" | "reviews" | "journal";

function Poster({ src, alt, fallback }: { src: string | null; alt: string; fallback: string }) {
  return <ResilientImage className={styles.poster} src={src} alt={alt} fallback={<span className={styles.posterFallback}>{fallback}</span>} />;
}

export default function GlobalSearch() {
  const { lang, path, t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const rawTab = searchParams.get("tab");
  const tab: SearchTab = rawTab === "films" || rawTab === "users" || rawTab === "lists" || rawTab === "tags"
    || rawTab === "people" || rawTab === "reviews" || rawTab === "journal" ? rawTab : "all";
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(query));
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setInput(query);
    if (!query) {
      setResults(null);
      setLoading(false);
      setError(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    searchGlobal(query, lang).then(({ data }) => {
      if (active) setResults(data);
    }).catch(() => {
      if (active) {
        setResults(null);
        setError(true);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [query, lang, retry]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (input.trim()) next.set("q", input.trim());
    setSearchParams(next);
  };

  const resultAvailability: Record<Exclude<SearchTab, "all">, boolean> = {
    films: Boolean(results?.films.content.length),
    users: Boolean(results?.users.content.length),
    lists: Boolean(results?.lists.content.length),
    tags: Boolean(results?.tags.length),
    people: Boolean(results?.people.length),
    reviews: Boolean(results?.reviews.content.length),
    journal: Boolean(results?.journal.content.length),
  };
  const hasResults = results && (results.films.content.length > 0 || results.users.content.length > 0
    || results.lists.content.length > 0 || results.tags.length > 0 || results.people.length > 0
    || results.reviews.content.length > 0 || results.journal.content.length > 0);
  const hasVisibleResults = tab === "all" ? Boolean(hasResults) : resultAvailability[tab];

  const selectTab = (nextTab: SearchTab) => {
    const next = new URLSearchParams(searchParams);
    if (nextTab === "all") next.delete("tab");
    else next.set("tab", nextTab);
    setSearchParams(next);
  };

  return <main className={styles.page} aria-busy={loading}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("discoverEyebrow")}</p>
        <h1>{t("globalSearch")}</h1>
        <p>{t("globalSearchIntro")}</p>
        <form className={styles.searchForm} onSubmit={submit} aria-busy={loading}>
          <label htmlFor="global-search-query">{t("globalSearchPlaceholder")}
            <input id="global-search-query" value={input} onChange={event => setInput(event.target.value)} placeholder={t("globalSearchPlaceholder")} />
          </label>
          <button type="submit" aria-busy={loading}>{t("search")}</button>
        </form>
      </section>

      {query && <nav className={styles.resultNav} aria-label={t("globalSearchResults")}>
        {(["all", "films", "users", "lists", "tags", "people", "reviews", "journal"] as SearchTab[]).map(item => <button
          className={tab === item ? styles.activeTab : ""}
          type="button"
          aria-pressed={tab === item}
          aria-controls={item !== "all" && resultAvailability[item] ? item : undefined}
          onClick={() => selectTab(item)}
          key={item}
        >{item === "all" ? t("globalSearch") : item === "films" ? t("films") : item === "users" ? t("users") : item === "lists" ? t("searchLists") : item === "tags" ? t("searchTags") : item === "people" ? t("searchPeople") : item === "reviews" ? t("searchReviews") : t("journal")}</button>)}
      </nav>}

      {!query && <p className={styles.emptyIntro}>{t("globalSearchIntro")}</p>}
      {loading && <p className={styles.feedback} role="status">{t("loadingSearch")}</p>}
      {error && <p className={styles.alert} role="alert">{t("searchError")} <button type="button" aria-busy={loading} onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></p>}
      {!loading && !error && query && !hasVisibleResults && <section className={styles.noMatches}>
        <p className={styles.sectionKicker}>{t("emptyEyebrow")}</p>
        <h2>{t("noGlobalResults")}</h2>
        <p>{t("noGlobalResultsHint")}</p>
        <Link className={styles.noMatchesAction} to={path("/home")}>{t("home")}</Link>
      </section>}

      {!loading && !error && results && <div className={styles.results}>
        {(tab === "all" || tab === "films") && results.films.content.length > 0 && <section id="films" className={styles.section} aria-labelledby="global-search-films-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>01 / {t("films")}</p><h2 id="global-search-films-heading">{t("searchFilms")}</h2></div><span>{results.films.totalElements}</span></div>
          <div className={styles.filmGrid}>{results.films.content.map(movie => <article className={styles.filmCard} key={movie.id}>
            <Link to={path(`/films/${movie.id}`)} className={styles.posterLink} aria-label={`${movie.title} ${t("poster")}`}>
              <Poster src={movie.photoUrl} alt={movie.title} fallback={movie.title} />
            </Link>
            <h3><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link></h3>
            <p>{movie.releaseDate?.slice(0, 4) ?? t("unknownYear")}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
          </article>)}</div>
        </section>}

        {(tab === "all" || tab === "users") && results.users.content.length > 0 && <section id="users" className={styles.section} aria-labelledby="global-search-users-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>02 / {t("users")}</p><h2 id="global-search-users-heading">{t("searchUsers")}</h2></div><span>{results.users.totalElements}</span></div>
          <div className={styles.userGrid}>{results.users.content.map(user => <Link className={styles.userCard} to={path(`/users/${user.id}`)} key={user.id}>
            <ResilientImage src={user.avatarUrl} alt="" fallback={<span className={styles.avatarFallback}>{user.username.slice(0, 1).toUpperCase()}</span>} />
            <span><strong>{user.displayName || user.username}</strong><small>@{user.username}</small></span>
          </Link>)}</div>
        </section>}

        {(tab === "all" || tab === "lists") && results.lists.content.length > 0 && <section id="lists" className={styles.section} aria-labelledby="global-search-lists-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>03 / {t("lists")}</p><h2 id="global-search-lists-heading">{t("searchLists")}</h2></div><span>{results.lists.totalElements}</span></div>
          <div className={styles.listGrid}>{results.lists.content.map(list => <Link className={styles.listCard} to={path(`/lists/public/${list.id}`)} key={list.id}>
            <div className={styles.listPreview}>{list.previewMovies.slice(0, 3).map(movie => <Poster key={movie.id} src={movie.photoUrl} alt="" fallback={movie.title} />)}</div>
            <div><h3>{list.name}</h3><p>{list.ownerUsername} · {formatMovieCount(list.itemCount ?? 0, lang)}</p>{list.description && <small>{list.description}</small>}</div>
          </Link>)}</div>
        </section>}

        {(tab === "all" || tab === "tags") && results.tags.length > 0 && <section id="tags" className={styles.section} aria-labelledby="global-search-tags-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>04 / {t("tags")}</p><h2 id="global-search-tags-heading">{t("searchTags")}</h2></div><span>{results.tags.length}</span></div>
          <div className={styles.tagGrid}>{results.tags.map(tag => <Link className={styles.tag} to={path(`/lists/discover?tag=${encodeURIComponent(tag.slug)}`)} key={tag.id}>#{tag.name}</Link>)}</div>
        </section>}

        {(tab === "all" || tab === "people") && results.people.length > 0 && <section id="people" className={styles.section} aria-labelledby="global-search-people-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>05 / {t("searchPeople")}</p><h2 id="global-search-people-heading">{t("searchPeople")}</h2></div><span>{results.people.length}</span></div>
          <div className={styles.peopleGrid}>{results.people.map(person => <Link className={styles.personCard} to={path(`/people/${person.type.toLowerCase()}/${person.id}`)} key={`${person.type}-${person.id}`}>
            <ResilientImage src={person.photoUrl} alt="" fallback={<span className={styles.personFallback}>{person.name.slice(0, 1).toUpperCase()}</span>} />
            <span><strong>{person.name}</strong><small>{person.type === "ACTOR" ? t("actors") : person.type === "PRODUCER" ? t("producers") : t("directors")}</small></span>
          </Link>)}</div>
        </section>}

        {(tab === "all" || tab === "reviews") && results.reviews.content.length > 0 && <section id="reviews" className={styles.section} aria-labelledby="global-search-reviews-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>06 / {t("searchReviews")}</p><h2 id="global-search-reviews-heading">{t("searchReviews")}</h2></div><span>{results.reviews.totalElements}</span></div>
          <div className={styles.reviewGrid}>{results.reviews.content.map(review => <article className={styles.reviewCard} key={review.id}>
            <div className={styles.reviewHeader}>
              <Link className={styles.reviewPoster} to={path(`/films/${review.movieId}`)} aria-label={`${t("poster")} ${review.movieTitle}`}>
                <ResilientImage src={review.moviePhotoUrl} alt="" fallback={<span aria-hidden="true">{review.movieTitle.slice(0, 1)}</span>} />
              </Link>
              <div className={styles.reviewMeta}><Link to={path(`/users/${review.userId}`)}>{review.username}</Link><span>{review.rating != null ? `★ ${review.rating}` : ""}</span></div>
              <ResilientImage className={styles.reviewAvatar} src={review.userAvatarUrl} alt="" fallback={<span className={styles.reviewAvatarFallback} aria-hidden="true">{review.username.slice(0, 1).toUpperCase()}</span>} />
            </div>
            <p><Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></p>
            <Link className={styles.reviewMovie} to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>
          </article>)}</div>
        </section>}

        {(tab === "all" || tab === "journal") && results.journal.content.length > 0 && <section id="journal" className={styles.section} aria-labelledby="global-search-journal-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>07 / {t("journal")}</p><h2 id="global-search-journal-heading">{t("searchJournal")}</h2></div><span>{results.journal.totalElements}</span></div>
          <div className={styles.articleGrid}>{results.journal.content.map(article => <Link className={styles.articleCard} to={path(`/journal/${article.slug}`)} key={article.id}>
            <ResilientImage src={article.coverUrl} alt="" fallback={<span className={styles.articleCoverFallback} aria-hidden="true">REWIND</span>} />
            <div><p>{localizeJournalCategory(article.category, t)}</p><h3>{article.title}</h3>{article.excerpt && <small>{article.excerpt}</small>}</div>
          </Link>)}</div>
        </section>}
      </div>}
    </div>
  </main>;
}
