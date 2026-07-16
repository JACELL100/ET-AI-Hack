"""Auth routing utilizing Supabase Authentication with separate Citizen and Admin tables."""
from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client

from app.config import settings
from app.models.schemas import ok

logger = logging.getLogger("raksha.auth")
router = APIRouter(prefix="/auth", tags=["auth"])


def get_supabase_client() -> Client:
    """Helper to initialize the Supabase client using configured credentials."""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase credentials not configured in backend .env"
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    """
    Registers a new user as a 'citizen'.
    All public signups default to the citizen role.
    """
    sb = get_supabase_client()
    try:
        # Create user via Supabase admin auth to auto-confirm email (great for demo flow)
        auth_response = sb.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {
                "name": req.name
            }
        })
        
        user_id = auth_response.user.id
        
        # Fallback/redundant insert into public.citizens table
        try:
            sb.table("citizens").upsert({
                "id": user_id,
                "name": req.name,
                "email": req.email
            }).execute()
        except Exception as profile_err:
            logger.warning(
                "Trigger fallback citizen profile insertion failed: %s. "
                "Ensure public.citizens exists.",
                profile_err
            )
            
        return ok({
            "message": "Citizen registered successfully",
            "userId": user_id
        })
    except Exception as e:
        logger.error("Registration failed: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
def login(req: LoginRequest):
    """
    Authenticates a user and retrieves their name and role tables.
    Returns token credentials and user details.
    """
    sb = get_supabase_client()
    try:
        # Authenticate with Supabase Auth
        res = sb.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        
        user_id = res.user.id
        user_email = res.user.email
        
        # Retrieve user profile from citizens/admins tables
        is_citizen = False
        is_admin = False
        name = req.email.split("@")[0]
        
        try:
            citizen_res = sb.table("citizens").select("name").eq("id", user_id).execute()
            if citizen_res.data and len(citizen_res.data) > 0:
                is_citizen = True
                name = citizen_res.data[0].get("name", name)
                
            admin_res = sb.table("admins").select("name").eq("id", user_id).execute()
            if admin_res.data and len(admin_res.data) > 0:
                is_admin = True
                name = admin_res.data[0].get("name", name)
        except Exception as profile_err:
            logger.warning("Could not fetch user profiles: %s.", profile_err)
            
        return ok({
            "accessToken": res.session.access_token,
            "refreshToken": res.session.refresh_token,
            "user": {
                "id": user_id,
                "email": user_email,
                "name": name,
                "isCitizen": is_citizen,
                "isAdmin": is_admin
            }
        })
    except Exception as e:
        logger.error("Authentication failed: %s", e)
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )
