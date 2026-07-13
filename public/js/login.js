async function login(){
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const selectedTeam = localStorage.getItem("team") || "";

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                username,
                password,
                team: selectedTeam
            })
        });

        const data = await response.json();
            
        if(data.success){

            Swal.fire({
                title: 'Login Success!!',
                text: 'Hello, Welcome!',
                icon: 'success',
                iconColor: '#d32f2f',
                confirmButtonText: 'Lesgo!!',
                confirmButtonColor: '#d32f2f',
                background: '#eee',
                backdrop:`rgba(0,0,0,.4) left top no-repeat`,
                customClass:{
                    popup: 'cute-popup-border'
                }
            }).then((result) =>{
                if (result.isConfirmed){
                    window.location.href = "dashboard.html";
                }
            });
        } else {
            // JIKA GAGAL: Paparkan mesej amaran ralat daripada backend
            Swal.fire({
                title: 'Login Gagal!',
                text: data.message || 'Sila semak semula username dan password anda.',
                icon: 'error',
                confirmButtonColor: '#d32f2f'
            });
        }
    } catch (error) {
        console.error("Error semasa login:", error);
        Swal.fire({
            title: 'Ralat Sistem!',
            text: 'Tidak dapat berhubung dengan pelayan.',
            icon: 'error',
            confirmButtonColor: '#d32f2f'
        });
    }
}

const team = localStorage.getItem("team");
if (document.getElementById("teamName")) {
    document.getElementById("teamName").innerText = team || "No Team Selected";
}