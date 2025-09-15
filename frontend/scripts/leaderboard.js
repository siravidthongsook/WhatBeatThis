let cacheLeaderboardData = [];

const body = document.body;
const mainContainer = document.getElementById("main-container");
const leaderboardContainer = document.getElementById("leaderboard-container");
const leaderboardTable = document.getElementById("leaderboard-table");
const leaderboardToggle = document.getElementById("leaderboard-toggle");
const leaderboardClose = document.getElementById("leaderboard-close");
const leaderboardRefresh = document.getElementById("leaderboard-refresh");

// Modal interaction

function renderLeaderboardTable(data) {
    leaderboardTable.innerHTML = '';

    // if no data
    if (data.length === 0) {
        leaderboardTable.innerHTML = '<div class="leaderboard-no-data">No leaderboard data available.</div>';
        return;
    }
    
    // render table header
    const header = document.createElement('thead');
    header.innerHTML = `
        <tr>
            <th>#</th>
            <th>Player</th>
            <th>Score</th>
        </tr>
    `;
    leaderboardTable.appendChild(header);
    data.forEach(({ playerName, score }, index) => {
        const row = document.createElement('tbody');
        row.innerHTML = `
            <tr>
                <td>${index + 1}</td>
                <td>${playerName}</td>
                <td>${score}</td>
            </tr>
        `;
        leaderboardTable.appendChild(row);
    });
}

function fetchAndRenderLeaderboard(force = false) {
    leaderboardTable.innerHTML = '<div class="loading">Loading...</div>';
    fetchLeaderboardApi(100)
        .then(response => response.json())
        .then(data => {
            renderLeaderboardTable(data);
            cacheLeaderboardData = data;
        })
        .catch(error => {
            console.error("Error fetching leaderboard data:", error);
            leaderboardTable.innerHTML = '<div class="error">Failed to load leaderboard</div>';
        });
}

function showLeaderboardModal() {
    leaderboardContainer.style.opacity = "1";
    leaderboardContainer.style.visibility = "visible";
    mainContainer.style.filter = "blur(4px)";
    mainContainer.style.opacity = "0.7";
    leaderboardToggle.checked = true;

    // if we have cached data, use it
    if (cacheLeaderboardData.length > 0) {
        renderLeaderboardTable(cacheLeaderboardData);
        return;
    }
    // fetch real leaderboard data from backend
    fetchAndRenderLeaderboard();
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

leaderboardRefresh.addEventListener("click", function() {
    cacheLeaderboardData = [];
    fetchAndRenderLeaderboard(true);
});

body.addEventListener("click", (event) => {
    if (
        leaderboardContainer.contains(event.target) ||
        event.target === leaderboardToggle
    ) return;
    if (leaderboardToggle.checked) hideLeaderboardModal();
});