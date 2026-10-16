import { useEffect, useState } from "react";
import { getComments, addComment, deleteComment } from "../api/comments.api";

interface Comment {
  id: number;
  text: string;
}

export default function Comments({ reviewId }: { reviewId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await getComments(reviewId);
    setComments(res.data);
  };

  useEffect(() => {
    load();
  }, [reviewId]);

  const submit = async () => {
    await addComment(reviewId, text);
    setText("");
    load();
  };

  const remove = async (id: number) => {
    await deleteComment(id);
    load();
  };

  return (
    <div>
      <h3>Коментарі</h3>

      <input
        placeholder="Ваш коментар"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={submit}>Надіслати</button>

      <ul>
        {comments.map(c => (
          <li key={c.id}>
            {c.text}
            <button onClick={() => remove(c.id)}>Видалити</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
