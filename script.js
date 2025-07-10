document.addEventListener('DOMContentLoaded', () => {
    const playerCountInput = document.getElementById('player-count');
    const assignButton = document.getElementById('assign-button');
    const canvas = document.getElementById('player-canvas');
    const ctx = canvas.getContext('2d');
    const teamsOutput = document.getElementById('teams-output');

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8; // 80% of half the smallest dimension
    const playerRadius = 20; // Radius of the circle representing a player
    const playerImageSize = playerRadius * 2.5; // Make image a bit larger than the collision circle

    const playerImage = new Image();
    playerImage.src = 'assets/player.png'; // Path to player image
    let playerImageLoaded = false;
    playerImage.onload = () => { playerImageLoaded = true; drawPlayers(); }; // Redraw when loaded
    playerImage.onerror = () => { console.error("Player image failed to load. Using fallback."); playerImageLoaded = false; };

    // Basketball image for animation (loaded in drawBasketball or similar)
    const basketballImage = new Image();
    basketballImage.src = 'assets/basketball.png'; // Path to basketball image
    let basketballImageLoaded = false;
    basketballImage.onload = () => { basketballImageLoaded = true; /* Optionally redraw if needed */ };
    basketballImage.onerror = () => { console.error("Basketball image failed to load. Using fallback."); basketballImageLoaded = false; };


    let players = []; // Array to store player objects { id, angle, team }

    function drawPlayers() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

        if (players.length === 0) {
            // Draw a placeholder message if no players yet
            ctx.font = "16px Arial";
            ctx.fillStyle = "grey";
            ctx.textAlign = "center";
            ctx.fillText("Enter player count and click 'Assign Teams'", centerX, centerY);
            return;
        }

        // Draw connecting lines for "holding hands"
        ctx.beginPath();
        ctx.strokeStyle = "lightgray";
        // Move to the first player's position before starting the loop
        if (players.length > 0) {
            ctx.moveTo(centerX + radius * Math.cos(players[0].angle), centerY + radius * Math.sin(players[0].angle));
        }
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            // For all players (including the first, after moveTo), draw a line to their position
            ctx.lineTo(centerX + radius * Math.cos(player.angle), centerY + radius * Math.sin(player.angle));
        }
        if (players.length > 1) { // Only close path if there's something to close
            ctx.closePath(); // Connect last player to the first
        }
        ctx.stroke();


        players.forEach((player, index) => {
            const x = centerX + radius * Math.cos(player.angle);
            const y = centerY + radius * Math.sin(player.angle);

            if (playerImageLoaded) {
                // Draw player image
                ctx.drawImage(playerImage, x - playerImageSize / 2, y - playerImageSize / 2, playerImageSize, playerImageSize);
                 // Optionally, draw a colored circle behind or as a border if team is assigned
                if (player.team !== null) {
                    ctx.beginPath();
                    ctx.arc(x, y, playerRadius + 2, 0, Math.PI * 2); // A bit larger for border
                    ctx.strokeStyle = getTeamColor(player.team);
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.lineWidth = 1; // Reset line width
                }
            } else {
                // Fallback: Draw player (simple circle)
                ctx.beginPath();
                ctx.arc(x, y, playerRadius, 0, Math.PI * 2);
                ctx.fillStyle = player.team !== null ? getTeamColor(player.team) : 'lightblue'; // Color by team if assigned
                ctx.fill();
                ctx.strokeStyle = 'black'; // Add a border to player circles
                ctx.stroke();
                ctx.closePath();
            }

            // Draw player number/ID
            ctx.fillStyle = 'black';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
             // Adjust text position if using image to be below it, or centered if circle
            const textY = playerImageLoaded ? y + playerImageSize / 2 + 5 : y;
            ctx.fillText(player.id, x, textY);
        });
    }

    function getTeamColor(teamId) {
        const colors = ['coral', 'lightgreen', 'gold', 'violet', 'skyblue', 'lightpink', 'orange', 'khaki', 'salmon', 'turquoise'];
        return colors[teamId % colors.length];
    }

    function initializePlayers(count) {
        players = [];
        if (count <= 0) {
            drawPlayers(); // Draw placeholder if count is invalid
            return;
        }
        const angleStep = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            // Start angles from -Math.PI / 2 to have the first player at the top
            const angle = -Math.PI / 2 + (i * angleStep);
            players.push({ id: i + 1, angle: angle, team: null });
        }
        drawPlayers();
    }

    // Initial draw (placeholder message)
    drawPlayers();

    assignButton.addEventListener('click', () => {
        const count = parseInt(playerCountInput.value);

        if (isNaN(count) || count <= 6) {
            alert("Please enter a valid number of players (must be greater than 6).");
            teamsOutput.innerHTML = "<p>Assignment failed: Invalid player count.</p>";
            initializePlayers(0); // Clear players or show placeholder
            window.currentTeams = []; // Clear teams
            displayTeams(); // Update display
            return;
        }

        initializePlayers(count); // Setup players on canvas
        assignTeamsAndAnimate(count); // Changed to reflect new animation flow
    });

    function assignTeamsLogic(totalPlayers) {
        let currentPlayers = JSON.parse(JSON.stringify(players)); // Work with a copy for assignment
        let unassignedPlayerObjects = [...currentPlayers];

        // Shuffle players for random assignment
        for (let i = unassignedPlayerObjects.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unassignedPlayerObjects[i], unassignedPlayerObjects[j]] = [unassignedPlayerObjects[j], unassignedPlayerObjects[i]];
        }

        let teams = [];
        let teamIdCounter = 0;
        let numTeamsOf4 = 0;
        let numTeamsOf3 = 0;

        let foundCombination = false;
        // Iterate possible numbers of teams of 4 (max_teams_of_4 = floor(n/4))
        // For each number of teams of 4 (say 'a'), remaining_players = n - 4*a.
        // If remaining_players % 3 == 0, then we found a valid combo.
        // We prefer more teams of 4 if multiple solutions exist with same number of teams.
        // Or, more simply, iterate 'a' (num teams of 4) downwards. The first valid combo is taken.
        for (let a = Math.floor(totalPlayers / 4); a >= 0; a--) {
            let remainingFor3s = totalPlayers - (a * 4);
            if (remainingFor3s >= 0 && remainingFor3s % 3 === 0) {
                numTeamsOf4 = a;
                numTeamsOf3 = remainingFor3s / 3;
                // Ensure we actually form teams if totalPlayers > 0
                if (numTeamsOf4 === 0 && numTeamsOf3 === 0 && totalPlayers > 0) {
                    continue;
                }
                foundCombination = true;
                break;
            }
        }

        if (!foundCombination) {
            console.error(`Could not find a valid team combination for ${totalPlayers} players. This shouldn't happen for players > 6.`);
            teamsOutput.innerHTML = "<p>Error: Could not form teams of 3 or 4. Check player count.</p>";
            return { teams: [], assignmentOrder: [] }; // Return empty if no solution
        }

        let assignmentOrder = []; // Store players in the order they are assigned for animation

        for (let i = 0; i < numTeamsOf4; i++) {
            const newTeam = { id: teamIdCounter++, members: [], size: 4 };
            for (let j = 0; j < 4; j++) {
                if (unassignedPlayerObjects.length > 0) {
                    const playerToAssign = unassignedPlayerObjects.pop();
                    // Find the original player object in the main 'players' array to update its team
                    const originalPlayer = players.find(p => p.id === playerToAssign.id);
                    originalPlayer.team = newTeam.id;
                    newTeam.members.push(originalPlayer);
                    assignmentOrder.push({playerId: originalPlayer.id, teamId: newTeam.id});
                }
            }
            teams.push(newTeam);
        }

        for (let i = 0; i < numTeamsOf3; i++) {
            const newTeam = { id: teamIdCounter++, members: [], size: 3 };
            for (let j = 0; j < 3; j++) {
                 if (unassignedPlayerObjects.length > 0) {
                    const playerToAssign = unassignedPlayerObjects.pop();
                    const originalPlayer = players.find(p => p.id === playerToAssign.id);
                    originalPlayer.team = newTeam.id;
                    newTeam.members.push(originalPlayer);
                    assignmentOrder.push({playerId: originalPlayer.id, teamId: newTeam.id});
                }
            }
            teams.push(newTeam);
        }

        window.currentTeams = teams; // Store globally
        return { teams, assignmentOrder };
    }

    function displayTeams() {
        teamsOutput.innerHTML = ''; // Clear previous results
        if (!window.currentTeams || window.currentTeams.length === 0) {
            // Only show "no teams" if valid input led to no teams, or input was cleared
            const count = parseInt(playerCountInput.value);
            if (isNaN(count) || count <=6) { // If input is invalid/cleared
                 teamsOutput.innerHTML = "<p>Enter player count (>6) and click assign.</p>";
            } else if (players.length > 0 && (!window.currentTeams || window.currentTeams.length === 0) ) {
                // Valid input but teams somehow not formed (e.g. error in assignTeamsLogic)
                teamsOutput.innerHTML = "<p>Could not assign teams. Please check the console for errors.</p>";
            }
            return;
        }

        window.currentTeams.forEach(team => {
            const teamDiv = document.createElement('div');
            teamDiv.classList.add('team');
            const membersStr = team.members.map(p => `Player ${p.id}`).join(', ');
            teamDiv.innerHTML = `<h3>Team ${team.id + 1} (Size: ${team.members.length}):</h3><p>${membersStr}</p>`;
            teamsOutput.appendChild(teamDiv);
        });
    }

    // --- Animation Logic ---
    let basketballAngle = 0;
    let animationFrameId;
    const basketballRadius = 15; // Size of the basketball for animation
    let assignedInAnimation = {}; // Keep track of players assigned during animation to avoid re-assigning visually

    function drawBasketball() {
        const x = centerX + (radius - playerRadius - basketballRadius - 5) * Math.cos(basketballAngle); // Position inside player circle
        const y = centerY + (radius - playerRadius - basketballRadius - 5) * Math.sin(basketballAngle);

        if (basketballImageLoaded) {
            // Draw basketball image, rotating it
            ctx.save();
            ctx.translate(x, y); // Move to basketball's position
            // The nozzle is assumed to be at a specific part of the image, e.g., "top" if image is upright
            // So, we rotate the canvas by basketballAngle + an offset if the nozzle isn't at "0 rad" in the image
            // For simplicity, let's assume the nozzle is at the "right" (0 rad) of the image.
            // The "air nozzle is rolling against one person" means the part of basketball pointing to center (or away from player)
            // Let's say nozzle points "out" from the spinning center. This means it's opposite to basketballAngle.
            ctx.rotate(basketballAngle + Math.PI); // Rotate basketball image itself. Adding Math.PI to make "nozzle" point outward.
            ctx.drawImage(basketballImage, -basketballRadius, -basketballRadius, basketballRadius * 2, basketballRadius * 2);
            ctx.restore();
        } else {
            // Fallback: Simple basketball representation
            ctx.beginPath();
            ctx.arc(x, y, basketballRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'orange';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
            ctx.closePath();

            // Fallback: Nozzle (a small dot on the basketball, pointing "outwards" from spin center)
            // The nozzle direction should align with how player selection is determined.
            // If selection is based on basketballAngle, nozzle should point along this angle or its opposite.
            // The "nozzle is rolling against one person" implies the nozzle is on the circumference part that is "closest" to the players circle.
            // The part of the basketball that is "against" a player is effectively at `basketballAngle`.
            const nozzleMarkerX = x + basketballRadius * Math.cos(basketballAngle);
            const nozzleMarkerY = y + basketballRadius * Math.sin(basketballAngle);
            ctx.beginPath();
            ctx.arc(nozzleMarkerX, nozzleMarkerY, 4, 0, Math.PI * 2); // Make nozzle more visible
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
        }
    }

    function assignTeamsAndAnimate(totalPlayers) {
        // 1. Reset players' team assignments visually and logically
        players.forEach(p => p.team = null);
        assignedInAnimation = {};
        drawPlayers(); // Redraw with default colors

        // 2. Determine team structure and the order of assignment (without yet updating main 'players' array's team property)
        const { teams: determinedTeams, assignmentOrder } = assignTeamsLogic(totalPlayers);

        if (!determinedTeams || determinedTeams.length === 0) {
            displayTeams(); // Show error message if no teams formed
            return;
        }

        window.currentTeams = determinedTeams; // Store the final team structure

        let currentAssignmentIndex = 0;
        let spinSpeed = 0.1; // Radians per frame
        let targetPlayerAngle = null;
        let pauseFrames = 0;
        const PAUSE_DURATION = 30; // Frames to pause when a player is selected

        function animationLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPlayers(); // Draw players (colors will update as they are "assigned")
            drawBasketball();

            if (pauseFrames > 0) {
                pauseFrames--;
                animationFrameId = requestAnimationFrame(animationLoop);
                return;
            }

            if (currentAssignmentIndex < assignmentOrder.length) {
                const assignment = assignmentOrder[currentAssignmentIndex];
                const playerToAssign = players.find(p => p.id === assignment.playerId);

                if (!targetPlayerAngle || Math.abs(basketballAngle - targetPlayerAngle) < spinSpeed * 1.5) {
                    // Set new target: the player to be assigned
                    targetPlayerAngle = playerToAssign.angle;

                    // Adjust basketballAngle to be close to targetPlayerAngle for smooth stopping
                    // Normalize angles to be within 0 to 2*PI for comparison
                    let normBasketballAngle = (basketballAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
                    let normTargetAngle = (targetPlayerAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

                    // If basketball is perfectly aligned or very close
                    if (Math.abs(normBasketballAngle - normTargetAngle) < spinSpeed * 1.5) {
                        basketballAngle = targetPlayerAngle; // Snap to target

                        // Assign player to team (update visual state)
                        if (!assignedInAnimation[playerToAssign.id]) {
                            playerToAssign.team = assignment.teamId; // This updates color for next drawPlayers
                            assignedInAnimation[playerToAssign.id] = true;
                            console.log(`Player ${playerToAssign.id} assigned to Team ${assignment.teamId +1}`);
                            currentAssignmentIndex++;
                            pauseFrames = PAUSE_DURATION; // Pause to show assignment
                        }
                         // Pick next target immediately if current is assigned
                        if (currentAssignmentIndex < assignmentOrder.length) {
                             const nextAssignment = assignmentOrder[currentAssignmentIndex];
                             const nextPlayerToAssign = players.find(p => p.id === nextAssignment.playerId);
                             targetPlayerAngle = nextPlayerToAssign.angle;
                        } else {
                            targetPlayerAngle = null; // All assigned
                        }
                    }
                }
                // Spin towards target player
                if (targetPlayerAngle !== null) {
                    let diff = targetPlayerAngle - basketballAngle;
                    // Normalize difference to spin shortest path
                    if (diff > Math.PI) diff -= 2 * Math.PI;
                    if (diff < -Math.PI) diff += 2 * Math.PI;

                    if (Math.abs(diff) > spinSpeed) {
                        basketballAngle += Math.sign(diff) * spinSpeed;
                    } else {
                        basketballAngle = targetPlayerAngle; // Snap if close
                    }
                }
            } else { // All assignments animated
                spinSpeed *= 0.95; // Slow down the basketball
                if (spinSpeed < 0.001) {
                    cancelAnimationFrame(animationFrameId);
                    console.log("Animation finished.");
                    displayTeams(); // Display final team list
                    // Ensure all players have their final team color from window.currentTeams
                    players.forEach(p => {
                        const teamInfo = window.currentTeams.find(t => t.members.some(m => m.id === p.id));
                        if (teamInfo) p.team = teamInfo.id;
                    });
                    drawPlayers(); // Final redraw
                    return;
                }
            }

            basketballAngle += spinSpeed; // General spinning if no target or decelerating
            basketballAngle %= (2 * Math.PI); // Keep angle within 0-2PI

            animationFrameId = requestAnimationFrame(animationLoop);
        }

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    // Initial display of teams output area
    displayTeams();
});
