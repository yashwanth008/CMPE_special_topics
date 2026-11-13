"""HTTP API in front of the agent (Cloud Run friendly).

POST /chat     {message, session_id?}                         -> {session_id, reply, pending_confirmation?}
POST /confirm  {session_id, confirmation_id, approved}        -> same shape
GET  /healthz

Auth: set GOOGLE_CLIENT_ID to require a Google ID token (`Authorization: Bearer <id_token>`); the verified
subject becomes the user id. For local dev only, ALLOW_DEV_AUTH=1 trusts an `X-User-Id` header.
Sessions: in-memory by default; set SESSION_DB_URL (e.g. postgresql+asyncpg://...) for persistence.
"""
from __future__ import annotations

import logging
import os
import uuid

from fastapi import Depends, FastAPI, Header, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from pydantic import BaseModel, Field

from .agent import build_agent

log = logging.getLogger("shop_api")
APP_NAME = "finn"


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None


class ConfirmIn(BaseModel):
    session_id: str
    confirmation_id: str
    approved: bool


def authenticate(authorization: str | None = Header(default=None), x_user_id: str | None = Header(default=None)) -> str:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if client_id:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(401, "missing bearer token")
        try:
            from google.auth.transport import requests as greq
            from google.oauth2 import id_token
            claims = id_token.verify_oauth2_token(authorization[7:], greq.Request(), client_id)
            return f"g:{claims['sub']}"
        except Exception as e:  # noqa: BLE001
            log.warning("token rejected: %s", e)
            raise HTTPException(401, "invalid token")
    if os.getenv("ALLOW_DEV_AUTH") == "1" and x_user_id:
        return f"dev:{x_user_id[:64]}"
    raise HTTPException(401, "authentication required")


def _summarise(events) -> dict:
    reply, pending = "", None
    for ev in events:
        for p in (ev.content.parts if ev.content else []):
            if p.function_call and p.function_call.name == "adk_request_confirmation":
                orig = (p.function_call.args or {}).get("originalFunctionCall", {})
                pending = {"id": p.function_call.id, "tool": orig.get("name"), "args": orig.get("args")}
            elif p.text and ev.author != "user" and not ev.partial:
                reply = p.text  # last model text wins
    return {"reply": reply, "pending_confirmation": pending}


def create_app(agent=None) -> FastAPI:
    app = FastAPI(title="Finn shopping agent")
    db = os.getenv("SESSION_DB_URL")
    if db:
        from google.adk.sessions import DatabaseSessionService  # needs google-adk[db]
        sessions = DatabaseSessionService(db_url=db)
    else:
        sessions = InMemorySessionService()
    runner = Runner(agent=agent or build_agent(), app_name=APP_NAME, session_service=sessions)

    async def _run(uid: str, sid: str, content: types.Content) -> dict:
        events = [e async for e in runner.run_async(user_id=uid, session_id=sid, new_message=content)]
        return {"session_id": sid, **_summarise(events)}

    @app.get("/healthz")
    async def healthz():
        return {"ok": True}

    @app.post("/chat")
    async def chat(body: ChatIn, uid: str = Depends(authenticate)):
        sid = body.session_id
        if sid:
            if not await sessions.get_session(app_name=APP_NAME, user_id=uid, session_id=sid):
                raise HTTPException(404, "session not found")
        else:
            sid = (await sessions.create_session(app_name=APP_NAME, user_id=uid, state={"user_id": uid},
                                                 session_id=uuid.uuid4().hex)).id
        return await _run(uid, sid, types.Content(role="user", parts=[types.Part(text=body.message)]))

    @app.post("/confirm")
    async def confirm(body: ConfirmIn, uid: str = Depends(authenticate)):
        if not await sessions.get_session(app_name=APP_NAME, user_id=uid, session_id=body.session_id):
            raise HTTPException(404, "session not found")
        part = types.Part(function_response=types.FunctionResponse(
            id=body.confirmation_id, name="adk_request_confirmation", response={"confirmed": body.approved}))
        return await _run(uid, body.session_id, types.Content(role="user", parts=[part]))

    return app


def get_app() -> FastAPI:  # uvicorn --factory ecommerce_agent.app:get_app
    return create_app()
