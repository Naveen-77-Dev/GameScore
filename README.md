# 🎮 GameScore – Rummy & Call Break Score Tracker

**Track Scores. Manage Rounds. Find the Winner.**

GameScore is a web-based score tracking application designed for Rummy and Call Break. It helps players manage game sessions, record round-wise scores, track player rankings, and identify winners with ease.

## 🌐 Live Demo

<p align="center">
  <a href="https://naveen-77-dev.github.io/GameScore/"><strong>🚀 Open GameScore</strong></a>
</p>

**Repository:** [Naveen-77-Dev/GameScore](https://github.com/Naveen-77-Dev/GameScore)

## ✨ Features

### 🃏 Game Modes
- Rummy – Track scores and player eliminations.
- Call Break – Calculate scores based on bids and tricks.

### 👥 Player Management
- Add, remove, and rename players before starting.
- Rummy supports 2–20 players.
- Call Break supports 3–4 players.
- Player setup locks after the game starts.

### 📊 Score Tracking
- Record scores round by round.
- Automatically calculate cumulative scores.
- Treat empty score fields as zero.
- Undo the last round.
- View expandable round-wise score history.

### 🏆 Winner & Rankings
- Automatic winner calculation.
- Final player rankings.
- Support for tied winners.
- Player statuses: Playing, Eliminated, and Finished.

### 💾 Data Persistence
- Automatically save game progress using browser LocalStorage.
- Retain scores and history after refreshing the page.
- Start a new game while retaining the player list.

### 🎨 User Interface
- Modern dark green theme.
- Responsive design.
- Lucide React icons.
- Clean and interactive score management interface.

## 🧮 Scoring Rules

### Rummy
- Players accumulate points during each round.
- Default elimination limit: 101 points.
- Players reaching the elimination limit are eliminated.
- The eligible player with the lowest cumulative score wins.
- The game automatically ends when only one eligible player remains.

### Call Break
- Failed bid: `-Bid`
- Successful bid: `Bid + (Tricks - Bid) × 0.1`
- The player with the highest cumulative score wins.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application logic |
| Vite | Development and build tool |
| CSS3 | Styling |
| Lucide React | Icons |
| LocalStorage | Data persistence |
| GitHub Actions | Automated deployment |
| GitHub Pages | Hosting |

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Naveen-77-Dev/GameScore.git
```

**2. Navigate to the project folder**

```bash
cd GameScore
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Create a production build**

```bash
npm run build
```

The production-ready files will be generated in the `dist` directory.

## 🌍 Deployment

GameScore is configured for GitHub Pages deployment using GitHub Actions.

Repository: [GameScore](https://github.com/Naveen-77-Dev/GameScore)

Live application: [https://naveen-77-dev.github.io/GameScore/](https://naveen-77-dev.github.io/GameScore/)

## 🔮 Future Enhancements
- Multiplayer game support.
- Export scorecards as PDF or Excel.
- Player performance statistics.
- Customizable game settings.
- Support for additional card games.

## 👨‍💻 Developer

**Mangali Naveen**

B.Tech – Computer Science and Engineering (Artificial Intelligence & Machine Learning)

- GitHub: [Naveen-77-Dev](https://github.com/Naveen-77-Dev)
- LinkedIn: [Mangali Naveen](https://www.linkedin.com/in/naveen-mangali-a14684295/)

---

<p align="center">
  Made with ❤️ by Naveen
</p>