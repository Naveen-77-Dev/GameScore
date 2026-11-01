
import { useEffect, useState } from "react";
import {
  Trophy,
  Plus,
  Undo2,
  RotateCcw,
  Users,
  Spade,
  Trash2,
  Settings,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  History,
  Flag,
  Medal,
  AlertCircle
} from "lucide-react";
import "./App.css";

const STORAGE_KEY = "rummy-callbreak-data";

const defaultRummyPlayers = ["Player 1", "Player 2"];
const defaultCallBreakPlayers = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4"
];

function loadSavedData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function App() {
  const [savedData] = useState(loadSavedData);

  const [game, setGame] = useState(savedData.game || "rummy");
  const [players, setPlayers] = useState(
    Array.isArray(savedData.players)
      ? savedData.players
      : defaultRummyPlayers
  );

  const [scores, setScores] = useState(savedData.scores || {});
  const [rounds, setRounds] = useState(savedData.rounds || []);
  const [inputs, setInputs] = useState(savedData.inputs || {});
  const [bidInputs, setBidInputs] = useState(savedData.bidInputs || {});

  const [limit, setLimit] = useState(savedData.limit || 101);
  const [isStarted, setIsStarted] = useState(
    savedData.isStarted || false
  );
  const [isEnded, setIsEnded] = useState(
    savedData.isEnded || false
  );

  const [showSettings, setShowSettings] = useState(false);
  const [expandedRound, setExpandedRound] = useState(null);

  // Save the complete game whenever its data changes.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          game,
          players,
          scores,
          rounds,
          inputs,
          bidInputs,
          limit,
          isStarted,
          isEnded
        })
      );
    } catch (error) {
      console.error("Could not save game data:", error);
    }
  }, [
    game,
    players,
    scores,
    rounds,
    inputs,
    bidInputs,
    limit,
    isStarted,
    isEnded
  ]);

  const total = (name) => Number(scores[name] || 0);

  // Determine player status.
  const isEliminated = (player) =>
    game === "rummy" && total(player) >= limit;

  const isPlaying = (player) =>
    !isEnded && !isEliminated(player);

  // Calculate final winners.
  const getWinners = () => {
    if (!players.length) return [];

    let eligiblePlayers = players.filter(
      (player) => !isEliminated(player)
    );

    if (eligiblePlayers.length === 0) {
      eligiblePlayers = [...players];
    }

    const winningScore =
      game === "rummy"
        ? Math.min(...eligiblePlayers.map(total))
        : Math.max(...eligiblePlayers.map(total));

    return eligiblePlayers.filter(
      (player) => total(player) === winningScore
    );
  };

  const winners = isEnded ? getWinners() : [];

  const getRankedPlayers = () => {
    return [...players].sort((a, b) => {
      if (game === "rummy") {
        return total(a) - total(b);
      }
      return total(b) - total(a);
    });
  };

  // Rename players before the game starts.
  const renamePlayer = (index, newName) => {
    const oldName = players[index];

    setPlayers((prev) =>
      prev.map((player, i) =>
        i === index ? newName : player
      )
    );

    if (oldName === newName) return;

    const renameKey = (object) => {
      const next = { ...object };

      if (
        Object.prototype.hasOwnProperty.call(next, oldName)
      ) {
        next[newName] = next[oldName];
        delete next[oldName];
      }

      return next;
    };

    setScores(renameKey);
    setInputs(renameKey);
    setBidInputs(renameKey);

    setRounds((prev) =>
      prev.map((round) => ({
        ...round,
        changes: renameKey(round.changes || {})
      }))
    );
  };

  // Add player.
  const addPlayer = () => {
    const maximum = game === "rummy" ? 20 : 4;

    if (players.length >= maximum) return;

    let number = 1;
    let name = `Player ${number}`;

    while (players.includes(name)) {
      number++;
      name = `Player ${number}`;
    }

    setPlayers((prev) => [...prev, name]);
  };

  // Remove player.
  const removePlayer = (name) => {
    const minimum = game === "rummy" ? 2 : 3;

    if (players.length <= minimum) {
      alert(`At least ${minimum} players are required.`);
      return;
    }

    if (!window.confirm(`Remove ${name}?`)) return;

    setPlayers((prev) =>
      prev.filter((player) => player !== name)
    );

    setScores((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    setInputs((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    setBidInputs((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // Start game.
  const startGame = () => {
    const cleanedNames = players.map(
      (player, index) =>
        player.trim() || `Player ${index + 1}`
    );

    const normalizedNames = cleanedNames.map(
      (name) => name.toLowerCase()
    );

    if (
      new Set(normalizedNames).size !== cleanedNames.length
    ) {
      alert("Player names must be unique.");
      return;
    }

    if (
      game === "callbreak" &&
      players.length !== 3 &&
      players.length !== 4
    ) {
      alert("Call Break requires 3 or 4 players.");
      return;
    }

    setPlayers(cleanedNames);
    setScores({});
    setRounds([]);
    setInputs({});
    setBidInputs({});
    setIsEnded(false);
    setIsStarted(true);
  };

  // Switch game mode.
  const changeGame = (value) => {
    if (value === game) return;

    if (
      !window.confirm(
        "Switch game? Current game data will be cleared."
      )
    ) {
      return;
    }

    setGame(value);

    setPlayers(
      value === "rummy"
        ? [...defaultRummyPlayers]
        : [...defaultCallBreakPlayers]
    );

    setScores({});
    setRounds([]);
    setInputs({});
    setBidInputs({});
    setIsStarted(false);
    setIsEnded(false);
    setExpandedRound(null);
  };

  // Save a round.
  const addRound = () => {
    if (!isStarted || isEnded) return;

    const changes = {};

    for (const player of players) {
      if (isEliminated(player)) {
        changes[player] = 0;
        continue;
      }

      if (game === "rummy") {
        const raw = inputs[player];

        const value =
          raw === undefined || raw === ""
            ? 0
            : Number(raw);

        if (!Number.isFinite(value) || value < 0) {
          alert(`Enter a valid score for ${player}.`);
          return;
        }

        changes[player] = value;
      } else {
        const rawBid = bidInputs[player]?.bid;
        const rawTricks = bidInputs[player]?.tricks;

        const bid =
          rawBid === undefined || rawBid === ""
            ? 0
            : Number(rawBid);

        const tricks =
          rawTricks === undefined || rawTricks === ""
            ? 0
            : Number(rawTricks);

        if (
          !Number.isFinite(bid) ||
          !Number.isFinite(tricks) ||
          bid < 0 ||
          tricks < 0 ||
          bid > 13 ||
          tricks > 13
        ) {
          alert(`Enter valid bids and tricks for ${player}.`);
          return;
        }

        changes[player] =
          tricks < bid
            ? -bid
            : bid + (tricks - bid) * 0.1;
      }
    }

    const nextScores = { ...scores };

    players.forEach((player) => {
      nextScores[player] =
        (nextScores[player] || 0) + changes[player];
    });

    setRounds((prev) => [...prev, { changes }]);
    setScores(nextScores);
    setInputs({});
    setBidInputs({});

    // Automatically finish Rummy when only one player remains.
    if (game === "rummy") {
      const remainingPlayers = players.filter(
        (player) => nextScores[player] < limit
      );

      if (remainingPlayers.length <= 1) {
        setIsEnded(true);
      }
    }
  };

  // Undo last round.
  const undoRound = () => {
    if (!rounds.length || isEnded) return;

    const lastRound = rounds[rounds.length - 1];

    setScores((prev) => {
      const next = { ...prev };

      Object.entries(lastRound.changes || {}).forEach(
        ([player, points]) => {
          next[player] = (next[player] || 0) - points;
        }
      );

      return next;
    });

    setRounds((prev) => prev.slice(0, -1));
  };

  // End the game manually.
  const endGame = () => {
    if (!window.confirm("Are you sure you want to end this game?")) {
      return;
    }

    setIsEnded(true);
  };

  // Start a fresh game with the same players.
  const newGame = () => {
    if (
      !window.confirm(
        "Start a new game? All current scores and history will be cleared."
      )
    ) {
      return;
    }

    setScores({});
    setRounds([]);
    setInputs({});
    setBidInputs({});
    setIsStarted(false);
    setIsEnded(false);
    setExpandedRound(null);
  };

  // Build round history with cumulative totals.
  const roundHistory = [];
  const runningTotals = {};

  rounds.forEach((round, index) => {
    players.forEach((player) => {
      runningTotals[player] =
        (runningTotals[player] || 0) +
        Number(round.changes?.[player] || 0);
    });

    roundHistory.push({
      roundNumber: index + 1,
      changes: round.changes || {},
      totals: { ...runningTotals }
    });
  });

  return (
    <main className="app">

      {/* HEADER */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Spade size={25} />
          </div>

          <div>
            <h1>Game<span>Score</span></h1>
            <p>YOUR GAME. YOUR SCORE.</p>
          </div>
        </div>

        <button
          className="icon-btn"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* HERO */}

      <section className="hero">
        <p className="eyebrow">SCORE MANAGEMENT</p>
        <h2>Every round <span>counts.</span></h2>
        <p>Keep track of every move, every trick and every win.</p>
      </section>

      {/* GAME SWITCH */}

      <section className="game-switch">
        <button
          className={game === "rummy" ? "active" : ""}
          disabled={isStarted}
          onClick={() => changeGame("rummy")}
        >
          Rummy
        </button>

        <button
          className={game === "callbreak" ? "active" : ""}
          disabled={isStarted}
          onClick={() => changeGame("callbreak")}
        >
          Call Break
        </button>
      </section>

      {/* SETTINGS */}

      {showSettings && (
        <section className="panel settings">
          <h3>Game Settings</h3>

          {game === "rummy" && (
            <label>
              Elimination limit

              <input
                type="number"
                min="1"
                value={limit}
                disabled={isStarted}
                onChange={(e) =>
                  setLimit(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </label>
          )}

          <p>
            {game === "rummy"
              ? "Players reaching the limit are eliminated."
              : "Call Break supports 3 or 4 players."}
          </p>
        </section>
      )}

      {/* PLAYER SETUP */}

      <section className="panel">
        <div className="section-heading">
          <div>
            <h3><Users size={18} /> Players</h3>
            <p>
              {isStarted
                ? `${players.length} registered players`
                : `${players.length} players · Configure your players`}
            </p>
          </div>

          {!isStarted && (
            <button
              className="secondary-btn"
              onClick={addPlayer}
              disabled={players.length >= (game === "rummy" ? 20 : 4)}
            >
              <Plus size={16} /> Add Player
            </button>
          )}
        </div>

        {players.map((player, index) => (
          <div className="player-row" key={index}>
            <div className="player-name">
              <span className="avatar">{index + 1}</span>

              <div>
                <input
                  className="player-name-input"
                  type="text"
                  value={player}
                  maxLength={24}
                  disabled={isStarted}
                  placeholder="Enter player name"
                  onChange={(e) =>
                    renamePlayer(index, e.target.value)
                  }
                  onBlur={() => {
                    if (!player.trim()) {
                      renamePlayer(index, `Player ${index + 1}`);
                    }
                  }}
                />

                {isStarted && (
                  <small>
                    {isEliminated(player)
                      ? "Eliminated"
                      : isEnded
                        ? "Game finished"
                        : "Playing"}
                  </small>
                )}
              </div>
            </div>

            <div className="player-actions">
              {isStarted && (
                <>
                  <strong className={
                    total(player) < 0 ? "negative" : ""
                  }>
                    {total(player).toFixed(1)}
                  </strong>

                  <span className={
                    isEliminated(player)
                      ? "status-out"
                      : isEnded
                        ? "status-finished"
                        : "status-playing"
                  }>
                    {isEliminated(player)
                      ? "OUT"
                      : isEnded
                        ? "FINISHED"
                        : "PLAYING"}
                  </span>
                </>
              )}

              {!isStarted && (
                <button
                  className="remove-btn"
                  onClick={() => removePlayer(player)}
                  aria-label={`Remove ${player}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}

        {!isStarted && (
          <button className="primary-btn" onClick={startGame}>
            <Play size={17} /> Start Game
          </button>
        )}

        {isStarted && !isEnded && (
          <div className="started-message">
            <CheckCircle2 size={17} />
            Game in progress. Player settings are locked.
          </div>
        )}
      </section>

      {/* GAME STATUS */}

      {isStarted && (
        <section className="panel status-panel">
          <div className="section-heading">
            <div>
              <h3><Users size={18} /> Game Status</h3>
              <p>Current player positions</p>
            </div>
          </div>

          <div className="status-grid">
            <div className="status-box playing-box">
              <span className="status-number">
                {players.filter(isPlaying).length}
              </span>
              <span>Playing</span>
            </div>

            <div className="status-box out-box">
              <span className="status-number">
                {players.filter(isEliminated).length}
              </span>
              <span>Out</span>
            </div>

            <div className="status-box round-box">
              <span className="status-number">{rounds.length}</span>
              <span>Rounds</span>
            </div>
          </div>

          <div className="status-player-list">
            {players.map((player) => (
              <div className="status-player" key={player}>
                <span>{player}</span>

                {isEliminated(player) ? (
                  <span className="status-out">
                    <AlertCircle size={13} /> Eliminated
                  </span>
                ) : isEnded ? (
                  <span className="status-finished">
                    Finished
                  </span>
                ) : (
                  <span className="status-playing">
                    <CheckCircle2 size={13} /> Playing
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SCORE ENTRY */}

      {isStarted && !isEnded && (
        <>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Round {rounds.length + 1}</h3>
                <p>
                  {game === "rummy"
                    ? "Enter points for each active player"
                    : "Enter bids and tricks won"}
                </p>
              </div>

              <span className="round-tag">
                ROUND {rounds.length + 1}
              </span>
            </div>

            {players.map((player) => (
              <div className="score-input-row" key={player}>
                <div className="score-player-label">
                  <strong>{player}</strong>

                  {isEliminated(player) && (
                    <small className="out-label">OUT</small>
                  )}
                </div>

                {isEliminated(player) ? (
                  <span className="out-label">Eliminated</span>
                ) : game === "rummy" ? (
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={inputs[player] ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [player]: e.target.value
                      }))
                    }
                  />
                ) : (
                  <div className="call-inputs">
                    <input
                      type="number"
                      min="0"
                      max="13"
                      placeholder="Bid"
                      value={bidInputs[player]?.bid ?? ""}
                      onChange={(e) =>
                        setBidInputs((prev) => ({
                          ...prev,
                          [player]: {
                            ...prev[player],
                            bid: e.target.value
                          }
                        }))
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      max="13"
                      placeholder="Tricks"
                      value={bidInputs[player]?.tricks ?? ""}
                      onChange={(e) =>
                        setBidInputs((prev) => ({
                          ...prev,
                          [player]: {
                            ...prev[player],
                            tricks: e.target.value
                          }
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            ))}

            <button className="primary-btn" onClick={addRound}>
              Save Round <Plus size={17} />
            </button>
          </section>

          <section className="actions">
            <button
              className="secondary-btn"
              onClick={undoRound}
              disabled={!rounds.length}
            >
              <Undo2 size={17} /> Undo Round
            </button>

            <button className="danger-btn" onClick={endGame}>
              <Flag size={16} /> End Game
            </button>
          </section>
        </>
      )}

      {/* FINAL WINNER */}

      {isEnded && (
        <section className="winner-panel">
          <div className="winner-icon">
            <Crown size={35} />
          </div>

          <p className="eyebrow">GAME COMPLETED</p>
          <h2>
            {winners.length > 1 ? "It's a Tie!" : "Winner"}
          </h2>

          {winners.map((winner) => (
            <div className="winner-name" key={winner}>
              <Trophy size={19} />
              {winner}
            </div>
          ))}

          <p className="winner-description">
            {game === "rummy"
              ? "Lowest score among eligible players"
              : "Highest cumulative score"}
          </p>

          <div className="final-rankings">
            <h3><Medal size={18} /> Final Rankings</h3>

            {getRankedPlayers().map((player, index) => (
              <div className="ranking-row" key={player}>
                <span className="rank-number">
                  {index + 1}
                </span>

                <div className="ranking-player">
                  <strong>{player}</strong>
                  <small>
                    {isEliminated(player)
                      ? "Eliminated"
                      : winners.includes(player)
                        ? "Winner"
                        : "Finished"}
                  </small>
                </div>

                <strong className={
                  winners.includes(player) ? "winner-score" : ""
                }>
                  {total(player).toFixed(1)}
                </strong>

                {winners.includes(player) && (
                  <Crown size={17} className="crown-icon" />
                )}
              </div>
            ))}
          </div>

          <button className="primary-btn" onClick={newGame}>
            <RotateCcw size={17} /> Start New Game
          </button>
        </section>
      )}

      {/* SCORE SUMMARY */}

      {isStarted && (
        <section className="panel history">
          <div className="section-heading">
            <div>
              <h3><Trophy size={18} /> Score Summary</h3>
              <p>{rounds.length} completed rounds</p>
            </div>
          </div>

          {players.map((player) => (
            <div className="summary-row" key={player}>
              <div>
                <strong>{player}</strong>
                <small className={
                  isEliminated(player)
                    ? "summary-out"
                    : "summary-playing"
                }>
                  {isEliminated(player)
                    ? "Eliminated"
                    : isEnded
                      ? "Finished"
                      : "Playing"}
                </small>
              </div>

              <strong className={
                isEliminated(player) ? "negative" : ""
              }>
                {total(player).toFixed(1)}
              </strong>
            </div>
          ))}
        </section>
      )}

      {/* EXPANDABLE ROUND HISTORY */}

      {isStarted && (
        <section className="panel game-history">
          <div className="section-heading">
            <div>
              <h3><History size={19} /> Game History</h3>
              <p>View individual round scores and totals</p>
            </div>

            <span className="round-tag">
              {rounds.length} Rounds
            </span>
          </div>

          {roundHistory.length === 0 ? (
            <div className="empty-history">
              <History size={30} />
              <p>No rounds completed yet.</p>
              <small>Your round history will appear here.</small>
            </div>
          ) : (
            roundHistory.map((round) => {
              const isExpanded =
                expandedRound === round.roundNumber;

              return (
                <div
                  className={`history-card ${
                    isExpanded ? "expanded" : ""
                  }`}
                  key={round.roundNumber}
                >
                  <button
                    className="history-card-header"
                    onClick={() =>
                      setExpandedRound(
                        isExpanded ? null : round.roundNumber
                      )
                    }
                  >
                    <div className="history-card-title">
                      <span className="history-icon">
                        <Trophy size={19} />
                      </span>

                      <div>
                        <strong>Round {round.roundNumber}</strong>
                        <small>
                          {players.length} players · Round details
                        </small>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="history-details">
                      <div className="history-table-header">
                        <span>Player</span>
                        <span>Round Score</span>
                        <span>Total</span>
                      </div>

                      {players.map((player) => {
                        const roundScore =
                          round.changes[player] || 0;

                        const cumulative =
                          round.totals[player] || 0;

                        return (
                          <div
                            className="history-table-row"
                            key={player}
                          >
                            <strong>{player}</strong>

                            <span className={
                              roundScore < 0 ? "negative" : ""
                            }>
                              {roundScore.toFixed(1)}
                            </span>

                            <strong className={
                              cumulative < 0 ? "negative" : ""
                            }>
                              {cumulative.toFixed(1)}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      <footer>
        GAMESCORE · PLAY FAIR. KEEP SCORE.
      </footer>

    </main>
  );
}

export default App;
