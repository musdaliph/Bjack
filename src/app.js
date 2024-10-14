const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

let deck_id = '';
let playerHand = [];
let dealerHand = [];

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint to start a new game
app.get('/start-game', async (req, res) => {
  try {
    // 1. Create and shuffle deck
    const deck = await axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    deck_id = deck.data.deck_id;
    
    // 2. Draw 2 cards for player and 2 for dealer
    const drawCards = await axios.get(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=4`);
    const cards = drawCards.data.cards;

    playerHand = cards.slice(0, 2); // Player's hand
    dealerHand = cards.slice(2);    // Dealer's hand

    // 3. Send initial cards back
    res.json({
      player: playerHand,
      dealer: [dealerHand[0]], // Only show one of the dealer's cards
      dealer_hidden: dealerHand[1] // Keep second dealer card hidden
    });
  } catch (error) {
    res.status(500).send('Error starting game');
  }
});

// Endpoint for player hitting (drawing another card)
app.get('/hit', async (req, res) => {
  try {
    const draw = await axios.get(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=1`);
    const card = draw.data.cards[0];
    playerHand.push(card);

    res.json({ player: playerHand });
  } catch (error) {
    res.status(500).send('Error drawing card');
  }
});

// Endpoint for standing (ending player's turn and playing dealer's turn)
app.get('/stand', async (req, res) => {
  try {
    // Reveal dealer's hidden card
    let dealerScore = calculateScore(dealerHand);
    let playerScore = calculateScore(playerHand);

    // Dealer hits until score >= 17
    while (dealerScore < 17) {
      const draw = await axios.get(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=1`);
      dealerHand.push(draw.data.cards[0]);
      dealerScore = calculateScore(dealerHand);
    }

    // Determine the winner
    let result = '';
    if (playerScore > 21) {
      result = 'You lose! Busted.';
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      result = 'You win!';
    } else if (playerScore === dealerScore) {
      result = 'It\'s a tie!';
    } else {
      result = 'Dealer wins!';
    }

    res.json({ dealer: dealerHand, result: result });
  } catch (error) {
    res.status(500).send('Error during dealer turn');
  }
});

// Utility function to calculate hand score
function calculateScore(hand) {
  let values = hand.map(card => {
    if (['KING', 'QUEEN', 'JACK'].includes(card.value)) return 10;
    if (card.value === 'ACE') return 11;
    return parseInt(card.value);
  });

  let score = values.reduce((a, b) => a + b, 0);

  // Handle Aces being 1 or 11
  values.forEach(value => {
    if (score > 21 && value === 11) score -= 10;
  });

  return score;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

