
const team = localStorage.getItem("team");
if(document.getElementById("teamDisplay")) {
document.getElementById("teamDisplay").innerText = "Team: " + (team || "None");
}

// set today date automatically
document.getElementById("date").valueAsDate = new Date();

// load items + PIC from backend
async function loadData() {
    const itemsRes = await fetch("/api/items");
    const items = await itemsRes.json();

    const datalist = document.getElementById("itemsList");

    items.forEach(i => {
        let option = document.createElement("option")
        option.value = i.item_name;
        datalist.appendChild(option);
    });

    const picRes = await fetch ("/api/pic");
    const pic = await picRes.json();

    const picSelect = document.getElementById("pic");
    pic.forEach(p => {
        let option = document.createElement("option");
        option.value = p.name;
        option.innerText = p.name;
        picSelect.appendChild(option);
    });
}

loadData();

// submit
async function submitWork() {
    const data = {
        team: localStorage.getItem("team"),
        task: document.getElementById("task").value,
        date: document.getElementById("date").value,
        item: document.getElementById("itemInput").value,
        serial: document.getElementById("serial").value,
        pic: document.getElementById("pic").value
    };

    const res = await fetch("/api/workcontent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);
}

router.get("/stats", (req, res) => {
    db.get("SELECT COUNT (*) as total FROM work_content", (err, total) =>{
                res.json({
                    total: total.total
                });
            });
        });