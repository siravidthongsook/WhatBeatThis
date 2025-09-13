const mockLeaderboardData = [
    { rank: 1, username: "Alice", score: 1500 },
    { rank: 2, username: "Bob", score: 1200 },
    { rank: 3, username: "Charlie", score: 1000 },
    { rank: 4, username: "David", score: 800 },
    { rank: 5, username: "Eve", score: 600 },
];

const body = document.body;
const mainContainer = document.getElementById("main-container");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardTable = document.getElementById("leaderboard-table");
const leaderboardToggle = document.getElementById("leaderboard-toggle");
const leaderboardClose = document.getElementById("leaderboard-close");

// Modal interaction

function showLeaderboardModal() {
    leaderboardContainer.style.opacity = "1";
    leaderboardContainer.style.visibility = "visible";
    mainContainer.style.filter = "blur(4px)";
    mainContainer.style.opacity = "0.7";
    leaderboardToggle.checked = true;
}

// set Default leaderboard style
leaderboardContainer.style.opacity = "0";
leaderboardContainer.style.visibility = "hidden";

// set Default main container style
mainContainer.style.opacity = "1";

function hideLeaderboardModal() {
    leaderboardContainer.style.opacity = "0";
    leaderboardContainer.style.visibility = "hidden";
    mainContainer.style.filter = "none";
    mainContainer.style.opacity = "1";
    leaderboardToggle.checked = false;
}

leaderboardToggle.addEventListener("click", (event) => {
    event.target.checked ? showLeaderboardModal() : hideLeaderboardModal();
});

leaderboardClose.addEventListener("click", hideLeaderboardModal);

body.addEventListener("click", (event) => {
    if (
        leaderboardContainer.contains(event.target) ||
        event.target === leaderboardToggle
    ) return;
    if (leaderboardToggle.checked) hideLeaderboardModal();
});