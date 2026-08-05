// Memaparkan nama pasukan (team) pada komponen dashboard
const team = localStorage.getItem("team");
document.getElementById("teamName").innerText = team || "No Team Selected";
if(document.getElementById("teamDisplay")) {
    document.getElementById("teamDisplay").innerText = "Team: " + (team || "None");
}

let selectedTrains = [];
let selectedPics = []; // Array global untuk simpan button PIC yang di-highlight

// Array tempat menyimpan pasangan item & serial number untuk Table Kanan
let savedItemsData = [
    { item: "", serial: "" } // sekurang-kurangnya 1 slot laluan asal
]; 
let activeRowIndex = 0; // Menentukan slot baris mana yang sedang diisi
let isEditMode = false;

// Membina grid pemilihan Train ID 1-58 secara dinamik
function initTrainSelector() {
    const trainGrid = document.getElementById("trainGrid");
    if (!trainGrid) return;
    trainGrid.innerHTML = "";
    
    for (let i = 1; i <= 58; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;
        btn.style.cssText = "width: 100%; padding: 6px 0; border: 1px solid #ccc; background: #f8fafc; border-radius: 6px; cursor: pointer; text-align: center; font-weight: bold; font-family: inherit;";
        
        btn.onclick = (e) => {
            e.preventDefault();
            toggleTrainSelection(i, btn);
        };
        trainGrid.appendChild(btn);
    }
}

// Buka / Tutup Dropdown Grid Train ID
function toggleTrainDropdown(e) {
    if (e) e.preventDefault();
    const dd = document.getElementById("trainDropdown");
    if (dd) {
        dd.style.display = dd.style.display === "none" ? "block" : "none";
    }
}

// Logik Pilih / Batal Pilihan Train ID
function toggleTrainSelection(num, btn) {
    const index = selectedTrains.indexOf(num);
    if (index > -1) {
        selectedTrains.splice(index, 1);
        btn.style.background = "#f8fafc";
        btn.style.color = "#000";
        btn.style.borderColor = "#ccc";
    } else {
        selectedTrains.push(num);
        btn.style.background = "#c8102e";
        btn.style.color = "white";
        btn.style.borderColor = "#c8102e";
    }
    renderSelectedTrains();
}

// Papar Train ID Terpilih
function renderSelectedTrains() {
    const container = document.getElementById("selectedTrainsContainer");
    if (!container) return;
    container.innerHTML = "";
    
    selectedTrains.sort((a,b) => a - b).forEach(num => {
        const circle = document.createElement("div");
        circle.innerText = num;
        circle.style.cssText = "display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: #c8102e; color: white; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); font-family: sans-serif;";
        container.appendChild(circle);
    });
}

// Tutup dropdown sekiranya pengguna mengetik di luar kawasan grid
document.addEventListener("click", function(event) {
    const container = document.querySelector(".train-selector-container");
    if (container && !container.contains(event.target)) {
        const dd = document.getElementById("trainDropdown");
        if (dd) dd.style.display = "none";
    }
});

// Ambil statistik dari backend API
async function loadStats(){
    try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        document.getElementById("totalWeek").innerText = data.totalWeek || 0;
        document.getElementById("totalMonth").innerText = data.totalMonth || 0;
    } catch(err) {
        console.error("Gagal muat stats:", err);
    }
}

// Load PIC (format button) daripada backend
async function loadFormData() {
    try {
        let currentTeam = localStorage.getItem("team") || "Team 1";
        currentTeam = currentTeam.replace(/['"`]+/g,'').trim();

        const picRes = await fetch(`/api/pic?team=${encodeURIComponent(currentTeam)}`);
        const pics = await picRes.json();
        
        const picContainer = document.getElementById("picContainer");
        
        if (picContainer) {
            picContainer.innerHTML = ""; 
            picContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;";

            if (Array.isArray(pics)) {
                pics.forEach(p => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.innerText = p.name;
                    btn.style.cssText = "padding: 6px 12px; border: 1px solid #ccc; background: #f8fafc; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;";
                    
                    if (selectedPics.includes(p.name)) {
                        btn.style.background = "#c8102e";
                        btn.style.color = "white";
                        btn.style.borderColor = "#c8102e";
                    }

                    btn.onclick = (e) => {
                        e.preventDefault();
                        togglePicSelection(p.name, btn);
                    };
                    picContainer.appendChild(btn);
                });
            }
        }
    } catch(err) { console.error("Error loading PIC:", err); }
}

// Logik Pilih / Batal Pilihan PIC
function togglePicSelection(name, btn) {
    const index = selectedPics.indexOf(name);
    if (index > -1) {
        selectedPics.splice(index, 1);
        btn.style.background = "#f8fafc";
        btn.style.color = "#000";
        btn.style.borderColor = "#ccc";
    } else {
        selectedPics.push(name);
        btn.style.background = "#c8102e";
        btn.style.color = "white";
        btn.style.borderColor = "#c8102e";
    }
}

// =========================================================
// LOGIK APLIKASI UNTUK TABLE KANAN (SAVED ITEMS & SERIALS)
// =========================================================

function renderRightTable() {
    const container = document.getElementById("savedItemsList");
    if (!container) return;
    container.innerHTML = "";

    // Memastikan sekurang-kurangnya 5 slot dipaparkan mengikut mockup design
    const totalSlotsToRender = Math.max(5, savedItemsData.length);

    for (let i = 0; i < totalSlotsToRender; i++) {
        const itemObj = savedItemsData[i] || { item: "", serial: "" };
        
        const rowBox = document.createElement("div");
        rowBox.className = `right-item-row ${i === activeRowIndex ? 'active-row' : ''}`;
        
        // Tap mana-mana row di Table Kanan untuk edit / pilih slot tersebut
        rowBox.onclick = () => selectRowToEdit(i);

        rowBox.innerHTML = `
            <div class="field-group">
                <label>Items:</label>
                <input type="text" value="${itemObj.item || ''}" ${isEditMode ? '' : 'readonly'} onchange="updateRowData(${i}, 'item', this.value)" />
            </div>
            <div class="field-group">
                <label>Serial Numbers:</label>
                <input type="text" value="${itemObj.serial || ''}" ${isEditMode ? '' : 'readonly'} onchange="updateRowData(${i}, 'serial', this.value)" />
            </div>
        `;

        container.appendChild(rowBox);
    }
}

function saveCurrentItem() {
    const val = document.getElementById("itemInput").value.trim();
    if (!savedItemsData[activeRowIndex]) {
        savedItemsData[activeRowIndex] = { item: "", serial: "" };
    }
    savedItemsData[activeRowIndex].item = val;
    renderRightTable();
}

function saveCurrentSerial() {
    const val = document.getElementById("serial").value.trim();
    if (!savedItemsData[activeRowIndex]) {
        savedItemsData[activeRowIndex] = { item: "", serial: "" };
    }
    savedItemsData[activeRowIndex].serial = val;
    renderRightTable();
}

function addNewItemRow() {
    saveCurrentItem();
    savedItemsData.push({ item: "", serial: "" });
    activeRowIndex = savedItemsData.length - 1;
    document.getElementById("itemInput").value = "";
    document.getElementById("serial").value = "";
    renderRightTable();
}

function addNewSerialRow() {
    saveCurrentSerial();
    savedItemsData.push({ item: "", serial: "" });
    activeRowIndex = savedItemsData.length - 1;
    document.getElementById("itemInput").value = "";
    document.getElementById("serial").value = "";
    renderRightTable();
}

function selectRowToEdit(index) {
    activeRowIndex = index;
    if (!savedItemsData[index]) {
        savedItemsData[index] = { item: "", serial: "" };
    }
    document.getElementById("itemInput").value = savedItemsData[index].item || "";
    document.getElementById("serial").value = savedItemsData[index].serial || "";
    renderRightTable();
}

function updateRowData(index, key, value) {
    if (!savedItemsData[index]) {
        savedItemsData[index] = { item: "", serial: "" };
    }
    savedItemsData[index][key] = value;
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    alert(isEditMode ? "Edit Mode Enabled: You can now edit Table Kanan directly." : "Edit Mode Disabled.");
    renderRightTable();
}

// Fungsi hantar data kerja baru ke Records page
async function submitWorkAndRefresh(e) {
    if (e) e.preventDefault();

    // Mengumpul semua Items & Serials yang tersimpan di Table Kanan
    const itemsList = savedItemsData.map(d => d.item).filter(Boolean).join(", ");
    const serialsList = savedItemsData.map(d => d.serial).filter(Boolean).join(", ");

    const data = {
        team: localStorage.getItem("team"),
        task: document.getElementById("task").value,
        date: document.getElementById("date").value,
        item: itemsList || document.getElementById("itemInput").value,
        serial: serialsList || document.getElementById("serial").value,
        pic: selectedPics.join(", "),
        trains: selectedTrains.join(",")
    };

    if(!data.task || selectedPics.length === 0){
        alert("Please fill in the Task and select at least one PIC!");
        return;
    }

    try {
        const res = await fetch("/api/workcontent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        alert(result.message);
        
        // Reset Form
        document.getElementById("task").value = "";
        document.getElementById("itemInput").value = "";
        document.getElementById("serial").value = "";
        savedItemsData = [{ item: "", serial: "" }];
        activeRowIndex = 0;

        // Reset Train ID & PIC
        selectedTrains = [];
        selectedPics = [];
        renderSelectedTrains();
        initTrainSelector();
        loadFormData();
        renderRightTable();

        loadStats(); 
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

// Jalankan fungsi ketika halaman selesai dimuatkan
document.addEventListener("DOMContentLoaded", ()=>{
    loadStats();
    loadFormData();
    initTrainSelector();
    renderRightTable();
});