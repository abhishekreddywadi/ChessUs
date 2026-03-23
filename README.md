# ChessUs - Real-time Chess Game

A full-stack chess application where two players can play together in real-time using WebSockets.

## Project Overview

ChessUs is a multiplayer chess game built with:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + TypeScript + WebSocket (ws library)
- **Chess Logic**: chess.js library for move validation and game state

## How It Works

### Architecture

```
┌─────────────┐                    ┌─────────────┐
│   Player 1  │                    │   Player 2  │
│  (Frontend) │                    │  (Frontend) │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │         WebSocket               │
       └────────────┬────────────────────┘
                    │
            ┌───────▼────────┐
            │   Backend      │
            │  (Game Server) │
            │  - Matchmaking │
            │  - Move logic  │
            │  - Game state  │
            └────────────────┘
```

### Game Flow

1. **Connection**: Both players connect to the WebSocket server
2. **Matchmaking**: First player waits, second player joins → game starts
3. **Game Play**: Players take turns making moves
4. **Move Validation**: Server validates each move using chess.js
5. **Broadcast**: Both players receive the updated board state
6. **Game End**: Winner is declared when checkmate/draw occurs
7. **Disconnect Handling**: If a player leaves, the other is notified

### Key Components

#### Frontend
- `Game.tsx` - Main game component, manages WebSocket messages and board state
- `ChessBoard.tsx` - Renders the chess board and handles user interactions
- `useSocket.ts` - Custom hook for WebSocket connection management

#### Backend
- `Game.ts` - Handles individual game logic, move validation, and game state
- `GameManagement.ts` - Manages all connected users, matchmaking, and game cleanup
- `index.ts` - WebSocket server setup

## What I Learned

### 1. WebSocket Communication
- Real-time bidirectional communication between client and server
- Managing connection states (connecting, connected, error, disconnected)
- Handling WebSocket lifecycle events (open, message, close, error)

### 2. State Management in React
- Using `useRef` to avoid stale closure issues in event handlers
- Difference between `useState` (triggers re-render) and `useRef` (doesn't)
- Managing game state across different phases (idle, waiting, playing, game over)

### 3. Chess Board Coordinate System
- Converting array indices (0-7) to chess notation (a-h, 1-8)
- Understanding how 2D arrays represent the chess board
- ASCII character codes for generating column letters

### 4. Backend Architecture
- Managing multiple concurrent WebSocket connections
- Matchmaking system using a pending queue
- Game cleanup when users disconnect
- Broadcasting messages to specific clients

### 5. Type Safety with TypeScript
- Defining proper types for game state, moves, and WebSocket messages
- Using discriminated unions for message types
- Type-safe communication between frontend and backend

### 6. Error Handling
- Invalid move detection and user feedback
- Connection failure handling
- Graceful degradation when opponent disconnects

## Technical Benchmarks

### Performance
- Move latency: < 100ms (WebSocket real-time communication)
- Supports multiple concurrent games
- Efficient state updates using React refs

### Code Quality
- Full TypeScript coverage on both frontend and backend
- Component-based architecture for reusability
- Separation of concerns (UI, game logic, networking)

### Scalability Considerations
- Game state isolated per game instance
- Users removed from memory when disconnected
- No memory leaks from unhandled WebSocket connections

## Running the Project

### Backend
```bash
cd Backend
npm install
npm run dev
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173` in two browser tabs to play as two different players.

## Project Structure

```
ChatUs/
├── Backend/
│   └── src/
│       ├── Game.ts           # Individual game logic
│       ├── GameTypes.ts      # TypeScript type definitions
│       ├── GameManagement.ts # User and game management
│       └── index.ts          # WebSocket server entry point
├── Frontend/
│   └── src/
│       ├── hooks/
│       │   └── useSocket.ts  # WebSocket connection hook
│       ├── pages/
│       │   ├── game/
│       │   │   ├── ChessBoard.tsx
│       │   │   └── Game.tsx
│       │   └── Home.tsx
│       └── routes/
│           └── AppRoutes.tsx
```

## Future Improvements

- Add player authentication
- Implement game history/replay
- Add chess clock for timed games
- Chat between players during game
- ELO rating system
- Spectator mode
