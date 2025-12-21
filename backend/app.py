# ================================
# ENV SETUP (MUST BE FIRST)
# ================================
import os
from dotenv import load_dotenv

load_dotenv()  # MUST come before anything reads env vars

# Allow HTTP for local OAuth testing ONLY
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# ================================
# IMPORTS
# ================================
from flask import Flask, redirect, request, jsonify
from auth.google_oauth import get_oauth_flow
from db.models import get_db
from drive.google_drive import list_files_for_account

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime

# ================================
# APP INIT
# ================================
app = Flask(__name__)

# ================================
# ROUTES
# ================================

@app.route("/")
def home():
    return "Unified Drive Backend Running"

# -------------------------------
# GOOGLE LOGIN
# -------------------------------
@app.route("/auth/google")
def google_login():
    flow = get_oauth_flow()
    auth_url, _ = flow.authorization_url(
        prompt="consent",
        access_type="offline"
    )
    return redirect(auth_url)

# -------------------------------
# GOOGLE CALLBACK
# -------------------------------
@app.route("/auth/google/callback")
def google_callback():
    flow = get_oauth_flow()
    flow.fetch_token(authorization_response=request.url)
    creds = flow.credentials

    import requests
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {creds.token}"}
    ).json()

    email = userinfo["email"]

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO google_accounts (email, access_token, refresh_token, token_expiry)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (email)
        DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            token_expiry = EXCLUDED.token_expiry
    """, (
        email,
        creds.token,
        creds.refresh_token,
        creds.expiry
    ))

    conn.commit()
    cur.close()
    conn.close()

    return f"Google account connected successfully: {email}"

# -------------------------------
# UNIFIED FILE LIST
# -------------------------------
@app.route("/files/all")
def get_all_files():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT email, access_token, refresh_token FROM google_accounts")
    accounts = cur.fetchall()

    all_files = []

    for email, access_token, refresh_token in accounts:
        files = list_files_for_account(access_token, refresh_token)
        for f in files:
            f["account"] = email
            all_files.append(f)

    cur.close()
    conn.close()

    return jsonify(all_files)

# ================================
# MAIN
# ================================
if __name__ == "__main__":
    app.run(debug=True)
