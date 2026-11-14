import type { PersonFilmography } from "../../api/people.api";
import type { Genre } from "../../api/search.api";
import { localizeGenreName, useLocale } from "../../i18n";
import { getFilmDecade } from "../../utils/filmDecade";
import styles from "./PersonFilmographyFilters.module.css";

interface Props {
  films: PersonFilmography["films"];
  genres: Genre[];
  genresUnavailable: boolean;
  open: boolean;
  sort: string;
  genreId: string;
  decade: string;
  onSortChange(value: string): void;
  onGenreChange(value: string): void;
  onDecadeChange(value: string): void;
}

export default function PersonFilmographyFilters(props: Props) {
  const { t, lang } = useLocale();
  const decades = new Set<number>();
  for (const film of props.films) {
    const decade = getFilmDecade(film.releaseDate);
    if (decade !== null) decades.add(decade);
  }
  if (props.decade !== "") decades.add(Number(props.decade));
  const availableDecades = [...decades].sort((left, right) => right - left);

  return (
    <div
      id="person-filters"
      className={`${styles.controls} ${props.open ? styles.open : ""}`}
    >
      <label className={styles.field}>
        {t("sortBy")}
        <select
          value={props.sort}
          onChange={(event) => props.onSortChange(event.target.value)}
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="oldest">{t("sortOldest")}</option>
          <option value="rating">{t("sortBestRated")}</option>
          <option value="title">{t("sortTitle")}</option>
        </select>
      </label>
      <label className={styles.field}>
        {t("personDecade")}
        <select
          value={props.decade}
          onChange={(event) => props.onDecadeChange(event.target.value)}
        >
          <option value="">{t("personAllDecades")}</option>
          {availableDecades.map((decade) => (
            <option key={decade} value={decade}>{decade}–{decade + 9}</option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        {t("genre")}
        <select
          value={props.genreId}
          disabled={props.genresUnavailable}
          onChange={(event) => props.onGenreChange(event.target.value)}
        >
          <option value="">{t("allGenres")}</option>
          {props.genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {localizeGenreName(genre.name, lang)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
