// Fungsi untuk menampilkan kartu di elemen tertentu
function displayCards(elementId, cards) {
  const cardContainer = document.getElementById(elementId);
  cardContainer.innerHTML = cards.map(card => `<img src="${card.image}" alt="${card.code}">`).join('');
}

// Fungsi untuk memulai game ketika halaman di-load
async function startGame() {
  try {
    const response = await fetch('/start-game');
    const gameData = await response.json();

    // Tampilkan kartu player dan dealer di halaman
    displayCards('player-cards', gameData.player);
    displayCards('dealer-cards', gameData.dealer);

    // Kosongkan hasil game jika ada dari permainan sebelumnya
    document.getElementById('result').innerText = '';

    // Aktifkan tombol hit dan stand
    document.getElementById('hit-button').disabled = false;
    document.getElementById('stand-button').disabled = false;
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

// Fungsi untuk memukul (draw kartu baru untuk player)
async function hit() {
  try {
    const response = await fetch('/hit');
    const gameData = await response.json();

    // Tampilkan kartu terbaru player
    displayCards('player-cards', gameData.player);
    
    // Cek apakah player sudah bust (skor lebih dari 21)
    if (calculateScore(gameData.player) > 21) {
      document.getElementById('result').innerText = 'You busted! Dealer wins.';
      endGame();
    }
  } catch (error) {
    console.error('Error drawing card:', error);
  }
}

// Fungsi untuk stand (selesai giliran player, dealer mulai main)
async function stand() {
  try {
    const response = await fetch('/stand');
    const gameData = await response.json();

    // Tampilkan semua kartu dealer
    displayCards('dealer-cards', gameData.dealer);

    // Tampilkan hasil game
    document.getElementById('result').innerText = gameData.result;

    // Akhiri game
    endGame();
  } catch (error) {
    console.error('Error during stand:', error);
  }
}

// Fungsi untuk menghitung skor kartu
function calculateScore(hand) {
  let score = 0;
  let aceCount = 0;

  hand.forEach(card => {
    let value = card.value;
    if (['KING', 'QUEEN', 'JACK'].includes(value)) {
      score += 10;
    } else if (value === 'ACE') {
      score += 11;
      aceCount += 1;
    } else {
      score += parseInt(value);
    }
  });

  // Ubah nilai ACE dari 11 menjadi 1 jika total skor lebih dari 21
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount -= 1;
  }

  return score;
}

// Fungsi untuk menonaktifkan tombol setelah game selesai
function endGame() {
  document.getElementById('hit-button').disabled = true;
  document.getElementById('stand-button').disabled = true;
}

// Tambahkan event listener untuk memulai game ketika halaman pertama kali di-load
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-button').addEventListener('click', startGame);
  document.getElementById('hit-button').addEventListener('click', hit);
  document.getElementById('stand-button').addEventListener('click', stand);
});

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

