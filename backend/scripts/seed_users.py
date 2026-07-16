"""Seed initial users (admin and citizen) into Supabase Auth and respective citizens/admins tables."""
from __future__ import annotations

import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from app.config import settings


def seed_users():
    if not settings.supabase_url or not settings.supabase_service_key:
        print("Error: Supabase credentials not found in environment or .env file.")
        return

    print("Initializing Supabase client...")
    sb: Client = create_client(settings.supabase_url, settings.supabase_service_key)

    # 1. Seed Admin User
    admin_email = "admin@raksha.ai"
    admin_password = "AdminPassword123"
    print(f"Checking for admin user: {admin_email}...")

    try:
        auth_users = sb.auth.admin.list_users()
        existing_admin = next((u for u in auth_users if u.email == admin_email), None)
        
        if existing_admin:
            print("Admin user already exists in Auth.")
            admin_id = existing_admin.id
        else:
            print("Creating Admin user...")
            new_admin = sb.auth.admin.create_user({
                "email": admin_email,
                "password": admin_password,
                "email_confirm": True,
                "user_metadata": {
                    "name": "System Administrator"
                }
            })
            admin_id = new_admin.user.id
            print(f"Admin user created in Auth with ID: {admin_id}")

        # Ensure admin row is seeded
        sb.table("admins").upsert({
            "id": admin_id,
            "name": "System Administrator",
            "email": admin_email
        }).execute()
        print("Admin user profile seeded successfully in admins table.")

    except Exception as e:
        print(f"Error seeding admin user: {e}")

    # 2. Seed Demo Citizen User
    citizen_email = "citizen@raksha.ai"
    citizen_password = "CitizenPassword123"
    print(f"\nChecking for citizen user: {citizen_email}...")

    try:
        auth_users = sb.auth.admin.list_users()
        existing_citizen = next((u for u in auth_users if u.email == citizen_email), None)
        
        if existing_citizen:
            print("Citizen user already exists in Auth.")
            citizen_id = existing_citizen.id
        else:
            print("Creating Citizen user...")
            new_citizen = sb.auth.admin.create_user({
                "email": citizen_email,
                "password": citizen_password,
                "email_confirm": True,
                "user_metadata": {
                    "name": "Arjun Sharma"
                }
            })
            citizen_id = new_citizen.user.id
            print(f"Citizen user created in Auth with ID: {citizen_id}")

        # Ensure citizen row is seeded
        sb.table("citizens").upsert({
            "id": citizen_id,
            "name": "Arjun Sharma",
            "email": citizen_email
        }).execute()
        print("Citizen user profile seeded successfully in citizens table.")

    except Exception as e:
        print(f"Error seeding citizen user: {e}")


if __name__ == "__main__":
    seed_users()
