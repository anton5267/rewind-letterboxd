import { useEffect, useState } from "react";
import { getUserRating, setRating, deleteRating } from "../api/ratings.api";

export default function Rating({ movieId }: { movieId: number }) {
  const [value, setValue] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await getUserRating(movieId);
      setValue(res.data.rating);
    } catch {
      setValue(null);
    }
  };

  useEffect(() => {
    load();
  }, [movieId]);

  const rate = async (r: number) => {
    await setRating(movieId, r);
    setValue(r);
  };

  const remove = async () => {
    await deleteRating(movieId);
    setValue(null);
  };

  return (
    <div>
      <p>Ваша оцінка:</p>

      {[1,2,3,4,5].map(r => (
        <button
          key={r}
          onClick={() => rate(r)}
          style={{ fontWeight: value === r ? "bold" : "normal" }}
        >
          {r}
        </button>
      ))}

      {value && (
        <div>
          <p>Ви оцінили: {value}</p>
          <button onClick={remove}>Скасувати оцінку</button>
        </div>
      )}
    </div>
  );
}
