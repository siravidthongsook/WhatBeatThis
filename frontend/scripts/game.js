document.addEventListener('DOMContentLoaded', () => {
    const startContainer = document.getElementById('start-container');
    const startForm = document.getElementById('start-form');
    const playerNameInput = document.getElementById('player-name-input');
    const startButton = document.getElementById('start-button');

    const gameForm = document.getElementById('game-form');
    const gameInput = document.getElementById('game-input');
    const gameSubmitButton = document.getElementById('game-submit-button');
    const monitorDisplay = document.getElementById('monitor-display');

    const answerReasonContainer = document.getElementById('answer-reason-container');

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

    startForm.addEventListener('submit', (event) => {
        event.preventDefault();
        let playerName = playerNameInput.value.trim();


        if (!playerName || playerName.length === 0) {
            playerName = 'Guest';
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

    gameInput.addEventListener('input', () => {
        clearInputError();
    });

    // helper: show loading animation and submit answer to backend
    async function submitGuess(guess) {
        // safeguard
        if (!monitorDisplay) return;
        // remove input placeholder
        gameInput.placeholder = '';

        // temporarily store old content
        const oldContent = monitorDisplay.innerHTML;
        monitorDisplay.innerHTML = '<div class="monitor-answer answer-loading">Retrieving Your Answer</br>Please wait....</div>';


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

            showAnswerReason(data.reason, !data.beats);
            if (data.beats) {
                // display result
                // show play next round button
                monitorDisplay.innerHTML = `
                <div class="monitor-answer">
                    <p>
                        ${userGuess} 🤜 the ${currentSubject} !
                    </p>    
                    
                    <button id="next-round-button" class="next-round-button">Next Round ▶️</button>
                </div>`;

                const nextRoundButton = document.getElementById('next-round-button');
                if (nextRoundButton) {
                    nextRoundButton.addEventListener('click', () => {
                        playNextRound();
                    });
                }
            }
            else {
                answerReasonContainer.classList.add('wrong-answer');
                monitorDisplay.innerHTML = `<div class="monitor-answer">${userGuess} does not beat the ${currentSubject} ! ❌</div>`;
                // TODO: add a play again button
            }
        }
        catch (error) {
            console.error('Error fetching answer:', error);
            monitorDisplay.innerHTML = `<div class="monitor-answer">Error retrieving answer. </br>Please try again. </br>what beats ${oldContent}</div>`;
            return;
        }
        disableGameInput();
    }

    function hideAnswerReason() {
        answerReasonContainer.innerHTML = '';
        answerReasonContainer.style.display = 'none';
        answerReasonContainer.classList.remove('wrong-answer');
    }

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
        monitorDisplay.innerHTML = `<span class="">${currentSubject}</span>`;
    }

    // helper: create room and show creating animation
    async function createRoom() {
        if (!monitorDisplay) return;
        const oldContent = monitorDisplay.innerHTML;
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
            monitorDisplay.innerHTML = oldContent
        }
        catch (error) {
            console.error('Error creating room:', error);
            monitorDisplay.innerHTML = `<div class="monitor-answer">Error creating room. Please try again.</div>`;
        }

        // re-enable input
        enableGameInput();
        monitorDisplay.innerHTML = oldContent;
        
        // initialize game variable
        sessionStorage.setItem('gameStarted', 'true');
        sessionStorage.setItem('currentSubject', "computer");

        // focus input
        gameInput.focus();
    }

    // Handle game form submission
    gameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const guess = gameInput.value.trim();

        if (guess) {
            submitGuess(guess);
            
        } else {
            // make the box shake to indicate error
            if (!gameInput) return;

            // restart animation if already present
            gameForm.classList.remove('input-error');
            // force reflow
            void gameForm.offsetWidth;
            gameForm.classList.add('input-error');
            gameInput.focus();
            return;
        }

        clearInputError();
        gameInput.value = '';
        gameInput.focus();


    });
});