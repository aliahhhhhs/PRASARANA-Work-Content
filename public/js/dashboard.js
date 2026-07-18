// Memaparkan nama pasukan (team) pada komponen dashboard
const team = localStorage.getItem("team");
document.getElementById("teamName").innerText = team || "No Team Selected";
if(document.getElementById("teamDisplay")) {
    document.getElementById("teamDisplay").innerText = "Team: " + (team || "None");
}

let selectedTrains = [];

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
        // Nyahpilih
        selectedTrains.splice(index, 1);
        btn.style.background = "#f8fafc";
        btn.style.color = "#000";
        btn.style.borderColor = "#ccc";
    } else {
        // Pilih
        selectedTrains.push(num);
        btn.style.background = "#c8102e";
        btn.style.color = "white";
        btn.style.borderColor = "#c8102e";
    }
    renderSelectedTrains();
}

// Papar Train ID Terpilih dalam Bentuk Bulat (Bulatan Merah Kemas)
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
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();

    document.getElementById("totalWeek").innerText = data.totalWeek;
    document.getElementById("totalMonth").innerText = data.totalMonth;
}

// Load senarai items & PIC daripada backend ke dalam elemen input form
async function loadFormData() {
    if (!document.getElementById("itemsList")) return;

    // Load Items
    const itemsRes = await fetch("/api/items");
    const items = await itemsRes.json();
    const datalist = document.getElementById("itemsList");
    if (datalist){
        datalist.innerHTML = ""; // Bersihkan list lama jika ada
        items.forEach(i => {
            let option = document.createElement("option");
            option.value = i.item_name;
            datalist.appendChild(option);
    });
    }
    
    // Load PIC
    let currentTeam = localStorage.getItem("team") || "Team 1"; // take the active team
    currentTeam = currentTeam.replace(/['"`]+/g,'').trim();

    const picRes = await fetch(`/api/pic?team=${encodeURIComponent(currentTeam)}`);
    const pic = await picRes.json();
    const picSelect = document.getElementById("pic");
    
    if (picSelect){
        picSelect.innerHTML = '<option value="">All PIC</option>' // Reset option asal
        if (Array.isArray(pic)) {
        pic.forEach(p => {
            let option = document.createElement("option");
            option.value = p.name;
            option.innerText = p.name;
            picSelect.appendChild(option);
            });
        }
    }
}

// Fungsi hantar data kerja baru dan terus kemaskini statistik dashboard
async function submitWorkAndRefresh(e) {
    if (e) e.preventDefault();
    const data = {
        team: localStorage.getItem("team"),
        task: document.getElementById("task").value,
        date: document.getElementById("date").value,
        item: document.getElementById("itemInput").value,
        serial: document.getElementById("serial").value,
        pic: document.getElementById("pic").value,
        trains: selectedTrains.join(",")
    };

    if(!data.task || !data.item || !data.pic){
        alert("Please fill the Task, Items, and PIC!");
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
    
    // Reset Form After Saved //
    document.getElementById("task").value = "";
    document.getElementById("itemInput").value = "";
    document.getElementById("serial").value = "";

    // Reset status Train ID
    selectedTrains = [];
    renderSelectedTrains();
    initTrainSelector();

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
});
