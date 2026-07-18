// ==========================================
// 1. PEMBOLEHUBAH GLOBAL & FLATPICKR
// ==========================================
let selectedTrains = [];      // Untuk penapis (filter) jadual utama
let editSelectedTrains = [];  // Untuk pemilihan di dalam Modal Edit
let selectedStartDate = null;
let selectedEndDate = null;
let fpInstance = null;
let isAdminUser = false;

// ==========================================
// 2. SISTEM NOTIFIKASI ADMIN (CHATBOX EDIT)
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
    } catch(err) {
        console.error(err);
    }
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
// 3. LOGIK GRID TRAIN ID (PENAPIS UTAMA JADUAL)
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

// ==========================================
// 4. LOGIK GRID TRAIN ID (KHAS UNTUK MODAL EDIT)
// ==========================================
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

// Klik luar kawasan untuk tutup dropdown penapis & edit
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
// 5. PENAPISAN OPTIONS (TEAM, ITEM & PIC UTAMA)
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
// 6. PAPARAN DATA REKOD & TURUTAN DINAMIK 1-N
// ==========================================
async function loadRecords() {
    try {
        const res = await fetch("/api/workcontent");
        let data = await res.json();

        // Check Admin Hak Akses
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

        // Filter berasaskan dropdown & tarikh
        const team = document.getElementById("filterTeam").value;
        const pic = document.getElementById("filterPIC").value;
        const item = document.getElementById("filterItem").value;

        if (team) data = data.filter(r => r.team === team);
        if (pic) data = data.filter(r => r.pic === pic);
        if (item) data = data.filter(r => r.item === item);
        if (selectedStartDate && selectedEndDate) {
            data = data.filter(r => r.date >= selectedStartDate && r.date <= selectedEndDate);
        }

        // Filter berasaskan Train Grid Selection Utama
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
            table.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 15px;">Tiada rekod dijumpai.</td></tr>`;
            return;
        }

        // Turutan ID tetap tersusun 1-N walaupun ada data tengah dipadam
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
                trainsHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 180px;">`;
                row.trains.split(",").forEach(trainNum => {
                    if (trainNum.trim()) {
                        trainsHTML += `<span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #c8102e; color: white; font-weight: bold; font-size: 10px;">${trainNum.trim()}</span>`;
                    }
                });
                trainsHTML += `</div>`;
            }
            
            tr.innerHTML = `
            <td>${visualId}</td>
            <td>${row.team || '-'}</td>
            <td>${row.task || '-'}</td>
            <td>${row.date || '-'}</td>
            <td>${row.item || '-'}</td>
            <td>${row.serial || '-'}</td>
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
// 7. INTERAKSI ACTION: EDIT & DELETE REKOD
// ==========================================
async function editRecord(id, task, date, item, serial, trains, pic) {
    document.getElementById("editRecordId").value = id;
    document.getElementById("editTask").value = task || "";
    document.getElementById("editDate").value = date || "";
    document.getElementById("editItem").value = item || "";
    document.getElementById("editSerial").value = serial || "";

    try {
        const res = await fetch("/api/workcontent");
        const allRecords = await res.json();
        const currentRec = allRecords.find(r => r.id === id);
        const currentTeam = currentRec ? currentRec.team : "";
        document.getElementById("editRecordTeam").value = currentTeam;

        // Load dropdown PIC yang sepadan dengan team rekod tersebut
        const picRes = await fetch(currentTeam ? `/api/pic?team=${encodeURIComponent(currentTeam.trim())}` : "/api/pic");
        const picList = await picRes.json();
        const picSelect = document.getElementById("editPic");
        
        picSelect.innerHTML = '<option value="">Select PIC</option>';
        if (Array.isArray(picList)) {
            picList.forEach(p => {
                let option = document.createElement("option");
                option.value = p.name; option.innerText = p.name;
                if(p.name === pic) option.selected = true;
                picSelect.appendChild(option);
            });
        }
    } catch (err) { console.error("Gagal memuatkan PIC untuk edit", err); }

    // Parse data Train ID sedia ada ke dalam Grid Edit
    if (trains && trains.trim() !== "" && trains !== "-") {
        editSelectedTrains = trains.split(",").map(t => parseInt(t.trim())).filter(t => !isNaN(t));
    } else {
        editSelectedTrains = [];
    }

    initEditTrainSelector();
    renderEditSelectedTrains();

    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() { document.getElementById("editModal").style.display = "none"; }

async function saveEditedRecord() {
    const id = document.getElementById("editRecordId").value;
    const data = {
        task: document.getElementById("editTask").value,
        date: document.getElementById("editDate").value,
        item: document.getElementById("editItem").value,
        serial: document.getElementById("editSerial").value,
        trains: editSelectedTrains.join(","),
        pic: document.getElementById("editPic").value
    };

    const res = await fetch(`/api/workcontent/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert("Rekod berjaya dikemaskini!");
        closeEditModal();
        loadRecords();
    }
}

async function deleteRecord(id) {
    if(confirm("Confirm To Delete This Record?")) {
        await fetch("/api/workcontent/" + id, { method: "DELETE" });
        loadRecords();
    }
}

// ==========================================
// 8. EKSPORT KE EXCEL & CARIAN INPUT
// ==========================================
function exportToExcel() {
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes("Tiada rekod"))) {
        alert("Tiada data untuk dieksport!"); return;
    }
    const excelData = [["ID", "Team", "Task", "Date", "Item", "Serial", "Train ID(s)", "PIC"]];
    rows.forEach(row => {
        if (row.style.display !== "none") {
            const cells = row.querySelectorAll("td");
            let trainText = "";
            const trainSpans = cells[6].querySelectorAll("span");
            if (trainSpans.length > 0) {
                const nums = [];
                trainSpans.forEach(span => nums.push(span.innerText.trim()));
                trainText = nums.join(",");
            } else {
                trainText = cells[6].innerText.trim();
                if (trainText === "-") trainText = "";
            }
            excelData.push([
                cells[0].innerText, cells[1].innerText, cells[2].innerText, cells[3].innerText,
                cells[4].innerText, cells[5].innerText, trainText, cells[7].innerText
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
// 9. EVENT LISTENERS DOM LOADED
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