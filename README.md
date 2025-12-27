# 🎸 KeyHero - Rhythm Game

A Guitar Hero-style rhythm game built with TypeScript, Vite, and Web Audio API. Features multiple songs, difficulty levels, and an online leaderboard system.

![Status](https://img.shields.io/badge/status-ready_to_deploy-brightgreen)
![Platform](https://img.shields.io/badge/platform-web-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ Features

- 🎵 **3 Songs** with different BPM (120, 130, 140)
- 🎯 **3 Difficulty Levels** per song (Easy, Medium, Hard)
- 🏆 **Online Leaderboard** with per-song and global rankings
- 🎨 **Beautiful UI** with smooth animations
- 🔊 **Procedural Audio** fallback (no files needed!)
- ⚡ **Perfect Timing** via Web Audio API
- 🎮 **Keyboard Controls** (A, S, D, F keys)
- 📱 **Mobile Touch Support** with multi-touch chords
- 📊 **Score Tracking** with Perfect/Good/Miss ratings
- 🔥 **Combo System** with milestone sound effects

## 🎮 Play NOW (Local)

**The game is already running!** Just open: **http://localhost:5173**

For detailed instructions, see [PLAY_NOW.md](PLAY_NOW.md)

### Quick Start:
```bash
# Frontend (already running)
npm run dev

# Backend (in another terminal)
cd backend
npm start
```

Then visit http://localhost:5173 and start playing!

## 🚀 Deploy Online (FREE)

Deploy to Vercel + Render in 10 minutes for **$0/month**!

**Full deployment guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Quick Deploy:

1. **Push to GitHub**
2. **Deploy Backend**: Render.com (5 min)
3. **Deploy Frontend**: Vercel.com (5 min)
4. **Done!** Share your URL

## 🎯 Controls

### Desktop (Keyboard)
| Key | Lane |
|-----|------|
| A | Lane 1 (left) |
| S | Lane 2 |
| D | Lane 3 |
| F | Lane 4 (right) |

### Mobile (Touch)
- 🔴 **Tap colored buttons** at bottom of screen
- 👆 **Multi-touch** enabled for chords
- 📱 Works on all mobile devices
- See [MOBILE_SUPPORT.md](MOBILE_SUPPORT.md) for details

## 🏗️ Architecture

```
Frontend (Vite + TypeScript)
├── Song Selection UI
├── Difficulty Selection
├── Game Engine (Canvas + Web Audio)
└── Leaderboard Display

Backend (Express + SQLite)
├── Score Submission API
├── Leaderboard Retrieval
└── Database Management
```

## 📁 Project Structure

```
keyhero/
├── src/
│   ├── audio/          # Audio engine & SFX
│   ├── game/           # Game logic & charts
│   ├── render/         # Canvas rendering
│   ├── ui/             # UI screens
│   └── main.ts         # Entry point
├── backend/
│   ├── server.js       # Express API
│   ├── database.js     # SQLite layer
│   └── package.json
├── public/
│   └── audio/songs/    # Audio files (optional)
└── vercel.json         # Deployment config
```

## 🛠️ Tech Stack

**Frontend:**
- TypeScript
- Vite
- Web Audio API
- Canvas API
- Modern CSS

**Backend:**
- Node.js
- Express.js
- SQLite3
- CORS

## 📊 Scoring System

| Rating | Window | Points |
|--------|--------|--------|
| Perfect | ±60ms | 100 |
| Good | ±120ms | 50 |
| Miss | >120ms | 0 |

**Grades:** S, A, B, C, D, F (based on accuracy %)

## 🎵 Songs

1. **Electronic Beat** - 120 BPM, 60 seconds
2. **Rhythmic Flow** - 130 BPM, 75 seconds  
3. **Speed Run** - 140 BPM, 90 seconds

Each song has Easy, Medium, and Hard charts with increasing note density.

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Run Development Servers
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm start
```

### Build for Production
```bash
npm run build
```

## 📝 API Endpoints

### Submit Score
```bash
POST /api/scores
{
  "playerName": "Player",
  "songId": "song1",
  "difficulty": "hard",
  "score": 8500,
  "accuracy": 95.5,
  "maxCombo": 150,
  "grade": "A"
}
```

### Get Leaderboard
```bash
GET /api/leaderboard?songId=song1&difficulty=hard&limit=10
```

### Global Leaderboard
```bash
GET /api/leaderboard/global?limit=10
```

## 🎨 Customization

### Add Custom Songs
1. Place audio files in `/public/audio/songs/song1/track.wav`
2. Update metadata in `src/game/songMetadata.ts`
3. Create charts in `src/game/charts/`

### Modify Difficulty
Edit chart generator in `src/game/chartGenerator.ts`

### Change Colors/Theme
Update styles in UI components (`src/ui/`)

## 📚 Documentation

- [PLAY_NOW.md](PLAY_NOW.md) - How to play locally
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deploy to production
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details
- [BUILDPLAN.md](BUILDPLAN.md) - Original build specifications

## 🐛 Troubleshooting

### Game Won't Load
- Check if servers are running (ports 5173 and 3000)
- Clear browser cache
- Check browser console for errors

### No Sound
- Click the page to enable audio
- Check browser isn't muted
- Verify audio context is initialized

### Backend Connection Failed
- Verify backend is running on port 3000
- Check CORS configuration
- Test `/api/health` endpoint

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 📄 License

MIT License - feel free to use and modify!

## 🎉 Credits

Built with:
- Vite for blazing fast development
- TypeScript for type safety
- Web Audio API for perfect timing
- Express for simple backend
- SQLite for easy database

## 🚀 What's Next?

Potential enhancements:
- [ ] Chart editor for custom songs
- [ ] More songs and difficulties
- [ ] Visual effects and particles
- [ ] Calibration system for latency
- [ ] Multiplayer mode
- [ ] Mobile support
- [ ] Custom themes

---

**Made with ❤️ for rhythm game enthusiasts**

🎮 **Play now:** http://localhost:5173  
🌐 **Deploy:** Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)



