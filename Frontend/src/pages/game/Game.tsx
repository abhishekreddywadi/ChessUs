import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import { Chess } from "chess.js";
import { ChessBoard } from "./ChessBoard";

/**
 * Game State Types
 * Different states the game can be in
 */
type GameState = "idle" | "waiting" | "playing" | "game_over";

/**
 * Game Component
 * Manages the chess game state and WebSocket communication with the server
 * Handles game initialization, move processing, and board updates
 */
export const Game = () => {
    // Get WebSocket connection and connection status from custom hook
    const { status, socket } = useSocket();

    // Local chess.js instance for move validation and board state
    // Using useRef to avoid closure issues in useEffect
    const chessRef = useRef(new Chess());

    // State for the current board configuration to pass to ChessBoard component
    const [board, setBoard] = useState(chessRef.current.board());

    // Track the current game state
    const [gameState, setGameState] = useState<GameState>("idle");

    // Track the player's color (white or black)
    const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);

    // Track game over message (who won)
    const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);

    /**
     * useEffect: Sets up WebSocket message handler
     * Listens for game events from the server and updates local state accordingly
     * Only re-runs when socket changes (via dependency array)
     */
    useEffect(() => {
        // Exit early if socket is not available
        if (!socket || !socket.current) {
            return;
        }

        // Handle incoming WebSocket messages from the server
        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "Game Started":
                    // Game has been initialized by server
                    // Player receives their assigned color
                    chessRef.current = new Chess();
                    setBoard(chessRef.current.board());
                    setPlayerColor(data.color === "white" ? "white" : "black");
                    setGameState("playing");
                    setGameOverMessage(null);
                    console.log("Game Started! You are playing as:", data.color);
                    break;

                case "move":
                    // Apply the move received from server to local chess instance
                    // This keeps client in sync with server game state
                    const moveResult = chessRef.current.move(data.payload);
                    if (moveResult) {
                        setBoard(chessRef.current.board());
                        console.log("Move made:", moveResult);
                    } else {
                        console.error("Invalid move received from server:", data.payload);
                    }
                    break;

                case "white won":
                    // Game over - white won
                    setGameState("game_over");
                    setGameOverMessage("White wins! 🏆");
                    console.log("Game Over - White won");
                    break;

                case "black won":
                    // Game over - black won
                    setGameState("game_over");
                    setGameOverMessage("Black wins! 🏆");
                    console.log("Game Over - Black won");
                    break;

                case "opponent_disconnected":
                    // Opponent left the game - notify player
                    setGameState("game_over");
                    setGameOverMessage("Opponent Disconnected");
                    console.log("Opponent disconnected");
                    break;

                case "game_over":
                    // Generic game over message
                    setGameState("game_over");
                    setGameOverMessage("Game Over!");
                    console.log("Game Over");
                    break;
            }
        };
    }, [socket]); // Only re-run when socket reference changes

    /**
     * Handles the PLAY button click
     * Sends init_user message to server to start/join a game
     */
    const handlePlayClick = () => {
        if (socket.current) {
            socket.current.send(JSON.stringify({
                type: "init_user"
            }));
            // Set state to waiting - user will be matched with another player
            setGameState("waiting");
            setPlayerColor(null);
            setGameOverMessage(null);
        }
    };

    /**
     * Reset the game to play again
     */
    const handlePlayAgain = () => {
        setGameState("idle");
        setPlayerColor(null);
        setGameOverMessage(null);
        handlePlayClick();
    };

    // Show loading state while connecting to WebSocket server
    if (status === "connecting") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 text-lg">Connecting to server...</p>
                </div>
            </div>
        );
    }

    // Show error state if WebSocket connection failed
    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-slate-800 text-xl font-semibold mb-2">Connection Error</p>
                    <p className="text-slate-500">Could not connect to the game server. Please try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto px-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Chess Game</h1>
                        <p className="text-slate-500 mt-1">Play chess online</p>
                    </div>
                    {/* Connection Status Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${status === "connected" ? "bg-green-500" : "bg-yellow-500"}`}></span>
                        <span className="text-sm text-slate-600 capitalize">{status === "connected" ? "Online" : status}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4">
                {gameState === "idle" && (
                    // Initial state - show PLAY button
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="text-6xl mb-6">♟️</div>
                        <h2 className="text-2xl font-semibold text-slate-800 mb-3">Ready to Play?</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Click the button below to find an opponent and start your chess game.
                        </p>
                        <button
                            onClick={handlePlayClick}
                            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Find Opponent
                        </button>
                    </div>
                )}

                {gameState === "waiting" && (
                    // Waiting state - waiting for another player to join
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-amber-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">⏳</div>
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-800 mb-3">Finding Opponent...</h2>
                        <p className="text-slate-500 mb-4 max-w-md mx-auto">
                            We're looking for another player to join your game.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-amber-600">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            <span className="text-sm">Waiting for player to connect...</span>
                        </div>
                    </div>
                )}

                {gameState === "playing" && (
                    // Game in progress - show board with player info
                    <div>
                        {/* Player Info Banner */}
                        <div className="bg-white rounded-t-2xl shadow-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${playerColor === "white" ? "bg-slate-100" : "bg-slate-800"}`}>
                                    {playerColor === "white" ? "♔" : "♚"}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">You are playing as</p>
                                    <p className="font-semibold text-slate-800 capitalize">{playerColor}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Status</p>
                                <p className="font-semibold text-green-600">Game in progress</p>
                            </div>
                        </div>
                        {/* Chess Board */}
                        <div className="bg-white rounded-b-2xl shadow-lg p-6">
                            <ChessBoard socket={socket} board={board} />
                        </div>
                    </div>
                )}

                {gameState === "game_over" && (
                    // Game over state
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        {gameOverMessage === "Opponent Disconnected" ? (
                            // Opponent left - show different message
                            <>
                                <div className="text-6xl mb-6">👋</div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-3">Opponent Left</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                    Your opponent has disconnected from the game.
                                </p>
                            </>
                        ) : (
                            // Normal game over (win/loss)
                            <>
                                <div className="text-6xl mb-6">🏆</div>
                                <h2 className="text-3xl font-bold text-slate-800 mb-3">{gameOverMessage}</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                    {playerColor === "white" && gameOverMessage?.includes("White")
                                        ? "Congratulations! You won the match!"
                                        : playerColor === "black" && gameOverMessage?.includes("Black")
                                            ? "Congratulations! You won the match!"
                                            : "Better luck next time!"}
                                </p>
                            </>
                        )}
                        <button
                            onClick={handlePlayAgain}
                            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="max-w-4xl mx-auto px-4 mt-8 text-center">
                {gameState === "playing" && (
                    <p className="text-slate-400 text-sm">
                        Click a piece to select it, then click the destination square to move
                    </p>
                )}
            </div>
        </div>
    );
};
