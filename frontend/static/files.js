let currentFolder = "root";
let navigation = ["My Drive"];
let activeAccount = "ALL";
let allFiles = [];
let folderStack = ["root"];
let folderNameStack = ["My Drive"];

const filesEl = document.getElementById("files");
const previewEl = document.getElementById("preview");
const breadcrumbEl = document.getElementById("breadcrumb");
const accountsEl = document.getElementById("accounts");


let activeType = "ALL";
const filtersEl = document.getElementById("filters");

filtersEl.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    activeType = btn.dataset.type;

    filtersEl.querySelectorAll("button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    renderFiles();
  });
});




/* ---------------------------
   LOAD ACCOUNTS
---------------------------- */
function loadAccounts() {
  fetch("/api/accounts")
    .then(res => res.json())
    .then(accounts => {
      accountsEl.innerHTML = "";

      // ALL
      const allDiv = createAccountRow("ALL", "All Accounts");
      accountsEl.appendChild(allDiv);

      accounts.forEach(acc => {
        const div = createAccountRow(acc.email, acc.email, true);
        accountsEl.appendChild(div);
      });
    });
}

function createAccountRow(value, label, removable = false) {
  const username =
    value === "ALL"
      ? "All accounts"
      : value.split("@")[0];

  const avatarLetter =
    value === "ALL"
      ? "★"
      : username.charAt(0).toUpperCase();

  const div = document.createElement("div");
  div.className = "account" + (activeAccount === value ? " active" : "");

  div.innerHTML = `
    <div class="account-left">
      <div class="avatar">${avatarLetter}</div>
      <span class="username">${username}</span>
    </div>
    ${removable ? `<span class="remove">✖</span>` : ""}
  `;

  // ✅ ONLY FILTER FILES
  div.addEventListener("click", () => {
    activeAccount = value;
    loadFiles(currentFolder);
    loadAccounts();
  });

  // ❌ REMOVE ONLY — no redirect
  if (removable) {
    div.querySelector(".remove").addEventListener("click", (e) => {
      e.stopPropagation(); // VERY IMPORTANT
      removeAccount(value);
    });
  }

  return div;
}


function addAccount() {
  window.location.href = "/auth/google";
}

function removeAccount(email) {
  if (!confirm("Remove account?")) return;

  fetch(`/api/accounts/${email}`, { method: "DELETE" })
    .then(() => {
      activeAccount = "ALL";
      loadAccounts();
      loadFiles("root");
    });
}

/* ---------------------------
   LOAD FILES
---------------------------- */
function loadFiles(folderId = "root") {
  fetch(`/api/files?parent=${folderId}`)
    .then(res => res.json())
    .then(files => {
      allFiles = files;
      renderFiles();
    });
}

/* ---------------------------
   RENDER FILES
---------------------------- */
function renderFiles() {
  filesEl.innerHTML = "";
  previewEl.style.display = "none";

  let filtered =
    activeAccount === "ALL"
      ? allFiles
      : allFiles.filter(f => f.account === activeAccount);

  // 🔥 TYPE FILTER
  filtered = filtered.filter(file => {
    switch (activeType) {
      case "FOLDER":
        return file.mimeType === "application/vnd.google-apps.folder";

      case "DOC":
        return (
          file.mimeType === "application/vnd.google-apps.document" ||
          file.mimeType === "text/plain"
        );

      case "PDF":
        return file.mimeType === "application/pdf";

      case "IMAGE":
        return file.mimeType && file.mimeType.startsWith("image/");

      default:
        return true;
    }
  });

  if (filtered.length === 0) {
    filesEl.innerHTML = "<p>No files found</p>";
    return;
  }

 filtered.forEach(file => {
  const isFolder =
    file.mimeType === "application/vnd.google-apps.folder";

  const div = document.createElement("div");
  div.className = "file";

  div.innerHTML = `
    <div class="more">⋮</div>

    <div class="file-icon">${isFolder ? "📁" : "📄"}</div>
    <div class="file-name">${file.name}</div>
  `;

  // Normal click → open folder / preview
  div.addEventListener("click", () => {
    if (isFolder) {
      folderStack.push(file.id);
      folderNameStack.push(file.name);
      currentFolder = file.id;
      breadcrumbEl.innerText = folderNameStack.join(" / ");
      updateBackButton();
      loadFiles(file.id);
    } else {
      openPreview(file.id);
    }
  });

  // 3-dot menu click (VERY IMPORTANT)
  const moreBtn = div.querySelector(".more");
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllMenus();
    showMenu(div, file);
  });

  filesEl.appendChild(div);
});

}


function showMenu(card, file) {
  const menu = document.createElement("div");
  menu.className = "menu";

 menu.innerHTML = `
  <button onclick="renameItem('${file.id}', '${file.name}')">
    Rename
  </button>
  <button class="danger" onclick="deleteItem('${file.id}')">
    Delete
  </button>
`;


  card.appendChild(menu);
}

function closeAllMenus() {
  document.querySelectorAll(".menu").forEach(m => m.remove());
}

// Close menu on outside click
document.addEventListener("click", closeAllMenus);



function renameItem(fileId, oldName) {
  closeAllMenus();

  const newName = prompt("Rename to:", oldName);
  if (!newName || newName === oldName) return;

  fetch(`/api/files/${fileId}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName })
  }).then(() => loadFiles(currentFolder));
}

function deleteItem(fileId) {
  closeAllMenus();

  if (!confirm("Delete this item?")) return;

  fetch(`/api/files/${fileId}`, {
    method: "DELETE"
  }).then(() => loadFiles(currentFolder));
}



function goBack() {
  if (folderStack.length <= 1) return;

  folderStack.pop();
  folderNameStack.pop();

  currentFolder = folderStack[folderStack.length - 1];
  breadcrumbEl.innerText = folderNameStack.join(" / ");

  updateBackButton();
  loadFiles(currentFolder);
}
function updateBackButton() {
  const backBtn = document.getElementById("backBtn");
  backBtn.hidden = folderStack.length <= 1;
}

/* ---------------------------
   PREVIEW
---------------------------- */
function openPreview(fileId) {
  previewEl.style.display = "block";
  previewEl.innerHTML = `
    <iframe src="https://drive.google.com/file/d/${fileId}/preview"></iframe>
  `;
}

/* ---------------------------
   INIT
---------------------------- */
loadAccounts();
loadFiles();
folderStack = ["root"];
folderNameStack = ["My Drive"];
updateBackButton();
loadFiles("root");
