from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Annotated, List, Optional
from datetime import datetime, timezone
from pathlib import Path
from bson import ObjectId
import os
import uuid
import logging
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

# ---------------- Object storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "madre-arvore-da-vida"
storage_key = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    global storage_key
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 503:
        storage_key = None
        key = init_storage()
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------- Models ----------------
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls(**doc)

    def to_mongo(self) -> dict:
        d = self.model_dump(by_alias=True, exclude={"id"})
        d.pop("_id", None)
        return d


class Report(BaseDocument):
    description: str
    category: str
    latitude: float
    longitude: float
    reporter_name: Optional[str] = None
    photo_path: Optional[str] = None
    user_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReportCreate(BaseModel):
    description: str = Field(min_length=3, max_length=1000)
    category: str
    latitude: float
    longitude: float
    reporter_name: Optional[str] = Field(default=None, max_length=80)
    photo_path: Optional[str] = None


def report_out(r: Report) -> dict:
    return r.model_dump(by_alias=False)


app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Auth (Emergent Google + Apple) ----------------
import httpx
import jwt
from jwt import PyJWKClient
from datetime import timedelta
from fastapi import Request

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
APPLE_ISSUER = "https://appleid.apple.com"
APPLE_AUDIENCES = [a.strip() for a in os.environ["APPLE_AUDIENCES"].split(",") if a.strip()]
apple_jwks = PyJWKClient("https://appleid.apple.com/auth/keys")


class SessionIn(BaseModel):
    session_id: str


class AppleIn(BaseModel):
    identity_token: str
    full_name: Optional[str] = None
    email: Optional[str] = None


async def create_session(user_id: str) -> str:
    token = uuid.uuid4().hex + uuid.uuid4().hex
    now = datetime.now(timezone.utc)
    await db.user_sessions.insert_one({"session_token": token, "user_id": user_id,
                                       "created_at": now, "expires_at": now + timedelta(days=7)})
    return token


async def public_user(user_id: str) -> dict:
    return await db.users.find_one({"user_id": user_id}, {"_id": 0, "apple_sub": 0})


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = auth[7:].strip()
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    exp = sess["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessão expirada")
    user = await public_user(sess["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


@api_router.post("/auth/session")
async def auth_session(body: SessionIn):
    async with httpx.AsyncClient(timeout=20) as hc:
        r = await hc.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id},
                                  {"$set": {"name": data.get("name"), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": email, "name": data.get("name"),
                                   "picture": data.get("picture"), "provider": "google",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    token = await create_session(user_id)
    return {"session_token": token, "user": await public_user(user_id)}


@api_router.post("/auth/apple")
async def auth_apple(body: AppleIn):
    try:
        key = await run_in_threadpool(lambda: apple_jwks.get_signing_key_from_jwt(body.identity_token).key)
        claims = jwt.decode(body.identity_token, key, algorithms=["RS256"],
                            audience=APPLE_AUDIENCES, issuer=APPLE_ISSUER)
    except Exception as e:
        logger.warning(f"Apple token invalid: {e}")
        raise HTTPException(status_code=401, detail="Token Apple inválido")
    sub = claims["sub"]
    email = body.email or claims.get("email")
    existing = await db.users.find_one({"apple_sub": sub}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        updates = {}
        if body.full_name and not existing.get("name"):
            updates["name"] = body.full_name
        if email and not existing.get("email"):
            updates["email"] = email
        if updates:
            await db.users.update_one({"user_id": user_id}, {"$set": updates})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        doc = {"user_id": user_id, "apple_sub": sub, "name": body.full_name, "picture": None,
               "provider": "apple", "created_at": datetime.now(timezone.utc).isoformat()}
        if email:
            doc["email"] = email
        await db.users.insert_one(doc)
    token = await create_session(user_id)
    return {"session_token": token, "user_id": user_id, "user": await public_user(user_id)}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    return await get_current_user(request)


@api_router.post("/auth/logout")
async def auth_logout(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        await db.user_sessions.delete_one({"session_token": auth[7:].strip()})
    return {"ok": True}

ALLOWED_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic"}


@api_router.get("/")
async def root():
    return {"message": "Madre: Árvore da Vida API"}


@api_router.post("/upload")
async def upload(request: Request, file: UploadFile = File(...)):
    await get_current_user(request)
    content_type = file.content_type or "image/jpeg"
    ext = ALLOWED_TYPES.get(content_type, "jpg")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Imagem muito grande (máx 8MB)")
    path = f"{APP_NAME}/uploads/public/{uuid.uuid4()}.{ext}"
    try:
        result = await run_in_threadpool(put_object, path, data, content_type)
    except requests.HTTPError as e:
        code = e.response.status_code if e.response is not None else 500
        if code == 402:
            raise HTTPException(status_code=402, detail="Sem créditos de armazenamento")
        raise HTTPException(status_code=502, detail="Falha ao enviar a foto")
    await db.files.insert_one({"storage_path": result["path"], "content_type": content_type,
                               "original_filename": file.filename, "is_deleted": False,
                               "created_at": datetime.now(timezone.utc).isoformat()})
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def download(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    data, ct = await run_in_threadpool(get_object, path)
    return Response(content=data, media_type=record.get("content_type", ct),
                    headers={"Cache-Control": "public, max-age=86400"})


@api_router.post("/reports")
async def create_report(payload: ReportCreate, request: Request):
    user = await get_current_user(request)
    data = payload.model_dump()
    data["reporter_name"] = data.get("reporter_name") or user.get("name")
    report = Report(**data, user_id=user["user_id"])
    res = await db.reports.insert_one(report.to_mongo())
    report.id = str(res.inserted_id)
    return report_out(report)


@api_router.get("/reports")
async def list_reports():
    docs = await db.reports.find().sort("created_at", -1).to_list(500)
    return [report_out(Report.from_mongo(d)) for d in docs]


@api_router.delete("/reports/{report_id}")
async def delete_report(report_id: str, request: Request):
    user = await get_current_user(request)
    if not ObjectId.is_valid(report_id):
        raise HTTPException(status_code=404, detail="Não encontrado")
    res = await db.reports.delete_one({"_id": ObjectId(report_id), "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Não encontrado")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True, partialFilterExpression={"email": {"$type": "string"}})
    await db.users.create_index("apple_sub", unique=True, partialFilterExpression={"apple_sub": {"$type": "string"}})
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    try:
        await run_in_threadpool(init_storage)
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
