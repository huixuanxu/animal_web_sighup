import { useLikePost, useCreateComment, /* 新增： */ useDeletePost } from "../lib/queries";
import { useState } from "react";

export default function PostCard({ post }) {
  const like = useLikePost();
  const createComment = useCreateComment();
  const del = useDeletePost();
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    createComment.mutate({ post_id: post.id, author: "阿聿", text });
    setText("");
  };

  const onDelete = () => {
    if (confirm("確定要刪除這篇文章嗎？")) {
      del.mutate(post.id);
    }
  };

  return (
    <div className="relative rounded-xl border-black-300 bg-[#fff9f0] shadow 2xl-10 text-black">
      {/* 右上角垃圾桶 */}
      <button
        onClick={onDelete}
        className="absolute right-3 top-3 text-xl hover:scale-110 transition-transform"
        title="刪除文章"
        aria-label="刪除文章"
      >
        🗑️
      </button>

     <figure className="px-4 pt-6">
  {post.image_url && (
    // 1) 若是絕對網址就直接用；2) 若是 /static/... 就補上 /api
    <img
      src={
        post.image_url.startsWith("http")
          ? post.image_url
          : (post.image_url.startsWith("/api")
              ? post.image_url
              : `/api${post.image_url}`)
      }
      alt="pet"
      className="rounded-xl"
    />
  )}
</figure>

      <div className="p-4">
        {/* 如果有 title 可以顯示： */}
        {post.title && <h3 className="text-2xl font-bold mb-2">{post.title}</h3>}

        <p className="text-base mb-3">{post.content}</p>

        <div className="flex items-center gap-3 mb-2">
          <button
            className="btn btn-sm"
            onClick={() => like.mutate(post.id)}
          >
            👍 {post.likes}
          </button>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-1">留言</h4>
          <ul className="space-y-1">
            {post.comments?.map((c) => (
              <li key={c.id} className="text-sm opacity-80">
                <span className="font-medium">{c.author}：</span>
                {c.text}
              </li>
            ))}
          </ul>

          <form onSubmit={submit} className="flex gap-2 mt-3">
            <input
              className="input input-bordered flex-1"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="寫點什麼…"
              required
            />
            <button className="btn btn-accent btn-sm">送出</button>
          </form>
        </div>
      </div>
    </div>
  );
}
