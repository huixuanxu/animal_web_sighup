import { useState } from "react";
import { useCreatePost } from "../lib/queries";

export default function PostForm() {
  const createPost = useCreatePost();
  const [author, setAuthor] = useState("阿聿");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("author", author);
    fd.append("title", title);
    fd.append("content", content);
    if (image) fd.append("image", image);

    createPost.mutate(fd, {
      onSuccess: () => {
        setTitle("");
        setContent("");
        setImage(null);
      },
      // onError 已在 hook 裡 alert，這裡不用再處理
    });
  };

  return (
    <form onSubmit={submit} className="bg-white border rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">今天要發佈內容？</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="input input-bordered"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="使用者名稱"
          required
        />
        <input
          className="input input-bordered md:col-span-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="標題"
          required
        />
      </div>

      <textarea
        className="textarea textarea-bordered w-full mt-3"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="內文..."
        required
      />

      <div className="mt-3 flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          className="file-input file-input-bordered"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        <button className="btn btn-primary" disabled={createPost.isPending}>
          {createPost.isPending ? "發佈中…" : "發佈"}
        </button>
      </div>
    </form>
  );
}
