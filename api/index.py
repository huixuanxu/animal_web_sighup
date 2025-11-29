from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from uuid import uuid4
import os, logging

# ---- logging ----
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://work2-phi.vercel.app",  # 你的前端正式網域（Vercel）
        "http://localhost:5173",         # 本機開發
    ],
    allow_credentials=True,
    # 預檢會用到 OPTIONS，這裡一定要允許
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],   # 你有自訂 X-Client-Id，放通較簡單
    expose_headers=["*"],
    max_age=86400,
)
# ---- Supabase init (安全防呆版) ----
from supabase import create_client, Client
sb: Optional[Client] = None
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
try:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    else:
        sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialized")
except Exception as e:
    logger.exception("Supabase client init failed")
    sb = None

# ---- schemas ----
class CommentOut(BaseModel):
    id: int
    post_id: int
    author: str
    text: str
    created_at: str

class PostOut(BaseModel):
    id: int
    author: str
    title: str
    content: str
    image_url: Optional[str] = None
    likes_count: int
    created_at: str
    comments: List[CommentOut] = []

# ---- helpers ----
def _row_to_post_with_comments(row) -> PostOut:
    if sb is None:
        raise HTTPException(500, "Supabase not configured")
    # 讀 comments（可空）
    res = sb.table("comments").select("*").eq("post_id", row["id"]).order("created_at", desc=True).execute()
    comments = (res.data or [])
    return PostOut(
        id=row["id"],
        author=row["author"],
        title=row["title"],
        content=row["content"],
        image_url=row.get("image_url"),
        likes_count=row.get("likes_count", 0) or 0,
        created_at=row["created_at"],
        comments=comments
    )

# ---- routes ----
@app.get("/health")
def health():
    return {"ok": True}

@app.get("/health/supabase")
def health_supabase():
    return {"sb": bool(sb)}

@app.get("/posts", response_model=List[PostOut])
def list_posts():
    if sb is None:
        raise HTTPException(500, "Supabase not configured")
    rows = sb.table("posts").select("*").order("created_at", desc=True).execute().data or []
    return [_row_to_post_with_comments(r) for r in rows]

@app.get("/posts/{post_id}", response_model=PostOut)
def get_post(post_id: int):
    if sb is None:
        raise HTTPException(500, "Supabase not configured")
    row = sb.table("posts").select("*").eq("id", post_id).maybe_single().execute().data
    if not row:
        raise HTTPException(404, "Post not found")
    return _row_to_post_with_comments(row)

@app.post("/posts", response_model=PostOut)
async def create_post(
    author: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    image: UploadFile | None = File(None),
):
    try:
        image_url = None

        if image:
            # 1) 確保 bucket 存在且 Public（在 Supabase 後台建一次就好）
            # 2) 隨機檔名避免 409
            ext = os.path.splitext(image.filename)[1].lower() or ".jpg"
            key = f"{uuid4().hex}{ext}"
            data = await image.read()

            up_res = sb.storage.from_("images").upload(
                key,
                data,
                file_options={"contentType": image.content_type or "application/octet-stream"},
            )
            # up_res 在不同版本可能是物件或 dict，這邊只要沒有 error 就當成功
            if getattr(up_res, "error", None) or (isinstance(up_res, dict) and up_res.get("error")):
                raise HTTPException(500, f"upload error: {getattr(up_res,'error',None) or up_res.get('error')}")

            pub = sb.storage.from_("images").get_public_url(key)
            image_url = pub if isinstance(pub, str) else (pub.get("publicUrl") if isinstance(pub, dict) else None)

        # 直接 execute 取 data[0]，避免 .select().single() 版本差異
        ins = sb.table("posts").insert({
            "author": author,
            "title": title,
            "content": content,
            "image_url": image_url,
            "likes_count": 0,
            # created_at 讓 DB default now() 自己填
        }).execute()

        if not ins.data:
            raise HTTPException(500, "insert posts returned no data")

        row = ins.data[0]
        return _row_to_post_with_comments(row)

    except HTTPException:
        raise
    except Exception as e:
        # 讓你在 Render Logs 看到確切原因
        import traceback, sys
        print("POST /posts failed:", e, file=sys.stderr)
        traceback.print_exc()
        raise HTTPException(500, "internal_error")

@app.post("/posts/{post_id}/like", response_model=PostOut)
def toggle_like(post_id: int, x_client_id: Optional[str] = Header(None)):
    if sb is None:
        raise HTTPException(500, "Supabase not configured")
    if not x_client_id:
        raise HTTPException(400, "Missing X-Client-Id")
    try:
        liked = sb.table("likes").select("*").eq("post_id", post_id).eq("device_id", x_client_id).maybe_single().execute().data
        post = sb.table("posts").select("*").eq("id", post_id).single().execute().data
        if not post:
            raise HTTPException(404, "Post not found")

        if liked:
            sb.table("likes").delete().eq("id", liked["id"]).execute()
            sb.table("posts").update({"likes_count": max(0, (post.get("likes_count") or 0) - 1)}).eq("id", post_id).execute()
        else:
            sb.table("likes").insert({"post_id": post_id, "device_id": x_client_id}).execute()
            sb.table("posts").update({"likes_count": (post.get("likes_count") or 0) + 1}).eq("id", post_id).execute()

        row = sb.table("posts").select("*").eq("id", post_id).single().execute().data
        return _row_to_post_with_comments(row)
    except HTTPException:
        raise
    except Exception:
        logger.exception("POST /posts/{post_id}/like failed")
        raise HTTPException(500, "internal_error")

class CommentIn(BaseModel):
    post_id: int
    author: str
    text: str

@app.post("/comments", response_model=CommentOut)
def add_comment(payload: CommentIn):
    if sb is None:
        raise HTTPException(500, "Supabase not configured")
    try:
        exists = sb.table("posts").select("id").eq("id", payload.post_id).maybe_single().execute().data
        if not exists:
            raise HTTPException(404, "Post not found")
        resp = sb.table("comments").insert(payload.__dict__).execute()
        if not resp.data:
            raise HTTPException(500, "insert comments returned no data")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception:
        logger.exception("POST /comments failed")
        raise HTTPException(500, "internal_error")
