# ♟️ Chess Engine - The Next Big Thing in Online Chess

> "Started as a college project, aiming to dethrone Chess.com one day. Every grandmaster started with their first move, right?" 

A full-stack chess game that proves you don't need a fancy framework to build something awesome. Just pure Java brilliance, some clever JavaScript, and way too many late nights figuring out why pawns were moving backwards.

## 🎯 The Mission

Build a chess game so good that even Magnus Carlsen would be impressed (or at least not laugh). Spoiler: I actually pulled it off! This isn't just another "hello world" project - it's a fully functional chess engine with every rule, every edge case, and yes, even en passant (because nobody actually knows that rule anyway).

## ✨ What Makes This Special

- **Built From Scratch** - No chess libraries, no shortcuts. Every piece, every rule, written by hand
- **Full Stack Mastery** - Backend? Check. Frontend? Check. Making them talk to each other? Triple check
- **Real Chess Rules** - Castling, en passant, pawn promotion, check, checkmate, stalemate - it's all here
- **Actually Works** - Seriously, try to break it. I spent weeks making sure you can't

## 🚀 Features That'll Make You Go "Whoa"

- ✅ All pieces move exactly like they should (yes, even the knight)
- ✅ Click a piece, see legal moves highlighted in green (like having a chess coach in your browser)
- ✅ Illegal moves? Not on my watch. The game won't let you
- ✅ Detects check, checkmate, and stalemate automatically
- ✅ Special moves work: Castling, En Passant, Pawn Promotion to Queen
- ✅ Beautiful, responsive UI that doesn't look like it's from 1995
- ✅ Real-time API that's faster than my reaction time

## 🎮 Why This Project Exists

**Professor:** "Build something useful for your final project"  
**Me:** "How about a chess engine?"  
**Professor:** "That's too ambitious"  
**Me:** "Hold my coffee ☕"

Three weeks, 5000+ lines of code, and countless "why isn't the king moving" moments later... here we are.

## 🛠️ Tech Stack (AKA What I Learned)

### Backend Magic
- **Java 17** - Because we're not living in 2010
- **Spring Boot** - Making backend development actually enjoyable
- **RESTful API** - Clean, documented, and doesn't break randomly

### Frontend Wizardry  
- **Pure JavaScript** - No React, no Vue, just raw JavaScript skills
- **HTML5/CSS3** - Gradients that would make designers jealous
- **Grid Layout** - Because flexbox is so last year

## 🔧 Getting Started (It's Actually Easy)
```bash
git clone https://github.com/yourusername/chess-engine.git
cd chess-engine
mvn clean install
mvn spring-boot:run
```

Then open `http://localhost:8080` and prepare to be amazed.

## 🎯 The Cool Technical Stuff

### Architecture That Actually Makes Sense
```
User clicks piece → Frontend validates → API call → Backend logic → 
Move validation → State update → Response → Board updates → Profit
```

### Code That'll Make Your CS Professor Proud
- Object-oriented design with proper inheritance (Piece → King, Queen, etc.)
- Clean separation of concerns (Game logic ≠ API logic ≠ UI logic)
- Proper REST principles (not just "GET /doSomething")
- Move validation that checks literally everything

### The API Everyone Wishes They Built
```
POST   /api/chess/game/new        → Start your reign
GET    /api/chess/game/{id}/state → What's happening?
POST   /api/chess/game/{id}/move  → Make your move
GET    /api/chess/game/{id}/valid-moves → Where can I go?
```

## 🏆 Achievement Unlocked

- [x] Built a complete chess engine
- [x] Learned why async/await exists
- [x] Figured out castling (the hardest part, don't @ me)
- [x] Made it look good
- [x] Actually finished a side project
- [ ] Beat Chess.com (work in progress)

## 🚧 Coming Soon™

Because I'm not done yet:

- **Multiplayer Mode** - Challenge your friends (or enemies)
- **AI Opponent** - Teaching computers to lose gracefully
- **Move History** - Replay your greatest (or worst) games
- **Timer** - Because stress makes everything better
- **Tournaments** - Organize your own chess club
- **Dark Mode** - For late-night chess sessions

## 💭 Lessons Learned

1. Chess is harder than it looks
2. En passant is the most confusing rule ever invented
3. Testing edge cases is important (learned this the hard way)
4. Documentation is your future self's best friend
5. Coffee is essential for debugging at 2 AM

## 🎓 Why This Matters For My Career

This project isn't just code - it's proof that I can:
- Design and implement complex systems
- Build full-stack applications from scratch
- Write clean, maintainable code
- Debug like a detective
- Actually finish what I start
- Make something people can use and enjoy

## 📈 The Numbers

- **Lines of Code:** 5000+
- **Coffee Consumed:** Too many
- **"It finally works!" moments:** 47
- **Times I wanted to give up:** 3
- **Times I'm glad I didn't:** Every time someone plays it

## 🌟 Try It Yourself

Seriously, clone it. Break it. Try to make an illegal move. Try to put yourself in check. Try anything. I've spent weeks making sure you can't break it (but let me know if you do).

## 👨‍💻 About Me

Just a student who thought "how hard could building chess be?" and found out the answer is "very, but totally worth it."

**This project taught me more than a semester of classes.**

Want to see more? Check out my [GitHub](https://github.com/RD-1205) where I'm probably building something else ambitious.

---

### 📞 Contact

Got questions? Found a bug? Want to collaborate on beating Chess.com?

- **GitHub:** (https://github.com/RD-1205)
- **LinkedIn:** (https://www.linkedin.com/in/rudra-arora-689143316/)
- **Email:** rudraarora0905@gmail.com

---

⭐ **If this project impressed you, give it a star!** ⭐

