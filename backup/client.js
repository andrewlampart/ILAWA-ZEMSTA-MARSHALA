const socket = io('http://79.191.232.249:3000');
let playerID = null; // zamiast let player_id = '';
let roomID = null;
let selectedCardIndex = null;  // Index of the selected player card
let selectedOpponentCardIndex = null;  // Index of the selected opponent card
let myTurn = false;


socket.on('updateGameState', function(data) {
    console.log("Otrzymano aktualizację stanu gry z serwera:", data);
    myTurn = data.current_player === playerID;  // Poprawka tutaj
    console.log("Uruchamiam funkcję aktualizujStanGry.");
    console.log("Otrzymano aktualizację stanu gry z serwera.");
    aktualizujStanGry(data);
    console.log("Aktualizacja stanu gry zakończona.");
});

socket.on('gameOver', function(data) {
    if (playerID === data.winner) {
        alert("Wygrałeś!");
    } else if (playerID === data.loser) {
        alert("Przegrałeś...");
    }
    location.reload();  // Przeładuj stronę, aby wrócić do początkowego stanu
});

socket.on('message', function(data) {
    alert(data);
});

function createRoom() {
    socket.emit('createRoom');
}

function joinRoom(id) {
    console.log("Wywołano funkcję joinRoom z ID:", id);
    console.log("Emitting joinRoom event with roomID:", id);
    socket.emit('joinRoom', { roomID: id });
}

function zagrajKarte(indexKarty) {
    console.log("Rozpoczynam funkcję 'zagrajKarte'");
    console.log(`Emitowanie zdarzenia zagrajKarte z indeksem karty: ${indexKarty}`);

    socket.emit('zagrajKarte', {
        roomID: roomID, 
        player: playerID,
        card_index: indexKarty
    });
    console.log("Zakończono funkcję 'zagrajKarte'");
}

document.getElementById('drawCardButton').addEventListener('click', function() {
    socket.emit('dobierzKarte', roomID);
});


function zaatakujKarte() {
    if (selectedCardIndex !== null && selectedOpponentCardIndex !== null) {
        socket.emit('zaatakujKarte', { player: playerID, attacker_index: selectedCardIndex, defender_index: selectedOpponentCardIndex, roomID: roomID });
        clearSelections();
    }
}

function activateSpecialAbility() {
    if (selectedCardIndex !== null) {
        socket.emit('activateSpecialAbility', { player: playerID, card_index: selectedCardIndex, roomID: roomID });
        clearSelections();
    }
}

function zakonczTure() {
    console.log("Funkcja 'zakonczTure' została wywołana.");
    if (!myTurn || !roomID) return; // Jeśli to nie twoja tura lub roomID jest null, nie rób nic
    console.log(`Wysyłanie żądania zakończenia tury z roomID: ${roomID}`);
    socket.emit('zakonczTure', { player: playerID, roomID: roomID });
}


function selectPlayerCard(index) {
    clearSelections();
    selectedCardIndex = index;
    document.getElementById('playerCard_' + index).style.border = "3px solid blue";
}

function selectOpponentCard(index) {
    selectedOpponentCardIndex = index;
    document.getElementById('opponentCard_' + index).style.border = "3px solid red";
}

function clearSelections() {
    if (selectedCardIndex !== null) {
        document.getElementById('playerCard_' + selectedCardIndex).style.border = "none";
        selectedCardIndex = null;
    }
    if (selectedOpponentCardIndex !== null) {
        document.getElementById('opponentCard_' + selectedOpponentCardIndex).style.border = "none";
        selectedOpponentCardIndex = null;
    }
}

socket.on('roomCreated', function(id) {
    console.log(`Utworzono pokój: ${id}`);
    roomID = id;
    // Aktualizacja interfejsu użytkownika, aby wyświetlić ID pokoju
    const roomDisplayElement = document.getElementById('roomDisplay');
    if (roomDisplayElement) {
        roomDisplayElement.textContent = `Pokój: ${id}`;
    } else {
        console.error("Element 'roomDisplay' nie istnieje w HTML.");
    }
});

socket.on('joinedRoom', function(id) {
    console.log(`Dołączono do pokoju: ${id}`);
    roomID = id;
});

socket.on('playerID', function(id) {
    playerID = id;

    // Aktualizacja interfejsu użytkownika, aby wyświetlić ID gracza
    const playerDisplayElement = document.getElementById('playerDisplay');
    if (playerDisplayElement) {
        playerDisplayElement.textContent = `Gracz: ${playerID}`;
    } else {
        console.error("Element 'playerDisplay' nie istnieje w HTML.");
    }
});

socket.on('error', function(errorMessage) {
    console.error(errorMessage);
    alert(errorMessage);
    console.error("Błąd:", errorMessage);
});

function aktualizujStanGry(gameState) {
    if (!gameState) return;
    console.log("Updating game state..."); 
    
    const currentPlayerDiv = document.getElementById('currentPlayer');
    if (currentPlayerDiv) {
        currentPlayerDiv.textContent = `Tura gracza: ${gameState.current_player}`;        
    }

    const roomDisplayElement = document.getElementById('roomDisplay');
    if (roomDisplayElement) {
        roomDisplayElement.textContent = `Pokój: ${roomID}`;
    }

    const playerDisplayElement = document.getElementById('playerDisplay');
    if (playerDisplayElement) {
        playerDisplayElement.textContent = `Gracz: ${playerID}`;
    }

    console.log("ID gracza:", playerID);
    console.log("Odebrano stan gry z serwera:", gameState);
    console.log("Aktualizacja stanu gry dla gracza:", playerID);
    console.log("Karty w ręce gracza:", gameState.players[playerID].hand);
    console.log("Karty na stole gracza:", gameState.players[playerID].board);
    
    let opponent = playerID === 'player1' ? 'player2' : 'player1';
    console.log("Karty na stole przeciwnika:", gameState.players[opponent].board);

    if (!gameState.players[playerID]) {
        console.error("Brak danych gracza w otrzymanym stanie gry.");
        return;
    }

    const remainingDrawsElement = document.getElementById('remainingDraws');
    if (remainingDrawsElement) {
        remainingDrawsElement.textContent = `Pozostało kart do dobrania: ${gameState.remainingDraws}`;
    }

    document.title = "Gra Karciana - Tura gracza: " + gameState.current_player;

    const mojeKartyDiv = document.getElementById('mojeKarty');
    while (mojeKartyDiv.firstChild) {
        mojeKartyDiv.removeChild(mojeKartyDiv.firstChild);
    }
    gameState.players[playerID].hand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.name}" class="card-image"><div class="card-name">${card.name}</div><div class="card-stats">Atak: ${card.attack}, Zdrowie: ${card.health}</div><div class="card-description">${card.special.replace('\\n', '<br>')}</div>`;
        cardDiv.onclick = () => zagrajKarte(index);
        mojeKartyDiv.appendChild(cardDiv);
    });

    const stolDiv = document.getElementById('stol');
    while (stolDiv.firstChild) {
        stolDiv.removeChild(stolDiv.firstChild);
    }
    gameState.players[playerID].board.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.id = 'playerCard_' + index;
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.name}" class="card-image"><div class="card-name">${card.name}</div><div class="card-stats">Atak: ${card.attack}, Zdrowie: ${card.health}</div><div class="card-description">${card.special.replace('\\n', '<br>')}</div>`;
        cardDiv.onclick = () => selectPlayerCard(index);
        stolDiv.appendChild(cardDiv);
    });

    const kartyPrzeciwnikaDiv = document.getElementById('kartyPrzeciwnika');
    while (kartyPrzeciwnikaDiv.firstChild) {
        kartyPrzeciwnikaDiv.removeChild(kartyPrzeciwnikaDiv.firstChild);
    }    gameState.players[opponent].board.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.id = 'opponentCard_' + index;
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.name}" class="card-image"><div class="card-name">${card.name}</div><div class="card-stats">Atak: ${card.attack}, Zdrowie: ${card.health}</div><div class="card-description">${card.special.replace('\\n', '<br>')}</div>`;
        cardDiv.onclick = () => selectOpponentCard(index);
        kartyPrzeciwnikaDiv.appendChild(cardDiv);
    });

    const endTurnButton = document.getElementById('endTurnButton');
    const drawCardButton = document.getElementById('drawCardButton');
    
    if (gameState.current_player === playerID) {
        endTurnButton.style.display = 'block';
        drawCardButton.disabled = false;
    } else {
        endTurnButton.style.display = 'none';
        drawCardButton.disabled = true;
    }

    const actionPointsDisplayElement = document.getElementById('actionPointsDisplay');
    if (actionPointsDisplayElement) {
        actionPointsDisplayElement.textContent = `Punkty akcji: ${gameState.players[playerID].action_points}`;
    }

}

