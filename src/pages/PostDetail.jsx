import { useParams, useNavigate } from "react-router-dom";
import { usePost, useLikePost, useCreateComment, useDeletePost } from "../lib/queries";
import { useState } from "react";
import { fmt } from "../lib/date";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading } = usePost(Number(id));
  const like = useLikePost();
  const createComment = useCreateComment();
  const del = useDeletePost();

  const [text, setText] = useState("");
  const [showImg, setShowImg] = useState(true);

  if (isLoading) return <div className="p-8">載入中…</div>;
  if (!post) return <div className="p-8">找不到文章</div>;

  // ✅ 圖片 URL 修正（/static 走 8001）
  const API = import.meta.env.VITE_API_URL;
  const imgSrc =
    post.image_url
      ? (post.image_url.startsWith("http")
          ? post.image_url
          : `${API}${post.image_url}`)
      : null;

  const submit = (e) => {
    e.preventDefault();
    createComment.mutate({ post_id: post.id, author: "匿名", text });
    setText("");
  };

  const onDelete = () => {
    if (confirm("確定要刪除這篇文章嗎？")) {
      del.mutate(post.id, {
        onSuccess: () => navigate("/feed"),
      });
    }
  };

  const commentCount = post.comments?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#fff9f0]">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 左側：文章 */}
        <div className="lg:col-span-2">
          <div className="relative bg-white rounded-2xl shadow-md p-6">
            {/* 🗑️ 刪除按鈕 */}
            <button
              onClick={onDelete}
              className="absolute right-8 bottom-4 text-2xl hover:scale-110 transition-transform"
              title="刪除文章"
              aria-label="刪除文章"
            >
              🗑️
            </button>

            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <div className="text-sm text-gray-500 mb-4">
              {post.author}・{fmt(post.created_at)}
            </div>

            <p className="mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

            {/* 照片：讀取失敗就顯示替代區塊 */}
            {imgSrc && showImg ? (
              <img
                src={imgSrc}
                alt="post"
                className="rounded-xl mb-4"
                onError={() => setShowImg(false)}
              />
            ) : (
              post.image_url && (
                <div className="mb-4 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                  圖片載入失敗
                </div>
              )
            )}

            {/* 👍 + 💬 計數 */}
            <div className="flex items-center gap-4">
              <button className="btn btn-outline" onClick={() => like.mutate(post.id)}>
                👍 {post.likes}
              </button>
              <div className="inline-flex items-center gap-2 text-gray-700">
                <span>💬</span>
                <span>{commentCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：留言 */}
        <div className="space-y-3">
          <form onSubmit={submit} className="bg-white rounded-xl shadow p-4">
            <input
              className="input input-bordered w-full"
              placeholder="匿名留言…"
              value={text}
              onChange={(e)=>setText(e.target.value)}
              required
            />
            <div className="text-right mt-2">
              <button className="btn btn-primary btn-sm">發布</button>
            </div>
          </form>

          {post.comments?.slice().reverse().map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow p-4">
              <div className="text-sm text-gray-500 mb-1">
                {c.author}・{fmt(c.created_at)}
              </div>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
