const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const { activate_special_ability } = require('./specialAbilities');


const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer);

app.use(express.static(path.join(__dirname)));

const cards = JSON.parse(fs.readFileSync("cards_info.json", "utf8"));

const characterSet = '123456789ABCDEFGHJKMNPQRSTUVWXYZ';
function generateUniqueId() {
  return 'x'
    .repeat(8)
    .replace(/x/g, () => characterSet[Math.trunc(Math.random() * 32)]);
}


function draw_random_cards(cards_list, num_cards=10) {
    const drawn_cards = cards_list.sort(() => 0.5 - Math.random()).slice(0, num_cards);
    return drawn_cards;
}


function draw_card(state, player, roomID, room) {
    let result = { success: true, message: "" };  // Inicjalizacja zmiennej wynikowej

    if (state.players[player].action_points < 1) {
        return { success: false, message: "Nie masz wystarczającej liczby punktów akcji do dobierania karty." };
    }

    if (state.players[player].drawCount >= 10) {
        return { success: false, message: "Osiągnąłeś limit dobierania kart." };
    }

    let drawn_card = draw_random_cards(state.unused_cards, 1)[0];

    if (!drawn_card) {
        return { success: false, message: "Nie ma więcej kart do dobierania." };
    }

    state.players[player].hand.push(drawn_card);
    state.players[player].action_points -= 1;
    state.unused_cards = state.unused_cards.filter(card => card.name !== drawn_card.name);
    state.players[player].drawCount += 1;
    state.remainingDraws = 10 - state.players[player].drawCount;

    
    const winner = checkForWinner(state);
    if (winner) {
        io.to(roomID).emit('gameOver', winner);
        return { success: false, message: "Nie ma więcej kart do dobierania i przegrałeś." };
    }

    if (result.success) {
        io.to(roomID).emit('updateGameState', room.gameState);
    } else {
        socket.emit('error', result.message);
    }

    return result;  // Zwróć wynik
}


function initialize_game_state_with_replacement() {
    const deepCopy = (arr) => arr.map(item => Object.assign({}, item));
    
    let remaining_cards = [...cards]; // Tworzenie kopii listy kart

    // Draw 10 random cards for player 1
    let player1_cards = draw_random_cards(remaining_cards, 10);

    // Remove the drawn cards for player 1 from the available cards pool
    remaining_cards = remaining_cards.filter(card => !player1_cards.includes(card));

    // Draw 10 random cards for player 2 from the remaining cards
    let player2_cards = draw_random_cards(remaining_cards, 10);

    // Remove the drawn cards for player 2 from the available cards pool
    remaining_cards = remaining_cards.filter(card => !player2_cards.includes(card));

    return {
        "players": {
            "player1": {
                "hand": deepCopy(player1_cards),
                "board": [],
                "action_points": 2,
                "drawCount": 0  
            },
            "player2": {
                "hand": deepCopy(player2_cards),
                "board": [],
                "action_points": 2,
                "drawCount": 0  
            }
        },
        "current_player": "player1",
        "unused_cards": remaining_cards,  // Updated line to use the remaining cards
        "drawCount": 0,  
        "remainingDraws": 10  
    };
}


function play_card(state, player, card_index, socket) {
    console.log(`Próba zagrania karty przez ${player} z indeksem ${card_index}`);
    if (state.current_player !== player) {
        console.log(`Błąd: ${player} nie jest aktualnym graczem.`);
        socket.emit('error', 'To nie jest twoja tura.');
        return false;
    }
    if (state.players[player].action_points < 1) {
        console.log(`Błąd: ${player} nie ma wystarczającej liczby punktów akcji.`);
        return false;
    }
    if (card_index >= state.players[player].hand.length) {
        console.log(`Błąd: Nieprawidłowy indeks karty dla gracza ${player}.`);
        return false;
    }

    const card = state.players[player].hand.splice(card_index, 1)[0];
    state.players[player].board.push(card);
    state.players[player].action_points -= 1;
    return true;
}

function checkForWinner(state, roomID) {
    const player1 = state.players.player1;
    const player2 = state.players.player2;

    if (player1.hand.length === 0 && player1.board.length === 0 && state.unused_cards.length === 0) {
        io.to(roomID).emit('gameOver', { winner: 'player2', loser: 'player1' });
        resetRoom(roomID);
        return 'player2';
    }

    if (player2.hand.length === 0 && player2.board.length === 0 && state.unused_cards.length === 0) {
        io.to(roomID).emit('gameOver', { winner: 'player1', loser: 'player2' });
        resetRoom(roomID);
        return 'player1';
    }

    return null;
}

function resetRoom(roomID) {
    delete rooms[roomID];
}



function attack_card(state, player, attacker_index, defender_index, roomID, socket) {
    if (state.current_player !== player || state.players[player].action_points < 1 || attacker_index >= state.players[player].board.length) {
        return false;
    }
    
    const opponent = player === 'player1' ? 'player2' : 'player1';
    const defender = state.players[opponent].board[defender_index];

    // Dodane sprawdzenie, czy obronca to "Gzowiak"
    if (defender.name === "Gzowiak") {
        socket.emit('error', 'Nie możesz zaatakować Gzowiaka.');
        return false;
    }

    const attacker = state.players[player].board[attacker_index];

    defender.health -= attacker.attack;
    attacker.health -= defender.attack;

    if (defender.health <= 0) {
        state.players[opponent].board.splice(defender_index, 1);
    }
    if (attacker.health <= 0) {
        state.players[player].board.splice(attacker_index, 1);
    }

    state.players[player].action_points -= 1;

    const winner = checkForWinner(state);
    if (winner) {
        io.to(roomID).emit('gameOver', winner);
        return;
    }

    return true;
}



function end_turn(state, player) {
    console.log(`Próba zakończenia tury przez gracza ${player}`); // Dodaj tę linię
    if (state.current_player !== player) {
        return false;
    }
    const next_player = player === 'player1' ? 'player2' : 'player1';
    state.current_player = next_player;
    state.players[next_player].action_points = 2;  // Reset action points for the next player
    const szczepanCard = state.players[player].board.find(card => card.name === "Szczepan");
    if (szczepanCard && szczepanCard.baseAttack !== undefined) {
        szczepanCard.attack = szczepanCard.baseAttack;
    }
    return true;
}


// Struktura do przechowywania informacji o pokojach
const rooms = {};

io.on('connection', function(socket) {

    socket.on('error', function(err) {
        console.error(`Błąd dla socketu o ID ${socket.id}:`, err);
    });
    
    socket.on('createRoom', function() {
        let roomID;
        do {
            roomID = generateUniqueId();
        } while (rooms[roomID]);
    
        rooms[roomID] = {
            players: [],
            gameState: null,
            gameStarted: false
        };
        socket.join(roomID);
        const playerID = 'player' + (rooms[roomID].players.length + 1);
        rooms[roomID].players.push({ socketId: socket.id, playerId: playerID });
        console.log(`Gracz ${playerID} dołączył do pokoju ${roomID}`);
        console.log("Aktualna struktura pokoi:", rooms);
        socket.emit('roomCreated', roomID);
        console.log(`Utworzono pokój: ${roomID}`);
        socket.emit('playerID', playerID);
        console.log(`Gracz o ID socketu ${socket.id} (playerID: ${playerID}) dołączył do pokoju ${roomID}`);
    });
    

    socket.on('joinRoom', function({ roomID }) { 
        // ... istniejący kod ...
    
        if (rooms[roomID] && rooms[roomID].players.length < 2) {
            const playerID = 'player' + (rooms[roomID].players.length + 1);
            socket.join(roomID);
            rooms[roomID].players.push({ socketId: socket.id, playerId: playerID }); 
            console.log("Aktualna struktura pokoi:", rooms);
            socket.emit('playerID', playerID);
            console.log(`Gracz ${playerID} dołączył do pokoju ${roomID}`);
    
            socket.emit('joinedRoom', roomID);  // <- Dodaj tę linię
    
            if (rooms[roomID].players.length === 2) {
                rooms[roomID].gameState = initialize_game_state_with_replacement();
                rooms[roomID].gameStarted = true;
            }
    
            if (rooms[roomID].gameState) {
                console.log("Wysyłanie stanu gry do klientów:", rooms[roomID].gameState);
                io.to(roomID).emit('updateGameState', rooms[roomID].gameState);
                console.log("Wysłano aktualizację stanu gry do klientów");
            }
    
        } else {
            socket.emit('error', 'Pokój jest pełny lub nie istnieje');
        }
    });
    

    // Obsługa zdarzeń gry
    socket.on('zagrajKarte', function(data) {
        const room = rooms[data.roomID];
        if (room && room.gameState) {
            if (play_card(room.gameState, data.player, data.card_index, socket)) {
                io.to(data.roomID).emit('updateGameState', room.gameState);
            } else {
                console.log(`Nieudana próba zagrania karty przez gracza: ${data.player} w pokoju: ${data.roomID}`);
            }            
        } else {
            console.log(`Nie znaleziono pokoju o ID: ${data.roomID} lub brak stanu gry.`);
        }
    });
    

    socket.on('zaatakujKarte', function(data) {
        const room = rooms[data.roomID];
        if (room && room.gameState) {
            if (attack_card(room.gameState, data.player, data.attacker_index, data.defender_index, data.roomID, socket)) {
                io.to(data.roomID).emit('updateGameState', room.gameState);
            }            
        } else {
            console.log(`Nie znaleziono pokoju o ID: ${data.roomID} lub brak stanu gry.`);
        }
    });

    socket.on('activateSpecialAbility', function(data) {
        const room = rooms[data.roomID];
        if (room && room.gameState) {
            if (activate_special_ability(room.gameState, data.player, data.card_index)) {
                io.to(data.roomID).emit('updateGameState', room.gameState);
            }
        }
    });

    socket.on('zakonczTure', function(data) {
        console.log(`Otrzymano żądanie zakończenia tury od gracza ${data.player} w pokoju ${data.roomID}`); // Dodaj tę linię
        const room = rooms[data.roomID];
        if (room && room.gameState) {
            if (end_turn(room.gameState, data.player)) {
                io.to(data.roomID).emit('updateGameState', room.gameState);
            }
        }
    });

    socket.on('dobierzKarte', function(roomID) {
        const room = rooms[roomID];
        if (room && room.gameState) {
            const currentPlayer = room.gameState.current_player;
            const result = draw_card(room.gameState, currentPlayer, roomID, room); // Dodaj "room" jako argument
                        if (result.success) {
                io.to(roomID).emit('updateGameState', room.gameState);
            } else {
                socket.emit('error', result.message);
            }
        } else {
            console.log(`Nie znaleziono pokoju o ID: ${roomID} lub brak stanu gry.`);
        }
    });
});

httpServer.listen(3000, () => {
    console.log('Server listening on port 3000');
});