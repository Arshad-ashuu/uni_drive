let allFiles = [];
let activeAccount = "ALL";

const filesContainer = document.getElementById("files");
const tabsContainer = document.getElementById("tabs");

/* ---------------------------
   FETCH FILES
---------------------------- */
fetch("/api/files")
  .then(res => res.json())
  .then(data => {
    allFiles = data;
    renderTabs();
    renderFiles();
  })
  .catch(err => {
    console.error("Failed to load files", err);
  });

/* ---------------------------
   RENDER TABS
---------------------------- */
function renderTabs() {
  tabsContainer.innerHTML = "";

  const accounts = [...new Set(allFiles.map(f => f.account))];

  // ALL FILES TAB
  tabsContainer.appendChild(createTab("ALL", "All Files"));

  // ACCOUNT TABS
  accounts.forEach(acc => {
    tabsContainer.appendChild(createTab(acc, acc));
  });
}

function createTab(value, label) {
  const btn = document.createElement("button");
  btn.innerText = label;
  btn.className = value === activeAccount ? "active" : "";
  btn.onclick = () => {
    activeAccount = value;
    renderTabs();
    renderFiles();
  };
  return btn;
}

/* ---------------------------
   RENDER FILES
---------------------------- */
function renderFiles() {
  filesContainer.innerHTML = "";

  const filtered =
    activeAccount === "ALL"
      ? allFiles
      : allFiles.filter(f => f.account === activeAccount);

  if (filtered.length === 0) {
    filesContainer.innerHTML = "<p>No files found</p>";
    return;
  }

  filtered.forEach(file => {
    const div = document.createElement("div");
    div.className = "file-card";

    div.innerHTML = `
      <div class="file-icon">📄</div>
      <div class="file-name">${file.name}</div>
      <small class="file-account">${file.account}</small>

      <div class="actions">
        <button onclick="renameFile('${file.id}', '${file.name}')">✏️</button>
        <button onclick="deleteFile('${file.id}')">🗑️</button>
      </div>
    `;

    filesContainer.appendChild(div);
  });
}

/* ---------------------------
   DELETE FILE
---------------------------- */
function deleteFile(fileId) {
  if (!confirm("Delete this file?")) return;

  fetch(`/api/files/${fileId}`, {
    method: "DELETE"
  })
    .then(res => {
      if (!res.ok) throw new Error("Delete failed");
      allFiles = allFiles.filter(f => f.id !== fileId);
      renderFiles();
    })
    .catch(err => alert("Failed to delete file"));
}

/* ---------------------------
   RENAME FILE
---------------------------- */
function renameFile(fileId, oldName) {
  const newName = prompt("Enter new file name", oldName);
  if (!newName || newName === oldName) return;

  fetch(`/api/files/${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  })
    .then(res => {
      if (!res.ok) throw new Error("Rename failed");

      const file = allFiles.find(f => f.id === fileId);
      if (file) file.name = newName;

      renderFiles();
    })
    .catch(err => alert("Failed to rename file"));
}
