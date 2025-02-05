// Global variables for board state, turn, and selection
let boardState = []; // 8x8 array holding piece objects or null
let currentTurn = "w"; // "w" for white, "b" for black
let selectedSquare = null; // {row, col} of the currently selected piece
let legalMoves = []; // Array of legal moves for the selected piece

// Initialize the board state with standard starting position
function initBoard() {
  boardState = [];
  // Row 0: Black major pieces
  boardState.push([
    { type: "rook", color: "b", moved: false },
    { type: "knight", color: "b" },
    { type: "bishop", color: "b" },
    { type: "queen", color: "b" },
    { type: "king", color: "b", moved: false },
    { type: "bishop", color: "b" },
    { type: "knight", color: "b" },
    { type: "rook", color: "b", moved: false }
  ]);
  // Row 1: Black pawns
  let row1 = [];
  for (let i = 0; i < 8; i++) {
    row1.push({ type: "pawn", color: "b", moved: false });
  }
  boardState.push(row1);
  // Rows 2 to 5: Empty squares
  for (let r = 2; r <= 5; r++) {
    boardState.push(new Array(8).fill(null));
  }
  // Row 6: White pawns
  let row6 = [];
  for (let i = 0; i < 8; i++) {
    row6.push({ type: "pawn", color: "w", moved: false });
  }
  boardState.push(row6);
  // Row 7: White major pieces
  boardState.push([
    { type: "rook", color: "w", moved: false },
    { type: "knight", color: "w" },
    { type: "bishop", color: "w" },
    { type: "queen", color: "w" },
    { type: "king", color: "w", moved: false },
    { type: "bishop", color: "w" },
    { type: "knight", color: "w" },
    { type: "rook", color: "w", moved: false }
  ]);
}

// Render the board state to the DOM
function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const box = document.createElement("div");
      box.classList.add("box");
      // Alternate colors based on row+col parity
      if ((r + c) % 2 === 0) {
        box.classList.add("light");
      } else {
        box.classList.add("dark");
      }
      box.dataset.row = r;
      box.dataset.col = c;
      // If there is a piece, add its image
      const piece = boardState[r][c];
      if (piece) {
        const img = document.createElement("img");
        img.classList.add("pcs");
        // The image source follows the pattern: pieces-basic-svg/{pieceType}-{color}.svg
        img.src = `pieces-basic-svg/${piece.type}-${piece.color}.svg`;
        img.alt = `${piece.type}-${piece.color}`;
        box.appendChild(img);
      }
      boardDiv.appendChild(box);
    }
  }
}

// Helper functions for board bounds and piece detection
function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}
function isEmpty(r, c) {
  return inBounds(r, c) && boardState[r][c] === null;
}
function isEnemy(r, c, color) {
  return inBounds(r, c) && boardState[r][c] && boardState[r][c].color !== color;
}
function isAlly(r, c, color) {
  return inBounds(r, c) && boardState[r][c] && boardState[r][c].color === color;
}

// Generate legal moves for the piece at (row, col)
function getLegalMoves(piece, row, col) {
  let moves = [];
  if (piece.type === "pawn") {
    // Pawns move forward differently depending on color
    const dir = piece.color === "w" ? -1 : 1;
    // One square forward
    if (isEmpty(row + dir, col)) moves.push({ row: row + dir, col });
    // Two squares forward if not moved yet
    if (!piece.moved && isEmpty(row + dir, col) && isEmpty(row + 2 * dir, col)) {
      moves.push({ row: row + 2 * dir, col });
    }
    // Diagonal captures
    if (isEnemy(row + dir, col - 1, piece.color)) moves.push({ row: row + dir, col: col - 1 });
    if (isEnemy(row + dir, col + 1, piece.color)) moves.push({ row: row + dir, col: col + 1 });
    // (En passant could be added here)
  } else if (piece.type === "knight") {
    const knightMoves = [
      { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
      { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
      { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
      { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
    ];
    knightMoves.forEach(m => {
      const newRow = row + m.dr, newCol = col + m.dc;
      if (inBounds(newRow, newCol) && !isAlly(newRow, newCol, piece.color)) {
        moves.push({ row: newRow, col: newCol });
      }
    });
  } else if (piece.type === "bishop") {
    moves = moves.concat(slidingMoves(row, col, piece.color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]));
  } else if (piece.type === "rook") {
    moves = moves.concat(slidingMoves(row, col, piece.color, [[-1, 0], [1, 0], [0, -1], [0, 1]]));
  } else if (piece.type === "queen") {
    moves = moves.concat(
      slidingMoves(row, col, piece.color, [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ])
    );
  } else if (piece.type === "king") {
    const kingMoves = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
      { dr: 0, dc: -1 },                   { dr: 0, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
    ];
    kingMoves.forEach(m => {
      const newRow = row + m.dr, newCol = col + m.dc;
      if (inBounds(newRow, newCol) && !isAlly(newRow, newCol, piece.color)) {
        moves.push({ row: newRow, col: newCol });
      }
    });
    // Castling (note: this simplified version does not check for moving through check)
    if (!piece.moved) {
      // Kingside castling
      if (boardState[row][7] &&
          boardState[row][7].type === "rook" &&
          boardState[row][7].color === piece.color &&
          !boardState[row][7].moved &&
          isEmpty(row, col + 1) &&
          isEmpty(row, col + 2)
      ) {
        moves.push({ row: row, col: col + 2, castling: "kingside" });
      }
      // Queenside castling
      if (boardState[row][0] &&
          boardState[row][0].type === "rook" &&
          boardState[row][0].color === piece.color &&
          !boardState[row][0].moved &&
          isEmpty(row, col - 1) &&
          isEmpty(row, col - 2) &&
          isEmpty(row, col - 3)
      ) {
        moves.push({ row: row, col: col - 2, castling: "queenside" });
      }
    }
  }
  return moves;
}

// Helper for sliding pieces (bishop, rook, queen)
function slidingMoves(row, col, color, directions) {
  let moves = [];
  directions.forEach(dir => {
    let r = row, c = col;
    while (true) {
      r += dir[0];
      c += dir[1];
      if (!inBounds(r, c)) break;
      if (isEmpty(r, c)) {
        moves.push({ row: r, col: c });
      } else {
        if (isEnemy(r, c, color)) moves.push({ row: r, col: c });
        break;
      }
    }
  });
  return moves;
}

// Highlight squares in legalMoves by adding a CSS class
function highlightLegalMoves() {
  legalMoves.forEach(move => {
    const box = document.querySelector(`.box[data-row="${move.row}"][data-col="${move.col}"]`);
    if (box) box.classList.add("legal");
  });
}
// Remove all legal move highlights
function clearHighlights() {
  document.querySelectorAll(".legal").forEach(box => box.classList.remove("legal"));
}

// Handle a click on a board square at (row, col)
function handleClick(row, col) {
  const piece = boardState[row][col];
  // No piece selected yet: select if it belongs to the current turn
  if (selectedSquare === null) {
    if (piece && piece.color === currentTurn) {
      selectedSquare = { row, col };
      legalMoves = getLegalMoves(piece, row, col);
      // (Optional: you might filter out moves that would leave the king in check)
      highlightLegalMoves();
      highlightSquare(row, col);
    }
  } else {
    // Clicking the same square cancels selection
    if (selectedSquare.row === row && selectedSquare.col === col) {
      clearHighlights();
      unhighlightSquare(row, col);
      selectedSquare = null;
      legalMoves = [];
      return;
    }
    // If the clicked square is among the legal moves, make the move
    if (legalMoves.some(move => move.row === row && move.col === col)) {
      movePiece(selectedSquare, { row, col, ...getMoveData(row, col) });
      clearHighlights();
      unhighlightSquare(selectedSquare.row, selectedSquare.col);
      selectedSquare = null;
      legalMoves = [];
      // Switch turn
      currentTurn = currentTurn === "w" ? "b" : "w";
      // Check for checkmate/stalemate for the new turn
      setTimeout(checkGameStatus, 100); // slight delay to allow board re-rendering
    } else {
      // If you click on another piece of your own color, reselect that piece.
      if (piece && piece.color === currentTurn) {
        clearHighlights();
        unhighlightSquare(selectedSquare.row, selectedSquare.col);
        selectedSquare = { row, col };
        legalMoves = getLegalMoves(piece, row, col);
        highlightLegalMoves();
        highlightSquare(row, col);
      }
    }
  }
}

// (Optional) Visual feedback for the selected square
function highlightSquare(row, col) {
  const box = document.querySelector(`.box[data-row="${row}"][data-col="${col}"]`);
  if (box) box.classList.add("selected");
}
function unhighlightSquare(row, col) {
  const box = document.querySelector(`.box[data-row="${row}"][data-col="${col}"]`);
  if (box) box.classList.remove("selected");
}

// Return any extra move data (for example, if this move is a castling move)
function getMoveData(row, col) {
  // Find the move object (if any) for this square
  const m = legalMoves.find(move => move.row === row && move.col === col);
  return m || {};
}

// Make a move from one square to another
function movePiece(from, to) {
  const piece = boardState[from.row][from.col];
  // If this move is castling, handle the rook move as well.
  if (to.castling) {
    boardState[to.row][to.col] = piece;
    boardState[from.row][from.col] = null;
    piece.moved = true;
    if (to.castling === "kingside") {
      const rook = boardState[from.row][7];
      boardState[from.row][5] = rook;
      boardState[from.row][7] = null;
      if (rook) rook.moved = true;
    } else if (to.castling === "queenside") {
      const rook = boardState[from.row][0];
      boardState[from.row][3] = rook;
      boardState[from.row][0] = null;
      if (rook) rook.moved = true;
    }
  } else {
    boardState[to.row][to.col] = piece;
    boardState[from.row][from.col] = null;
    if (piece.hasOwnProperty("moved")) {
      piece.moved = true;
    }
    // Pawn promotion: auto-promote to queen when reaching the last rank
    if (piece.type === "pawn") {
      if ((piece.color === "w" && to.row === 0) || (piece.color === "b" && to.row === 7)) {
        piece.type = "queen";
      }
    }
  }
  renderBoard();
}

// --- Check / Checkmate / Stalemate Detection ---

// Determine whether the king of the given color is in check.
function isKingInCheck(color) {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardState[r][c];
      if (p && p.type === "king" && p.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
    if (kingPos) break;
  }
  if (!kingPos) return false; // should not happen
  // For every enemy piece, if any can move to the king’s square then the king is in check.
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardState[r][c];
      if (p && p.color !== color) {
        const moves = getLegalMoves(p, r, c);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check if a side has any legal moves that do not leave its king in check.
function hasLegalMoves(color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardState[r][c];
      if (p && p.color === color) {
        const moves = getLegalMoves(p, r, c);
        for (const move of moves) {
          if (!simulateMoveLeavesKingInCheck(r, c, move, color)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Simulate a move and check whether the moving side’s king remains safe.
function simulateMoveLeavesKingInCheck(fromRow, fromCol, move, color) {
  // Make a deep copy of boardState (for small boards this is acceptable)
  let tempBoard = boardState.map(row => row.map(p => p ? { ...p } : null));
  const piece = tempBoard[fromRow][fromCol];
  tempBoard[move.row][move.col] = piece;
  tempBoard[fromRow][fromCol] = null;
  if (move.castling) {
    if (move.castling === "kingside") {
      tempBoard[fromRow][5] = tempBoard[fromRow][7];
      tempBoard[fromRow][7] = null;
    } else if (move.castling === "queenside") {
      tempBoard[fromRow][3] = tempBoard[fromRow][0];
      tempBoard[fromRow][0] = null;
    }
  }
  return isKingInCheckSim(color, tempBoard);
}

// Version of isKingInCheck that works on a provided board (for simulation)
function isKingInCheckSim(color, board) {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "king" && p.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
    if (kingPos) break;
  }
  if (!kingPos) return false;
  // For every enemy piece, see if it can attack the king.
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color !== color) {
        const moves = getLegalMovesSim(p, r, c, board);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// A simulation version of getLegalMoves that uses a provided board.
function getLegalMovesSim(piece, row, col, board) {
  let moves = [];
  function inBoundsSim(r, c) {
    return r >= 0 && r < 8 && c < 8 && c >= 0;
  }
  function isEmptySim(r, c) {
    return inBoundsSim(r, c) && board[r][c] === null;
  }
  function isEnemySim(r, c, color) {
    return inBoundsSim(r, c) && board[r][c] && board[r][c].color !== color;
  }
  function isAllySim(r, c, color) {
    return inBoundsSim(r, c) && board[r][c] && board[r][c].color === color;
  }
  function slidingMovesSim(row, col, color, directions) {
    let mvs = [];
    directions.forEach(dir => {
      let r = row, c = col;
      while (true) {
        r += dir[0];
        c += dir[1];
        if (!inBoundsSim(r, c)) break;
        if (isEmptySim(r, c)) {
          mvs.push({ row: r, col: c });
        } else {
          if (isEnemySim(r, c, color)) mvs.push({ row: r, col: c });
          break;
        }
      }
    });
    return mvs;
  }
  if (piece.type === "pawn") {
    const dir = piece.color === "w" ? -1 : 1;
    if (isEmptySim(row + dir, col)) moves.push({ row: row + dir, col: col });
    if (!piece.moved && isEmptySim(row + dir, col) && isEmptySim(row + 2 * dir, col)) {
      moves.push({ row: row + 2 * dir, col: col });
    }
    if (isEnemySim(row + dir, col - 1, piece.color)) moves.push({ row: row + dir, col: col - 1 });
    if (isEnemySim(row + dir, col + 1, piece.color)) moves.push({ row: row + dir, col: col + 1 });
  } else if (piece.type === "knight") {
    const knightMoves = [
      { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
      { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
      { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
      { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
    ];
    knightMoves.forEach(m => {
      const newRow = row + m.dr, newCol = col + m.dc;
      if (inBoundsSim(newRow, newCol) && !isAllySim(newRow, newCol, piece.color)) {
        moves.push({ row: newRow, col: newCol });
      }
    });
  } else if (piece.type === "bishop") {
    moves = moves.concat(slidingMovesSim(row, col, piece.color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]));
  } else if (piece.type === "rook") {
    moves = moves.concat(slidingMovesSim(row, col, piece.color, [[-1, 0], [1, 0], [0, -1], [0, 1]]));
  } else if (piece.type === "queen") {
    moves = moves.concat(slidingMovesSim(row, col, piece.color, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]));
  } else if (piece.type === "king") {
    const kingMoves = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
      { dr: 0, dc: -1 },                  { dr: 0, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
    ];
    kingMoves.forEach(m => {
      const newRow = row + m.dr, newCol = col + m.dc;
      if (inBoundsSim(newRow, newCol) && !isAllySim(newRow, newCol, piece.color)) {
        moves.push({ row: newRow, col: newCol });
      }
    });
  }
  return moves;
}

// After a move, check if the new turn has any legal moves.
// If none, and the king is in check → checkmate; otherwise → stalemate.
function checkGameStatus() {
  if (!hasLegalMoves(currentTurn)) {
    if (isKingInCheck(currentTurn)) {
      alert(`Checkmate! ${currentTurn === "w" ? "White" : "Black"} loses!`);
    } else {
      alert("Stalemate!");
    }
  }
}

// --- Event Listeners ---

// Listen for clicks on the board (using event delegation)
document.getElementById("board").addEventListener("click", (e) => {
  const box = e.target.closest(".box");
  if (!box) return;
  const row = parseInt(box.dataset.row);
  const col = parseInt(box.dataset.col);
  handleClick(row, col);
});

// Initialize the game on page load
document.addEventListener("DOMContentLoaded", () => {
  initBoard();
  renderBoard();
});
