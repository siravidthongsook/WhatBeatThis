document.addEventListener('DOMContentLoaded', () => {
    const startContainer = document.getElementById('start-container');
    const startForm = document.getElementById('start-form');
    const playerNameInput = document.getElementById('player-name-input');
    const startButton = document.getElementById('start-button');

    const gameForm = document.getElementById('game-form');
    const gameInput = document.getElementById('game-input');
    const gameSubmitButton = document.getElementById('game-submit-button');

    const gameHeader = document.getElementById('game-header');
    const monitorDisplay = document.getElementById('monitor-display');

    const answerReasonContainer = document.getElementById('answer-reason-container');

    const playAgainButtonContent = `
    <div class="replay-button-container">
        <button id="replay-button" class="replay-button" title="Play Again 🔄">Play Again 🔄</button>
    </div>`

    const endGamePlayAgainButtonContent = `
    <div style="margin-top: 16px; display: flex; justify-content: center;">
        <button id="play-again-btn" style="
            padding: 10px 24px;
            font-size: 1.1rem;
            border-radius: 8px;
            border: none;
            background: #eaeaea;
            color: #222;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: background 0.2s, color 0.2s;
        ">
            Play again 🔄 
        </button>
    </div>`

    function getScoreTag() {
        const score = sessionStorage.getItem('score') || '0';
        return `<div class="score-display">Score: ${score}</div>`;
    }

    // Close the start modal
    function closeStartModal() {
        startContainer.style.opacity = '0';
        startContainer.style.visibility = 'hidden';
    }
    
    // Handle start form submission
    // listen to enter key on player name input to submit form
    function listenToEnterKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            startButton.click();
        }
    }
    document.addEventListener('keydown', listenToEnterKey);

    // clear player name error when user types
    if (playerNameInput) {
        playerNameInput.addEventListener('input', () => {
            playerNameInput.classList.remove('input-error');
            // force reflow to allow animation to be re-added next time
            void playerNameInput.offsetWidth;
        });
    }

    startForm.addEventListener('submit', (event) => {
        event.preventDefault();
        let playerName = playerNameInput.value.trim();

        if (!playerName || playerName.length === 0) {
            playerName = 'Guest';
        }
        if (playerName.length > 20){
            // show shake on the player name input and refuse to submit
            shakePlayerNameInput();
            playerNameInput.focus();
            return; // prevent continuing with invalid name
        }

        closeStartModal();
        document.removeEventListener('keydown', listenToEnterKey);
        gameInput.focus();
        sessionStorage.setItem('playerName', playerName);
        createRoom();
    });

    // remove error state when user types
    function clearInputError() {
        if (!gameInput) return;
        gameForm.classList.remove('input-error');
        // force reflow to allow animation to be re-added next time
        void gameForm.offsetWidth;
    }

    function shakePlayerNameInput() {
        if (!playerNameInput) return;
        // remove then re-add class to restart animation
        playerNameInput.classList.remove('input-error');
        // force reflow
        void playerNameInput.offsetWidth;
        playerNameInput.classList.add('input-error');
    }

    gameInput.addEventListener('input', () => {
        clearInputError();
    });

    // helper: show loading animation and submit answer to backend
    async function submitGuess(guess) {
        // safeguard
        if (!monitorDisplay) return;
        // remove input placeholder
        gameInput.placeholder = '';

        monitorDisplay.innerHTML = '<div class="monitor-answer answer-loading">Retrieving Your Answer</br>Please wait....</div>';

        function repeatWordCase() {
            monitorDisplay.innerHTML = `<div class="monitor-answer"><strong class="dynamic-text">${guess}</strong> has already been used in this game. ${endGamePlayAgainButtonContent}</div>`;
            showAnswerReason(`The word "${guess}" has already been used in this game.`, true);
            disableGameInput();
            const replayButton = document.getElementById('play-again-btn');
            if (replayButton) {
                replayButton.addEventListener('click', () => {
                    resetGame();
                });
            }
            // adjust font-size for long guess
            adjustDynamicTextFont();
        }

        // check guess

        const response = await getAnswerApi(guess)
        try {
            if (!response.ok) throw new Error('Failed to get answer');
            // data Schema: { user_guess: string, beats: boolean, reason: string }
            const data = await response.json();
            console.log('Received answer data:', data);

            // store to variable before updating
            const currentSubject = sessionStorage.getItem('currentSubject') || "UNKNOWN [BUG]";
            // make user input subject a new current subject
            sessionStorage.setItem('currentSubject', data.user_guess)
            
            const userGuess = String(data.user_guess).trim();
            // capitalize first letter
            const capitalizedUserGuess = userGuess.charAt(0).toUpperCase() + userGuess.slice(1);
            const capitalizedCurrentSubject = currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1);

            // store emoji
            const emoji = data.user_guess_emoji || "❓";
            sessionStorage.setItem('emoji', emoji);

            showAnswerReason(data.reason, !data.beats);
            // show guessed-word meta message if present
            if (data.guess_message) {
                const metaNode = document.createElement('div');
                metaNode.className = 'guess-meta';
                metaNode.style.marginTop = '8px';
                metaNode.style.fontSize = '0.87rem';
                metaNode.style.color = '#00001e';
                metaNode.innerText = data.guess_message;
                answerReasonContainer.appendChild(metaNode);
            }
            if (data.beats) {
                // increment score
                let score = parseInt(sessionStorage.getItem('score') || '0', 10);
                score += 1;
                sessionStorage.setItem('score', score.toString());
                
                // display result
                // show play next round button
                monitorDisplay.innerHTML = `
                <div class="monitor-answer answer-static">
                    ${playAgainButtonContent}
                    ${getScoreTag()}
                    <p>
                        <span class="dynamic-text">${capitalizedUserGuess}</span> 🤜 <span class="dynamic-text">${capitalizedCurrentSubject}</span> !
                    </p>
                    
                    <button id="next-round-button" class="next-round-button">Continue ▶️</button>
                </div>`;

                // adjust font-size for dynamic text elements to fit the monitor
                adjustDynamicTextFont();

                const nextRoundButton = document.getElementById('next-round-button');
                if (nextRoundButton) {
                    nextRoundButton.addEventListener('click', () => {
                        playNextRound();
                    });
                }
                const replayButton = document.getElementById('replay-button');
                if (replayButton) {
                    replayButton.addEventListener('click', () => {
                        resetGame();
                    });
                }
            }
            else if (data.is_repeat_guess) {
                repeatWordCase();
            }
            else {
                answerReasonContainer.classList.add('wrong-answer');
                monitorDisplay.innerHTML = `
                    ${getScoreTag()}
                    <div class="monitor-answer answer-static">
                        <span class="dynamic-text">${userGuess}</span> does not beat <span class="dynamic-text">${currentSubject} ❌</span><br>
                        The game is over
                        <div style="margin-top: 10px; font-size: 1.2rem;">Final Score: ${sessionStorage.getItem('score') || '0'}</div>
                        ${endGamePlayAgainButtonContent}
                    </div>
                `;

                // adjust dynamic text sizing for long strings
                adjustDynamicTextFont();

                const playAgainBtn = document.getElementById('play-again-btn');
                if (playAgainBtn) {
                    playAgainBtn.addEventListener('click', () => {
                        resetGame();
                    });
                }
                const replayButton = document.getElementById('replay-button');
                if (replayButton) {
                    replayButton.addEventListener('click', () => {
                        resetGame();
                    });
                }
            }
        }
        catch (error) {
            // word already used error
            if (response.status === 400) {
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error && errorData.error.code === "WORD_ALREADY_USED") {
                        // end the game
                        repeatWordCase();
                        return;
                    }
                    if (errorData && errorData.error && errorData.error.code === "GUESS_INVALID") {
                        // handle guess invalid error
                        shakeInputError();
                        const currentSubject = sessionStorage.getItem('currentSubject') || "UNKNOWN [BUG]";
                        const emoji = sessionStorage.getItem('emoji') || "❓";
                        const newContent = `<span class="emoji">${emoji}</span>`;
                        monitorDisplay.innerHTML = `<div class="monitor-answer dynamic-text">Guess length is invalid. Please try again. shorter</div>`;
                        adjustDynamicTextFont();
                        setTimeout(() => { monitorDisplay.innerHTML = newContent; adjustDynamicTextFont(); }, 3000);
                        return;
                    }
                } catch (jsonError) {
                    console.error('Error parsing JSON for WORD_ALREADY_USED:', jsonError);
                }
            }
            // generic error message
            console.error('Error fetching answer:', error);
            monitorDisplay.innerHTML = `<div class="monitor-answer">Error retrieving answer. </br>Please try again. </br>what beats ${currentSubject}${emoji}?</div>`;
            return;
        }
        disableGameInput();
    }

    function hideAnswerReason() {
        answerReasonContainer.innerHTML = '';
        answerReasonContainer.style.display = 'none';
        answerReasonContainer.classList.remove('wrong-answer');
    }

    // Adjust font-size of elements with .dynamic-text so long strings shrink to fit the monitor
    function adjustDynamicTextFont() {
        if (!monitorDisplay) return;
        // pick all dynamic-text elements inside monitorDisplay
        const elems = monitorDisplay.querySelectorAll('.dynamic-text');
        if (!elems || elems.length === 0) return;

        // Determine available width inside monitor (subtract some padding)
        const containerWidth = monitorDisplay.clientWidth * 0.9; // use 90% to leave margins

        elems.forEach(el => {
            // reset to default so we can measure natural size
            el.style.fontSize = '';
            el.style.whiteSpace = 'normal';

            // start from a default size and shrink until it fits or reaches min size
            const maxSize = 32; // px
            const minSize = 12; // px
            let size = Math.min(maxSize, Math.max(16, Math.floor(maxSize - el.textContent.length / 2)));

            el.style.fontSize = size + 'px';

            // reduce until width is below containerWidth or reach minSize
            while (el.scrollWidth > containerWidth && size > minSize) {
                size -= 1;
                el.style.fontSize = size + 'px';
                // break if it's very small
                if (size <= minSize) break;
            }
        });
    }

    // Recompute sizing when the window changes size
    window.addEventListener('resize', () => {
        // debounce a little to avoid thrash
        setTimeout(adjustDynamicTextFont, 80);
    });

    function showAnswerReason(reason, wrong = false) {
        if (wrong) answerReasonContainer.classList.add('wrong-answer');
        else answerReasonContainer.classList.remove('wrong-answer');
        answerReasonContainer.innerHTML = `<span id="answer-reason">${reason}</span>`;
        answerReasonContainer.style.display = 'block';
    }
    
    function disableGameInput() {
        gameForm.classList.add('disabled');
        gameInput.disabled = true;
        gameSubmitButton.disabled = true;
    }
    
    function enableGameInput() {
        gameForm.classList.remove('disabled');
        gameInput.disabled = false;
        gameSubmitButton.disabled = false;
    }
    
    function playNextRound() {
        enableGameInput();
        hideAnswerReason();
        
        const currentSubject = sessionStorage.getItem('currentSubject') || "UNKNOWN [BUG]";
        const emoji = sessionStorage.getItem('emoji') || "❓";
        monitorDisplay.innerHTML = `${getScoreTag()} ${playAgainButtonContent} <span class="emoji">${emoji}</span>`;
        gameHeader.innerText = `What beats ${currentSubject.toLowerCase()}?`;
        gameInput.value = '';
        gameInput.focus();
    }

    async function resetGame() {
        // delete room from backend
        await deleteRoomApi();

        // clear session storage
        sessionStorage.removeItem('roomId');
        sessionStorage.removeItem('currentSubject');
        sessionStorage.removeItem('emoji');
        sessionStorage.removeItem('gameStarted');

        // reset UI
        hideAnswerReason();

        // reset game header
        gameHeader.innerText = `What beats computer?`;
        
        // reset input
        gameInput.value = '';
        gameInput.placeholder = 'Water';
        
        // create room
        createRoom();
    }


    // helper: create room and show creating animation
    async function createRoom() {
        if (!monitorDisplay) return;
        monitorDisplay.innerHTML = '<div class="monitor-answer answer-loading">Creating a room for you</br>Please wait....</div>';
        
        // disable input during this time
        disableGameInput();

        const response = await createRoomApi();
        try {
            if (!response.ok) throw new Error('Failed to create room');
            const data = await response.json();
            const roomId = data.roomId;
            console.log('Creating room successfully, Room ID:', roomId);
            sessionStorage.setItem('roomId', roomId);
            monitorDisplay.innerHTML = newContent
        }
        catch (error) {
            console.error('Error creating room:', error);
            monitorDisplay.innerHTML = `<div class="monitor-answer">Error creating room. Please try again.</div>`;
        }

        // re-enable input
        enableGameInput();
        monitorDisplay.innerHTML = '<span class="emoji">💻</span>';

        // initialize game variables
        sessionStorage.setItem('gameStarted', 'true');
        sessionStorage.setItem('currentSubject', "computer");
        sessionStorage.setItem('score', '0');
        sessionStorage.setItem('emoji', '💻');

        // focus input
        gameInput.focus();
    }

    function shakeInputError() {
        // make the box shake to indicate error
        if (!gameInput) return;

        // restart animation if already present
        gameForm.classList.remove('input-error');
        // force reflow
        void gameForm.offsetWidth;
        gameForm.classList.add('input-error');
        gameInput.focus();
    }

    // Handle game form submission
    gameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const guess = gameInput.value.trim();

        // defocus gameInput
        if (gameInput) {
            // Try to blur immediately (hides keyboard on most devices)
            try { gameInput.blur(); } catch (e) {}

            // Some mobile browsers re-open the keyboard when the element regains focus.
            // Use a short delayed blur and a temporary readonly trick to ensure the keyboard stays hidden.
            setTimeout(() => {
            try {
                gameInput.blur();
                // temporary readonly helps on some Android versions
                gameInput.setAttribute('readonly', 'readonly');
                // also blur the active element if something else got focus
                if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
                }
                setTimeout(() => gameInput.removeAttribute('readonly'), 100);
            } catch (e) {}
            }, 50);

            // If later code focuses the input (this file does), force-hide again after that focus
            setTimeout(() => { try { gameInput.blur(); } catch (e) {} }, 250);
        }

        if (guess) {
            submitGuess(guess);
            
        } else {
            shakeInputError();
            return;
        }

        clearInputError();
        gameInput.value = '';
        gameInput.focus();


    });
});