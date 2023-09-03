function activate_special_ability(state, player, card_index, io, rooms, roomID) {

    const cards = require('./cards_info.json');

    if (state.current_player !== player || state.players[player].action_points < 1) {
        return false;
    }
    // Ensure the card exists in the player's board
    if (card_index >= 0 && card_index < state.players[player].board.length) {
        const card = state.players[player].board[card_index];
        // Check if the card is "MC"
        if (card.name === "MC") {
            // Collect all cards from both players on the board
            const allCards = state.players[player].board.concat(state.players[state.current_player === 'player1' ? 'player2' : 'player1'].board);
            // Exclude the MC card
            const otherCards = allCards.filter(c => c.name !== "MC");
            // Shuffle the array
            const shuffledCards = otherCards.sort(() => Math.random() - 0.5);
            // Take up to the first 3 cards and set their health to 0
            const cardsToTake = Math.min(3, shuffledCards.length);
            for (let i = 0; i < cardsToTake; i++) {
                shuffledCards[i].health = 0;
            }
            // Remove MC card from the board
            state.players[player].board.splice(card_index, 1);
        }

        else if (card.name === "Kuta") {
            // Get the opponent's player ID
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            // Ensure the opponent has cards on the board
            if (state.players[opponent].board.length > 0) {
                // Choose a random card from the opponent's board
                const randomIndex = Math.floor(Math.random() * state.players[opponent].board.length);
                // Set the chosen card's health to 0
                state.players[opponent].board[randomIndex].health = 0;
            }
        }
        else if (card.name === "Marshal") {
            // Check if "Moczary" card is also on the player's board
            const hasMoczary = state.players[player].board.some(c => c.name === "Moczary");
            if (hasMoczary) {
                // Add the "Pogrzeb" card to the player's board
                state.players[player].board.push({
                    name: "Pogrzeb",
                    attack: 5,
                    health: 5,
                    // Assuming the image and special description are placeholders. 
                    // Update them with actual data if needed.
                    image: "img/pogrzeb.jpg", 
                    special: "Uśmiechnij się!"
                });
            }
        }
        else if (card.name === "Cycu") {
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            // Ensure the opponent has cards on the board
            if (state.players[opponent].board.length > 0) {
                for (let i = 0; i < 1; i++) {
                    if (state.players[opponent].board.length === 0) break; // Break if no more opponent cards
                    const randomIndex = Math.floor(Math.random() * state.players[opponent].board.length);
                    state.players[opponent].board[randomIndex].attack = 0;
                }
            }
        }

        else if (card.name === "Kali") {
            card.attack += 2;
            card.health += 2;
        }

        else if (card.name === "Galik") {
            // Collect all cards from both players on the board
            const allCards = state.players[player].board.concat(state.players[state.current_player === 'player1' ? 'player2' : 'player1'].board);
            // Set attack of all cards to 0
            for (let card of allCards) {
                card.attack = 0;
            }
        }

        else if (card.name === "Siara") {
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            // Ensure the opponent has cards on the board
            if (state.players[opponent].board.length > 0) {
                for (let i = 0; i < 3; i++) {
                    if (state.players[opponent].board.length === 0) break; // Break if no more opponent cards
                    const randomIndex = Math.floor(Math.random() * state.players[opponent].board.length);
                    state.players[opponent].board[randomIndex].health -= 1;
                    if (state.players[opponent].board[randomIndex].health <= 0) {
                        state.players[opponent].board.splice(randomIndex, 1); // Remove the card if its health is 0 or below
                    }
                }
            }
        }

        else if (card.name === "Przemek") {
            state.players[player].board.push({
                name: "Audi",
                attack: 3,
                health: 4,
                image: "img/audi.jpg", // Assuming there's an image named "audi.jpg" for this card
                special: "Beep beep!" // No special ability for the Audi card
            });
        }
        else if (card.name === "Adam") {
            // Jeśli karta na planszy gracza to "Adam", zamieniamy ją na "Dettlaffa"
            state.players[player].board[card_index] = {
                name: "Dettlaff",
                attack: 9,
                health: 1,
                image: "img/dettlaff.jpg",  // Upewnij się, że masz odpowiedni obrazek
                special: "Może przekształcić się w Adama"
            };
        }
        else if (card.name === "Dettlaff") {
            // Jeśli karta na planszy gracza to "Dettlaff", zamieniamy ją na "Adama"
            state.players[player].board[card_index] = {
                name: "Adam",
                attack: 1,   // Bazowe wartości Adama
                health: 9,   // Bazowe wartości Adama
                image: "img/adam.png",  // Upewnij się, że masz odpowiedni obrazek
                special: "Może przekształcić się w Dettlaffa"
            };
        }
        else if (card.name === "Raca") {
            // Dla każdej karty gracza na planszy odbieramy 1 zdrowia i dodajemy +2 do ataku
            for (let playerCard of state.players[player].board) {
                playerCard.health -= 1;
                playerCard.attack += 2;
            }
        }
        
        else if (card.name === "Gabi") {
            // Pobierz wszystkie karty na planszy gracza (oprócz "Gabi")
            const playerBoardCards = state.players[player].board.filter(c => c.name !== "Gabi");
            
            // Jeśli są dostępne karty na planszy gracza
            if (playerBoardCards.length > 0) {
                // Losuj dwie karty z dostępnych kart na planszy gracza
                const shuffledCards = playerBoardCards.sort(() => Math.random() - 0.5);
                const cardsToBoost = Math.min(2, shuffledCards.length);
        
                for (let i = 0; i < cardsToBoost; i++) {
                    // Daj każdej z wylosowanych kart +2 do ataku i +2 do zdrowia
                    shuffledCards[i].attack += 2;
                    shuffledCards[i].health += 2;
                }
            }
        }

        else if (card.name === "Folga") {
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
        
            // Upewnij się, że przeciwnik ma karty na planszy
            if (state.players[opponent].board.length > 0) {
                // Wybierz losową kartę z planszy przeciwnika
                const randomIndex = Math.floor(Math.random() * state.players[opponent].board.length);
                const targetCard = state.players[opponent].board[randomIndex];
        
                // Odejmij 2 punkty ataku i 2 punkty życia od wybranej karty
                targetCard.attack = Math.max(0, targetCard.attack - 2);
                targetCard.health = Math.max(0, targetCard.health - 2);
        
                // Dodaj 2 punkty ataku i 2 punkty życia do karty "Folga"
                card.attack += 2;
                card.health += 2;
            }
        }

        else if (card.name === "Krępa") {
            // Pobierz ID przeciwnika
            const opponent = player === 'player1' ? 'player2' : 'player1';
            
            // Iteruj przez wszystkie karty przeciwnika na planszy
            state.players[opponent].board.forEach(opponentCard => {
                // Zadaj 1 obrażenie
                opponentCard.health -= 1;
            });
        
            // Usuń karty przeciwnika z 0 lub mniej zdrowia
            state.players[opponent].board = state.players[opponent].board.filter(opponentCard => opponentCard.health > 0);
        }

        else if (card.name === "Kokos") {
            // Jeśli karta na planszy gracza to "Kokos", przyzywa on dwa cwele 1/1 na planszę
        
            // Pierwszy cwel
            const cwel1 = {
                name: "Anime dziewczynka",
                attack: 1,
                health: 1,
                image: "img/cwel.jpg",  // Upewnij się, że masz odpowiedni obrazek dla Cwela
                special: "uWu"
            };
        
            // Drugi cwel
            const cwel2 = {
                name: "Cwel",
                attack: 1,
                health: 1,
                image: "img/cwel.jpg",  // Upewnij się, że masz odpowiedni obrazek dla Cwela
                special: "Podwładny Kokosa"
            };
        
            // Dodajemy oba cwele na koniec planszy gracza
            state.players[player].board.push(cwel1, cwel2);
        }
        else if (card.name === "Krystian") {
            // Równouprawnienie: wszystkie karty na stole (zarówno gracza, jak i przeciwnika) mają zdrowie równe atakowi
        
            // Dla kart gracza
            for (let playerCard of state.players[player].board) {
                playerCard.health = playerCard.attack;
            }
        
            // Dla kart przeciwnika
            const opponent = player === 'player1' ? 'player2' : 'player1';
            for (let opponentCard of state.players[opponent].board) {
                opponentCard.health = opponentCard.attack;
            }
        }
        else if (card.name === "Aleks") {
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
        
            // Upewniamy się, że przeciwnik ma karty na planszy
            if (state.players[opponent].board.length > 0) {
                for (let opponentCard of state.players[opponent].board) {
                    if (Math.random() < 0.5) {
                        // 50% szans na zmniejszenie zdrowia o 1
                        opponentCard.health -= 1;
                    } else {
                        // 50% szans na zmniejszenie ataku o 1
                        opponentCard.attack -= 1;
                        if (opponentCard.attack < 0) opponentCard.attack = 0; // Upewniamy się, że wartość ataku nie jest mniejsza niż 0
                    }
                }
            }
        }

        else if (card.name === "Szczepan") {
            // Pobierz ID przeciwnika
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            
            // Oblicz liczbę kart przeciwnika na planszy
            const opponentCardCount = state.players[opponent].board.length;
            
            // Jeśli nie mamy jeszcze bazowej wartości ataku, ustaw ją
            if (card.baseAttack === undefined) {
                card.baseAttack = card.attack;
            }
            
            // Zwiększ atak karty "Szczepan" o liczbę kart przeciwnika na planszy
            card.attack = card.baseAttack + opponentCardCount;
        }

        else if (card.name === "Adamek") {
            // Przeglądamy wszystkie karty na planszy gracza
            for (let playerCard of state.players[player].board) {
                playerCard.attack += 1;  // Dodajemy +1 do ataku każdej karty
            }
        }

        else if (card.name === "Karol Synowiec") {
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            
            // Sprawdzamy, czy przeciwnik ma karty na planszy
            if (state.players[opponent].board.length > 0) {
                // Jeśli tak, wybieramy losową kartę
                const randomIndex = Math.floor(Math.random() * state.players[opponent].board.length);
                const stolenCard = state.players[opponent].board.splice(randomIndex, 1)[0];
                
                // Dodajemy skradzioną kartę do naszej planszy
                state.players[player].board.push(stolenCard);
                
                // Odejmujemy dodatkowy 1 punkt akcji od gracza
                state.players[player].action_points -= 1;
            }
        }
        
        else if (card.name === "Dudul") {
            // Jeśli karta na planszy gracza to "Dudul", dodaj kartę "Joint" do ręki gracza
            state.players[player].hand.push({
                name: "Joint",
                attack: 4,
                health: 4,
                image: "img/joint.jpg",
                special: "*płonie*"
            });
        }

        else if (card.name === "Małpa") {
            // Znajdź kartę z najniższym zdrowiem na planszy gracza
            let lowestHealthCard = null;
            for (let playerCard of state.players[player].board) {
                if (!lowestHealthCard || playerCard.health < lowestHealthCard.health) {
                    lowestHealthCard = playerCard;
                }
            }
        
            // Jeśli znaleziono kartę z najniższym zdrowiem, odnajdź jej bazową wartość zdrowia w cards_info.json
            if (lowestHealthCard) {
                const baseCard = cards.find(c => c.name === lowestHealthCard.name);
                if (baseCard) {
                    lowestHealthCard.health = baseCard.health;
                }
            }
        }

        else if (card.name === "Mazut") {
            // Przyzywanie wózka widłowego dla obu graczy
            const forkliftCard = {
                name: "Wózek widłowy",
                attack: 3,
                health: 3,
                image: "img/wózek.jpg",
                special: "W górę! I w dół!"
            };
        
            state.players[player].board.push(forkliftCard);  // Dodanie wózka dla aktualnego gracza
        
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            state.players[opponent].board.push({ ...forkliftCard });  // Dodanie wózka dla przeciwnika (skopiowanie obiektu)
        }
        
        else if (card.name === "Tulwin") {
            // Losujemy kartę gracza (nie Tulwina) na stole
            const playerBoardCards = state.players[player].board.filter(c => c.name !== "Tulwin");
            if (playerBoardCards.length > 0) {
                const randomIndex = Math.floor(Math.random() * playerBoardCards.length);
                const randomCard = playerBoardCards[randomIndex];
                
                // Karta traci 2 zdrowia
                randomCard.health -= 2;
                
                // Karta zyskuje 5 ataku
                randomCard.attack += 5;
            }
        }


        else if (card.name === "Rudy") {
            // Zwiększamy statystyki wszystkim sojusznikom Rudy'ego na planszy
            for (let ally of state.players[player].board) {
                ally.attack += 2;
                ally.health += 1;
            }
        
            // Przyzywujemy "Hooliganów" na planszę przeciwnika
            const opponent = state.current_player === 'player1' ? 'player2' : 'player1';
            state.players[opponent].board.push({
                name: "Hooligani",
                attack: 3,
                health: 5,
                image: "img/hooligans.jpg",
                special: "Powiedz do kamery że przepraszasz Jeziorak!"  // Jeśli "Hooligani" mają jakąś umiejętność specjalną, można ją tutaj dodać
            });
        }

        else if (card.name === "Suchy") {
            // Jeśli karta na planszy gracza to "Suchy", aktywujemy Próg Podatkowy
            for (let playerCard of state.players[player].board) {
                if (playerCard.health <= 1) {
                    playerCard.health = 0;  // Ustawiamy zdrowie karty na 0, co oznacza, że zostanie usunięta
                }
            }
        
            const opponent = player === 'player1' ? 'player2' : 'player1';
            for (let opponentCard of state.players[opponent].board) {
                if (opponentCard.health <= 1) {
                    opponentCard.health = 0;  // Ustawiamy zdrowie karty na 0, co oznacza, że zostanie usunięta
                }
            }
        }
        
        


        // Reduce the action points for the player
        state.players[player].action_points -= 1;
    }
    
    // Remove cards with 0 or less health from both player's board
    state.players.player1.board = state.players.player1.board.filter(card => card.health > 0);
    state.players.player2.board = state.players.player2.board.filter(card => card.health > 0);
 
    return true;
}

module.exports.activate_special_ability = activate_special_ability;