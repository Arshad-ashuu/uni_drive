# ================================
# ENV SETUP
# ================================
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# ================================
# IMPORTS
# ================================
from flask import Flask, redirect, request, jsonify, render_template
import requests

from auth.google_oauth import get_oauth_flow
from db.models import get_db
from drive.google_drive import list_files_for_account

# ================================
# APP INIT
# ================================
app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static"
)

# ================================
# UI ROUTES
# ================================

@app.route("/")
def home():
    return render_template("add_account.html")


@app.route("/files")
def files_page():
    return render_template("files.html")


# ================================
# GOOGLE AUTH
# ================================

@app.route("/auth/google")
def google_login():
    flow = get_oauth_flow()
    auth_url, _ = flow.authorization_url(
        prompt="consent",
        access_type="offline"
    )
    return redirect(auth_url)


@app.route("/auth/google/callback")
def google_callback():
    flow = get_oauth_flow()
    flow.fetch_token(authorization_response=request.url)
    creds = flow.credentials

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

    return redirect("/files")


# ================================
# FILES API
# ================================

@app.route("/api/files")
def all_files():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT email, access_token, refresh_token
        FROM google_accounts
    """)
    accounts = cur.fetchall()

    files = []

    for email, access_token, refresh_token in accounts:
        drive_files = list_files_for_account(access_token, refresh_token)
        for f in drive_files:
            f["account"] = email
            files.append(f)

    cur.close()
    conn.close()

    return jsonify(files)


# ================================
# CRUD: GOOGLE ACCOUNTS
# ================================

# CREATE (manual – optional)
@app.route("/api/accounts", methods=["POST"])
def create_account():
    data = request.json

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO google_accounts (email, access_token, refresh_token, token_expiry)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
    """, (
        data["email"],
        data.get("access_token"),
        data.get("refresh_token"),
        data.get("token_expiry")
    ))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Account created"}), 201


# READ (all)
@app.route("/api/accounts", methods=["GET"])
def list_accounts():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT email, token_expiry
        FROM google_accounts
        ORDER BY email
    """)
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify([
        {
            "email": r[0],
            "token_expiry": r[1]
        }
        for r in rows
    ])


# READ (single)
@app.route("/api/accounts/<email>", methods=["GET"])
def get_account(email):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT email, token_expiry
        FROM google_accounts
        WHERE email = %s
    """, (email,))

    row = cur.fetchone()

    cur.close()
    conn.close()

    if not row:
        return jsonify({"error": "Account not found"}), 404

    return jsonify({
        "email": row[0],
        "token_expiry": row[1]
    })


# UPDATE
@app.route("/api/accounts/<email>", methods=["PUT"])
def update_account(email):
    data = request.json

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE google_accounts
        SET access_token = %s,
            refresh_token = %s,
            token_expiry = %s
        WHERE email = %s
    """, (
        data.get("access_token"),
        data.get("refresh_token"),
        data.get("token_expiry"),
        email
    ))

    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Account updated"})


# DELETE
@app.route("/api/accounts/<email>", methods=["DELETE"])
def delete_account(email):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        DELETE FROM google_accounts
        WHERE email = %s
    """, (email,))

    if cur.rowcount == 0:
        cur.close()
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Account deleted"})


# ================================
# MAIN
# ================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
