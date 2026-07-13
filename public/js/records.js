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
                option.value = p.name;
                option.innerText = p.name;
                picSelect.appendChild(option);
                });
            }
        }
    } catch (err) {
        console.error("Failed to populate PIC drop-down component:", err);
    }
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
                option.value = i.item_name;
                option.innerText = i.item_name;
                itemSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error("Failed to Add Items:", err);
    }
}

async function loadRecords() {
    try {
        const res = await fetch("/api/workcontent");
        let data = await res.json();

        let isAdmin = false;
        try {
            const userRes = await fetch("/api/auth/me");
            if (userRes.ok) {
                const currentUser = await userRes.json();
                isAdmin = currentUser && (currentUser.username === "SayaAdmin1" || currentUser.username === "SayaAdmin2");
            }
        } catch (e) {
            console.warn("API Auth Me belum aktif, default ke non-admin");
        }

        const team = document.getElementById("filterTeam").value;
        const pic = document.getElementById("filterPIC").value;
        const item = document.getElementById("filterItem").value;

        if (team && team.trim() !== "") {
            data = data.filter(r => r.team === team);
        }
        if (pic && pic.trim() !== "") {
            data = data.filter(r => r.pic === pic);
        }
        if (item && item.trim() !== "") {
            data = data.filter(r => r.item === item);
        }

        // Semakan range tarikh flatpickr
        if (selectedStartDate && selectedEndDate) {
            data = data.filter(r => r.date >= selectedStartDate && r.date <= selectedEndDate);
        }

        const totalCountElement = document.getElementById("totalRecordsCount");
        if (totalCountElement) {
            totalCountElement.innerHTML = data.length;
        }

        const table = document.getElementById("tableBody");
        if (!table) return;
        table.innerHTML = "";

        if (data.length === 0) {
            table.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 15px;">Tiada rekod dijumpai.</td></tr>`;
            return;
        }

        data.forEach(row => {
            const tr = document.createElement("tr");
            
            let actionButtons = `<em>No Access</em>`;
            if (isAdmin) {
                actionButtons = `
                <button class="edit" onclick="editRecord(${row.id}, '${row.task || ''}', '${row.date || ''}', '${row.item || ''}', '${row.serial || ''}', '${row.trains || ''}', '${row.pic || ''}')">Edit</button>
                <button class="delete" onclick="deleteRecord(${row.id})">Delete</button>`;
            }

            // Membina paparan bulat mini yang cantik untuk Train ID dalam lajur jadual
            let trainsHTML = "-";
            if (row.trains && row.trains.trim() !== "") {
                trainsHTML = `<div style="display: flex; flex-wrap: wrap; gap: 4px; max-width: 180px;">`;
                row.trains.split(",").forEach(trainNum => {
                    if (trainNum.trim()) {
                        trainsHTML += `<span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #c8102e; color: white; font-weight: bold; font-size: 10px; font-family: sans-serif;">${trainNum.trim()}</span>`;
                    }
                });
                trainsHTML += `</div>`;
            }
            
            // Susunan td diselaraskan tepat dengan records.html yang baru ditambah lajur ID
            tr.innerHTML = `
            <td>${row.id}</td>
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
        });
    } catch (err) {
        console.error("Error loading records:", err);
    }
}

// Buka Modal Edit dan tetapkan nilai kosong mengikut lakaran
function editRecord(id, task, date, item, serial, trains, pic) {
    document.getElementById("editRecordId").value = id;
    
    document.getElementById("editTask").value = task || "";
    document.getElementById("editDate").value = date || "";
    document.getElementById("editItem").value = item || "";
    document.getElementById("editSerial").value = serial || "";
    document.getElementById("editTrains").value = trains || "";
    document.getElementById("editPic").value = pic || "";
    
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
}

// Hantar kemas kini rekod ke server
async function saveEditedRecord() {
    const id = document.getElementById("editRecordId").value;
    
    const data = {
        task: document.getElementById("editTask").value,
        date: document.getElementById("editDate").value,
        item: document.getElementById("editItem").value,
        serial: document.getElementById("editSerial").value,
        trains: document.getElementById("editTrains").value,
        pic: document.getElementById("editPic").value
    };

    try {
        const res = await fetch(`/api/workcontent/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (res.ok) {
            alert("Rekod berjaya dikemaskini!");
            closeEditModal();
            loadRecords();
        } else {
            alert("Ralat semasa menyimpan: " + result.message);
        }
    } catch (err) {
        console.error("Error updating record:", err);
    }
}

async function deleteRecord(id) {
    if(confirm("Confirm To Delete This Record?")) {
        await fetch("/api/workcontent/" + id, { method: "DELETE" });
        loadRecords();
    }
}

// Eksport Data Terpilih ke Excel (Termasuk Kolum Train ID)
function exportToExcel() {
    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");

    if (rows.length === 0 || (rows.length === 1 && rows[0].innerText.includes("Tiada rekod"))) {
        alert("Tiada data untuk dieksport!");
        return;
    }

    const excelData = [];
    excelData.push(["ID", "Team", "Task", "Date", "Item", "Serial", "Train ID(s)", "PIC"]);

    rows.forEach(row => {
        if (row.style.display !== "none") {
            const cells = row.querySelectorAll("td");
            
            // Ekstrak text nombor kereta sahaja (kerana lajur ini mengandungi elemen bulatan HTML)
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
                cells[0].innerText, // ID
                cells[1].innerText, // Team
                cells[2].innerText, // Task
                cells[3].innerText, // Date
                cells[4].innerText, // Item
                cells[5].innerText, // Serial
                trainText,          // Train ID
                cells[7].innerText  // PIC
            ]);
        }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records Data");

    let filename = "Work_Content_Records.xlsx";
    if (selectedStartDate && selectedEndDate) {
        filename = `Records_${selectedStartDate}_to_${selectedEndDate}.xlsx`;
    }

    XLSX.writeFile(workbook, filename);
}

document.getElementById("search").addEventListener("input", function (){
    let value = this.value.toLowerCase();
    let rows = document.querySelectorAll("#tableBody tr");
    rows.forEach(row =>{
        row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
});

// Takrifan pembolehubah julat tarikh global
let fpInstance = null;
let selectedStartDate = null;
let selectedEndDate = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadFilterOptions();
    await loadRecords();

    // Inisialisasi Flatpickr
    fpInstance = flatpickr("#filterDateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        onClose: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 2) {
                selectedStartDate = instance.formatDate(selectedDates[0], "Y-m-d");
                selectedEndDate = instance.formatDate(selectedDates[1], "Y-m-d");
            } else if (selectedDates.length === 0) {
                selectedStartDate = null;
                selectedEndDate = null;
            }
            loadRecords();
        }
    });

    // Event Listener untuk Butang Clear Penapis Keseluruhan
    const clearBtn = document.getElementById("clearDataBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            if (fpInstance) {
                fpInstance.clear();
            }
            selectedStartDate = null;
            selectedEndDate = null;
            
            document.getElementById("filterTeam").value = "";
            document.getElementById("filterItem").value = "";
            document.getElementById("filterPIC").value = "";
            document.getElementById("search").value = "";
            
            updatePicFilterOptions();
            loadRecords();
        });
    }

    document.getElementById("filterTeam").onchange = async function () {
        await updatePicFilterOptions();
        loadRecords();
    };

    document.getElementById("filterPIC").onchange = loadRecords;
    document.getElementById("filterItem").onchange = loadRecords;
});