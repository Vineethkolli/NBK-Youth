// Sort players by time for timer-required games
export const sortPlayersByTime = (players) => {
  return [...players]
    .filter(player => player.timeCompleted)
    .sort((a, b) => a.timeCompleted - b.timeCompleted)
    .slice(0, 3);
};

// Sort players by winner status for non-timer games
export const sortPlayersByWinnerStatus = (players) => {
  const winners = players.filter(player => player.status === 'winner-1st');
  const secondPlace = players.filter(player => player.status === 'winner-2nd');
  const thirdPlace = players.filter(player => player.status === 'winner-3rd');
  
  return [...winners, ...secondPlace, ...thirdPlace];
};

// Get top players based on game type
export const getTopPlayers = (game) => {
  if (game.timerRequired) {
    const topPlayers = sortPlayersByTime(game.players);
    return topPlayers.map(player => ({
      ...player,
      timeCompleted: undefined
    }));
  }
  return sortPlayersByWinnerStatus(game.players);
};
