import { useState, type KeyboardEvent } from "react";
import { searchPeople, type PersonSearchPage, type PersonType } from "../api/people.api";
import { useLocale } from "../i18n";
import RetryNotice from "./RetryNotice";
import styles from "./AdminMovieCreditsField.module.css";

type SearchPerson = PersonSearchPage["content"][number];
export interface SelectedMoviePerson { id: number; name: string; photoUrl?: string | null; type?: SearchPerson["type"]; filmCount?: number }
export interface AdminMovieCreditsDraft {
  actors: (SelectedMoviePerson & { characterName: string | null; castOrder: number | null })[];
  directors: SelectedMoviePerson[];
  producers: SelectedMoviePerson[];
}

interface Props {
  value: AdminMovieCreditsDraft;
  onChange: (value: AdminMovieCreditsDraft) => void;
}

const personTypes: PersonType[] = ["actor", "director", "producer"];
const selectedKey = { actor: "actors", director: "directors", producer: "producers" } as const;

export default function AdminMovieCreditsField({ value, onChange }: Props) {
  const { t } = useLocale();
  const [queries, setQueries] = useState<Record<PersonType, string>>({ actor: "", director: "", producer: "" });
  const [results, setResults] = useState<Record<PersonType, SearchPerson[] | null>>({ actor: null, director: null, producer: null });
  const [loading, setLoading] = useState<Record<PersonType, boolean>>({ actor: false, director: false, producer: false });
  const [errors, setErrors] = useState<Record<PersonType, boolean>>({ actor: false, director: false, producer: false });

  const labels: Record<PersonType, string> = { actor: t("actors"), director: t("directors"), producer: t("producers") };
  const search = async (type: PersonType) => {
    const query = queries[type].trim();
    if (query.length < 2) return;
    setLoading(current => ({ ...current, [type]: true }));
    setErrors(current => ({ ...current, [type]: false }));
    try {
      const response = await searchPeople(type, query, 0, 12);
      setResults(current => ({ ...current, [type]: response.data.content }));
    } catch {
      setErrors(current => ({ ...current, [type]: true }));
    } finally {
      setLoading(current => ({ ...current, [type]: false }));
    }
  };

  const selected = (type: PersonType) => value[selectedKey[type]] as SelectedMoviePerson[];
  const add = (type: PersonType, person: SearchPerson) => {
    if (selected(type).some(item => item.id === person.id)) return;
    if (type === "actor") {
      onChange({ ...value, actors: [...value.actors, { ...person, characterName: null, castOrder: value.actors.length }] });
    } else if (type === "director") {
      onChange({ ...value, directors: [...value.directors, person] });
    } else {
      onChange({ ...value, producers: [...value.producers, person] });
    }
  };

  const remove = (type: PersonType, id: number) => {
    if (type === "actor") onChange({ ...value, actors: value.actors.filter(person => person.id !== id) });
    else if (type === "director") onChange({ ...value, directors: value.directors.filter(person => person.id !== id) });
    else onChange({ ...value, producers: value.producers.filter(person => person.id !== id) });
  };

  const updateActor = (id: number, field: "characterName" | "castOrder", next: string) => {
    onChange({ ...value, actors: value.actors.map(actor => actor.id !== id ? actor : field === "characterName"
      ? { ...actor, characterName: next || null }
      : { ...actor, castOrder: next === "" ? null : Number(next) }) });
  };

  return <section className={styles.root} aria-labelledby="admin-movie-credits-title">
    <h3 id="admin-movie-credits-title">{t("castAndCrew")}</h3>
    {personTypes.map(type => <fieldset className={styles.group} key={type} disabled={loading[type]} aria-busy={loading[type]}>
      <legend>{labels[type]}</legend>
      <div role="search" className={styles.search}>
        <label className={styles.searchField}>{t("adminMoviePeopleSearch")} · {labels[type]}
          <input value={queries[type]} minLength={2} maxLength={100} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") { event.preventDefault(); void search(type); }
          }} onChange={event => { setQueries(current => ({ ...current, [type]: event.target.value })); setResults(current => ({ ...current, [type]: null })); }} />
        </label>
        <button type="button" disabled={loading[type] || queries[type].trim().length < 2} onClick={() => { void search(type); }}>{loading[type] ? t("loading") : t("search")}</button>
      </div>
      {errors[type] && <RetryNotice className={styles.error} message={t("peopleSearchError")} retryLabel={t("retry")} disabled={loading[type]} busy={loading[type]} onRetry={() => {
        void search(type);
      }} />}
      {!errors[type] && !!results[type]?.length && <ul className={styles.results} aria-label={`${labels[type]} · ${t("adminMoviePeopleResults")}`}>
        {results[type]?.map(person => <li key={person.id}><span>{person.name}</span><button type="button" disabled={selected(type).some(item => item.id === person.id)} onClick={() => add(type, person)}>
          {selected(type).some(item => item.id === person.id) ? t("selected") : t("add")}
        </button></li>)}
      </ul>}
      {selected(type).length > 0 && <ul className={styles.selected} aria-label={`${labels[type]} · ${t("adminMovieSelectedPeople")}`}>
        {selected(type).map(person => <li key={person.id}>
          <span className={styles.personName}>{person.name}</span>
          {type === "actor" && <div className={styles.actorFields}>
            <label>{t("characterName")}<input maxLength={150} value={(person as AdminMovieCreditsDraft["actors"][number]).characterName ?? ""} onChange={event => updateActor(person.id, "characterName", event.target.value)} /></label>
            <label>{t("castOrder")}<input type="number" min="0" step="1" value={(person as AdminMovieCreditsDraft["actors"][number]).castOrder ?? ""} onChange={event => updateActor(person.id, "castOrder", event.target.value)} /></label>
          </div>}
          <button type="button" aria-label={`${t("remove")} ${person.name}`} onClick={() => remove(type, person.id)}>{t("remove")}</button>
        </li>)}
      </ul>}
      {results[type]?.length === 0 && !errors[type] && !loading[type] && queries[type].trim().length >= 2 && <p className={styles.empty} role="status">{t("noGlobalResults")}</p>}
    </fieldset>)}
  </section>;
}
