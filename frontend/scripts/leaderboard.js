const mockLeaderboardData = [
    { rank: 1, username: "Alice", score: 1500 },
    { rank: 2, username: "Bob", score: 1200 },
    { rank: 3, username: "Charlie", score: 1000 },
    { rank: 4, username: "David", score: 800 },
    { rank: 5, username: "Eve", score: 600 },
];

const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardTable = document.getElementById("leaderboard-table");
const leaderboardToggle = document.getElementById("leaderboard-toggle");
const leaderboardClose = document.getElementById("leaderboard-close");

// Modal interaction
leaderboardToggle.addEventListener("click", (event) => {
    console.log(event.target.checked);
    if (event.target.checked) {
        leaderboardContainer.style.display = "block";
    } else {
        leaderboardContainer.style.display = "none";
    }
})

leaderboardClose.addEventListener("click", () => {
    leaderboardContainer.style.display = "none";
    leaderboardToggle.checked = false;
})