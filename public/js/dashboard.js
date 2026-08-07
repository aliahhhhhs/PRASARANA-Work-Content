const team = localStorage.getItem("team");
document.getElementById("teamName").innerText = team || "No Team Selected";

let selectedTrains = []; // Array of objects: { train: 1, coach: "M1" }
let selectedPics = [];
let pendingTrainNumber = null;
let activeMode = null; // "IN" or "OUT"

// Temporary store for current IN/OUT pair before tapping Add More
let currentDraftData = {
    itemIn: "",
    serialIn: "",
    itemOut: "",
    serialOut: ""
};

let savedItemsData = [];
let activeRowIndex = 0;
let isEditMode = false;

// Initialize Train ID grid (1 to 58)
function initTrainSelector() {
    const trainGrid = document.getElementById("trainGrid");
    if (!trainGrid) return;
    trainGrid.innerHTML = "";
    
    for (let i = 1; i <= 58; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;
        btn.className = "train-num-btn";
        
        btn.onclick = (e) => {
            e.preventDefault();
            pendingTrainNumber = i;
            toggleTrainDropdown();
            document.getElementById("coachModal").style.display = "flex";
        };
        trainGrid.appendChild(btn);
    }
}

function selectCoach(coachCode) {
    if (pendingTrainNumber !== null) {
        // Replace existing entry if same train ID selected, otherwise push
        const existingIdx = selectedTrains.findIndex(t => t.train === pendingTrainNumber);
        if (existingIdx > -1) {
            selectedTrains[existingIdx].coach = coachCode;
        } else {
            selectedTrains.push({ train: pendingTrainNumber, coach: coachCode });
        }
        pendingTrainNumber = null;
        document.getElementById("coachModal").style.display = "none";
        renderSelectedTrains();
    }
}

function toggleTrainDropdown(e) {
    if (e) e.preventDefault();
    const dd = document.getElementById("trainDropdown");
    if (dd) {
        dd.style.display = dd.style.display === "none" ? "block" : "none";
    }
}

function renderSelectedTrains() {
    const container = document.getElementById("selectedTrainsContainer");
    if (!container) return;
    container.innerHTML = "";
    
    selectedTrains.sort((a,b) => a.train - b.train).forEach(item => {
        const pill = document.createElement("div");
        pill.className = "selected-train-pill";
        pill.innerText = `${item.train} : ${item.coach}`;
        pill.onclick = () => removeTrainSelection(item.train);
        container.appendChild(pill);
    });
}

function removeTrainSelection(trainNum) {
    selectedTrains = selectedTrains.filter(t => t.train !== trainNum);
    renderSelectedTrains();
}

// IN / OUT Modal Handlers
function openItemModal(mode) {
    activeMode = mode;
    const modal = document.getElementById("itemModal");
    const title = document.getElementById("modalTitle");
    const lblItem = document.getElementById("lblItemName");
    const lblSerial = document.getElementById("lblSerialName");
    const itemInput = document.getElementById("modalItemInput");
    const serialInput = document.getElementById("modalSerialInput");

    if (mode === 'IN') {
        title.innerText = "Item In";
        lblItem.innerText = "Item In";
        lblSerial.innerText = "Serial Number In";
        itemInput.value = currentDraftData.itemIn;
        serialInput.value = currentDraftData.serialIn;
    } else {
        title.innerText = "Item Out";
        lblItem.innerText = "Item Out";
        lblSerial.innerText = "Serial Number Out";
        itemInput.value = currentDraftData.itemOut;
        serialInput.value = currentDraftData.serialOut;
    }
    modal.style.display = "flex";
}

function closeItemModal() {
    document.getElementById("itemModal").style.display = "none";
}

function saveItemModalData() {
    const itemVal = document.getElementById("modalItemInput").value.trim();
    const serialVal = document.getElementById("modalSerialInput").value.trim();

    if (activeMode === 'IN') {
        currentDraftData.itemIn = itemVal;
        currentDraftData.serialIn = serialVal;
    } else {
        currentDraftData.itemOut = itemVal;
        currentDraftData.serialOut = serialVal;
    }
    closeItemModal();
}

function commitCurrentAndReset() {
    if (!currentDraftData.itemIn && !currentDraftData.serialIn && !currentDraftData.itemOut && !currentDraftData.serialOut) {
        alert("Please enter IN or OUT details first.");
        return;
    }

    savedItemsData.push({ ...currentDraftData });
    // Reset inputs
    currentDraftData = { itemIn: "", serialIn: "", itemOut: "", serialOut: "" };
    renderRightTable();
}

function renderRightTable() {
    const container = document.getElementById("savedItemsList");
    if (!container) return;
    container.innerHTML = "";

    const slotsToRender = Math.max(1, savedItemsData.length);

    for (let i = 0; i < slotsToRender; i++) {
        const data = savedItemsData[i] || { itemIn: "", serialIn: "", itemOut: "", serialOut: "" };
        const card = document.createElement("div");
        card.className = "saved-card-pair";

        card.innerHTML = `
            <div class="saved-sub-box">
                <div class="field-row">
                    <label>Item In:</label>
                    <input type="text" value="${data.itemIn || ''}" ${isEditMode ? '' : 'readonly'} onchange="updateSavedRow(${i}, 'itemIn', this.value)" />
                </div>
                <div class="field-row">
                    <label>S/N In:</label>
                    <input type="text" value="${data.serialIn || ''}" ${isEditMode ? '' : 'readonly'} onchange="updateSavedRow(${i}, 'serialIn', this.value)" />
                </div>
            </div>
            <div class="saved-sub-box">
                <div class="field-row">
                    <label>Item Out:</label>
                    <input type="text" value="${data.itemOut || ''}" ${isEditMode ? '' : 'readonly'} onchange="updateSavedRow(${i}, 'itemOut', this.value)" />
                </div>
                <div class="field-row">
                    <label>S/N Out:</label>
                    <input type="text" value="${data.serialOut || ''}" ${isEditMode ? '' : 'readonly'} onchange="updateSavedRow(${i}, 'serialOut', this.value)" />
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

function updateSavedRow(index, key, value) {
    if (savedItemsData[index]) {
        savedItemsData[index][key] = value;
    }
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    alert(isEditMode ? "Edit Mode Enabled: You can now edit the saved items directly." : "Edit Mode Disabled.");
    renderRightTable();
}

// Report Textarea expand/shrink mechanics
function expandReportTextarea(el) {
    el.classList.add("expanded");
}

function shrinkReportTextarea(el) {
    if (!el.value.trim()) {
        el.classList.remove("expanded");
    }
}

// File Upload & Preview
function triggerFileInput(id) {
    document.getElementById(id).click();
}

function handleFileChange(event, targetPreviewId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.getElementById(targetPreviewId);
            container.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" onclick="openImagePreview('${e.target.result}', event)" />`;
        };
        reader.readAsDataURL(file);
    }
}

function openImagePreview(src, event) {
    event.stopPropagation();
    document.getElementById("previewImageSrc").src = src;
    document.getElementById("imagePreviewModal").style.display = "flex";
}

function closeImagePreview() {
    document.getElementById("imagePreviewModal").style.display = "none";
}

// Load PICs & Stats
async function loadFormData() {
    try {
        let currentTeam = localStorage.getItem("team") || "Team 1";
        currentTeam = currentTeam.replace(/['"`]+/g,'').trim();

        const picRes = await fetch(`/api/pic?team=${encodeURIComponent(currentTeam)}`);
        const pics = await picRes.json();
        const picContainer = document.getElementById("picContainer");
        
        if (picContainer && Array.isArray(pics)) {
            picContainer.innerHTML = "";
            pics.forEach(p => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.innerText = p.name;
                btn.className = `btn-pic-pill ${selectedPics.includes(p.name) ? 'active' : ''}`;
                btn.onclick = (e) => {
                    e.preventDefault();
                    togglePicSelection(p.name, btn);
                };
                picContainer.appendChild(btn);
            });
        }
    } catch(err) { console.error("Error loading PIC:", err); }
}

function togglePicSelection(name, btn) {
    const index = selectedPics.indexOf(name);
    if (index > -1) {
        selectedPics.splice(index, 1);
        btn.classList.remove("active");
    } else {
        selectedPics.push(name);
        btn.classList.add("active");
    }
}

async function loadStats(){
    try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        document.getElementById("totalWeek").innerText = data.totalWeek || 0;
        document.getElementById("totalMonth").innerText = data.totalMonth || 0;
    } catch(err) { console.error("Gagal muat stats:", err); }
}

async function submitWorkAndRefresh(e) {
    if (e) e.preventDefault();

    const trainsFormatted = selectedTrains.map(t => `${t.train}:${t.coach}`).join(",");
    const data = {
        team: localStorage.getItem("team"),
        task: document.getElementById("task").value,
        date: document.getElementById("date").value,
        savedItems: savedItemsData,
        pic: selectedPics.join(", "),
        trains: trainsFormatted,
        findingProblem: document.getElementById("findingProblem").value,
        troubleshootMethod: document.getElementById("troubleshootMethod").value
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
        alert(result.message || "Data saved successfully!");
        
        // Reset Form
        document.getElementById("workContentForm").reset();
        savedItemsData = [];
        selectedTrains = [];
        selectedPics = [];
        renderSelectedTrains();
        renderRightTable();
        loadFormData();
        loadStats();
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

document.addEventListener("DOMContentLoaded", ()=>{
    loadStats();
    loadFormData();
    initTrainSelector();
    renderRightTable();
});