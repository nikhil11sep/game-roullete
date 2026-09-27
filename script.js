const wheel = document.getElementById('wheel');
const resultNumber = document.getElementById('resultNumber');
const wheelCenterNumber = document.getElementById('wheelCenterNumber');
const resultColor = document.getElementById('resultColor');
const resultWinners = document.getElementById('resultWinners');
const activePlayerName = document.getElementById('activePlayerName');
const topSpinStatsValue = document.getElementById('topSpinStatsValue');
const totalProfitStats = document.getElementById('totalProfitStats');
const totalProfitStatsValue = document.getElementById('totalProfitStatsValue');
const playerCards = document.getElementById('playerCards');
const rouletteBoard = document.getElementById('rouletteBoard');
const betList = document.getElementById('betList');
const historyList = document.getElementById('historyList');
const betAmountInput = document.getElementById('betAmount');
const clearBetsBtn = document.getElementById('clearBetsBtn');
const repeatBetsBtn = document.getElementById('repeatBetsBtn');
const placeBetBtn = document.getElementById('placeBetBtn');
const spinBtn = document.getElementById('spinBtn');
const spinSummary = document.getElementById('spinSummary');
const redProbability = document.getElementById('redProbability');
const blackProbability = document.getElementById('blackProbability');
const zeroProbability = document.getElementById('zeroProbability');
const redCount = document.getElementById('redCount');
const blackCount = document.getElementById('blackCount');
const zeroCount = document.getElementById('zeroCount');
const oddProbability = document.getElementById('oddProbability');
const evenProbability = document.getElementById('evenProbability');
const oddCount = document.getElementById('oddCount');
const evenCount = document.getElementById('evenCount');
const lowProbability = document.getElementById('lowProbability');
const highProbability = document.getElementById('highProbability');
const lowCount = document.getElementById('lowCount');
const highCount = document.getElementById('highCount');
const sampleSizeLabel = document.getElementById('sampleSizeLabel');
const applyInitialBalancesBtn = document.getElementById('applyInitialBalancesBtn');
const cornerBetBtn = document.getElementById('cornerBetBtn');
const cornerBetHelp = document.getElementById('cornerBetHelp');

const numberSequence = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const state = {
  players: [
    { id: 'player-1', name: 'Nikhil', balance: 200, profit: 0, loss: 0, bets: [] },
    { id: 'player-2', name: 'Pallavi', balance: 200, profit: 0, loss: 0, bets: [] },
    { id: 'player-3', name: 'Harshita', balance: 200, profit: 0, loss: 0, bets: [] },
    { id: 'player-4', name: 'Bansal', balance: 200, profit: 0, loss: 0, bets: [] }
  ],
  currentPlayerId: 'player-1',
  selectedNumber: null,
  cornerBetMode: false,
  cornerNumbers: [],
  activeBet: { type: 'color', value: 'red' },
  spinInProgress: false,
  wheelRotation: 0,
  history: [],
  sample: {
    red: 0,
    black: 0,
    green: 0,
    odd: 0,
    even: 0,
    low: 0,
    high: 0,
    total: 0
  }
};

function getColor(number) {
  if (number === 0) return 'green';
  return number % 2 === 0 ? 'black' : 'red';
}

function getRandomWinningNumber() {
  const randomValues = new Uint32Array(1);
  const rangeSize = 2 ** 32;
  const unbiasedRange = rangeSize - (rangeSize % 37);

  do {
    crypto.getRandomValues(randomValues);
  } while (randomValues[0] >= unbiasedRange);

  return randomValues[0] % 37;
}

function getNumbersForBet(bet) {
  if (bet.type === 'straight') return [bet.number];
  if (bet.type === 'corner') return [...(bet.numbers || [])];
  if (bet.type === 'color') {
    return Array.from({ length: 37 }, (_, number) => number)
      .filter((number) => getColor(number) === bet.value);
  }
  if (bet.type === 'parity') {
    return Array.from({ length: 37 }, (_, number) => number)
      .filter((number) => number > 0 && (bet.value === 'odd' ? number % 2 === 1 : number % 2 === 0));
  }
  if (bet.type === 'range') {
    return Array.from({ length: 37 }, (_, number) => number)
      .filter((number) => bet.value === 'low' ? number >= 1 && number <= 18 : number >= 19 && number <= 36);
  }
  if (bet.type === 'dozen') {
    const start = (Number(bet.value) - 1) * 12 + 1;
    return Array.from({ length: 12 }, (_, index) => start + index);
  }
  if (bet.type === 'column') {
    return Array.from({ length: 12 }, (_, index) => index * 3 + Number(bet.value));
  }
  return [];
}

function formatCurrency(value) {
  return `$${value}`;
}

function getCurrentPlayer() {
  return state.players.find((player) => player.id === state.currentPlayerId);
}

function getAllBets() {
  return state.players.flatMap((player) => player.bets);
}

function runInitialProbabilitySample() {
  const sampledSpins = [];
  for (let spin = 0; spin < 1000; spin += 1) {
    const number = Math.floor(Math.random() * 37);
    sampledSpins.push({
      number,
      color: getColor(number),
      bets: [],
      isSample: true
    });
    state.sample[getColor(number)] += 1;
    if (number > 0) {
      state.sample[number % 2 === 1 ? 'odd' : 'even'] += 1;
      state.sample[number <= 18 ? 'low' : 'high'] += 1;
    }
    state.sample.total += 1;
  }

  state.history = sampledSpins.slice(-20).reverse();
  renderHistory();
  renderSampleStatistics();
}

function renderSampleStatistics() {
  const percentage = (count, total = state.sample.total) =>
    `${(total ? (count / total) * 100 : 0).toFixed(1)}%`;
  const nonZeroTotal = state.sample.total - state.sample.green;
  redProbability.textContent = percentage(state.sample.red);
  blackProbability.textContent = percentage(state.sample.black);
  zeroProbability.textContent = percentage(state.sample.green);
  oddProbability.textContent = percentage(state.sample.odd, nonZeroTotal);
  evenProbability.textContent = percentage(state.sample.even, nonZeroTotal);
  lowProbability.textContent = percentage(state.sample.low, nonZeroTotal);
  highProbability.textContent = percentage(state.sample.high, nonZeroTotal);
  redCount.textContent = `${state.sample.red} of ${state.sample.total}`;
  blackCount.textContent = `${state.sample.black} of ${state.sample.total}`;
  zeroCount.textContent = `${state.sample.green} of ${state.sample.total}`;
  oddCount.textContent = `${state.sample.odd} of ${nonZeroTotal}`;
  evenCount.textContent = `${state.sample.even} of ${nonZeroTotal}`;
  lowCount.textContent = `${state.sample.low} of ${nonZeroTotal}`;
  highCount.textContent = `${state.sample.high} of ${nonZeroTotal}`;
  sampleSizeLabel.textContent = `${state.sample.total} spins sampled`;
}

function recordSpinInSample(number) {
  state.sample[getColor(number)] += 1;
  if (number > 0) {
    state.sample[number % 2 === 1 ? 'odd' : 'even'] += 1;
    state.sample[number <= 18 ? 'low' : 'high'] += 1;
  }
  state.sample.total += 1;
  renderSampleStatistics();
}

function formatBetLabel(bet) {
  if (bet.type === 'straight') return `Number ${bet.number}`;
  if (bet.type === 'corner') return `Corner ${bet.numbers.join(', ')}`;
  if (bet.type === 'color') return bet.value === 'red' ? 'Red' : 'Black';
  if (bet.type === 'parity') return bet.value === 'odd' ? 'Odd' : 'Even';
  if (bet.type === 'range') return bet.value === 'low' ? 'Low (1-18)' : 'High (19-36)';
  if (bet.type === 'dozen') return `Dozen ${bet.value}`;
  if (bet.type === 'column') return `Column ${bet.value}`;
  return 'Bet';
}

function buildRouletteBoard() {
  const createNumberCell = (number) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = `board-cell ${number === 0 ? 'green' : getColor(number)}`;
    cell.textContent = number;
    cell.dataset.number = String(number);
    cell.addEventListener('click', () => {
      if (state.cornerBetMode) {
        toggleCornerNumber(number);
        return;
      }
      state.activeBet = { type: 'straight', value: 'straight' };
      state.selectedNumber = number;
      updateSelectedNumberCell();
    });
    return cell;
  };

  const zeroCell = createNumberCell(0);
  zeroCell.classList.add('board-zero-cell');
  rouletteBoard.appendChild(zeroCell);

  for (let column = 0; column < 12; column += 1) {
    [1, 2, 3].forEach((row) => {
      const cell = createNumberCell(column * 3 + row);
      cell.style.gridColumn = String(column + 2);
      cell.style.gridRow = String(row);
      rouletteBoard.appendChild(cell);
    });
  }

  [1, 2, 3].forEach((columnNumber) => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'bet-choice board-row-choice';
    marker.dataset.type = 'column';
    marker.dataset.value = String(columnNumber);
    marker.textContent = '2 to 1';
    marker.style.gridColumn = '14';
    marker.style.gridRow = String(columnNumber);
    marker.addEventListener('click', () => setActiveBetType(marker));
    rouletteBoard.appendChild(marker);
  });

  const outsideBets = [
    { label: '1 to 18', type: 'range', value: 'low' },
    { label: 'Even', type: 'parity', value: 'even' },
    { label: 'Red', type: 'color', value: 'red' },
    { label: 'Black', type: 'color', value: 'black' },
    { label: 'Odd', type: 'parity', value: 'odd' },
    { label: '19 to 36', type: 'range', value: 'high' }
  ];

  outsideBets.forEach((bet, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `bet-choice board-outside-choice ${bet.value === 'red' ? 'outside-red' : bet.value === 'black' ? 'outside-black' : ''}`;
    button.dataset.type = bet.type;
    button.dataset.value = bet.value;
    button.textContent = bet.label;
    button.style.gridColumn = `${2 + index * 2} / span 2`;
    button.addEventListener('click', () => setActiveBetType(button));
    rouletteBoard.appendChild(button);
  });

  [
    { label: '1st 12', value: '1' },
    { label: '2nd 12', value: '2' },
    { label: '3rd 12', value: '3' }
  ].forEach((dozen, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bet-choice board-dozen-choice';
    button.dataset.type = 'dozen';
    button.dataset.value = dozen.value;
    button.textContent = dozen.label;
    button.style.gridColumn = `${2 + index * 4} / span 4`;
    button.addEventListener('click', () => setActiveBetType(button));
    rouletteBoard.appendChild(button);
  });
}

function createWheelLabels() {
  const sectorSize = 360 / numberSequence.length;
  const stops = numberSequence.flatMap((number, index) => {
    const start = index * sectorSize;
    const end = (index + 1) * sectorSize;
    const color = number === 0 ? '#159957' : getColor(number) === 'red' ? '#c9363e' : '#111111';
    return [`${color} ${start}deg`, `${color} ${end}deg`];
  });
  wheel.style.background = `conic-gradient(${stops.join(', ')})`;

  const wheelLabels = numberSequence.map((number, index) => {
    const label = document.createElement('div');
    label.className = 'wheel-number';
    label.textContent = number;
    label.style.setProperty('--angle', `${sectorSize * (index + 0.5)}deg`);
    label.style.color = number === 0 ? '#dfffee' : getColor(number) === 'red' ? '#ffe3e3' : '#f3f4f6';
    return label;
  });

  wheelLabels.forEach((label) => wheel.appendChild(label));
}

function updateSelectedNumberCell() {
  document.querySelectorAll('.board-cell').forEach((cell) => {
    const isSelected = Number(cell.dataset.number) === state.selectedNumber;
    cell.classList.toggle('selected', isSelected);
    cell.classList.toggle('corner-selected', state.cornerNumbers.includes(Number(cell.dataset.number)));
  });
}

function isValidCornerSelection(numbers) {
  if (numbers.length !== 4 || numbers.includes(0)) return false;

  const rows = [...new Set(numbers.map((number) => ((number - 1) % 3) + 1))].sort();
  const columns = [...new Set(numbers.map((number) => Math.floor((number - 1) / 3)))].sort();
  if (rows.length !== 2 || columns.length !== 2 || rows[1] !== rows[0] + 1 || columns[1] !== columns[0] + 1) {
    return false;
  }

  return rows.every((row) => columns.every((column) => numbers.includes(column * 3 + row)));
}

function updateCornerBetMode() {
  cornerBetBtn.textContent = `Corner bet: ${state.cornerBetMode ? 'On' : 'Off'}`;
  cornerBetBtn.setAttribute('aria-pressed', String(state.cornerBetMode));
  cornerBetBtn.classList.toggle('active', state.cornerBetMode);
  rouletteBoard.classList.toggle('corner-bet-mode', state.cornerBetMode);
  if (!state.cornerBetMode) {
    cornerBetHelp.textContent = 'Select four adjacent numbers to make a corner bet. Pays 8:1.';
  } else if (state.cornerNumbers.length === 4 && isValidCornerSelection(state.cornerNumbers)) {
    cornerBetHelp.textContent = `Corner ready: ${state.cornerNumbers.join(', ')}. Pays 8:1.`;
  } else if (state.cornerNumbers.length === 4) {
    cornerBetHelp.textContent = 'These numbers do not form a corner. Click selected numbers to change them.';
  } else {
    cornerBetHelp.textContent = `Select four adjacent numbers (${state.cornerNumbers.length}/4). Pays 8:1.`;
  }
}

function toggleCornerNumber(number) {
  if (number === 0) {
    cornerBetHelp.textContent = 'Zero cannot be included in a corner bet.';
    return;
  }

  const selectedIndex = state.cornerNumbers.indexOf(number);
  if (selectedIndex >= 0) {
    state.cornerNumbers.splice(selectedIndex, 1);
  } else if (state.cornerNumbers.length < 4) {
    state.cornerNumbers.push(number);
  } else {
    cornerBetHelp.textContent = 'Four numbers are selected. Click a selected number to change it.';
    return;
  }

  updateCornerBetMode();
  updateSelectedNumberCell();
}

function toggleCornerBetMode() {
  state.cornerBetMode = !state.cornerBetMode;
  state.cornerNumbers = [];
  state.selectedNumber = null;
  if (state.cornerBetMode) {
    state.activeBet = { type: 'corner', value: 'corner' };
  } else {
    state.activeBet = { type: 'straight', value: 'straight' };
  }
  updateCornerBetMode();
  updateSelectedNumberCell();
}

function updateWinningNumberCell(number, winnerInitials = []) {
  document.querySelectorAll('.board-cell').forEach((cell) => {
    const isWinningCell = Number(cell.dataset.number) === number;
    cell.classList.toggle('winning-number', isWinningCell);
    if (isWinningCell && winnerInitials.length) {
      cell.dataset.winners = winnerInitials.join(' ');
    } else {
      delete cell.dataset.winners;
    }
  });
}

function updateBetHighlights() {
  const coveredNumbers = new Set(
    getCurrentPlayer().bets.flatMap((bet) => getNumbersForBet(bet))
  );
  const hasPlacedBets = getCurrentPlayer().bets.length > 0;

  document.querySelectorAll('.board-cell').forEach((cell) => {
    const number = Number(cell.dataset.number);
    const isCovered = coveredNumbers.has(number);

    cell.classList.toggle('bet-covered', isCovered);
    cell.classList.toggle('bet-uncovered', hasPlacedBets && !isCovered);
    cell.setAttribute('aria-hidden', 'false');
  });
}

function renderBalance() {
  const player = getCurrentPlayer();
  activePlayerName.textContent = player.name;
  renderTotalProfit();
}

function renderTotalProfit() {
  const totalProfit = state.players.reduce(
    (total, player) => total + player.profit - player.loss,
    0
  );
  totalProfitStatsValue.textContent = totalProfit === 0
    ? formatCurrency(0)
    : `${totalProfit > 0 ? '+' : '-'}${formatCurrency(Math.abs(totalProfit))}`;
  totalProfitStats.className = `top-spin-stats ${totalProfit > 0 ? 'win' : totalProfit < 0 ? 'loss' : ''}`;
}

function updateInitialBalanceNames() {
  document.querySelectorAll('.initial-balance-player-name').forEach((nameElement) => {
    const player = state.players.find((candidate) => candidate.id === nameElement.dataset.playerId);
    if (player) nameElement.textContent = player.name;
  });
}

function applyInitialBalances() {
  if (state.spinInProgress) return;
  if (getAllBets().length) {
    alert('Clear all active bets before changing initial balances.');
    return;
  }

  const inputs = [...document.querySelectorAll('.initial-balance-input')];
  const balances = inputs.map((input) => Number(input.value));
  if (balances.some((balance) => !Number.isInteger(balance) || balance < 0 || balance > 1000000)) {
    alert('Enter a whole-number balance from $0 to $1,000,000 for every player.');
    return;
  }

  state.players.forEach((player, index) => {
    player.balance = balances[index];
    player.profit = 0;
    player.loss = 0;
  });

  renderBalance();
  renderPlayers();
  renderBetList();
  updateBetHighlights();
}

function renderPlayers() {
  playerCards.innerHTML = '';

  state.players.forEach((player) => {
    const card = document.createElement('div');
    card.className = `player-card ${player.id === state.currentPlayerId ? 'active' : ''}`;
    card.addEventListener('click', () => {
      if (state.spinInProgress) return;
      state.currentPlayerId = player.id;
      renderPlayers();
      renderBalance();
      renderBetList();
      updateBetHighlights();
    });

    card.innerHTML = `
      <input class="player-name-input" type="text" value="${player.name}" maxlength="24" aria-label="${player.name} name" />
      <strong>${formatCurrency(player.balance)}</strong>
      <span class="player-card-stats">
        <span class="profit">+$${player.profit}</span>
        <span class="loss">-$${player.loss}</span>
      </span>
      <small>${player.bets.length} active bet${player.bets.length === 1 ? '' : 's'}</small>
    `;

    const nameInput = card.querySelector('.player-name-input');
    nameInput.addEventListener('click', (event) => event.stopPropagation());
    nameInput.addEventListener('input', () => {
      player.name = nameInput.value;
      nameInput.setAttribute('aria-label', `${player.name || 'Player'} name`);
      updateInitialBalanceNames();
      if (player.id === state.currentPlayerId) {
        renderBalance();
      }
    });
    nameInput.addEventListener('blur', () => {
      const trimmedName = nameInput.value.trim();
      player.name = trimmedName || `Player ${state.players.indexOf(player) + 1}`;
      renderPlayers();
      renderBalance();
    });

    playerCards.appendChild(card);
  });

  updateInitialBalanceNames();
}

function renderBetList() {
  const bets = state.players.flatMap((player) => (
    player.bets.map((bet) => ({ player, bet }))
  ));
  betList.innerHTML = '';
  repeatBetsBtn.disabled = !state.history[0]?.bets?.length || state.spinInProgress;

  if (!bets.length) {
    const emptyRow = document.createElement('li');
    emptyRow.className = 'bet-item';
    emptyRow.innerHTML = '<span>No bets placed</span><span>—</span>';
    betList.appendChild(emptyRow);
    return;
  }

  bets.forEach(({ player, bet }) => {
    const item = document.createElement('li');
    item.className = 'bet-item';
    const details = document.createElement('span');
    details.className = 'bet-details';
    details.innerHTML = `<span><strong>${player.name}</strong> · ${formatBetLabel(bet)}</span><span>${formatCurrency(bet.amount)}</span>`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-bet-btn';
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('aria-label', `Remove ${player.name}'s ${formatBetLabel(bet)} bet`);
    removeButton.addEventListener('click', () => removeBet(player.id, bet.id));

    item.append(details, removeButton);
    betList.appendChild(item);
  });

}

function renderHistory() {
  historyList.innerHTML = '';

  state.history.slice(0, 20).forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const badge = document.createElement('span');
    badge.className = `history-badge ${entry.color}`;
    badge.textContent = entry.number;
    item.appendChild(badge);

    const details = document.createElement('div');
    details.className = 'history-details';

    const result = document.createElement('strong');
    result.textContent = `${entry.number} • ${entry.color}`;
    details.appendChild(result);

    const bets = document.createElement('div');
    bets.className = 'history-bets';
    entry.bets.forEach((bet) => {
      const betLine = document.createElement('span');
      betLine.className = `history-bet ${bet.won ? 'won' : 'lost'}`;
      betLine.textContent = `${bet.playerName}: ${formatBetLabel(bet)} ${formatCurrency(bet.amount)} • ${bet.won ? `Won ${formatCurrency(bet.profit)}` : `Lost ${formatCurrency(bet.amount)}`}`;
      bets.appendChild(betLine);
    });
    if (entry.isSample) {
      const sampleLabel = document.createElement('span');
      sampleLabel.className = 'history-bet';
      sampleLabel.textContent = 'Initial sample';
      bets.appendChild(sampleLabel);
    }
    details.appendChild(bets);
    item.appendChild(details);

    historyList.appendChild(item);
  });
}

function setActiveBetType(button) {
  if (state.cornerBetMode) {
    state.cornerBetMode = false;
    state.cornerNumbers = [];
    updateCornerBetMode();
  }
  document.querySelectorAll('.bet-choice').forEach((element) => {
    element.classList.toggle('active', element === button);
  });

  state.activeBet = {
    type: button.dataset.type,
    value: button.dataset.value
  };

  if (button.dataset.type !== 'straight') {
    state.selectedNumber = null;
    updateSelectedNumberCell();
  }
}

function placeCurrentBet() {
  const amount = Number(betAmountInput.value);
  const player = getCurrentPlayer();

  if (!Number.isFinite(amount) || amount <= 0) {
    alert('Choose a valid bet amount.');
    return;
  }

  if (amount > player.balance) {
    alert('You do not have enough balance for that bet.');
    return;
  }

  if (state.activeBet.type === 'straight' && state.selectedNumber === null) {
    alert('Select a number before placing a straight bet.');
    return;
  }
  if (state.activeBet.type === 'corner' && !isValidCornerSelection(state.cornerNumbers)) {
    alert('Select exactly four numbers that form a corner on the roulette table.');
    return;
  }

  const newBet = {
    id: Date.now() + Math.random(),
    type: state.activeBet.type,
    value: state.activeBet.value,
    amount,
    number: state.activeBet.type === 'straight' ? state.selectedNumber : null,
    numbers: state.activeBet.type === 'corner' ? [...state.cornerNumbers] : null
  };

  player.bets.push(newBet);
  player.balance -= amount;
  if (state.activeBet.type === 'corner') {
    state.cornerBetMode = false;
    state.cornerNumbers = [];
    state.activeBet = { type: 'straight', value: 'straight' };
    updateCornerBetMode();
    updateSelectedNumberCell();
  }
  renderBalance();
  renderBetList();
  renderPlayers();
  updateBetHighlights();
  betAmountInput.focus();
}

function spinWheel() {
  if (state.spinInProgress || !getAllBets().length) return;

  state.spinInProgress = true;
  spinBtn.disabled = true;
  spinSummary.textContent = 'Spinning...';
  spinSummary.className = 'spin-summary';
  wheelCenterNumber.textContent = '--';
  updateWinningNumberCell(null);

  const winningNumber = getRandomWinningNumber();
  const winningColor = getColor(winningNumber);
  const winningIndex = numberSequence.indexOf(winningNumber);
  const sectorSize = 360 / numberSequence.length;
  const winningSectorCenter = (winningIndex + 0.5) * sectorSize;
  const currentRotation = ((state.wheelRotation % 360) + 360) % 360;
  const alignmentRotation = (360 - ((currentRotation + winningSectorCenter) % 360)) % 360;
  const fullRotations = 6 + Math.floor(Math.random() * 3);
  state.wheelRotation += 360 * fullRotations + alignmentRotation;

  wheel.style.transform = `rotate(${state.wheelRotation}deg)`;

  setTimeout(() => {
    resultNumber.textContent = `${winningNumber}`;
    wheelCenterNumber.textContent = `${winningNumber}`;

    const spinInfo = settleBets(winningNumber);
    const winnerNames = [...new Set(
      spinInfo.betResults
        .filter((bet) => bet.won)
        .map((bet) => bet.playerName.trim() || 'Player')
    )];
    const hasWinningBet = winnerNames.length > 0;
    resultColor.textContent = hasWinningBet ? 'Huraahh!' : 'Kat gaya';
    resultColor.style.color = hasWinningBet ? '#bff7d5' : '#ffc1c1';
    resultWinners.textContent = hasWinningBet ? `Winning players: ${winnerNames.join(', ')}` : '';
    const winnerInitials = winnerNames.map((name) => name.charAt(0).toUpperCase());
    updateWinningNumberCell(winningNumber, winnerInitials);
    recordSpinInSample(winningNumber);
    state.history.unshift({
      number: winningNumber,
      color: winningColor,
      bets: spinInfo.betResults,
      isSample: false
    });
    state.history = state.history.slice(0, 20);

    if (spinInfo.totalWin > 0) {
      spinSummary.textContent = `Players won ${formatCurrency(spinInfo.totalWin)} total profit. Total return: ${formatCurrency(spinInfo.totalPayout)}.`;
      spinSummary.className = 'spin-summary win';
      topSpinStatsValue.textContent = `Won ${formatCurrency(spinInfo.totalWin)}`;
      topSpinStatsValue.parentElement.className = 'top-spin-stats win';
    } else if (spinInfo.totalLoss > 0) {
      spinSummary.textContent = `Players lost ${formatCurrency(spinInfo.totalLoss)} total on this spin.`;
      spinSummary.className = 'spin-summary loss';
      topSpinStatsValue.textContent = `Lost ${formatCurrency(spinInfo.totalLoss)}`;
      topSpinStatsValue.parentElement.className = 'top-spin-stats loss';
    } else {
      spinSummary.textContent = 'This spin was a complete loss. No winnings this round.';
      spinSummary.className = 'spin-summary loss';
      topSpinStatsValue.textContent = 'No money won';
      topSpinStatsValue.parentElement.className = 'top-spin-stats loss';
    }

    renderHistory();
    renderBalance();
    renderBetList();
    renderPlayers();

    setTimeout(() => {
      state.spinInProgress = false;
      spinBtn.disabled = false;
      renderBetList();
    }, 600);
  }, 3000);
}

function getPayoutMultiplier(bet, winningNumber) {
  if (bet.type === 'straight') return bet.number === winningNumber ? 35 : 0;
  if (bet.type === 'corner') return bet.numbers.includes(winningNumber) ? 8 : 0;
  if (bet.type === 'color') return getColor(winningNumber) === bet.value ? 1 : 0;
  if (bet.type === 'parity') {
    if (winningNumber === 0) return 0;
    if (bet.value === 'odd') return winningNumber % 2 === 1 ? 1 : 0;
    return winningNumber % 2 === 0 ? 1 : 0;
  }
  if (bet.type === 'range') {
    if (winningNumber === 0) return 0;
    if (bet.value === 'low') return winningNumber <= 18 ? 1 : 0;
    return winningNumber >= 19 ? 1 : 0;
  }
  if (bet.type === 'dozen') {
    if (winningNumber === 0) return 0;
    const dozen = winningNumber <= 12 ? 1 : winningNumber <= 24 ? 2 : 3;
    return Number(bet.value) === dozen ? 2 : 0;
  }
  if (bet.type === 'column') {
    if (winningNumber === 0) return 0;
    const column = ((winningNumber - 1) % 3) + 1;
    return Number(bet.value) === column ? 2 : 0;
  }
  return 0;
}

function settleBets(winningNumber) {
  let totalWin = 0;
  let totalLoss = 0;
  let totalPayout = 0;
  const betResults = [];

  state.players.forEach((player) => {
    const settledBets = [...player.bets];
    player.bets = [];

    settledBets.forEach((bet) => {
      const payoutMultiplier = getPayoutMultiplier(bet, winningNumber);
      if (payoutMultiplier > 0) {
        const winnings = bet.amount * (payoutMultiplier + 1);
        player.balance += winnings;
        player.profit += winnings - bet.amount;
        totalWin += winnings - bet.amount;
        totalPayout += winnings;
        betResults.push({
          ...bet,
          playerId: player.id,
          playerName: player.name,
          won: true,
          profit: winnings - bet.amount
        });
      } else {
        player.loss += bet.amount;
        totalLoss += bet.amount;
        betResults.push({
          ...bet,
          playerId: player.id,
          playerName: player.name,
          won: false,
          profit: 0
        });
      }
    });
  });

  state.selectedNumber = null;
  updateSelectedNumberCell();
  updateBetHighlights();
  renderBalance();
  renderBetList();

  return {
    totalWin,
    totalLoss,
    totalPayout,
    betResults
  };
}

function repeatPreviousBets() {
  if (state.spinInProgress) return;

  const previousBets = state.history[0]?.bets || [];
  if (!previousBets.length) {
    alert('There are no previous bets to repeat.');
    return;
  }

  const requiredByPlayer = new Map();
  previousBets.forEach((bet) => {
    requiredByPlayer.set(
      bet.playerId,
      (requiredByPlayer.get(bet.playerId) || 0) + bet.amount
    );
  });

  for (const [playerId, requiredAmount] of requiredByPlayer) {
    const player = state.players.find((candidate) => candidate.id === playerId);
    if (!player || requiredAmount > player.balance) {
      alert('One or more players do not have enough balance to repeat their bets.');
      return;
    }
  }

  previousBets.forEach((previousBet) => {
    const player = state.players.find((candidate) => candidate.id === previousBet.playerId);
    if (!player) return;

    player.bets.push({
      id: Date.now() + Math.random(),
      type: previousBet.type,
      value: previousBet.value,
      amount: previousBet.amount,
      number: previousBet.number,
      numbers: previousBet.numbers ? [...previousBet.numbers] : null
    });
    player.balance -= previousBet.amount;
  });

  renderPlayers();
  renderBalance();
  renderBetList();
  updateBetHighlights();
}

function clearBets() {
  const player = getCurrentPlayer();
  const refund = player.bets.reduce((total, bet) => total + bet.amount, 0);
  player.bets = [];
  player.balance += refund;
  renderBalance();
  renderPlayers();
  updateBetHighlights();
  renderBetList();
}

function removeBet(playerId, betId) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return;
  const betIndex = player.bets.findIndex((bet) => bet.id === betId);
  if (betIndex === -1) return;

  const [removedBet] = player.bets.splice(betIndex, 1);
  player.balance += removedBet.amount;
  renderBalance();
  renderPlayers();
  updateBetHighlights();
  renderBetList();
}

document.querySelectorAll('.bet-choice').forEach((button) => {
  button.addEventListener('click', () => setActiveBetType(button));
});

placeBetBtn.addEventListener('click', placeCurrentBet);
spinBtn.addEventListener('click', spinWheel);
clearBetsBtn.addEventListener('click', clearBets);
repeatBetsBtn.addEventListener('click', repeatPreviousBets);
applyInitialBalancesBtn.addEventListener('click', applyInitialBalances);
cornerBetBtn.addEventListener('click', toggleCornerBetMode);

createWheelLabels();
buildRouletteBoard();
renderPlayers();
renderBalance();
renderBetList();
renderHistory();
updateSelectedNumberCell();
updateBetHighlights();
window.requestAnimationFrame(runInitialProbabilitySample);
