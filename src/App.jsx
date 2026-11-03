import { useEffect, useMemo, useState } from "react";
import {
  Trophy, Plus, Undo2, RotateCcw, Users, Spade,
  Trash2, Settings, Play, CheckCircle2, ChevronDown,
  ChevronUp, Crown, History, Flag, Medal, AlertCircle,
  BarChart3, Star, Sun, Moon, Zap, Target, Award
} from "lucide-react";
import "./App.css";

const STORAGE_KEY = "gamescore-data";

const initialPlayers = {
  rummy: ["Player 1", "Player 2"],
  callbreak: ["Player 1", "Player 2", "Player 3", "Player 4"]
};

const emptyCareer = () => ({
  games: 0,
  wins: 0,
  shows: 0,
  roundsPlayed: 0,
  firstRoundWins: 0,
  rummyBest: null,
  callBreakBest: null
});

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function playVictorySound() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audio = new AudioContextClass();

    const notes = [
      { frequency: 523.25, start: 0, duration: 0.2 },
      { frequency: 659.25, start: 0.2, duration: 0.2 },
      { frequency: 783.99, start: 0.4, duration: 0.25 },
      { frequency: 1046.5, start: 0.65, duration: 0.5 }
    ];

    notes.forEach(({ frequency, start, duration }) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, audio.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.16,
        audio.currentTime + start + 0.03
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audio.currentTime + start + duration
      );

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start(audio.currentTime + start);
      oscillator.stop(audio.currentTime + start + duration);
    });

    setTimeout(() => audio.close(), 1800);
  } catch (error) {
    console.warn("Victory sound could not be played:", error);
  }
}

function App() {
  const [saved] = useState(loadData);

  const [game, setGame] = useState(saved.game || "rummy");
  const [players, setPlayers] = useState(
    saved.players || initialPlayers.rummy
  );
  const [scores, setScores] = useState(saved.scores || {});
  const [rounds, setRounds] = useState(saved.rounds || []);
  const [inputs, setInputs] = useState(saved.inputs || {});
  const [bidInputs, setBidInputs] = useState(saved.bidInputs || {});
  const [bidsConfirmed, setBidsConfirmed] = useState(
    saved.bidsConfirmed || false
  );
  const [showWinner, setShowWinner] = useState(
    saved.showWinner || ""
  );
  const [limit, setLimit] = useState(saved.limit ?? 101);
  const [callBreakTarget, setCallBreakTarget] = useState(
    saved.callBreakTarget ?? 100
  );
  const [isStarted, setIsStarted] = useState(
    saved.isStarted || false
  );
  const [isEnded, setIsEnded] = useState(saved.isEnded || false);
  const [career, setCareer] = useState(saved.career || {});
  const [archivedGameIds, setArchivedGameIds] = useState(
    saved.archivedGameIds || []
  );
  const [matchId, setMatchId] = useState(saved.matchId || "");
  const [theme, setTheme] = useState(saved.theme || "dark");
  const [showSettings, setShowSettings] = useState(false);
  const [expandedRound, setExpandedRound] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          game, players, scores, rounds, inputs, bidInputs,
          bidsConfirmed, showWinner, limit, callBreakTarget, isStarted,
          isEnded, career, archivedGameIds, matchId, theme
        })
      );
    } catch (error) {
      console.error("Unable to save GameScore data:", error);
    }
  }, [
    game, players, scores, rounds, inputs, bidInputs,
    bidsConfirmed, showWinner, limit, callBreakTarget, isStarted, isEnded,
    career, archivedGameIds, matchId, theme
  ]);

  const total = (player) => number(scores[player]);

  const isEliminated = (player) =>
    game === "rummy" && total(player) >= limit;

  const getWinners = (currentScores = scores) => {
    if (game === "callbreak") {
      const last = rounds[rounds.length - 1];

      return last
        ? players.filter(
            (p) =>
              number(currentScores[p]) >= Number(callBreakTarget) &&
              number(currentScores[p]) -
                number(last.changes?.[p]) <
                Number(callBreakTarget)
          )
        : [];
    }

    const eligible = players.filter(
      (p) => number(currentScores[p]) < limit
    );
    const candidates = eligible.length ? eligible : players;

    if (!candidates.length) return [];

    const best = Math.min(
      ...candidates.map((p) => number(currentScores[p]))
    );

    return candidates.filter(
      (p) => number(currentScores[p]) === best
    );
  };

  const getRankedPlayers = () =>
    [...players].sort((a, b) => {
      if (game === "rummy") {
        return (
          Number(isEliminated(a)) - Number(isEliminated(b)) ||
          total(a) - total(b)
        );
      }

      return total(b) - total(a);
    });

  const archiveCompletedGame = (
    finalScores = scores,
    finalRounds = rounds
  ) => {
    if (!matchId || archivedGameIds.includes(matchId)) return;

    const finalRound = finalRounds[finalRounds.length - 1];

    const winners =
      game === "callbreak" && finalRound
        ? players.filter(
            (p) =>
              number(finalScores[p]) >= Number(callBreakTarget) &&
              number(finalScores[p]) -
                number(finalRound.changes?.[p]) <
                Number(callBreakTarget)
          )
        : getWinners(finalScores);

    setCareer((previous) => {
      const next = { ...previous };

      players.forEach((player) => {
        const stats = {
          ...emptyCareer(),
          ...(next[player] || {})
        };

        stats.games += 1;

        if (winners.includes(player)) stats.wins += 1;

        const participatedRounds = finalRounds.filter(
          (round) =>
            round.changes?.[player] !== null &&
            round.changes?.[player] !== undefined
        );

        stats.roundsPlayed += participatedRounds.length;

        if (game === "rummy") {
          stats.shows += finalRounds.filter(
            (round) => round.showWinner === player
          ).length;

          if (
            finalRounds.length > 0 &&
            finalRounds[0].showWinner === player
          ) {
            stats.firstRoundWins += 1;
          }

          const result = number(finalScores[player]);

          stats.rummyBest =
            stats.rummyBest === null
              ? result
              : Math.min(stats.rummyBest, result);
        } else {
          const result = number(finalScores[player]);

          stats.callBreakBest =
            stats.callBreakBest === null
              ? result
              : Math.max(stats.callBreakBest, result);
        }

        next[player] = stats;
      });

      return next;
    });

    setArchivedGameIds((previous) => [...previous, matchId]);
  };

  const renamePlayer = (index, newName) => {
    const oldName = players[index];

    if (!oldName || oldName === newName) return;

    setPlayers((previous) =>
      previous.map((p, i) => (i === index ? newName : p))
    );

    const renameObject = (object) => {
      const next = { ...object };

      if (Object.hasOwn(next, oldName)) {
        next[newName] = next[oldName];
        delete next[oldName];
      }

      return next;
    };

    setScores(renameObject);
    setInputs(renameObject);
    setBidInputs(renameObject);

    setRounds((previous) =>
      previous.map((round) => ({
        ...round,
        changes: renameObject(round.changes || {}),
        bids: renameObject(round.bids || {}),
        tricks: renameObject(round.tricks || {})
      }))
    );

    setCareer((previous) => {
      const next = { ...previous };

      if (next[oldName]) {
        next[newName] = next[oldName];
        delete next[oldName];
      }

      return next;
    });
  };

  const addPlayer = () => {
    const max = game === "rummy" ? 20 : 4;

    if (players.length >= max) return;

    let index = 1;

    while (players.includes(`Player ${index}`)) index++;

    setPlayers((previous) => [...previous, `Player ${index}`]);
  };

  const removePlayer = (name) => {
    const minimum = game === "rummy" ? 2 : 3;

    if (players.length <= minimum) {
      alert(`At least ${minimum} players are required.`);
      return;
    }

    if (!window.confirm(`Remove ${name}?`)) return;

    setPlayers((previous) => previous.filter((p) => p !== name));

    setScores((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });

    setInputs((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });

    setBidInputs((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const startGame = () => {
    const names = players.map(
      (p, i) => p.trim() || `Player ${i + 1}`
    );

    if (
      new Set(names.map((p) => p.toLowerCase())).size !== names.length
    ) {
      alert("Player names must be unique.");
      return;
    }

    if (game === "callbreak" && names.length !== 4) {
      alert("Call Break requires exactly 4 players.");
      return;
    }

    setPlayers(names);
    setScores({});
    setRounds([]);
    setInputs({});
    setBidInputs({});
    setBidsConfirmed(false);
    setShowWinner("");
    setIsEnded(false);
    setIsStarted(true);
    setMatchId(`match-${Date.now()}`);
    setExpandedRound(null);
  };

  const changeGame = (value) => {
    if (value === game || isStarted) return;

    setGame(value);
    setPlayers([...initialPlayers[value]]);
    setScores({});
    setRounds([]);
    setInputs({});
    setBidInputs({});
    setBidsConfirmed(false);
    setShowWinner("");
    setIsEnded(false);
    setMatchId("");
  };

  const confirmBids = () => {
    const bids = {};

    for (const player of players) {
      const raw = bidInputs[player]?.bid;

      if (
        raw === undefined ||
        raw === "" ||
        !Number.isInteger(Number(raw)) ||
        Number(raw) < 1 ||
        Number(raw) > 8
      ) {
        alert(
          `Enter a whole-number bid from 1 to 8 for ${player}.`
        );
        return;
      }

      bids[player] = Number(raw);
    }

    setBidInputs((previous) =>
      Object.fromEntries(
        players.map((player) => [
          player,
          { ...previous[player], bid: bids[player], tricks: "" }
        ])
      )
    );

    setBidsConfirmed(true);
  };

  const addRound = () => {
    if (!isStarted || isEnded) return;

    const changes = {};
    const bids = {};
    const tricks = {};

    if (game === "rummy") {
      if (!showWinner) {
        alert("Please select the Rummy show winner before saving.");
        return;
      }

      if (!players.includes(showWinner) || isEliminated(showWinner)) {
        alert("Please select an active player as the show winner.");
        return;
      }

      for (const player of players) {
        if (isEliminated(player)) {
          changes[player] = null;
          continue;
        }

        const raw = inputs[player];

        if (
          raw === undefined ||
          raw === "" ||
          !/^\d+$/.test(String(raw)) ||
          Number(raw) < 0 ||
          Number(raw) > 80
        ) {
          alert(
            `${player}: enter a whole-number score from 0 to 80. Decimals and negative numbers are not allowed.`
          );
          return;
        }

        changes[player] = Number(raw);
      }
    } else {
      if (!bidsConfirmed) {
        alert("Confirm all bids before entering tricks.");
        return;
      }

      for (const player of players) {
        const bid = Number(bidInputs[player]?.bid);
        const raw = bidInputs[player]?.tricks;

        if (
          raw === undefined ||
          raw === "" ||
          !/^\d+$/.test(String(raw)) ||
          Number(raw) > 13
        ) {
          alert(
            `Enter a whole number of tricks from 0 to 13 for ${player}.`
          );
          return;
        }

        const won = Number(raw);

        bids[player] = bid;
        tricks[player] = won;

        changes[player] =
          won < bid
            ? -bid
            : bid + (won - bid) * 0.1;
      }

      const trickTotal = Object.values(tricks).reduce(
        (a, b) => a + b,
        0
      );

      if (trickTotal !== 13) {
        alert(
          `The total tricks must equal 13. Current total: ${trickTotal}.`
        );
        return;
      }
    }

    const nextScores = { ...scores };

    players.forEach((player) => {
      if (changes[player] !== null) {
        nextScores[player] =
          number(nextScores[player]) + changes[player];
      }
    });

    const newRound = {
      changes,
      bids,
      tricks,
      showWinner: game === "rummy" ? showWinner : null,
      game
    };

    const nextRounds = [...rounds, newRound];

    setRounds(nextRounds);
    setScores(nextScores);
    setInputs({});
    setBidInputs({});
    setBidsConfirmed(false);
    setShowWinner("");

    if (game === "rummy") {
      const remaining = players.filter(
        (p) => number(nextScores[p]) < limit
      );

      if (remaining.length <= 1) {
        archiveCompletedGame(nextScores, nextRounds);
        playVictorySound();
        setIsEnded(true);
      }
    } else if (
      players.some(
        (p) =>
          number(scores[p]) < Number(callBreakTarget) &&
          number(nextScores[p]) >= Number(callBreakTarget)
      )
    ) {
      archiveCompletedGame(nextScores, nextRounds);
      playVictorySound();
      setIsEnded(true);
    }
  };

  const undoRound = () => {
    if (!rounds.length || isEnded) return;

    const last = rounds[rounds.length - 1];

    setScores((previous) => {
      const next = { ...previous };

      Object.entries(last.changes || {}).forEach(
        ([player, points]) => {
          if (points !== null) {
            next[player] =
              number(next[player]) - number(points);
          }
        }
      );

      return next;
    });

    setRounds((previous) => previous.slice(0, -1));
    setInputs({});
    setBidInputs({});
    setBidsConfirmed(false);
  };

  const endGame = () => {
    if (!window.confirm("Are you sure you want to end this game?")) {
      return;
    }

    archiveCompletedGame(scores, rounds);
    playVictorySound();
    setIsEnded(true);
  };

  const newGame = () => {
    if (
      !window.confirm(
        "Start a new game? Career statistics will be preserved."
      )
    ) {
      return;
    }

    setScores({});
    setRounds([]);
    setInputs({});
    setBidInputs({});
    setBidsConfirmed(false);
    setShowWinner("");
    setIsStarted(false);
    setIsEnded(false);
    setMatchId("");
    setExpandedRound(null);
  };

  const roundHistory = useMemo(() => {
    const running = {};

    return rounds.map((round, index) => {
      players.forEach((player) => {
        const value = round.changes?.[player];

        if (value !== null && value !== undefined) {
          running[player] =
            number(running[player]) + number(value);
        }
      });

      return {
        ...round,
        roundNumber: index + 1,
        totals: { ...running }
      };
    });
  }, [rounds, players]);

  // Match insights are calculated only from the active match.
  // Archived career records are kept separately and never affect these results.
  const performance = players.map((name) => {
    const participatedRounds = rounds.filter(
      (round) =>
        round.changes?.[name] !== null &&
        round.changes?.[name] !== undefined
    );

    const shows = rounds.filter(
      (round) => round.showWinner === name
    ).length;

    const firstRoundWins =
      rounds.length > 0 && rounds[0].showWinner === name ? 1 : 0;

    const successfulBids = rounds.filter(
      (round) =>
        round.game === "callbreak" &&
        number(round.tricks?.[name]) >=
          number(round.bids?.[name])
    ).length;

    const bestRound = participatedRounds.length
      ? Math.max(
          ...participatedRounds.map((round) =>
            number(round.changes?.[name])
          )
        )
      : 0;

    return {
      name,
      roundsPlayed: participatedRounds.length,
      shows,
      firstRoundWins,
      successfulBids,
      bestRound,
      totalScore: number(scores[name]),
      wins: isEnded && getWinners().includes(name) ? 1 : 0
    };
  });

  const highest = (key) => {
    const max = Math.max(
      0,
      ...performance.map((p) => number(p[key]))
    );

    return max > 0
      ? performance.filter((p) => number(p[key]) === max)
      : [];
  };

  const mostRounds = highest("roundsPlayed");
  const mostShows = highest("shows");
  const earlyBirds = highest("firstRoundWins");
  const successfulBidders = highest("successfulBids");
  const bestCallBreakRound = highest("bestRound");

  const lowestRummy =
    game === "rummy" && performance.length
      ? performance.filter(
          (p) =>
            p.totalScore ===
            Math.min(
              ...performance.map((item) => item.totalScore)
            )
        )
      : [];

  const callBreakExperts =
    game === "callbreak" && performance.length
      ? performance.filter(
          (p) =>
            p.totalScore ===
            Math.max(
              ...performance.map((item) => item.totalScore)
            )
        )
      : [];

  const titlesFor = (player) => {
    const titles = [];

    if (
      game === "rummy" &&
      player.shows > 0 &&
      mostShows.some((p) => p.name === player.name)
    ) {
      titles.push("Show Master");
    }

    if (
      player.roundsPlayed > 0 &&
      mostRounds.some((p) => p.name === player.name)
    ) {
      titles.push("Most Rounds Played");
    }

    if (
      game === "rummy" &&
      player.firstRoundWins > 0 &&
      earlyBirds.some((p) => p.name === player.name)
    ) {
      titles.push("Early Bird");
    }

    if (
      game === "rummy" &&
      rounds.length > 0 &&
      lowestRummy.some((p) => p.name === player.name)
    ) {
      titles.push("Lowest Count Champion");
    }

    if (
      game === "callbreak" &&
      player.successfulBids > 0 &&
      successfulBidders.some((p) => p.name === player.name)
    ) {
      titles.push("Most Successful Bids");
    }

    if (
      game === "callbreak" &&
      rounds.length > 0 &&
      bestCallBreakRound.some((p) => p.name === player.name)
    ) {
      titles.push("Best Round");
    }

    if (
      game === "callbreak" &&
      rounds.length > 0 &&
      callBreakExperts.some((p) => p.name === player.name)
    ) {
      titles.push("Call Break Expert");
    }

    return titles;
  };

  const winners = isEnded ? getWinners() : [];

  return (
    <main className={`app ${theme}-theme`}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Spade size={25} /></div>
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

      <section className="hero">
        <p className="eyebrow">SCORE MANAGEMENT</p>
        <h2>Every round <span>counts.</span></h2>
        <p>Keep track of every move, every trick and every win.</p>
      </section>

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

      {showSettings && (
        <section className="panel settings-panel">
          <h3><Settings size={18} /> Settings</h3>
          <p>Choose your preferred appearance.</p>
          <div className="theme-switch">
            <button
              className={theme === "dark" ? "selected" : ""}
              onClick={() => setTheme("dark")}
            >
              <Moon size={17} /> Dark Theme
            </button>
            <button
              className={theme === "light" ? "selected" : ""}
              onClick={() => setTheme("light")}
            >
              <Sun size={17} /> Light Theme
            </button>
          </div>
        </section>
      )}

      {/* PLAYERS */}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h3><Users size={18} /> Players</h3>
            <p>{players.length} players · Configure your players</p>
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

        {game === "callbreak" && !isStarted && (
          <div className="limit-control">
            <label htmlFor="call-break-target">Call Break target score</label>
            <input
              id="call-break-target"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={callBreakTarget}
              onChange={(e) => {
                const v = e.target.value;

                if (v === "" || /^\d+$/.test(v)) {
                  setCallBreakTarget(
                    v === "" ? "" : Math.max(1, Number(v))
                  );
                }
              }}
              onBlur={() =>
                setCallBreakTarget(
                  Math.max(1, Number(callBreakTarget) || 100)
                )
              }
            />
          </div>
        )}

        {game === "rummy" && !isStarted && (
          <div className="limit-control">
            <label htmlFor="limit">Rummy elimination limit</label>
            <input
              id="limit"
              type="number"
              min="1"
              value={limit}
              onChange={(e) =>
                setLimit(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
        )}

        {players.map((player, index) => (
          <div className="player-row" key={player}>
            <div className="player-name">
              <span className="avatar">{index + 1}</span>
              <div>
                <input
                  className="player-name-input"
                  value={player}
                  maxLength={24}
                  disabled={isStarted}
                  onChange={(e) =>
                    renamePlayer(index, e.target.value)
                  }
                />
                {isStarted && (
                  <small>
                    {isEliminated(player) ? "Eliminated" : "Playing"}
                  </small>
                )}
              </div>
            </div>

            <div className="player-actions">
              {isStarted ? (
                <>
                  <strong>{total(player).toFixed(1)}</strong>
                  <span
                    className={
                      isEliminated(player)
                        ? "status-out"
                        : "status-playing"
                    }
                  >
                    {isEliminated(player) ? "OUT" : "PLAYING"}
                  </span>
                </>
              ) : (
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

        {isStarted && (
          <div className="started-message">
            <CheckCircle2 size={17} /> Game in progress
          </div>
        )}
      </section>

      {/* CURRENT ROUND ENTRY */}
      {isStarted && !isEnded && (
        <>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Current Round · {rounds.length + 1}</h3>
                <p>
                  {game === "rummy"
                    ? "Select the show winner and enter scores."
                    : "Enter bids first, then actual tricks."}
                </p>
              </div>
              <span className="round-tag">
                ROUND {rounds.length + 1}
              </span>
            </div>

            {game === "rummy" && (
              <>
                <div className="winner-select">
                  <label htmlFor="show-winner">
                    Rummy show winner *
                  </label>
                  <select
                    id="show-winner"
                    value={showWinner}
                    onChange={(e) => setShowWinner(e.target.value)}
                  >
                    <option value="">Select winner (required)</option>
                    {players
                      .filter((p) => !isEliminated(p))
                      .map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                  </select>
                </div>

                {players.map((player) => (
                  <div className="score-input-row" key={player}>
                    <div className="score-player-label">
                      <strong>{player}</strong>
                      <small>
                        {isEliminated(player)
                          ? "OUT"
                          : "Penalty points (0–80)"}
                      </small>
                    </div>

                    {isEliminated(player) ? (
                      <span className="out-label">OUT</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="80"
                        step="1"
                        inputMode="numeric"
                        placeholder="0–80"
                        value={inputs[player] ?? ""}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [player]: e.target.value
                          }))
                        }
                      />
                    )}
                  </div>
                ))}

                <p className="validation-note">
                  <AlertCircle size={15} />
                  Whole numbers only. Minimum 0, maximum 80. Winner selection is mandatory.
                </p>

                <button className="primary-btn" onClick={addRound}>
                  Save Rummy Round <CheckCircle2 size={17} />
                </button>
              </>
            )}

            {game === "callbreak" && (
              <>
                {!bidsConfirmed ? (
                  <>
                    <p className="workflow-note">
                      Step 1: Enter each player's bid.
                    </p>

                    {players.map((player) => (
                      <div className="score-input-row" key={player}>
                        <strong>{player}</strong>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          step="1"
                          inputMode="numeric"
                          placeholder="Bid (1–8)"
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
                      </div>
                    ))}

                    <button
                      className="primary-btn"
                      onClick={confirmBids}
                    >
                      <CheckCircle2 size={17} /> OK — Confirm Bids
                    </button>
                  </>
                ) : (
                  <>
                    <p className="workflow-note">
                      Step 2: Enter actual tricks won. Total must equal 13.
                    </p>

                    {players.map((player) => (
                      <div className="score-input-row" key={player}>
                        <div className="score-player-label">
                          <strong>{player}</strong>
                          <small>
                            Bid: {bidInputs[player]?.bid}
                          </small>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          step="1"
                          placeholder="Actual tricks"
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
                    ))}

                    <button className="primary-btn" onClick={addRound}>
                      Save Call Break Round <CheckCircle2 size={17} />
                    </button>
                  </>
                )}
              </>
            )}
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

      {/* PLAYER PERFORMANCE — ABOVE SCORE SUMMARY */}
      <section className="panel insights-panel">
        <div className="section-heading">
          <div>
            <h3><BarChart3 size={19} /> Player Performance</h3>
            <p>Insights and achievements from this match only</p>
          </div>
          <Star size={20} />
        </div>

        <div className="insight-grid">
          {game === "rummy" ? (
            <>
              <div className="insight-card">
                <small>Most Rounds Played</small>
                <strong>
                  {mostRounds.length
                    ? mostRounds.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>{mostRounds[0]?.roundsPlayed || 0} rounds</span>
              </div>

              <div className="insight-card">
                <small>Most Rummy Shows</small>
                <strong>
                  {mostShows.length
                    ? mostShows.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>{mostShows[0]?.shows || 0} shows</span>
              </div>

              <div className="insight-card">
                <small>Early Bird</small>
                <strong>
                  {earlyBirds.length
                    ? earlyBirds.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>First-round show winner</span>
              </div>

              <div className="insight-card">
                <small>Lowest Current Count</small>
                <strong>
                  {lowestRummy.length
                    ? lowestRummy.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>
                  {lowestRummy[0]?.totalScore ?? 0} points
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="insight-card">
                <small>Most Rounds Played</small>
                <strong>
                  {mostRounds.length
                    ? mostRounds.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>{mostRounds[0]?.roundsPlayed || 0} rounds</span>
              </div>

              <div className="insight-card">
                <small>Most Successful Bids</small>
                <strong>
                  {successfulBidders.length
                    ? successfulBidders.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>
                  {successfulBidders[0]?.successfulBids || 0} successful bids
                </span>
              </div>

              <div className="insight-card">
                <small>Best Single Round</small>
                <strong>
                  {bestCallBreakRound.length
                    ? bestCallBreakRound.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>
                  {bestCallBreakRound[0]?.bestRound ?? 0} points
                </span>
              </div>

              <div className="insight-card">
                <small>Highest Total Score</small>
                <strong>
                  {callBreakExperts.length
                    ? callBreakExperts.map((p) => p.name).join(", ")
                    : "—"}
                </strong>
                <span>
                  {callBreakExperts[0]?.totalScore ?? 0} points
                </span>
              </div>
            </>
          )}
        </div>

        <div className="career-list">
          <h4><Crown size={17} /> Player Titles</h4>

          {performance.map((player) => (
            <div className="career-row" key={player.name}>
              <div>
                <strong>{player.name}</strong>
                <small>
                  {player.roundsPlayed} rounds ·{" "}
                  {game === "rummy"
                    ? `${player.shows} shows`
                    : `${player.successfulBids} successful bids`}
                </small>
              </div>

              <div className="title-tags">
                {titlesFor(player).length ? (
                  titlesFor(player).map((title) => (
                    <span key={title}>{title}</span>
                  ))
                ) : (
                  <span className="no-title">New player</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="insight-footnote">
          These statistics reset when you start a new game. Only rounds from this match are counted.
        </p>
      </section>

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
                <small
                  className={
                    isEliminated(player)
                      ? "summary-out"
                      : "summary-playing"
                  }
                >
                  {isEliminated(player) ? "Eliminated" : "Playing"}
                </small>
              </div>
              <strong>{total(player).toFixed(1)}</strong>
            </div>
          ))}
        </section>
      )}

      {/* WINNER */}
      {isEnded && (
        <section className="winner-panel">
          <div className="winner-icon"><Crown size={36} /></div>
          <p className="eyebrow">GAME COMPLETED</p>
          <h2>{winners.length > 1 ? "It's a Tie!" : "Winner"}</h2>

          {winners.map((player) => (
            <div className="winner-name" key={player}>
              <Trophy size={19} /> {player}
            </div>
          ))}

          {winners.map((winner) => {
            const playerStats = performance.find(
              (player) => player.name === winner
            );

            const awardIcons = {
              "Show Master": "🏆",
              "Most Rounds Played": "🎯",
              "Early Bird": "⚡",
              "Lowest Count Champion": "🥇",
              "Call Break Expert": "♠️"
            };

            const awardDescriptions = {
              "Show Master": "Highest number of Rummy shows",
              "Most Rounds Played": "Played the most rounds",
              "Early Bird": "First-round show winner",
              "Lowest Count Champion": "Best lowest Rummy count",
              "Call Break Expert": "Reached the target score first"
            };

            const awards = playerStats
              ? titlesFor(playerStats)
              : [];

            return (
              <div className="award-showcase" key={winner}>
                <h3>🏅 {winner}'s Achievements</h3>

                {awards.length > 0 ? (
                  <div className="award-grid">
                    {awards.map((title) => (
                      <div className="award-card" key={title}>
                        <div className="award-art">
                          {awardIcons[title] || "🏅"}
                        </div>
                        <strong>{title}</strong>
                        <small>
                          {awardDescriptions[title] ||
                            "Special achievement"}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="winner-description">
                    Congratulations on winning! Keep playing to unlock more awards.
                  </p>
                )}
              </div>
            );
          })}

          <p className="winner-description">
            {game === "rummy"
              ? "Lowest score among eligible players"
              : "Highest cumulative score"}
          </p>

          <div className="final-rankings">
            <h3><Medal size={18} /> Final Rankings</h3>

            {getRankedPlayers().map((player, index) => (
              <div className="ranking-row" key={player}>
                <span className="rank-number">{index + 1}</span>
                <strong className="ranking-player">{player}</strong>
                <strong className="ranking-score">
                  {total(player).toFixed(1)}
                </strong>
                {winners.includes(player) ? (
                  <Crown className="crown-icon" size={17} />
                ) : (
                  <span
                    className="ranking-crown-space"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          <button className="primary-btn" onClick={newGame}>
            <RotateCcw size={17} /> Start New Game
          </button>
        </section>
      )}

      {/* ROUND HISTORY */}
      {isStarted && (
        <section className="panel game-history">
          <div className="section-heading">
            <div>
              <h3><History size={19} /> Round History</h3>
              <p>View individual round scores and totals</p>
            </div>
            <span className="round-tag">{rounds.length} Rounds</span>
          </div>

          {!roundHistory.length ? (
            <div className="empty-history">
              <History size={30} />
              <p>No rounds completed yet.</p>
              <small>Your round history will appear here.</small>
            </div>
          ) : (
            roundHistory.map((round) => {
              const expanded =
                expandedRound === round.roundNumber;

              return (
                <div
                  className={`history-card ${
                    expanded ? "expanded" : ""
                  }`}
                  key={round.roundNumber}
                >
                  <button
                    className="history-card-header"
                    onClick={() =>
                      setExpandedRound(
                        expanded ? null : round.roundNumber
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
                          {round.game === "rummy"
                            ? "Rummy"
                            : "Call Break"}
                        </small>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {expanded && (
                    <div className="history-details">
                      <div className="history-table-header">
                        <span>Player</span>
                        <span>Round Score</span>
                        <span>Total</span>
                      </div>

                      {players.map((player) => {
                        const value = round.changes?.[player];
                        const out =
                          value === null || value === undefined;

                        return (
                          <div
                            className="history-table-row"
                            key={player}
                          >
                            <strong>{player}</strong>
                            <span className={out ? "out-label" : ""}>
                              {out
                                ? "OUT"
                                : number(value).toFixed(1)}
                            </span>
                            <strong>
                              {out
                                ? "—"
                                : number(
                                    round.totals[player]
                                  ).toFixed(1)}
                            </strong>
                          </div>
                        );
                      })}

                      {round.game === "rummy" &&
                        round.showWinner && (
                          <p className="history-meta">
                            Show winner: {round.showWinner}
                          </p>
                        )}

                      {round.game === "callbreak" && (
                        <div className="history-meta">
                          {players.map((player) => (
                            <span key={player}>
                              {player}: bid {round.bids?.[player]} · tricks{" "}
                              {round.tricks?.[player]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      <footer>GAMESCORE · PLAY FAIR. KEEP SCORE.</footer>
    </main>
  );
}

export default App;