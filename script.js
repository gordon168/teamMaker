document.addEventListener('DOMContentLoaded', () => {
    const playerCountInput = document.getElementById('player-count');
    const startAssignmentBtn = document.getElementById('start-assignment-btn');
    const errorMessageElement = document.getElementById('error-message');
    const playerCircleContainerEl = document.getElementById('player-list'); // Renamed from playerListUL
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
        playerCircleContainerEl.innerHTML = ''; // Changed from playerListUL
        teamsDisplayDiv.innerHTML = '';
        errorMessageElement.textContent = '';

        basketballElement.classList.remove('visible');
        basketballElement.style.left = '-60px';
        basketballElement.style.transform = 'translateY(-50%) rotate(0deg)';
        const basketballAirNozzle = basketballElement.querySelector('#air-nozzle');
        if (basketballAirNozzle) basketballAirNozzle.style.transform = 'rotate(0deg)';

        // Clear any highlights from player items (now .player-cartoon)
        document.querySelectorAll('.player-cartoon.highlighted').forEach(el => el.classList.remove('highlighted'));
        document.querySelectorAll('.player-cartoon.assigned').forEach(el => el.classList.remove('assigned'));


        startAssignmentBtn.disabled = false; // Ensure start button is usable
        if(resetBtn) resetBtn.disabled = false; // Ensure reset button is usable
    }

    function generatePlayers(count) {
        playersInfo = []; // Clear existing players before generating new ones
        for (let i = 0; i < count; i++) {
            playersInfo.push({ id: i, name: `Player ${i + 1}`, element: null, originalOrder: i });
        }
        renderPlayerListAndPositionInCircle(); // New combined function
    }

    function renderPlayerListAndPositionInCircle() {
        playerCircleContainerEl.innerHTML = ''; // Clear previous player elements
        const numPlayers = playersInfo.length;
        if (numPlayers === 0) return;

        const playerElements = [];

        playersInfo.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.classList.add('player-cartoon');
            playerDiv.dataset.playerId = player.id;

            const headDiv = document.createElement('div');
            headDiv.classList.add('player-head');
            playerDiv.appendChild(headDiv);

            const bodyDiv = document.createElement('div');
            bodyDiv.classList.add('player-body');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('player-name');
            nameSpan.textContent = player.name;
            bodyDiv.appendChild(nameSpan);
            playerDiv.appendChild(bodyDiv);

            const leftHandDiv = document.createElement('div');
            leftHandDiv.classList.add('player-hand', 'left-hand');
            playerDiv.appendChild(leftHandDiv);

            const rightHandDiv = document.createElement('div');
            rightHandDiv.classList.add('player-hand', 'right-hand');
            playerDiv.appendChild(rightHandDiv);

            playerCircleContainerEl.appendChild(playerDiv);
            player.element = playerDiv; // Store reference to the main player div
            playerElements.push(playerDiv);
        });

        // Position players in a circle
        const containerWidth = playerCircleContainerEl.offsetWidth;
        const containerHeight = playerCircleContainerEl.offsetHeight;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        // Radius should be smaller than container half-width/height to fit players
        // Player width is ~60px, height ~80px from CSS.
        const playerVisualWidth = 60; // From CSS .player-cartoon width
        const playerVisualHeight = 80; // From CSS .player-cartoon height

        // Radius calculation for "holding hands" and fitting in container
        const desiredArcLengthBetweenPlayerCenters = 55; //px - aim for this spacing for hands to touch
        let radiusFromArcLength = (desiredArcLengthBetweenPlayerCenters * numPlayers) / (2 * Math.PI);

        const maxPlayerExtentFromCenter = Math.max(playerVisualWidth, playerVisualHeight) / 2;
        const paddingFromContainerEdge = 15; // A little more padding
        let radiusFromContainer = Math.min(centerX, centerY) - maxPlayerExtentFromCenter - paddingFromContainerEdge;

        // Ensure radius is positive
        radiusFromContainer = Math.max(radiusFromContainer, playerVisualWidth / 2); // Minimum radius to not overlap self badly

        let radius = Math.min(radiusFromArcLength, radiusFromContainer);
        radius = Math.max(radius, 0); // Ensure radius is not negative if container is too small

        playerElements.forEach((element, index) => {
            // Distribute players evenly, starting at the top (-PI/2 rad or -90 deg)
            const angle = (index / numPlayers) * 2 * Math.PI - (Math.PI / 2);

            // Calculate position for the center of the player element
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Adjust to position top-left corner of the element, then transform-origin will handle rotation center
            element.style.left = `${x - playerVisualWidth / 2}px`;
            element.style.top = `${y - playerVisualHeight / 2}px`;

            // Rotate player to face outwards from the circle center
            // Angle in degrees for CSS rotate. Add 90 because 0 rad is right, players are upright.
            const rotationDegrees = (angle * 180 / Math.PI) + 90;
            element.style.transform = `rotate(${rotationDegrees}deg)`;
            element.style.transformOrigin = 'center center';
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
        // Initial basketball position: center of the animation container
        const animationContainerRect = animationContainer.getBoundingClientRect();
        const initialBasketballX = animationContainerRect.width / 2 - basketballElement.offsetWidth / 2;
        const initialBasketballY = animationContainerRect.height / 2 - basketballElement.offsetHeight / 2;

        basketballElement.style.left = `${initialBasketballX}px`;
        basketballElement.style.top = `${initialBasketballY}px`;
        basketballElement.style.transform = 'rotate(0deg)'; // No Y-translation needed if top/left set center

        // const basketballAirNozzle = basketballElement.querySelector('#air-nozzle'); // Nozzle is part of visual
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

                    const playerElement = playerToAssign.element;

                    // 1. Animate basketball to the player
                    const playerRect = playerElement.getBoundingClientRect();
                    // animationContainerRect is already available from the start of the function

                    // Calculate target X and Y for the basketball's center to align with player's center
                    // relative to the animationContainer
                    const targetCenterX = playerRect.left - animationContainerRect.left + playerRect.width / 2;
                    const targetCenterY = playerRect.top - animationContainerRect.top + playerRect.height / 2;

                    // Set basketball's top-left to position its center at (targetCenterX, targetCenterY)
                    const targetBasketballX = targetCenterX - basketballElement.offsetWidth / 2;
                    const targetBasketballY = targetCenterY - basketballElement.offsetHeight / 2;

                    basketballElement.style.left = `${targetBasketballX}px`;
                    basketballElement.style.top = `${targetBasketballY}px`;

                    // Rotation Logic:
                    // Basketball needs to rotate so its "top" (where nozzle is) points towards the player.
                    // Get current basketball center
                    const basketballRect = basketballElement.getBoundingClientRect();
                    const basketballCenterX = basketballRect.left - animationContainerRect.left + basketballRect.width / 2;
                    const basketballCenterY = basketballRect.top - animationContainerRect.top + basketballRect.height / 2;

                    // Angle from current basketball center to target player center
                    let angleToPlayer = Math.atan2(targetCenterY - basketballCenterY, targetCenterX - basketballCenterX) * 180 / Math.PI;

                    // Adjust angle so 0 degrees is "up" for the basketball sprite, then add angleToPlayer
                    // Our nozzle is at the "top" of the basketball. If basketball's 0deg rotation means nozzle is up,
                    // then we need to rotate it by `angleToPlayer` (plus 90 deg because atan2's 0 is to the right).
                    let rotationForNozzle = angleToPlayer + 90;

                    // Add some spins for rolling effect
                    let currentTransform = basketballElement.style.transform;
                    let currentRotationMatch = currentTransform.match(/rotate\(([^deg)]+)deg\)/);
                    let currentRotationDegrees = currentRotationMatch && !isNaN(parseFloat(currentRotationMatch[1])) ? parseFloat(currentRotationMatch[1]) : 0;

                    // Ensure it spins a few times towards the new direction
                    // To make it look like it rolls *towards* the player, this is more complex.
                    // For now, just spin and then orient.
                    let newVisualRotation = currentRotationDegrees + (360 * 2); // Spin effect

                    basketballElement.style.transform = `rotate(${newVisualRotation + rotationForNozzle}deg)`;
                    // This might be too much rotation at once. Simpler:
                    // basketballElement.style.transform = `rotate(${rotationForNozzle}deg)`; // Just point nozzle
                    // Let's try with a spin then final orientation:
                    // First, animate to position with a generic spin, then a quick turn to point.
                    // This is hard to do with a single transition.
                    // Alternative: basketball has a constant "rolling" animation via CSS, and JS just sets final orientation.
                    // For now, let's set the final orientation directly, plus some arbitrary spins.
                    // The transition in CSS handles the actual animation of rotation.

                    basketballElement.style.transform = `rotate(${currentRotationDegrees + (360*2) + rotationForNozzle}deg)`;


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
