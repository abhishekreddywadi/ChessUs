import type { Color, PieceSymbol, Square } from "chess.js";
import { useState, type RefObject } from "react";

/**
 * ChessBoard Component
 * Renders a professional chess board and handles piece selection and move sending via WebSocket
 *
 * @param board - 2D array representing the chess board with pieces
 * @param socket - WebSocket ref for sending moves to the server
 */

// Unicode chess symbols for displaying pieces
const PIECE_SYMBOLS: Record<PieceSymbol, { white: string; black: string }> = {
    p: { white: "♙", black: "♟" },  // Pawn
    n: { white: "♘", black: "♞" },  // Knight
    b: { white: "♗", black: "♝" },  // Bishop
    r: { white: "♖", black: "♜" },  // Rook
    q: { white: "♕", black: "♛" },  // Queen
    k: { white: "♔", black: "♚" },  // King
};

export const ChessBoard = ({ board, socket }: {
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][],
    socket: RefObject<WebSocket | null>
}) => {
    // State to track the currently selected square (source square for move)
    const [from, setFrom] = useState<Square | null>(null);

    /**
     * Handles square click events
     * - First click: Selects the piece (sets 'from' square)
     * - Second click: Attempts to make a move to the clicked square
     *
     * @param clickedSquare - The square that was clicked
     */
    const handleSquareClick = (clickedSquare: Square) => {
        // If clicking the same square, deselect it
        if (from === clickedSquare) {
            setFrom(null);
            return;
        }

        // If no source square is selected, set this as the source
        if (!from) {
            setFrom(clickedSquare);
            return;
        }

        // Source square already selected, attempt to make a move
        // Check if socket exists and is connected (readyState === 1 means OPEN)
        if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not connected. Cannot send move.");
            setFrom(null); // Reset selection
            return;
        }

        // Send the move payload to the server via WebSocket
        const movePayload = {
            type: "move",
            payload: {
                from: from,
                to: clickedSquare
            }
        };

        socket.current.send(JSON.stringify(movePayload));
        console.log("Move sent:", movePayload);

        // Reset the selection after sending the move
        setFrom(null);
    };

    /**
     * Gets the appropriate CSS classes for a square based on its position
     * Handles alternating colors and selected state highlighting
     */
    const getSquareClasses = (rowIndex: number, colIndex: number, squareName: Square): string => {
        const isLightSquare = (rowIndex + colIndex) % 2 === 0;
        const isSelected = from === squareName;

        // Base classes - all squares have these
        let classes = "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl cursor-pointer transition-all duration-150 select-none relative ";

        // Color scheme - professional cream/brown tones
        if (isSelected) {
            // Highlighted square (selected piece) - yellow accent
            classes += isLightSquare
                ? "bg-amber-200 ring-4 ring-amber-400 ring-inset "
                : "bg-amber-400 ring-4 ring-amber-500 ring-inset ";
        } else {
            // Normal squares
            classes += isLightSquare
                ? "bg-amber-50 hover:bg-amber-100 "    // Light square - cream
                : "bg-amber-700 hover:bg-amber-600 ";   // Dark square - brown
        }

        return classes;
    };

    /**
     * Gets the styled piece element with proper color
     */
    const getPieceDisplay = (square: { square: Square; type: PieceSymbol; color: Color } | null) => {
        if (!square) return null;

        const symbol = PIECE_SYMBOLS[square.type];
        const pieceChar = square.color === "w" ? symbol.white : symbol.black;

        // Piece color styling - drop shadow for depth
        const colorClass = square.color === "w"
            ? "text-slate-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
            : "text-slate-950 drop-shadow-[0_2px_2px_rgba(255,255,255,0.3)]";

        return (
            <span className={`transition-transform hover:scale-110 active:scale-95 ${colorClass}`}>
                {pieceChar}
            </span>
        );
    };

    // Column labels (a-h) and Row labels (8-1)
    const columnLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            {/* Board container with shadow and border */}
            <div className="bg-amber-950 p-3 rounded-lg shadow-2xl">
                <div className="flex">
                    {/* Row numbers label */}
                    <div className="flex flex-col justify-around pr-2">
                        {[8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                            <div
                                key={num}
                                className="text-amber-200 text-sm font-semibold w-6 text-center"
                            >
                                {num}
                            </div>
                        ))}
                    </div>

                    {/* Chess Board */}
                    <div>
                        {board.map((row, i) => {
                            return (
                                <div key={i} className="flex">
                                    {row.map((square, j) => {
                                        // Calculate the square name (e.g., "a8", "e4")
                                        const squareName = (String.fromCharCode(65 + (j % 8)) + "" + (8 - i)).toLowerCase() as Square;

                                        return (
                                            <div
                                                key={j}
                                                className={getSquareClasses(i, j, squareName)}
                                                onClick={() => handleSquareClick(squareName)}
                                                title={squareName}
                                            >
                                                {getPieceDisplay(square)}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column labels (a-h) */}
                <div className="flex justify-around pl-8 pt-2">
                    {columnLabels.map((label) => (
                        <div
                            key={label}
                            className="text-amber-200 text-sm font-semibold w-12 sm:w-16 md:w-20 text-center"
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Turn indicator / Status */}
            <div className="text-center text-slate-600 text-sm">
                {from ? (
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        Selected: <span className="font-semibold uppercase">{from}</span>
                        <span className="text-slate-400">→ Click destination square</span>
                    </span>
                ) : (
                    <span className="text-slate-500">Click a piece to select it</span>
                )}
            </div>
        </div>
    );
};
