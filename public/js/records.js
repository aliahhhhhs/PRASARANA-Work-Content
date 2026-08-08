let selectedTrains = [];
let editSelectedTrains = [];
let editSelectedPics = [];
let editItemsList = [];
let selectedStartDate = null;
let selectedEndDate = null;
let fpInstance = null;
let isAdminUser = false;
let currentRecords = [];

function toggleNotiDropdown(e) {
    if(e) e.preventDefault();
    const menu = document.getElementById("notiDropdownMenu");
    if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
}

async function loadNotifications() {
    try {
        const res = await fetch("/api/edit-requests");
        if (!res.ok) return;
        const requests = await res.json();
        const countEl = document.getElementById("notiCount");
        const container = document.getElementById("notiItemsContainer");
        
        if(Array.isArray(requests) && requests.length > 0) {
            if (countEl) {
                countEl.innerText = requests.length;
                countEl.style.display = "inline-block";
            }
            if (container) {
                container.innerHTML = "";
                requests.forEach(req => {
                    const item = document.createElement("div");
                    item.className = "noti-item";
                    item.innerHTML = `
                        <b>ID Rekod: ${req.record_id}</b> (${req.username})<br>
                        <span>"${req.message}"</span>
                        <button onclick="dismissNotification(${req.id})">Selesai</button>
                    `;
                    container.appendChild(item);
                });
            }
        } else {
            if (countEl) countEl.style.display = "none";
            if (container) container.innerHTML = "Tiada notifikasi baharu.";
        }
    } catch(err) { console.error(err); }
}

async function dismissNotification(id) {
    await fetch(`/api/edit-requests/dismiss/${id}`, { method: "POST" });
    loadNotifications();
}

async function submitEditRequest() {
    const recordId = document.getElementById("chatRecordId").value;
    const message = document.getElementById("chatMessage").value;

    if(!recordId || !message) {
        alert("Sila isi ID Rekod dan Mesej pembetulan!");
        return;
    }

    const res = await fetch("/api/edit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: recordId, message: message })
    });

    const result = await res.json();
    alert(result.message);
    document.getElementById("chatRecordId").value = "";
    document.getElementById("chatMessage").value = "";
}

function initTrainSelector() {
    const trainGrid = document.getElementById("trainGrid");
    if (!trainGrid) return;
    trainGrid.innerHTML = "";
    
    for (let i = 1; i <= 58; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;
        btn.style.cssText = "width: 100%; padding: 6px 0; border: 1px solid #ccc; background: #f8fafc; border-radius: 6px; cursor: pointer; text-align: center; font-weight: bold;";
        
        if (selectedTrains.includes(i)) {
            btn.style.background = "#c8102e";
            btn.style.color = "white";
        }

        btn.onclick = (e) => {
            e.preventDefault();
            toggleTrainSelection(i, btn);
        };
        trainGrid.appendChild(btn);
    }
}

function toggleTrainDropdown(e) {
    if (e) e.preventDefault();
    const dd = document.getElementById("trainDropdown");
    if (dd) dd.style.display = dd.style.display === "none" ? "block" : "none";
}

function toggleTrainSelection(num, btn) {
    const index = selectedTrains.indexOf(num);
    if (index > -1) {
        selectedTrains.splice(index, 1);
        btn.style.background = "#f8fafc";
        btn.style.color = "#000";
    } else {
        selectedTrains.push(num);
        btn.style.background = "#c8102e";
        btn.style.color = "white";
    }
    renderSelectedTrains();
    loadRecords();
}

function renderSelectedTrains() {
    const container = document.getElementById("selectedTrainsContainer");
    if (!container) return;
    container.innerHTML = "";
    
    selectedTrains.sort((a,b) => a - b).forEach(num => {
        const circle = document.createElement("span");
        circle.innerText = num;
        circle.style.cssText = "display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #c8102e; color: white; font-weight: bold; font-size: 11px; margin-right: 4px;";
        container.appendChild(circle);
    });
}

// LOGIK TRAIN ID UNTUK MODAL EDIT
function initEditTrainSelector() {
    const trainGrid = document.getElementById("editTrainGrid");
    if (!trainGrid) return;
    trainGrid.innerHTML = "";
    
    for (let i = 1; i <= 58; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;
        btn.style.cssText = "width: 100%; padding: 4px 0; border: 1px solid #ccc; background: #f8fafc; border-radius: 4px; cursor: pointer; text-align: center; font-size: 12px; font-weight: bold;";
        
        if (editSelectedTrains.includes(String(i)) || editSelectedTrains.includes(i)) {
            btn.style.background = "#c8102e";
            btn.style.color = "white";
            btn.style.borderColor = "#c8102e";
        }

        btn.onclick = (e) => {
            e.preventDefault();
            toggleEditTrainSelection(i, btn);
        };
        trainGrid.appendChild(btn);
    }
}

function toggleEditTrainDropdown(e) {
    if (e) e.preventDefault();
    const dd = document.getElementById("editTrainDropdown");
    if (dd) dd.style.display = dd.style.display === "none" ? "block" : "none";
}

function toggleEditTrainSelection(num, btn) {
    const val = String(num);
    const index = editSelectedTrains.indexOf(val);
    if (index > -1) {
        editSelectedTrains.splice(index, 1);
        btn.style.background = "#f8fafc";
        btn.style.color = "#000";
        btn.style.borderColor = "#ccc";
    } else {
        editSelectedTrains.push(val);
        btn.style.background = "#c8102e";
        btn.style.color = "white";
        btn.style.borderColor = "#c8102e";
    }
    renderEditSelectedTrains();
}

function renderEditSelectedTrains() {
    const container = document.getElementById("editSelectedTrainsContainer");
    if (!container) return;
    container.innerHTML = "";
    
    editSelectedTrains.forEach(num => {
        const circle = document.createElement("span");
        circle.innerText = num;
        circle.style.cssText = "display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; border-radius: 12px; background: #c8102e; color: white; font-weight: bold; font-size: 10px; margin-right: 4px;";
        container.appendChild(circle);
    });
}

// RENDER REKOD JADUAL
async function loadRecords() {
    try {
        const res = await fetch("/api/workcontent");
        let data = await res.json();
        currentRecords = data;

        try {
            const userRes = await fetch("/api/auth/me");
            if (userRes.ok) {
                const currentUser = await userRes.json();
                isAdminUser = currentUser && (currentUser.username === "Admin" || currentUser.team_name === "All");
                if (isAdminUser) {
                    const btnNoti = document.getElementById("adminNotiBtn");
                    if (btnNoti) btnNoti.style.display = "inline-block";
                    loadNotifications();
                }
            }
        } catch (e) { console.warn("Auth API check failed", e); }

        const team = document.getElementById("filterTeam").value;
        const pic = document.getElementById("filterPIC").value;

        if (team) data = data.filter(r => r.team === team);
        if (pic) data = data.filter(r => r.pic === pic);

        const totalCountElement = document.getElementById("totalRecordsCount");
        if (totalCountElement) totalCountElement.innerHTML = data.length;

        const table = document.getElementById("tableBody");
        if (!table) return;
        table.innerHTML = "";

        if (data.length === 0) {
            table.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 15px;">Tiada rekod dijumpai.</td></tr>`;
            return;
        }

        let visualId = 1;

        data.forEach(row => {
            const tr = document.createElement("tr");
            
            const actionButtons = `
                <button class="edit" onclick="editRecord(${row.id})">Edit</button>
                <button class="delete" onclick="deleteRecord(${row.id})">Delete</button>
            `;

            let trainsHTML = "-";
            if (row.trains && row.trains.trim() !== "") {
                trainsHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">`;
                row.trains.split(",").forEach(tStr => {
                    if (tStr.trim()) {
                        trainsHTML += `<span style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; border-radius: 12px; background: #c8102e; color: white; font-weight: bold; font-size: 11px;">${tStr.trim()}</span>`;
                    }
                });
                trainsHTML += `</div>`;
            }

            let parsedItems = [];
            try {
                parsedItems = typeof row.item === 'string' ? JSON.parse(row.item) : row.item;
            } catch(e) {
                parsedItems = [];
            }

            let itemsInHTML = `<div class="sketch-item-card-grid">`;
            let itemsOutHTML = `<div class="sketch-item-card-grid">`;

            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                parsedItems.forEach(pair => {
                    if (pair.itemIn || pair.serialIn) {
                        itemsInHTML += `
                            <div class="sketch-box-card">
                                <div><b>Item In:</b> ${pair.itemIn || '-'}</div>
                                <div><b>S/N In:</b> ${pair.serialIn || '-'}</div>
                            </div>
                        `;
                    }
                    if (pair.itemOut || pair.serialOut) {
                        itemsOutHTML += `
                            <div class="sketch-box-card">
                                <div><b>Item Out:</b> ${pair.itemOut || '-'}</div>
                                <div><b>S/N Out:</b> ${pair.serialOut || '-'}</div>
                            </div>
                        `;
                    }
                });
            } else {
                itemsInHTML += `<div class="sketch-box-card">-</div>`;
                itemsOutHTML += `<div class="sketch-box-card">-</div>`;
            }

            itemsInHTML += `</div>`;
            itemsOutHTML += `</div>`;

            let formattedDate = row.date || '-';
            if (row.date && row.date.includes("-")) {
                const parts = row.date.split("-");
                if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            const reportIcon = `
                <div onclick="openReportModal(${row.id})" style="cursor: pointer; display: inline-block;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                </div>
            `;

            tr.innerHTML = `
            <td>${visualId}</td>
            <td>${row.team || '-'}</td>
            <td>${row.task || '-'}</td>
            <td>${formattedDate}</td>
            <td>${itemsInHTML}</td>
            <td>${itemsOutHTML}</td>
            <td>${trainsHTML}</td>
            <td>${reportIcon}</td>
            <td>${row.pic || '-'}</td>
            <td>${actionButtons}</td>
            `;
            table.appendChild(tr);
            visualId++;
        });
    } catch (err) { console.error("Error loading records:", err); }
}

// EDIT RECORD POPUP HANDLERS
async function editRecord(id) {
    const rec = currentRecords.find(r => String(r.id) === String(id));
    if (!rec) {
        alert("Rekod tidak ditemui!");
        return;
    }

    const editModal = document.getElementById("editModal");
    if (!editModal) return;

    document.getElementById("editRecordId").value = id;
    document.getElementById("editTask").value = rec.task || "";
    document.getElementById("editDate").value = rec.date || "";

    try {
        editItemsList = typeof rec.item === 'string' ? JSON.parse(rec.item) : (rec.item || []);
    } catch(e) {
        editItemsList = [];
    }

    renderEditItemsList();

    editSelectedPics = rec.pic ? rec.pic.split(",").map(p => p.trim()).filter(Boolean) : [];
    
    try {
        const picRes = await fetch(rec.team ? `/api/pic?team=${encodeURIComponent(rec.team.trim())}` : "/api/pic");
        const picList = await picRes.json();
        const editPicContainer = document.getElementById("editPicContainer");
        if (editPicContainer) {
            editPicContainer.innerHTML = "";
            if (Array.isArray(picList)) {
                picList.forEach(p => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.innerText = p.name;
                    btn.className = `btn-pic-rounded ${editSelectedPics.includes(p.name) ? 'active' : ''}`;
                    btn.onclick = (e) => {
                        e.preventDefault();
                        toggleEditPicSelection(p.name, btn);
                    };
                    editPicContainer.appendChild(btn);
                });
            }
        }
    } catch(err) { console.error(err); }

    editSelectedTrains = rec.trains ? rec.trains.split(",").map(t => t.trim()).filter(Boolean) : [];
    initEditTrainSelector();
    renderEditSelectedTrains();

    editModal.style.display = "flex";
}

function renderEditItemsList() {
    const container = document.getElementById("editItemsContainer");
    if (!container) return;
    container.innerHTML = "";

    editItemsList.forEach((obj, index) => {
        const itemBtn = document.createElement("div");
        itemBtn.className = "edit-item-button-row";
        itemBtn.onclick = () => openSubItemModal(index);

        itemBtn.innerHTML = `
            <div><b>Item In:</b> ${obj.itemIn || '-'} | <b>S/N In:</b> ${obj.serialIn || '-'}</div>
            <div><b>Item Out:</b> ${obj.itemOut || '-'} | <b>S/N Out:</b> ${obj.serialOut || '-'}</div>
        `;
        container.appendChild(itemBtn);
    });
}

function openSubItemModal(index) {
    const obj = editItemsList[index];
    document.getElementById("subItemIndex").value = index;
    
    document.getElementById("subCurrentItemIn").value = obj.itemIn || "";
    document.getElementById("subNewItemIn").value = "";
    document.getElementById("subCurrentSerialIn").value = obj.serialIn || "";
    document.getElementById("subNewSerialIn").value = "";

    document.getElementById("subCurrentItemOut").value = obj.itemOut || "";
    document.getElementById("subNewItemOut").value = "";
    document.getElementById("subCurrentSerialOut").value = obj.serialOut || "";
    document.getElementById("subNewSerialOut").value = "";

    document.getElementById("subItemModal").style.display = "flex";
}

function closeSubItemModal() {
    document.getElementById("subItemModal").style.display = "none";
}

function saveSubItemChanges() {
    const index = parseInt(document.getElementById("subItemIndex").value);
    
    const newIn = document.getElementById("subNewItemIn").value.trim();
    const newSerIn = document.getElementById("subNewSerialIn").value.trim();
    const newOut = document.getElementById("subNewItemOut").value.trim();
    const newSerOut = document.getElementById("subNewSerialOut").value.trim();

    if (newIn) editItemsList[index].itemIn = newIn;
    if (newSerIn) editItemsList[index].serialIn = newSerIn;
    if (newOut) editItemsList[index].itemOut = newOut;
    if (newSerOut) editItemsList[index].serialOut = newSerOut;

    renderEditItemsList();
    closeSubItemModal();
}

function toggleEditPicSelection(name, btn) {
    const index = editSelectedPics.indexOf(name);
    if (index > -1) {
        editSelectedPics.splice(index, 1);
        btn.classList.remove("active");
    } else {
        editSelectedPics.push(name);
        btn.classList.add("active");
    }
}

function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

async function saveEditedRecord() {
    const id = document.getElementById("editRecordId").value;

    const data = {
        task: document.getElementById("editTask").value,
        date: document.getElementById("editDate").value,
        savedItems: editItemsList,
        trains: editSelectedTrains.join(","),
        pic: editSelectedPics.join(", ")
    };
    
    try {
        const res = await fetch(`/api/workcontent/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("Record successfully updated!");
            closeEditModal();
            await loadRecords();
        } else {
            const errData = await res.json();
            alert("Failed to update: " + (errData.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Error updating record:", err);
    }
}

// Delete Records
async function deleteRecord(id) {
    if(confirm("Confirm To Delete This Record?")) {
        try {
            const res = await fetch("/api/workcontent/" + id, { method: "DELETE" });
            if (res.ok) {
                alert("Record deleted successfully!");
                loadRecords();
            } else {
                alert("Gagal memadam rekod.");
            }
        } catch(e) {
            console.error("Error deleting record:", e);
        }
    }
}

// REPORT MODAL POPUP
function openReportModal(recordId) {
    const rec = currentRecords.find(r => String(r.id) === String(recordId));
    if (!rec) return;

    document.getElementById("modalFindingProblem").innerText = rec.finding_problem || "No problem stated.";
    document.getElementById("modalTroubleshootMethod").innerText = rec.troubleshoot_method || "No method stated.";
    
    renderMediaElement(rec.file_before, "modalReportBefore");
    renderMediaElement(rec.file_after, "modalReportAfter");

    document.getElementById("reportModal").style.display = "flex";
}

function renderMediaElement(dataUrl, containerId) {
    const container = document.getElementById(containerId);
    if (!dataUrl) {
        container.innerHTML = "No File";
        return;
    }

    if (dataUrl.startsWith("data:image/")) {
        container.innerHTML = `<img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:10px; cursor:pointer;" onclick="openImagePreview('${dataUrl}', 'image', event)" />`;
    } else if (dataUrl.startsWith("data:video/")) {
        container.innerHTML = `<video src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:10px; cursor:pointer;" onclick="openImagePreview('${dataUrl}', 'video', event)"></video>`;
    } else if (dataUrl.startsWith("data:audio/")) {
        container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="openImagePreview('${dataUrl}', 'audio', event)">🎵<small>Audio</small></div>`;
    } else {
        container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer;" onclick="openImagePreview('${dataUrl}', 'file', event)">📁<small>File</small></div>`;
    }
}

function closeReportModal() {
    document.getElementById("reportModal").style.display = "none";
}

function openImagePreview(src, type, event) {
    if (event) event.stopPropagation();
    const mediaContainer = document.getElementById("previewMediaContainer");
    
    if (type === 'image') {
        mediaContainer.innerHTML = `<img src="${src}" style="max-width: 100%; max-height: 70vh; border-radius: 12px;" />`;
    } else if (type === 'video') {
        mediaContainer.innerHTML = `<video src="${src}" controls autoplay style="max-width: 100%; max-height: 70vh; border-radius: 12px;"></video>`;
    } else if (type === 'audio') {
        mediaContainer.innerHTML = `<audio src="${src}" controls autoplay style="width: 100%; margin-top: 20px;"></audio>`;
    } else {
        mediaContainer.innerHTML = `<a href="${src}" download="attachment">Download File</a>`;
    }

    document.getElementById("imagePreviewModal").style.display = "flex";
}

function closeImagePreview() {
    document.getElementById("imagePreviewModal").style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
    initTrainSelector();
    await loadRecords();
});