document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const playerCountInput = document.getElementById('player-count');
    const playerCircle = document.querySelector('.player-circle');
    const teamsContainer = document.querySelector('.teams-container');
    const basketball = document.querySelector('.basketball');

    startBtn.addEventListener('click', () => {
        const playerCount = parseInt(playerCountInput.value);
        if (playerCount >= 6) {
            setupPlayers(playerCount);
            assignTeams(playerCount);
        } else {
            alert('Please enter a number of players greater than or equal to 6.');
        }
    });

    function setupPlayers(count) {
        playerCircle.innerHTML = '';
        const radius = 140;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 2 * Math.PI;
            const x = radius * Math.cos(angle) + 150 - 25;
            const y = radius * Math.sin(angle) + 150 - 25;
            const playerDiv = document.createElement('div');
            playerDiv.classList.add('player');
            playerDiv.textContent = `P${i + 1}`;
            playerDiv.style.left = `${x}px`;
            playerDiv.style.top = `${y}px`;
            playerDiv.dataset.id = i + 1;
            playerCircle.appendChild(playerDiv);
        }
    }

    async function assignTeams(playerCount) {
        let players = Array.from({ length: playerCount }, (_, i) => i + 1);
        const teams = [];
        let teamId = 1;

        while (players.length > 0) {
            let teamSize = 4;
            if (players.length % 4 !== 0 && players.length % 4 < 3 && players.length > 5) {
                teamSize = 3;
            } else if (players.length % 4 !== 0 && players.length > 5) {
                teamSize = 5;
            } else if (players.length <= 5 && players.length >= 3) {
                teamSize = players.length;
            }

            const team = { id: teamId++, players: [] };

            for (let i = 0; i < teamSize; i++) {
                if (players.length === 0) break;

                const randomIndex = Math.floor(Math.random() * players.length);
                const selectedPlayerId = players[randomIndex];
                players.splice(randomIndex, 1);

                await animateToPlayer(selectedPlayerId);

                team.players.push(selectedPlayerId);
                const playerDiv = document.querySelector(`.player[data-id='${selectedPlayerId}']`);
                playerDiv.classList.add('selected');
            }
            teams.push(team);
            displayTeams(teams);
        }
    }

    function animateToPlayer(playerId) {
        return new Promise(resolve => {
            const playerDiv = document.querySelector(`.player[data-id='${playerId}']`);
            const playerRect = playerDiv.getBoundingClientRect();
            const circleRect = playerCircle.getBoundingClientRect();

            const x = playerRect.left - circleRect.left + (playerRect.width / 2) - (basketball.offsetWidth / 2);
            const y = playerRect.top - circleRect.top + (playerRect.height / 2) - (basketball.offsetHeight / 2);

            basketball.style.animation = 'roll 1s linear infinite';
            basketball.style.transform = `translate(${x}px, ${y}px)`;

            setTimeout(() => {
                basketball.style.animation = '';
                resolve();
            }, 1000);
        });
    }

    function displayTeams(teams) {
        teamsContainer.innerHTML = '';
        teams.forEach(team => {
            const teamDiv = document.createElement('div');
            teamDiv.classList.add('team');
            teamDiv.innerHTML = `<h3>Team ${team.id}</h3>`;
            const playerList = document.createElement('ul');
            team.players.forEach(player => {
                const playerItem = document.createElement('li');
                playerItem.textContent = `Player ${player}`;
                playerList.appendChild(playerItem);
            });
            teamDiv.appendChild(playerList);
            teamsContainer.appendChild(teamDiv);
        });
    }
});
