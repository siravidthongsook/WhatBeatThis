document.addEventListener('DOMContentLoaded', () => {
    const startContainer = document.getElementById('start-container');
    const startForm = document.getElementById('start-form');
    const playerNameInput = document.getElementById('player-name-input');
    const startButton = document.getElementById('start-button');

    const gameForm = document.getElementById('game-form');
    const gameInput = document.getElementById('game-input');
    const gameSubmitButton = document.getElementById('game-submit-button');
    const monitorDisplay = document.getElementById('monitor-display');

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
        playCreatingAnimation();
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

    // helper: show loading animation then demo answer
    function playDemoLoadingAndAnswer(guess) {
        if (!monitorDisplay) return;
        // temporarily store old content
        const oldContent = monitorDisplay.innerHTML;
        monitorDisplay.innerHTML = '<div class="monitor-answer answer-loading">Retrieving Your Answer</br>Please wait....</div>';

        // after 5 seconds show demo answer
        setTimeout(() => {
            monitorDisplay.innerHTML = `<div class="monitor-answer">${guess} 🤜 the computer! ✅</div>`;

            // revert to old content after 4s so demo doesn't persist forever
            setTimeout(() => {
                monitorDisplay.innerHTML = oldContent;
            }, 4000);
        }, 2000);
    }

    // helper: show create room animation
    function playCreatingAnimation() {
        if (!monitorDisplay) return;
        const oldContent = monitorDisplay.innerHTML;
        monitorDisplay.innerHTML = '<div class="monitor-answer answer-loading">Creating a room for you</br>Please wait....</div>';
        
        // disable input during this time
        gameForm.classList.add('disabled');
        gameInput.disabled = true;
        gameSubmitButton.disabled = true;

        
        // after 3 seconds revert to old content
        setTimeout(() => {
            gameForm.classList.remove('disabled');
            gameInput.disabled = false;
            gameSubmitButton.disabled = false;
            monitorDisplay.innerHTML = oldContent;
        }, 3000);
    }

    // Handle game form submission
    gameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const guess = gameInput.value.trim();

        if (guess) {
                // duplicate guess: play demo loading animation and show answer
            playDemoLoadingAndAnswer(guess);
            
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