from __future__ import annotations

import os
from typing import Any

import jwt
from fastapi import Depends, Header, HTTPException, Request


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    return authorization.split(" ", 1)[1].strip()


def verify_user(
    request: Request,
    authorization: str | None = Header(default=None),
    x_aegisure_workspace: str | None = Header(default=None),
    x_aura_workspace: str | None = Header(default=None),
) -> dict[str, Any]:
    token = _bearer(authorization)
    static_token = os.getenv("AEGISURE_API_TOKEN")
    if static_token and token == static_token:
        workspace_id = x_aegisure_workspace or x_aura_workspace or os.getenv("AEGISURE_WORKSPACE_ID") or "local"
        return {"user_id": "local-dev", "email": "local@aegisure.dev", "workspace_id": workspace_id, "auth_mode": "static_token"}

    secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("AEGISURE_SUPABASE_JWT_SECRET")
    if not secret:
        if os.getenv("AEGISURE_DEV_AUTH", "false").lower() == "true":
            return {"user_id": "dev-user", "email": "dev@aegisure.dev", "workspace_id": x_aegisure_workspace or x_aura_workspace or "local", "auth_mode": "dev"}
        raise HTTPException(status_code=401, detail="Supabase JWT verification is not configured")

    try:
        claims = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Supabase JWT: {exc}") from exc

    user_id = str(claims.get("sub") or "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Supabase JWT is missing subject")
    workspace_id = x_aegisure_workspace or x_aura_workspace or claims.get("workspace_id") or f"ws_{user_id}"
    email = (claims.get("email") or (claims.get("user_metadata") or {}).get("email") or f"{user_id}@supabase").lower()
    return {"user_id": user_id, "email": email, "workspace_id": workspace_id, "claims": claims, "auth_mode": "supabase"}


CurrentUser = Depends(verify_user)
