import { useEffect, useState } from "react";
import { getGenres, type Genre } from "../api/search.api";
import { localizeGenreName, useLocale } from "../i18n";
import RetryNotice from "./RetryNotice";
import styles from "./AdminMovieGenresField.module.css";

interface Props {
  selectedIds: number[];
  onChange: (genreIds: number[]) => void;
}

export default function AdminMovieGenresField({ selectedIds, onChange }: Props) {
  const { lang, t } = useLocale();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    getGenres()
      .then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);

  const toggle = (genreId: number, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(genreId);
    else next.delete(genreId);
    onChange([...next].sort((left, right) => left - right));
  };

  return (
    <fieldset className={styles.fieldset} disabled={loading} aria-busy={loading}>
      <legend>{t("genres")}</legend>
      {loading && <p role="status">{t("loading")}</p>}
      {error && <RetryNotice className={styles.error} message={t("adminMovieDetailsError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
      {!loading && !error && <div className={styles.options}>
        {genres.map(genre => <label className={styles.option} key={genre.id}>
          <input type="checkbox" checked={selectedIds.includes(genre.id)} onChange={event => toggle(genre.id, event.target.checked)} />
          <span>{localizeGenreName(genre.name, lang)}</span>
        </label>)}
      </div>}
    </fieldset>
  );
}
