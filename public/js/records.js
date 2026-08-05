// ==========================================
// PEMBOLEHUBAH GLOBAL
// ==========================================
let selectedTrains = [];
let editSelectedTrains = [];
let editSelectedPics = [];
let editItemsList = []; // Array pasangan { item, serial } untuk Modal Edit
let selectedStartDate = null;
let selectedEndDate = null;
let fpInstance = null;
let isAdminUser = false;

// ==========================================
// SISTEM NOTIFIKASI ADMIN & EDIT REQUEST
// ==========================================
function toggleNotiDropdown(e) {
    if(e) e.preventDefault();
    const menu = document.getElementById("notiDropdownMenu");
    menu.style.display = menu.style.display === "none" ? "block" : "none";
}

async function loadNotifications() {
    if (!isAdminUser) return;
    try {
        const res = await fetch("/api/edit-requests");
        const requests = await res.json();
        
        const countEl = document.getElementById("notiCount");
        const container = document.getElementById("notiItemsContainer");
        
        if(requests.length > 0) {
            countEl.innerText = requests.length;
            countEl.style.display = "inline-block";
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
        } else {
            countEl.style.display = "none";
            container.innerHTML = "Tiada notifikasi baharu.";
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

// ==========================================
// LOGIK GRID TRAIN ID (UTAMA & EDIT)
// ==========================================
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

function initEditTrainSelector() {
    const trainGrid = document.getElementById("editTrainGrid");
    if (!trainGrid) return;
    trainGrid.innerHTML = "";
    
    for (let i = 1; i <= 58; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;
        btn.style.cssText = "width: 100%; padding: 4px 0; border: 1px solid #ccc; background: #f8fafc; border-radius: 4px; cursor: pointer; text-align: center; font-size: 12px; font-weight: bold;";
        
        if (editSelectedTrains.includes(i)) {
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
    const index = editSelectedTrains.indexOf(num);
    if (index > -1) {
        editSelectedTrains.splice(index, 1);
        btn.style.background = "#f8fafc";
        btn.style.color = "#000";
        btn.style.borderColor = "#ccc";
    } else {
        editSelectedTrains.push(num);
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
    
    editSelectedTrains.sort((a,b) => a - b).forEach(num => {
        const circle = document.createElement("span");
        circle.innerText = num;
        circle.style.cssText = "display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #c8102e; color: white; font-weight: bold; font-size: 10px; margin-right: 4px;";
        container.appendChild(circle);
    });
}

document.addEventListener("click", function(event) {
    const container = document.querySelector(".train-selector-container");
    if (container && !container.contains(event.target)) {
        const dd = document.getElementById("trainDropdown");
        if (dd) dd.style.display = "none";
    }
    const editContainer = document.querySelector(".edit-train-container");
    if (editContainer && !editContainer.contains(event.target)) {
        const edd = document.getElementById("editTrainDropdown");
        if (edd) edd.style.display = "none";
    }
});

// ==========================================
// PENAPISAN OPTIONS
// ==========================================
async function updatePicFilterOptions() {
    const selectedTeam = document.getElementById("filterTeam").value;
    const url = selectedTeam ? `/api/pic?team=${encodeURIComponent(selectedTeam.trim())}` : "/api/pic";
    try {
        const picRes = await fetch(url);
        const pic = await picRes.json();
        const picSelect = document.getElementById("filterPIC");
        if (picSelect){
            picSelect.innerHTML = '<option value="">All PIC</option>';
            if (Array.isArray(pic)) {
                pic.forEach(p => {
                    let option = document.createElement("option");
                    option.value = p.name; option.innerText = p.name;
                    picSelect.appendChild(option);
                });
            }
        }
    } catch (err) { console.error(err); }
}

async function loadFilterOptions(){
    await updatePicFilterOptions();
    try {
        const itemRes = await fetch("/api/items");
        const items = await itemRes.json();
        const itemSelect = document.getElementById("filterItem");
        if (itemSelect) {
            itemSelect.innerHTML ='<option value="">All Items</option>';
            items.forEach(i =>{
                let option = document.createElement("option");
                option.value = i.item_name; option.innerText = i.item_name;
                itemSelect.appendChild(option);
            });
        }
    } catch (err) { console.error(err); }
}

// ==========================================
// PAPARAN DATA REKOD
// ==========================================
async function loadRecords() {
    try {
        const res = await fetch("/api/workcontent");
        let data = await res.json();

        try {
            const userRes = await fetch("/api/auth/me");
            if (userRes.ok) {
                const currentUser = await userRes.json();
                isAdminUser = currentUser && (currentUser.username === "SayaAdmin1" || currentUser.username === "SayaAdmin2");
                if (isAdminUser) {
                    document.getElementById("adminNotiBtn").style.display = "inline-block";
                    loadNotifications();
                }
            }
        } catch (e) { console.warn("Auth API error"); }

        const team = document.getElementById("filterTeam").value;
        const pic = document.getElementById("filterPIC").value;
        const item = document.getElementById("filterItem").value;

        if (team) data = data.filter(r => r.team === team);
        if (pic) data = data.filter(r => r.pic === pic);
        if (item) data = data.filter(r => r.item && r.item.includes(item));
        if (selectedStartDate && selectedEndDate) {
            data = data.filter(r => r.date >= selectedStartDate && r.date <= selectedEndDate);
        }

        if (selectedTrains.length > 0) {
            data = data.filter(r => {
                if (!r.trains) return false;
                const rowTrains = r.trains.split(",").map(t => parseInt(t.trim()));
                return selectedTrains.every(t => rowTrains.includes(t));
            });
        }

        const totalCountElement = document.getElementById("totalRecordsCount");
        if (totalCountElement) totalCountElement.innerHTML = data.length;

        const table = document.getElementById("tableBody");
        if (!table) return;
        table.innerHTML = "";

        if (data.length === 0) {
            table.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 15px;">Tiada rekod dijumpai.</td></tr>`;
            return;
        }

        let visualId = 1;

        data.forEach(row => {
            const tr = document.createElement("tr");
            
            let actionButtons = `<em>No Access</em>`;
            if (isAdminUser) {
                actionButtons = `
                <button class="edit" onclick="editRecord(${row.id}, '${row.task || ''}', '${row.date || ''}', '${row.item || ''}', '${row.serial || ''}', '${row.trains || ''}', '${row.pic || ''}')">Edit</button>
                <button class="delete" onclick="deleteRecord(${row.id})">Delete</button>`;
            }

            let trainsHTML = "-";
            if (row.trains && row.trains.trim() !== "") {
                trainsHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">`;
                row.trains.split(",").forEach(trainNum => {
                    if (trainNum.trim()) {
                        trainsHTML += `<span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #c8102e; color: white; font-weight: bold; font-size: 10px;">${trainNum.trim()}</span>`;
                    }
                });
                trainsHTML += `</div>`;
            }

            const itemList = (row.item || "").split(",").map(s => s.trim());
            const serialList = (row.serial || "").split(",").map(s => s.trim());
            const maxPairs = Math.max(itemList.length, serialList.length);

            let itemsAndSerialsHTML = `<div class="items-sketch-grid">`;
            for (let i = 0; i < maxPairs; i++) {
                const currentItem = itemList[i] || "-";
                const currentSerial = serialList[i] || "-";
                itemsAndSerialsHTML += `
                    <div class="item-sketch-card">
                        <div><b>Item:</b> ${currentItem}</div>
                        <div><b>Serial Number:</b> ${currentSerial}</div>
                    </div>
                `;
            }
            itemsAndSerialsHTML += `</div>`;

            let formattedDate = row.date || '-';
            if (row.date && row.date.includes("-")) {
                const parts = row.date.split("-");
                if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            tr.innerHTML = `
            <td>${visualId}</td>
            <td>${row.team || '-'}</td>
            <td>${row.task || '-'}</td>
            <td>${formattedDate}</td>
            <td>${itemsAndSerialsHTML}</td>
            <td>${trainsHTML}</td>
            <td>${row.pic || '-'}</td>
            <td>${actionButtons}</td>
            `;
            table.appendChild(tr);
            visualId++;
        });
    } catch (err) { console.error("Error loading records:", err); }
}

// ==========================================
// INTERAKSI POPUP EDIT REKOD & SUB-MODAL ITEM
// ==========================================
async function editRecord(id, task, date, item, serial, trains, pic) {
    document.getElementById("editRecordId").value = id;
    document.getElementById("editTask").value = task || "";
    document.getElementById("editDate").value = date || "";

    // Parse pasangan Item & Serial ke dalam Array
    const rawItems = (item || "").split(",").map(s => s.trim());
    const rawSerials = (serial || "").split(",").map(s => s.trim());
    const totalCount = Math.max(rawItems.length, rawSerials.length);

    editItemsList = [];
    for (let i = 0; i < totalCount; i++) {
        editItemsList.push({
            item: rawItems[i] || "",
            serial: rawSerials[i] || ""
        });
    }

    renderEditItemsList();

    if (pic && pic.trim() !== "" && pic !== "-") {
        editSelectedPics = pic.split(",").map(p => p.trim());
    } else {
        editSelectedPics = [];
    }

    try {
        const res = await fetch("/api/workcontent");
        const allRecords = await res.json();
        const currentRec = allRecords.find(r => r.id === id);
        const currentTeam = currentRec ? currentRec.team : "";
        document.getElementById("editRecordTeam").value = currentTeam;

        const picRes = await fetch(currentTeam ? `/api/pic?team=${encodeURIComponent(currentTeam.trim())}` : "/api/pic");
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
    } catch (err) { console.error("Gagal memuatkan PIC untuk edit", err); }

    if (trains && trains.trim() !== "" && trains !== "-") {
        editSelectedTrains = trains.split(",").map(t => parseInt(t.trim())).filter(t => !isNaN(t));
    } else {
        editSelectedTrains = [];
    }

    initEditTrainSelector();
    renderEditSelectedTrains();

    document.getElementById("editModal").style.display = "flex";
}

// Papar senarai butang Item & Serial di Modal Edit utama
function renderEditItemsList() {
    const container = document.getElementById("editItemsContainer");
    if (!container) return;
    container.innerHTML = "";

    editItemsList.forEach((obj, index) => {
        const itemBtn = document.createElement("div");
        itemBtn.className = "edit-item-button-row";
        itemBtn.onclick = () => openSubItemModal(index);

        itemBtn.innerHTML = `
            <span><b>Item:</b> ${obj.item || 'Item Name'}</span>
            <span style="color: #64748b;">|</span>
            <span><b>Serial Number:</b> ${obj.serial || '1234567890'}</span>
        `;
        container.appendChild(itemBtn);
    });
}

// Buka Sub-modal Popup untuk edit Item/Serial individu
function openSubItemModal(index) {
    const obj = editItemsList[index];
    document.getElementById("subItemIndex").value = index;
    
    document.getElementById("subCurrentItem").value = obj.item || "";
    document.getElementById("subNewItem").value = "";
    
    document.getElementById("subCurrentSerial").value = obj.serial || "";
    document.getElementById("subNewSerial").value = "";

    document.getElementById("subItemModal").style.display = "flex";
}

function closeSubItemModal() {
    document.getElementById("subItemModal").style.display = "none";
}

function saveSubItemChanges() {
    const index = parseInt(document.getElementById("subItemIndex").value);
    const newItem = document.getElementById("subNewItem").value.trim();
    const newSerial = document.getElementById("subNewSerial").value.trim();

    if (newItem !== "") {
        editItemsList[index].item = newItem;
    }
    if (newSerial !== "") {
        editItemsList[index].serial = newSerial;
    }

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

    const itemsFormatted = editItemsList.map(d => d.item).filter(Boolean).join(", ");
    const serialsFormatted = editItemsList.map(d => d.serial).filter(Boolean).join(", ");

    const data = {
        task: document.getElementById("editTask").value,
        date: document.getElementById("editDate").value,
        item: itemsFormatted,
        serial: serialsFormatted,
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
        alert("An error occurred while saving.");
    }
}

async function deleteRecord(id) {
    if(confirm("Confirm To Delete This Record?")) {
        await fetch("/api/workcontent/" + id, { method: "DELETE" });
        loadRecords();
    }
}

// ==========================================
// EKSPORT KE EXCEL & CARIAN
// ==========================================
function exportToExcel() {
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes("Tiada rekod"))) {
        alert("Tiada data untuk dieksport!"); return;
    }
    const excelData = [["ID", "Team", "Task", "Date", "Items & Serial Numbers", "Train ID(s)", "PIC"]];
    rows.forEach(row => {
        if (row.style.display !== "none") {
            const cells = row.querySelectorAll("td");
            
            const cards = cells[4].querySelectorAll(".item-sketch-card");
            let itemsSerialsText = "";
            if (cards.length > 0) {
                const textArr = [];
                cards.forEach(c => textArr.push(c.innerText.replace(/\n/g, " ")));
                itemsSerialsText = textArr.join(" | ");
            } else {
                itemsSerialsText = cells[4].innerText.trim();
            }

            let trainText = "";
            const trainSpans = cells[5].querySelectorAll("span");
            if (trainSpans.length > 0) {
                const nums = [];
                trainSpans.forEach(span => nums.push(span.innerText.trim()));
                trainText = nums.join(",");
            } else {
                trainText = cells[5].innerText.trim();
                if (trainText === "-") trainText = "";
            }

            excelData.push([
                cells[0].innerText, cells[1].innerText, cells[2].innerText, cells[3].innerText,
                itemsSerialsText, trainText, cells[6].innerText
            ]);
        }
    });
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records Data");
    XLSX.writeFile(workbook, "Work_Content_Records.xlsx");
}

document.getElementById("search").addEventListener("input", function (){
    let value = this.value.toLowerCase();
    let rows = document.querySelectorAll("#tableBody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
});

// ==========================================
// EVENT LISTENERS DOM LOADED
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    initTrainSelector();
    await loadFilterOptions();
    await loadRecords();

    fpInstance = flatpickr("#filterDateRange", {
        mode: "range", dateFormat: "Y-m-d",
        onClose: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 2) {
                selectedStartDate = instance.formatDate(selectedDates[0], "Y-m-d");
                selectedEndDate = instance.formatDate(selectedDates[1], "Y-m-d");
            } else { selectedStartDate = null; selectedEndDate = null; }
            loadRecords();
        }
    });

    document.getElementById("clearDataBtn").addEventListener("click", function() {
        if (fpInstance) fpInstance.clear();
        selectedStartDate = null; selectedEndDate = null;
        selectedTrains = [];
        renderSelectedTrains();
        initTrainSelector();
        document.getElementById("filterTeam").value = "";
        document.getElementById("filterItem").value = "";
        document.getElementById("filterPIC").value = "";
        document.getElementById("search").value = "";
        updatePicFilterOptions();
        loadRecords();
    });

    document.getElementById("filterTeam").onchange = async function () {
        await updatePicFilterOptions();
        loadRecords();
    };
    document.getElementById("filterPIC").onchange = loadRecords;
    document.getElementById("filterItem").onchange = loadRecords;
});