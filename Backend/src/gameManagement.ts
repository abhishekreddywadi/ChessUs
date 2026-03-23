import WebSocket from "ws"
import { Game } from "./Game.js";
import type { Moves } from "./GameTypes.js"

/**
 * GameManagement Class
 * Manages all connected users, pending players waiting for a match,
 * and active games. Handles user disconnection and game cleanup.
 */
export class GameManagement {
    private PendingParticipants: WebSocket | null
    private users: WebSocket[]
    private games: Game[]

    constructor() {
        this.games = []
        this.users = []
        this.PendingParticipants = null
    }

    /**
     * Add a new user to the game management system
     * Sets up message handlers and disconnect handlers
     * @param userWs - The WebSocket connection for the new user
     */
    public addUser(userWs: WebSocket) {
        this.users.push(userWs)
        this.addEventHandler(userWs)
        this.addDisconnectHandler(userWs)
        console.log(`User connected. Total users: ${this.users.length}`)
    }

    /**
     * Remove a user from the system and clean up their games
     * @param userWs - The WebSocket connection to remove
     */
    public removeUser(userWs: WebSocket) {
        // Remove from users list
        this.users = this.users.filter((user) => user !== userWs)

        // If this user was waiting for a match, clear the pending slot
        if (this.PendingParticipants === userWs) {
            this.PendingParticipants = null
            console.log("Waiting player removed from queue")
        }

        // Find and clean up any games this user was part of
        const gamesToRemove: Game[] = []
        this.games.forEach((game) => {
            if (game.participant1 === userWs || game.participant2 === userWs) {
                // Notify the other player that this user disconnected
                game.handleDisconnection(userWs)
                gamesToRemove.push(game)
            }
        })

        // Remove the completed games from the list
        this.games = this.games.filter((game) => !gamesToRemove.includes(game))

        console.log(`User removed. Remaining users: ${this.users.length}, Active games: ${this.games.length}`)
    }

    /**
     * Set up message event handlers for a user
     * Handles: init_user (find match), move (make chess move)
     * @param userWs - The WebSocket connection to set up handlers for
     */
    public addEventHandler(userWs: WebSocket) {
        userWs.on('message', (data) => {
            try {
                const ParsedData = JSON.parse(data.toString())

                if (ParsedData.type == "init_user") {
                    this.handleInitUser(userWs)
                }
                else if (ParsedData.type == "move") {
                    this.handleMove(userWs, ParsedData.payload)
                }
            } catch (error) {
                console.error("Error parsing message:", error)
            }
        })
    }

    /**
     * Set up disconnect/close event handlers for a user
     * Automatically removes user and notifies opponents when they disconnect
     * @param userWs - The WebSocket connection to set up handlers for
     */
    public addDisconnectHandler(userWs: WebSocket) {
        userWs.on('close', () => {
            this.removeUser(userWs)
        })

        userWs.on('error', (error) => {
            console.error("WebSocket error:", error)
            this.removeUser(userWs)
        })
    }

    /**
     * Handle a user requesting to find a match
     * If someone is waiting, start a game. Otherwise, add to waiting queue.
     * @param userWs - The WebSocket of the user looking for a match
     */
    private handleInitUser(userWs: WebSocket) {
        // Check if there's already a pending participant waiting
        if (this.PendingParticipants) {
            // Someone is waiting - create a game!
            const game = new Game(this.PendingParticipants, userWs)
            this.games.push(game)
            this.PendingParticipants = null // Clear the waiting slot
            console.log("Game started! Total active games:", this.games.length)
        } else {
            // No one waiting - this user becomes the pending participant
            this.PendingParticipants = userWs
            console.log("User added to waiting queue")
        }
    }

    /**
     * Handle a chess move from a user
     * Finds the user's game and processes the move
     * @param userWs - The WebSocket of the user making the move
     * @param move - The move details (from, to squares)
     */
    private handleMove(userWs: WebSocket, move: Moves) {
        const game = this.games.find((g) =>
            g.participant1 === userWs || g.participant2 === userWs
        )

        if (game) {
            game.makeMove(userWs, move)
        } else {
            console.warn("Move received but no game found for user")
        }
    }
}
