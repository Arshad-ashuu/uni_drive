# 📂 Unified Drive – Multi-Account Google Drive Dashboard

A personal backend project that allows you to **view files from multiple Google Drive accounts in one place** without switching accounts, using **Google OAuth 2.0**, **Flask**, and **PostgreSQL (Docker)**.

This project is built as a **learning + DevOps-oriented system**, with a clear roadmap to expand into upload, delete, UI, and automation.

---

## 🚀 Features (Phase 1 – Completed)

* 🔐 Google OAuth 2.0 authentication
* 👥 Connect **multiple Google accounts**
* ☁️ Fetch files from **all connected Google Drives**
* 🧩 Unified `/files/all` API
* 🐘 PostgreSQL running in **Docker**
* 🔄 Token storage & reuse (no repeated login)

---

## 🧠 Motivation

Managing files across multiple Google accounts is painful because it requires frequent account switching.

**Unified Drive** solves this by acting as a **single backend gateway** to all your Google Drive accounts — securely, without copying or storing files locally.

---

## 🏗️ Architecture Overview

```
Browser
   ↓
Flask Backend
   ↓
Google OAuth 2.0
   ↓
Google Drive API
   ↓
PostgreSQL (Docker)
```

* Files are fetched **live** from Google Drive
* Only OAuth tokens are stored (securely)
* No files are duplicated or cached locally

---

## 🛠️ Tech Stack

| Layer     | Technology       |
| --------- | ---------------- |
| Backend   | Python, Flask    |
| Auth      | Google OAuth 2.0 |
| Cloud API | Google Drive API |
| Database  | PostgreSQL       |
| Container | Docker           |
| Dev Tools | dotenv, requests |

---

## 📁 Project Structure

```
backend/
├── app.py
├── .env
├── requirements.txt
│
├── auth/
│   └── google_oauth.py
│
├── drive/
│   └── google_drive.py
│
├── db/
│   └── models.py
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd backend
```

---

### 2️⃣ Create Python Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Setup PostgreSQL (Docker)

```bash
docker run -d \
  --name unified_drive_postgres \
  -e POSTGRES_DB=unified_drive \
  -e POSTGRES_USER=unified_user \
  -e POSTGRES_PASSWORD=unified_pass \
  -p 5432:5432 \
  postgres:16
```

Create table:

```bash
docker exec -it unified_drive_postgres psql -U unified_user -d unified_drive
```

```sql
CREATE TABLE google_accounts (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP
);
```

---

### 5️⃣ Configure Environment Variables

Create `.env` inside `backend/`:

```env
GOOGLE_CLIENT_ID=xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxx
DATABASE_URL=postgresql://unified_user:unified_pass@localhost:5432/unified_drive
```

---

### 6️⃣ Google Cloud Setup

1. Create a Google Cloud project
2. Enable **Google Drive API**
3. Create **OAuth Client ID**

   * Type: Web application
   * Redirect URI:

     ```
     http://localhost:5000/auth/google/callback
     ```

---

### 7️⃣ Run the App

```bash
python app.py
```

---

## 🔑 Usage

### Connect Google Account

Open in browser:

```
http://localhost:5000/auth/google
```

Repeat for each Google account you want to add.

---

### Fetch Unified File List

```
http://localhost:5000/files/all
```

Example response:

```json
[
  {
    "id": "1xA...",
    "name": "resume.pdf",
    "mimeType": "application/pdf",
    "account": "personal@gmail.com"
  },
  {
    "id": "7Yb...",
    "name": "photo.jpg",
    "mimeType": "image/jpeg",
    "account": "backup@gmail.com"
  }
]
```

---

## 🔐 Security Notes

* OAuth tokens are stored **locally** in Postgres
* HTTP is enabled **only for local development**
* No files are stored or cached
* This project is intended for **personal use**

---

## 🛣️ Roadmap

### Phase 2 (Planned)

* Upload files
* Delete files
* Download files
* Select target Google account

### Phase 3

* Web UI (HTML / React)
* Search & filtering
* File preview

### Phase 4

* Face recognition (Photos)
* Deduplication
* Background sync jobs

---

## 📌 Learning Outcomes

* OAuth 2.0 in real-world systems
* Secure token handling
* Dockerized databases
* API aggregation patterns
* Debugging production-style issues

---

## 🧑‍💻 Author

**Mohammad Arshad**
DevOps Learner | Backend Developer
Built as a personal project for learning and experimentation.

---

## ⭐ Final Note

This project is intentionally built **incrementally** to simulate real-world engineering workflows.



