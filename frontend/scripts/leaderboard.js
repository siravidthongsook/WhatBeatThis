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
    leaderboardContainer.style.opacity = "0";
    leaderboardContainer.style.display = "block";
    leaderboardContainer.style.transition = "opacity 0.2s ease-in-out";
    setTimeout(() => {
        leaderboardContainer.style.opacity = "1";
        mainContainer.style.filter = "blur(4px)";
        mainContainer.style.opacity = "0.7";
        mainContainer.style.transition = "opacity 0.4s ease-in-out";
    }, 10);
    leaderboardToggle.checked = true;
}

function hideLeaderboardModal() {
    leaderboardContainer.style.opacity = "0";
    setTimeout(() => {
        leaderboardContainer.style.display = "none";
    }, 205);
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