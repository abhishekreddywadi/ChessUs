import WebSocket from "ws"
import type { Moves } from "./GameTypes.js"
import { Chess } from "chess.js"

export class Game {
    public participant1: WebSocket
    public participant2: WebSocket
    public moves: Moves[]
    public board: Chess
    public movesLength: number
    public isGameOver: boolean // Track if game has ended

    constructor(participant1: WebSocket, participant2: WebSocket) {
        this.participant1 = participant1
        this.participant2 = participant2
        this.moves = []
        this.board = new Chess()
        this.movesLength = 0
        this.isGameOver = false

        // Notify both players that game has started
        this.participant1.send(JSON.stringify({
            type: "Game Started",
            message: "game has been Started",
            color: "white"
        }))
        this.participant2.send(JSON.stringify({
            type: "Game Started",
            message: "game has been Started",
            color: "black"
        }))
    }

    /**
     * Handle player disconnection
     * Notifies the other player that their opponent has left
     * @param disconnectedSocket - The WebSocket that disconnected
     */
    public handleDisconnection(disconnectedSocket: WebSocket) {
        if (this.isGameOver) {
            return // Game already over, no need to notify
        }

        this.isGameOver = true

        // Find the other player (the one who didn't disconnect)
        const otherPlayer = this.participant1 === disconnectedSocket
            ? this.participant2
            : this.participant1

        // Notify the remaining player that opponent left
        const disconnectMessage = JSON.stringify({
            type: "opponent_disconnected",
            message: "Your opponent has disconnected. Game abandoned."
        })

        if (otherPlayer.readyState === WebSocket.OPEN) {
            otherPlayer.send(disconnectMessage)
        }

        console.log("Player disconnected, game abandoned")
    }

    public makeMove(socket: WebSocket, move: Moves) {
        if (this.isGameOver) {
            return // Game already over, ignore moves
        }

        if (this.movesLength % 2 == 0 && socket !== this.participant1) {
            return
        }

        if (this.movesLength % 2 == 1 && socket !== this.participant2) {
            return
        }
        try {
            this.board.move(move)

            // Broadcast the move to BOTH players so both can update their boards
            // The sender needs confirmation too, not just the opponent
            const moveMessage = JSON.stringify({
                type: "move",
                payload: move
            })

            this.participant1.send(moveMessage)
            this.participant2.send(moveMessage)

        }

        catch (e) {
            socket.send(JSON.stringify({
                type: "invalid_move",
                message: "invalid Move"
            }))
            return
        }
        // Check if game is over and notify both players
        if (this.board.isGameOver()) {
            this.isGameOver = true
            let winner = "";
            let message = "";

            if (this.board.turn() == 'w') {
                // White's turn means black just made the winning move
                winner = "black won";
                message = "Black wins!";
            } else {
                // Black's turn means white just made the winning move
                winner = "white won";
                message = "White wins!";
            }

            const gameOverMessage = JSON.stringify({
                type: winner,
                message: message
            })

            // Send game over notification to BOTH players
            this.participant1.send(gameOverMessage)
            this.participant2.send(gameOverMessage)
            return
        }
        this.movesLength++;
    }
}
