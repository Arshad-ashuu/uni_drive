import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def list_files_for_account(access_token, refresh_token):
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    )

    service = build("drive", "v3", credentials=creds)

    results = service.files().list(
        q="trashed = false",
        pageSize=50,
        fields="files(id, name, mimeType, modifiedTime, size)"
    ).execute()

    return results.get("files", [])
