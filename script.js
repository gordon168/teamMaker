document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateButton');
    const totalPlayersInput = document.getElementById('totalPlayers');
    const teamsResultDiv = document.getElementById('teamsResult');
    const errorMessagesDiv = document.getElementById('errorMessages');

    generateButton.addEventListener('click', () => {
        const totalPlayers = parseInt(totalPlayersInput.value);
        teamsResultDiv.innerHTML = ''; // Clear previous results
        errorMessagesDiv.textContent = ''; // Clear previous errors

        if (isNaN(totalPlayers) || totalPlayers <= 6) {
            errorMessagesDiv.textContent = 'Please enter a valid number of players (must be greater than 6).';
            return;
        }

        const players = Array.from({ length: totalPlayers }, (_, i) => `Player ${i + 1}`);
        shuffleArray(players); // Randomize player order

        const teams = assignTeams(players, totalPlayers);
        displayTeams(teams);
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function assignTeams(players, totalPlayers) {
        const teams = [];
        let numTeamsOfFour = 0;
        let numTeamsOfThree = 0;

        // Determine the number of teams of 4 and 3
        // We want to maximize teams of 4.
        // Let x be the number of teams of 4, and y be the number of teams of 3.
        // 4x + 3y = totalPlayers
        // We need to find non-negative integers x, y.

        for (let x = Math.floor(totalPlayers / 4); x >= 0; x--) {
            const remainingPlayers = totalPlayers - (x * 4);
            if (remainingPlayers % 3 === 0) {
                numTeamsOfFour = x;
                numTeamsOfThree = remainingPlayers / 3;
                break;
            }
        }

        // Fallback if no perfect combination is found (should not happen with numbers > 6 and team sizes 3,4)
        // This logic might need refinement for edge cases not covered by the primary loop,
        // but the problem constraints (total > 6, team sizes 3 or 4) usually make it solvable.
        // For example, 7 players: one team of 4, one team of 3. (x=1, y=1) -> 4*1 + 3*1 = 7. Loop: x=1. 7 - 4 = 3. 3%3==0. So numTeamsOfFour=1, numTeamsOfThree=1.
        // 8 players: two teams of 4. (x=2, y=0) -> 4*2 + 3*0 = 8. Loop: x=2. 8 - 8 = 0. 0%3==0. So numTeamsOfFour=2, numTeamsOfThree=0.
        // 9 players: three teams of 3. (x=0, y=3) -> 4*0 + 3*3 = 9. Loop: x=2 (8, rem 1), x=1 (4, rem 5), x=0 (0, rem 9). 9%3==0. So numTeamsOfFour=0, numTeamsOfThree=3.
        // 10 players: one t4, two t3. (x=1, y=2) -> 4*1+3*2=10. Loop: x=2 (8, rem 2), x=1 (4, rem 6). 6%3==0. numTeamsOfFour=1, numTeamsOfThree=2.
        // 11 players: two t4, one t3. (x=2, y=1) -> 4*2+3*1=11. Loop: x=2 (8, rem 3). 3%3==0. numTeamsOfFour=2, numTeamsOfThree=1.

        let playerIndex = 0;
        for (let i = 0; i < numTeamsOfFour; i++) {
            teams.push(players.slice(playerIndex, playerIndex + 4));
            playerIndex += 4;
        }

        for (let i = 0; i < numTeamsOfThree; i++) {
            teams.push(players.slice(playerIndex, playerIndex + 3));
            playerIndex += 3;
        }

        // If after forming teams of 4 and 3, there are still players left,
        // it means the initial logic for numTeamsOfFour and numTeamsOfThree might have an issue for some edge totalPlayers.
        // This can happen if totalPlayers is small like 1, 2, 5. But rule is totalPlayers > 6.
        // For totalPlayers = 7: one 4, one 3.
        // For totalPlayers = 8: two 4s.
        // For totalPlayers = 9: three 3s.
        // For totalPlayers = 10: one 4, two 3s.
        // For totalPlayers = 11: two 4s, one 3.
        // For totalPlayers = 13: one 4, three 3s (4*1 + 3*3 = 13) OR two 4s, one 3, one 2 (not allowed). Let's re-check logic for 13.
        // totalPlayers = 13:
        // x = floor(13/4) = 3. remaining = 13 - 12 = 1. 1%3 !=0
        // x = 2. remaining = 13 - 8 = 5. 5%3 != 0
        // x = 1. remaining = 13 - 4 = 9. 9%3 == 0. So numTeamsOfFour = 1, numTeamsOfThree = 3. Correct.
        // What if totalPlayers = 5? (Constraint is > 6, but for testing the distribution)
        // x = 1. rem = 1.
        // x = 0. rem = 5.
        // This implies that for some numbers, no combination of 3 and 4 might work if we don't allow flexible team counts.
        // However, it's a known mathematical result (Frobenius Coin Problem for 2 coins) that any integer N > a*b - a - b can be expressed as ax + by.
        // For a=3, b=4: 3*4 - 3 - 4 = 12 - 7 = 5. So any number of players > 5 can be formed with teams of 3 and 4.
        // Since our constraint is totalPlayers > 6, this will always work.


        return teams;
    }

    function displayTeams(teams) {
        if (teams.length === 0) {
            teamsResultDiv.innerHTML = '<p>Could not form teams with the given number of players.</p>'; // Should not happen with >6 players
            return;
        }

        const ul = document.createElement('ul');
        teams.forEach((team, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Team ${index + 1} (Size: ${team.length}):</strong> ${team.join(', ')}`;
            ul.appendChild(li);
        });
        teamsResultDiv.appendChild(ul);
    }
});
