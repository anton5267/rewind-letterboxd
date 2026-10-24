import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchGlobal, type GlobalSearchResponse } from "../api/search.api";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatMovieCount, formatMovieYear, localizeJournalCategory, useLocale } from "../i18n";
import { useRovingTabs } from "../hooks/useRovingTabs";
import { getUserHandle, getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./GlobalSearch.module.css";

type SearchTab = "all" | "films" | "users" | "lists" | "tags" | "people" | "reviews" | "journal";
const searchTabs = ["all", "films", "users", "lists", "tags", "people", "reviews", "journal"] as const satisfies readonly SearchTab[];

const searchShortcuts = [
  { href: "/films", label: "films" },
  { href: "/lists/discover?feed=team", label: "featuredLists" },
  { href: "/films?sort=rating_desc", label: "popularFilms" },
  { href: "/lists/discover", label: "searchLists" },
  { href: "/community", label: "searchMembers" },
  { href: "/community/reviewers", label: "popularReviewers" },
] as const;

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
  const categorySelectRef = useRef<HTMLSelectElement>(null);

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

  const focusCategorySelect = () => {
    const select = categorySelectRef.current;
    if (!select) return;
    select.focus({ preventScroll: true });
    select.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const { setTabRef, handleKeyDown } = useRovingTabs(searchTabs, selectTab);

  const tabLabel = (item: SearchTab) => item === "all" ? t("allSearchResults") : item === "films" ? t("films") : item === "users" ? t("users") : item === "lists" ? t("searchLists") : item === "tags" ? t("searchTags") : item === "people" ? t("searchPeople") : item === "reviews" ? t("searchReviews") : t("journal");
  const resultCounts: Record<Exclude<SearchTab, "all">, number> | null = !loading && !error && results ? {
    films: results.films.totalElements,
    users: results.users.totalElements,
    lists: results.lists.totalElements,
    tags: results.tags.length,
    people: results.people.length,
    reviews: results.reviews.totalElements,
    journal: results.journal.totalElements,
  } : null;
  const isEmptyState = !loading && !error && Boolean(query) && !hasVisibleResults;
  const categorySelect = <select ref={categorySelectRef} className={styles.categorySelect} aria-label={t("showSearchResultsFor")} aria-controls="global-search-results" value={tab} onChange={event => selectTab(event.target.value as SearchTab)}>
    {searchTabs.map(item => <option value={item} key={item}>{tabLabel(item)}{item !== "all" && resultCounts ? ` (${resultCounts[item]})` : ""}</option>)}
  </select>;

  return <main className={`${styles.page} ${tab === "films" ? styles.filmsOnly : ""}`} aria-labelledby="global-search-title" aria-busy={loading}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroHeading}>
          <Link className={styles.mobileBack} to={path("/home")} aria-label={t("home")}>←</Link>
          <div>
            <p className={styles.eyebrow}>{t("discoverEyebrow")}</p>
            <h1 id="global-search-title">{t("globalSearch")}</h1>
          </div>
          {query && <button className={styles.mobileFilter} type="button" aria-label={t("showSearchResultsFor")} onClick={focusCategorySelect}>
            <i className="fa-solid fa-sliders" aria-hidden="true" />
          </button>}
        </div>
        <p className={styles.heroIntro}>{t("globalSearchIntro")}</p>
        <form className={styles.searchForm} onSubmit={submit} aria-busy={loading}>
          <label htmlFor="global-search-query"><span className={styles.searchLabel}>{t("globalSearchPlaceholder")}</span>
            <input id="global-search-query" value={input} onChange={event => setInput(event.target.value)} placeholder={t("globalSearchPlaceholder")} />
          </label>
          <button type="submit" aria-label={t("search")} aria-busy={loading}><span className={styles.submitLabel}>{t("search")}</span><i className={`${styles.submitIcon} fa-solid fa-magnifying-glass`} aria-hidden="true" /></button>
        </form>
      </section>

      {query && <div className={styles.matchesHeading}>
        <h2>{t("showingSearchMatches")} “{query}”</h2>
        {isEmptyState ? <div className={styles.categoryPicker}>
          <span className={styles.categoryPrompt} aria-hidden="true">{t("showSearchResultsFor")} <span>⌄</span></span>
          {categorySelect}
        </div> : categorySelect}
      </div>}

      {query && <nav className={styles.resultNav} role="tablist" aria-orientation="horizontal" aria-label={t("globalSearchResults")}>
        {searchTabs.map(item => <button
          className={tab === item ? styles.activeTab : ""}
          type="button"
          role="tab"
          id={`global-search-tab-${item}`}
          ref={setTabRef(item)}
          tabIndex={tab === item ? 0 : -1}
          aria-selected={tab === item}
          aria-label={tabLabel(item)}
          aria-describedby={item !== "all" && resultCounts ? `global-search-count-${item}` : undefined}
          aria-controls="global-search-results"
          onClick={() => selectTab(item)}
          onKeyDown={event => handleKeyDown(event, item)}
          key={item}
        >{tabLabel(item)}{item !== "all" && resultCounts && <span id={`global-search-count-${item}`} className={styles.tabCount}> ({resultCounts[item]})</span>}</button>)}
      </nav>}

      {!query && <>
        <p className={styles.emptyIntro}>{t("globalSearchIntro")}</p>
        <nav className={styles.shortcuts} aria-label={t("searchShortcuts")}>
          {searchShortcuts.map(shortcut => <Link key={shortcut.href} to={path(shortcut.href)}>
            <span>{t(shortcut.label)}</span><span aria-hidden="true">→</span>
          </Link>)}
        </nav>
      </>}
      {query && <div id="global-search-results" className={styles.results} role="tabpanel" tabIndex={0} aria-busy={loading} aria-labelledby={`global-search-tab-${tab}`}>
      {loading && <p className={styles.feedback} role="status">{t("loadingSearch")}</p>}
      {error && <RetryNotice className={styles.alert} message={t("searchError")} retryLabel={t("retry")} busy={loading} onRetry={() => setRetry(value => value + 1)} />}
      {!loading && !error && query && !hasVisibleResults && <section className={styles.noMatches}>
        <p className={styles.sectionKicker}>{t("emptyEyebrow")}</p>
        <h2>{t("noGlobalResults")}</h2>
        <p>{t("noGlobalResultsHint")}</p>
        <Link className={styles.noMatchesAction} to={path("/home")}>{t("backToHome")}</Link>
      </section>}

      {!loading && !error && results && <>
        {(tab === "all" || tab === "films") && results.films.content.length > 0 && <section id="films" className={styles.section} aria-labelledby="global-search-films-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>01 / {t("films")}</p><h2 id="global-search-films-heading">{t("searchFilms")}</h2></div><span>{results.films.totalElements}</span></div>
          <div className={`${styles.filmGrid} ${tab === "all" ? styles.filmRail : ""}`} onFocusCapture={event => {
            if (event.target instanceof HTMLElement) event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
          }}>{results.films.content.map(movie => {
            const movieTitle = editorialText(movie.title, t("untitledFilm"));
            return <article className={styles.filmCard} key={movie.id}>
              <Link to={path(`/films/${movie.id}`)} className={styles.posterLink} aria-label={`${movieTitle} ${t("poster")}`} aria-describedby={`global-search-film-meta-${movie.id}`} title={movieTitle}>
                <Poster src={movie.photoUrl} alt={movieTitle} fallback={movieTitle} />
              </Link>
              <h3><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h3>
              <p id={`global-search-film-meta-${movie.id}`}>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
            </article>;
          })}</div>
        </section>}

        {(tab === "all" || tab === "reviews") && results.reviews.content.length > 0 && <section id="reviews" className={styles.section} aria-labelledby="global-search-reviews-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>06 / {t("searchReviews")}</p><h2 id="global-search-reviews-heading">{t("searchReviews")}</h2></div><span>{results.reviews.totalElements}</span></div>
          <div className={styles.reviewGrid}>{results.reviews.content.map(review => {
            const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
            return <article className={styles.reviewCard} key={review.id}>
              <Link className={styles.reviewPoster} to={path(`/films/${review.movieId}`)} aria-label={`${t("poster")} ${movieTitle}`}>
                <ResilientImage src={review.moviePhotoUrl} alt="" fallback={<span aria-hidden="true">{movieTitle.slice(0, 1)}</span>} />
              </Link>
              <div className={styles.reviewBody}>
                <div className={styles.reviewMeta}>
                  <div className={styles.reviewTitleRow}>
                    <Link className={styles.reviewMovie} to={path(`/films/${review.movieId}`)}>{movieTitle}</Link>
                    {review.rating != null && <span className={styles.reviewRating}>· ★ {review.rating}</span>}
                  </div>
                  <div className={styles.reviewAuthorRow}>
                    <Link to={path(`/users/${review.userId}`)}>{getUserName({ username: review.username }, t("someone"))}</Link>
                    <ResilientImage className={styles.reviewAvatar} src={review.userAvatarUrl} alt="" fallback={<span className={styles.reviewAvatarFallback} aria-hidden="true">{getUserInitial({ username: review.username })}</span>} />
                  </div>
                </div>
                <p><Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></p>
              </div>
            </article>;
          })}</div>
        </section>}

        {(tab === "all" || tab === "users") && results.users.content.length > 0 && <section id="users" className={styles.section} aria-labelledby="global-search-users-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>02 / {t("users")}</p><h2 id="global-search-users-heading">{t("searchUsers")}</h2></div><span>{results.users.totalElements}</span></div>
          <div className={styles.userGrid}>{results.users.content.map(user => <Link className={styles.userCard} to={path(`/users/${user.id}`)} key={user.id}>
            <ResilientImage src={user.avatarUrl} alt="" fallback={<span className={styles.avatarFallback}>{getUserInitial(user)}</span>} />
            <span><strong>{getUserName(user, t("someone"))}</strong><small>{getUserHandle(user, t("someone"))}</small></span>
          </Link>)}</div>
        </section>}

        {(tab === "all" || tab === "people") && results.people.length > 0 && <section id="people" className={styles.section} aria-labelledby="global-search-people-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>05 / {t("searchPeople")}</p><h2 id="global-search-people-heading">{t("searchPeople")}</h2></div><span>{results.people.length}</span></div>
          <div className={styles.peopleGrid}>{results.people.map(person => {
            const personName = editorialText(person.name, t("unknownPerson"));
            return <Link className={styles.personCard} to={path(`/people/${person.type.toLowerCase()}/${person.id}`)} key={`${person.type}-${person.id}`}>
              <ResilientImage src={person.photoUrl} alt="" fallback={<span className={styles.personFallback}>{personName.slice(0, 1).toUpperCase()}</span>} />
              <span><strong>{personName}</strong><small>{person.type === "ACTOR" ? t("actors") : person.type === "PRODUCER" ? t("producers") : t("directors")}</small></span>
            </Link>;
          })}</div>
        </section>}

        {(tab === "all" || tab === "tags") && results.tags.length > 0 && <section id="tags" className={styles.section} aria-labelledby="global-search-tags-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>04 / {t("tags")}</p><h2 id="global-search-tags-heading">{t("searchTags")}</h2></div><span>{results.tags.length}</span></div>
          <div className={styles.tagGrid} onFocusCapture={event => {
            if (event.target instanceof HTMLElement) event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
          }}>{results.tags.map(tag => <Link className={styles.tag} to={path(`/lists/discover?tag=${encodeURIComponent(tag.slug)}`)} key={tag.id}>#{tag.name}</Link>)}</div>
        </section>}

        {(tab === "all" || tab === "lists") && results.lists.content.length > 0 && <section id="lists" className={styles.section} aria-labelledby="global-search-lists-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>03 / {t("lists")}</p><h2 id="global-search-lists-heading">{t("searchLists")}</h2></div><span>{results.lists.totalElements}</span></div>
          <div className={styles.listGrid}>{results.lists.content.map(list => {
            const listName = editorialText(list.name, t("lists"));
            return <Link className={styles.listCard} to={path(`/lists/public/${list.id}`)} title={listName} key={list.id}>
              <div className={styles.listSummary}><h3>{listName}</h3><p><span className={styles.listOwner}>{getUserName({ username: list.ownerUsername }, t("someone"))}</span><span className={styles.listSeparator}> · </span><span className={styles.listCount}>{formatMovieCount(list.itemCount ?? 0, lang)}</span></p>{list.description && <small className={styles.listDescription}>{list.description}</small>}</div>
              <div className={styles.listPreview} aria-hidden="true">{list.previewMovies.slice(0, 5).map(movie => {
                const movieTitle = editorialText(movie.title, t("untitledFilm"));
                return <Poster key={movie.id} src={movie.photoUrl} alt="" fallback={movieTitle} />;
              })}</div>
            </Link>;
          })}</div>
        </section>}

        {(tab === "all" || tab === "journal") && results.journal.content.length > 0 && <section id="journal" className={styles.section} aria-labelledby="global-search-journal-heading">
          <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>07 / {t("journal")}</p><h2 id="global-search-journal-heading">{t("searchJournal")}</h2></div><span>{results.journal.totalElements}</span></div>
          <div className={styles.articleGrid}>{results.journal.content.map(article => {
            const articleTitle = editorialText(article.title, t("untitledArticle"));
            return <Link className={styles.articleCard} to={path(`/journal/${article.slug}`)} key={article.id}>
              <ResilientImage src={article.coverUrl} alt="" fallback={<span className={styles.articleCoverFallback} aria-hidden="true">REWIND</span>} />
              <div><p>{localizeJournalCategory(article.category, t)}</p><h3>{articleTitle}</h3>{article.excerpt && <small>{article.excerpt}</small>}</div>
            </Link>;
          })}</div>
        </section>}
      </>}
      </div>}
    </div>
  </main>;
}
