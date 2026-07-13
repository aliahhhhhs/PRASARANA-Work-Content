function selectTeam(team) {
    localStorage.setItem("team", team);

setTimeout(() => {
    window.location.href = "login.html";
}, 500);
}
