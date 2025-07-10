document.addEventListener('DOMContentLoaded', () => {
    const playerCountInput = document.getElementById('player-count');
    const startAssignmentBtn = document.getElementById('start-assignment-btn');
    const errorMessageElement = document.getElementById('error-message');
    const playerListUL = document.getElementById('player-list');
    const teamsDisplayDiv = document.getElementById('teams-display');
    const basketballElement = document.getElementById('basketball');
    const animationContainer = document.getElementById('animation-container');
    const resetBtn = document.getElementById('reset-btn');

    let playersInfo = []; // Stores {id, name, element, originalOrder}
    let teams = []; // Stores final team structures

    startAssignmentBtn.addEventListener('click', () => {
        resetState();
        const totalPlayers = parseInt(playerCountInput.value);

        if (isNaN(totalPlayers) || totalPlayers < 6) {
            errorMessageElement.textContent = 'Please enter a valid number of players (minimum 6).';
            return;
        }
        errorMessageElement.textContent = '';
        startAssignmentBtn.disabled = true; // Disable button during processing
        if(resetBtn) resetBtn.disabled = true;

        generatePlayers(totalPlayers);
        const teamConfigs = calculateTeamSizes(totalPlayers);
        if (!teamConfigs) { // Should theoretically not be hit for totalPlayers >= 6
            errorMessageElement.textContent = 'Error: Could not calculate team structure. Please try again.';
            startAssignmentBtn.disabled = false; // Re-enable if error
            if(resetBtn) resetBtn.disabled = false;
            return;
        }

        // Prepare players for assignment (shuffled)
        const playersToAssign = shuffleArray([...playersInfo]);
        prepareTeams(playersToAssign, teamConfigs);

        startAnimationSequence(); // This will re-enable buttons when done
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetState();
            playerCountInput.value = ''; // Clear input on explicit reset
        });
    }

    function resetState() {
        playersInfo = [];
        teams = [];
        playerListUL.innerHTML = '';
        teamsDisplayDiv.innerHTML = '';
        errorMessageElement.textContent = '';

        basketballElement.classList.remove('visible');
        basketballElement.style.left = '-60px';
        basketballElement.style.transform = 'translateY(-50%) rotate(0deg)';
        const basketballAirNozzle = basketballElement.querySelector('#air-nozzle');
        if (basketballAirNozzle) basketballAirNozzle.style.transform = 'rotate(0deg)';

        // Clear any highlights from player items
        document.querySelectorAll('#player-list li.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('#player-list li.assigned').forEach(el => el.classList.remove('assigned'));


        startAssignmentBtn.disabled = false; // Ensure start button is usable
        if(resetBtn) resetBtn.disabled = false; // Ensure reset button is usable
    }

    function generatePlayers(count) {
        for (let i = 0; i < count; i++) {
            // Store original order if needed later, though shuffling for assignment is key
            playersInfo.push({ id: i, name: `Player ${i + 1}`, element: null, originalOrder: i });
        }
        renderPlayerList();
    }

    function renderPlayerList() {
        playerListUL.innerHTML = '';
        playersInfo.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            li.dataset.playerId = player.id;
            li.classList.add('player-item');
            playerListUL.appendChild(li);
            player.element = li;
        });
    }

    function calculateTeamSizes(totalPlayers) {
        if (totalPlayers < 6) return null;

        for (let numFours = Math.floor(totalPlayers / 4); numFours >= 0; numFours--) {
            const remainingPlayers = totalPlayers - (numFours * 4);
            if (remainingPlayers % 3 === 0) {
                const numThrees = remainingPlayers / 3;
                // This combination works
                return { teamsOf4: numFours, teamsOf3: numThrees };
            }
        }
        // This should not be reached for totalPlayers >= 6, as numbers like 6,7,8,9,10,11... can always be formed.
        // Example: 6 (0,2), 7 (1,1), 8 (2,0), 9 (0,3), 10 (1,2), 11 (2,1).
        return null;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function prepareTeams(shuffledPlayers, teamConfigs) {
        teams = []; // Reset global teams array
        let playerPool = [...shuffledPlayers];
        let teamIdCounter = 1;

        for (let i = 0; i < teamConfigs.teamsOf4; i++) {
            const team = {
                id: teamIdCounter++,
                name: `Team ${teamIdCounter-1}`,
                size: 4,
                members: [], // Player objects will be added here
                memberElements: [] // For storing <li> elements in the team card
            };
            for (let j = 0; j < 4; j++) {
                if (playerPool.length > 0) {
                    team.members.push(playerPool.shift());
                }
            }
            teams.push(team);
        }

        for (let i = 0; i < teamConfigs.teamsOf3; i++) {
            const team = {
                id: teamIdCounter++,
                name: `Team ${teamIdCounter-1}`,
                size: 3,
                members: [],
                memberElements: []
            };
            for (let j = 0; j < 3; j++) {
                if (playerPool.length > 0) {
                    team.members.push(playerPool.shift());
                }
            }
            teams.push(team);
        }
    }

    // --- Animation Related Functions ---
    async function startAnimationSequence() {
        basketballElement.style.transform = 'translateY(-50%) rotate(0deg)';
        const basketballAirNozzle = basketballElement.querySelector('#air-nozzle');
        basketballElement.classList.add('visible');
        await delay(300); // Short delay for visibility

        // Create team card structures in the DOM
        teamsDisplayDiv.innerHTML = ''; // Clear any previous team cards
        teams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.classList.add('team-card');
            teamCard.dataset.teamId = team.id;

            const teamNameEl = document.createElement('h4');
            teamNameEl.textContent = team.name;
            teamCard.appendChild(teamNameEl);

            const memberListEl = document.createElement('ul');
            memberListEl.classList.add('team-member-list');
            teamCard.appendChild(memberListEl);
            teamsDisplayDiv.appendChild(teamCard);
            team.domElement = teamCard; // Store ref to team card
            team.memberListULElement = memberListEl; // Store ref to UL for members
        });

        let overallPlayerIndex = 0; // To pick players in their shuffled order for assignment

        for (const team of teams) { // Iterate through the prepared teams
            for (let i = 0; i < team.size; i++) {
                if (overallPlayerIndex < playersInfo.length) { // Check if there are players left (using original playersInfo for count)
                    // Find the player to assign based on the shuffled order used in prepareTeams
                    // This is tricky because prepareTeams consumes a *copy* of shuffled players.
                    // We need to iterate through the *actual* players assigned to *this team*.
                    const playerToAssign = team.members[i];
                    if (!playerToAssign) continue; // Should not happen if logic is correct

                    const playerElement = playerToAssign.element; // The <li> element in the top list

                    // 1. Animate basketball to the player
                    const playerRect = playerElement.getBoundingClientRect();
                    const animationContainerRect = animationContainer.getBoundingClientRect();

                    // Calculate target X for the basketball within the animation container
                    // The playerListUL might scroll, so get position relative to viewport first
                    let targetX = playerRect.left - animationContainerRect.left + (playerRect.width / 2) - (basketballElement.offsetWidth / 2);

                    // Adjust for horizontal scroll of playerListUL
                    targetX += playerListUL.scrollLeft;

                    // Scroll player element into view if list is scrollable
                    playerElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    await delay(400); // Give scrolling a bit of time to settle if it happens

                    basketballElement.style.left = `${targetX}px`;

                    // Rotation Logic:
                    // The basketball rolls (spins). When it stops, the nozzle (at its top) should point downwards.
                    let currentYTranslate = 'translateY(-50%)'; // Keep the vertical centering
                    let currentRotationMatch = basketballElement.style.transform.match(/rotate\(([^deg)]+)deg\)/);
                    let currentRotationDegrees = currentRotationMatch && !isNaN(parseFloat(currentRotationMatch[1])) ? parseFloat(currentRotationMatch[1]) : 0;

                    // Add 2 full spins for rolling effect, then add 180 deg to point the nozzle (assumed at the top of the basketball) downwards.
                    let newRotationDegrees = currentRotationDegrees + (360 * 2) + 180;
                    basketballElement.style.transform = `${currentYTranslate} rotate(${newRotationDegrees}deg)`;
                    // The airNozzle is a child and will rotate with the basketball. No separate rotation for nozzle needed.

                    playerElement.classList.add('highlighted');
                    await delay(1200); // Pause for "selection"

                    // 2. Visually assign player
                    playerElement.classList.remove('highlighted');
                    playerElement.classList.add('assigned'); // Mark as assigned in the top list

                    const assignedPlayerDisplay = document.createElement('li');
                    assignedPlayerDisplay.textContent = playerToAssign.name;
                    team.memberListULElement.appendChild(assignedPlayerDisplay);
                    team.memberElements.push(assignedPlayerDisplay); // Store for potential future use

                    overallPlayerIndex++;
                    await delay(600); // Pause after assignment
                }
            }
        }

        // Hide basketball after all assignments are done
        await delay(500);
        basketballElement.classList.remove('visible');
        basketballElement.style.left = '-60px';

        startAssignmentBtn.disabled = false; // Re-enable buttons after animation
        if(resetBtn) resetBtn.disabled = false;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

});
```
