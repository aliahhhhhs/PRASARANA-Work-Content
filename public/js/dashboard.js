const team = localStorage.getItem("team");
document.getElementById("teamName").innerText = team || "No Team Selected";

let selectedTrains = [];
let selectedPics = [];
let pendingTrainNumber = null;
let activeMode = null; // "IN" or "OUT"

let currentDraftData = {
    itemIn: "",
    serialIn: "",
    itemOut: "",
    serialOut: ""
};

let uploadedFileBefore = [];
let uploadedFileAfter = [];

let savedItemsData = [];
let activeRowIndex = 0;
let isEditMode = false;

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

// Menekan OK terus mengemaskini draf DAN automatik push ke table kanan
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

    // Kemaskini slot aktif di table kanan secara automatik
    if (!savedItemsData[activeRowIndex]) {
        savedItemsData[activeRowIndex] = { ...currentDraftData };
    } else {
        savedItemsData[activeRowIndex] = { ...savedItemsData[activeRowIndex], ...currentDraftData };
    }

    renderRightTable();
    closeItemModal();
}

// Menekan Add More membuka slot baris baharu
function commitCurrentAndReset() {
    currentDraftData = { itemIn: "", serialIn: "", itemOut: "", serialOut: "" };
    savedItemsData.push({ itemIn: "", serialIn: "", itemOut: "", serialOut: "" });
    activeRowIndex = savedItemsData.length - 1;
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

function expandReportTextarea(el) {
    el.classList.add("expanded");
}

function shrinkReportTextarea(el) {
    if (!el.value.trim()) {
        el.classList.remove("expanded");
    }
}

// File Upload & Preview Support All File Types (Image, Video, Audio)
function triggerFileInput(id) {
    document.getElementById(id).click();
}

function handleFileChange(event, targetPreviewId, category) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const container = document.getElementById(targetPreviewId);
    
    // Clear container if first upload or append previews
    if ((category === 'before' && uploadedFilesBefore.length === 0) || 
        (category === 'after' && uploadedFilesAfter.length === 0)) {
        container.innerHTML = "";
    }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = e.target.result;
            const mimeType = file.type;

            // Push file object into respective array
            if (category === 'before') {
                uploadedFilesBefore.push({ data: fileData, type: mimeType, name: file.name });
            } else {
                uploadedFilesAfter.push({ data: fileData, type: mimeType, name: file.name });
            }

            // Create thumbnail element
            const thumb = document.createElement("div");
            thumb.className = "preview-thumbnail";
            thumb.style.cssText = "display:inline-block; width:45px; height:45px; margin:2px; border-radius:6px; overflow:hidden; position:relative;";

            if (mimeType.startsWith("image/")) {
                thumb.innerHTML = `<img src="${fileData}" style="width:100%; height:100%; object-fit:cover;" onclick="openImagePreview('${fileData}', 'image', event)" />`;
            } else if (mimeType.startsWith("video/")) {
                thumb.innerHTML = `<video src="${fileData}" style="width:100%; height:100%; object-fit:cover;" onclick="openImagePreview('${fileData}', 'video', event)"></video>`;
            } else {
                thumb.innerHTML = `<div onclick="openImagePreview('${fileData}', 'file', event)" style="background:#ccc; text-align:center; height:100%;">📁</div>`;
            }

            container.appendChild(thumb);
        };
        reader.readAsDataURL(file);
    });
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

// Submission 
async function submitWorkAndRefresh(e) {
    if (e) e.preventDefault();

    const taskVal = document.getElementById("task").value.trim();
    if (!taskVal) {
        alert("Sila isi ruangan Task terlebih dahulu!");
        return;
    }

    if (selectedPics.length === 0) {
        alert("Sila pilih sekurang-kurangnya seorang PIC!");
        return;
    }

    const trainsFormatted = selectedTrains.map(t => `${t.train}:${t.coach}`).join(",");
    
    const data = {
        team: localStorage.getItem("team") || "Team 1",
        task: taskVal,
        date: document.getElementById("date").value,
        savedItems: savedItemsData,
        pic: selectedPics.join(", "),
        trains: trainsFormatted,
        findingProblem: document.getElementById("findingProblem").value,
        troubleshootMethod: document.getElementById("troubleshootMethod").value,
        // Send array as JSON string
        fileBefore: JSON.stringify(uploadedFilesBefore),
        fileAfter: JSON.stringify(uploadedFilesAfter)
    };

    try {
        const res = await fetch("/api/workcontent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
            alert(result.message || "Data successfully saved!");
            
            document.getElementById("workContentForm").reset();
            savedItemsData = [];
            selectedTrains = [];
            selectedPics = [];
            uploadedFilesBefore = [];
            uploadedFilesAfter = [];
            currentDraftData = { itemIn: "", serialIn: "", itemOut: "", serialOut: "" };
            activeRowIndex = 0;
            
            document.getElementById("previewBefore").innerHTML = '<div class="plus-icon">+</div><small>Add File</small>';
            document.getElementById("previewAfter").innerHTML = '<div class="plus-icon">+</div><small>Add File</small>';
            
            renderSelectedTrains();
            renderRightTable();
            loadFormData();
            loadStats();
        } else {
            alert("Ralat menyimpan data: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Error saving data:", err);
        alert("Gagal menghantar data ke server.");
    }
}

document.addEventListener("DOMContentLoaded", ()=>{
    loadStats();
    loadFormData();
    initTrainSelector();
    renderRightTable();
});