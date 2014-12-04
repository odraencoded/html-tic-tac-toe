// constant values for empty, cross and circle marked squares
var NO_MARK = 0
var CROSS_MARK = 1
var CIRCLE_MARK = 2

var PLAYER_MARK = CROSS_MARK
var MACHINE_MARK = CIRCLE_MARK

var COOKIE_LIFESPAN = 60; // days
var COOKIE_PREFIX = "tictactoe-";

// Initialize game
var turn = 0;
var playerTurn = true;

// A 3x3 nested array structure representing the game board
// The values of the game goes here, "squares" contains the elements
// representing the squares in a similar structure
board = [[NO_MARK, NO_MARK, NO_MARK],
         [NO_MARK, NO_MARK, NO_MARK],
         [NO_MARK, NO_MARK, NO_MARK]];

playing = false;
score = { victories: 0, ties: 0, defeats: 0 }

/* Caching DOM elements */

// DOM elements used for output of the game score
scoreEls = {
	victories: document.getElementById("wins"),
	ties: document.getElementById("draws"),
	defeats: document.getElementById("losses")
}

// Get board element
boardEl = document.getElementById("board");
boardEl.removeAttribute("hidden");

// Refresh board size
resizeBoard.queued = false;
queueResizeBoard();
window.addEventListener("resize", queueResizeBoard);

// Squares store the DOM elements that represent each board square
// in the same structure as "board" stores the turns
squares = [[],[],[]];
for(var l=0; l<3; l++) {
	var rowEl = boardEl.children[l];
	rowEl.className = "square-row";
	
	for(var c=0; c<3; c++) {
		var cellEl = rowEl.children[c];
		cellEl.className = "square-cell";
		
		var id = "square-" + (l + 1) + "-" + (c + 1);
		var el = document.getElementById(id);
		el.line = l;
		el.column = c;
		squares[l][c] = el;
		el.addEventListener("click", function(e) {
			e.preventDefault();
			if(clickedSquare(this.line, this.column)) {
				endTurn(this.line, this.column);
			};
		});
	}
}

turnEl = document.getElementById("turn-stat");
statusEl = document.getElementById("status");

document.getElementById("new-game").addEventListener("click", startNewGame);

// Load a previously loaded game or start a new one
loadGame();

// Updates which turn is showing in the HTML
function refreshTurnStat() {
	if(turn < 8) {
		var html = "" + (turn + 1);
		if(turn == 0) html += "st";
		else if(turn == 1) html += "nd";
		else if(turn == 2) html += "rd";
		else html += "th";
	} else {
		html = "Last";
	}
	html += " Turn";
	
	turnEl.innerHTML = html;
}

// Starts a game from scratch
function startNewGame() {
	// Clear board
	board = [[NO_MARK, NO_MARK, NO_MARK],
	         [NO_MARK, NO_MARK, NO_MARK],
	         [NO_MARK, NO_MARK, NO_MARK]];
	
	turn = 0;
	playing = true;
	boardEl.className = "playing";
	
	// Reset classes added to board elements
	for(var l=0; l<3; l++) {
		for(var c=0; c<3; c++) {
			squares[l][c].className = "square";
		}
	}
	
	// Decide who starts playing
	if(Math.random() < 0.5) {
		playerTurn = true;
	} else {
		playerTurn = false;
		machineTurn();
	}
	
	statusEl.textContent = "Your Turn";
	refreshTurnStat();
	
	// Auto-save game
	setCookie("board", JSON.stringify(board));
}

// Loads a previously saved game or starts a new one
function loadGame() {
	// Get saved score
	var savedScore = getCookie("score")
	if(savedScore != "") {
		score = JSON.parse(savedScore);
		for(var key in score) {
			scoreEls[key].textContent = score[key];
		}
	}
	
	// Get saved board data
	var savedBoard = getCookie("board");
	if(savedBoard != "") {
		board = JSON.parse(savedBoard);
		
		// Reset turn
		turn = 0;
		
		// Set classes for each square element which was marked
		for(var l=0; l<3; l++) {
			for(var c=0; c<3; c++) {
				var mark = board[l][c];
				var square = squares[l][c];
				square.className = "square";
				if(mark != NO_MARK) {
					// Turn isn't saved, it's calculated from how many
					// marks have been marked
					turn++;
					if(mark == CROSS_MARK) {
						square.className += " marked cross";
					} else if(mark == CIRCLE_MARK){
						square.className += " marked circle";
					}
				}
			}
		}
		
		/* Testing whether the saved game had been completed already */
		
		// Contains what squares finished the game
		var highlight = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		var matchResult = 0;
		
		// An array of tests to check whether game is finished
		var tests = []
		
		// To check whether there are three of the same in any line
		for(var l=0; l<3; l++) {
			tests.push([[l, 0], [l, 1], [l, 2]]);
		}
		
		// To check whether there are three of the same in any column
		for(var c=0; c<3; c++) {
			tests.push([[0, c], [1, c], [2, c]]);
		}
		
		// To check whether there are three of the same in any diagonal
		tests.push([[0, 0], [1, 1], [2, 2]]);
		tests.push([[0, 2], [1, 1], [2, 0]]);
		
		// Execute tests
		for(var i=0; i<tests.length; i++) {
			var test = tests[i];
			
			// Which mark are we testing for
			var markLine = test[0][0];
			var markCol = test[0][1];
			var mark = board[markLine][markCol];
			
			if(mark != NO_MARK) {
				if(checkLineVictory(mark, test, highlight)) {
					matchResult = mark;
				}
			}
		}
		
		// Check playing state
		playing = false;
		if(matchResult == NO_MARK) {
			if(turn >= 9) {
				statusEl.textContent = "Draw";
			} else {
				statusEl.textContent = "Your Turn";
				
				// Within 8 turns and nobody has won, the game continues
				playing = true;
			}
		} else {
			// The winning move doesn't increase the turn counter
			// because the turn counter is for the player's current turn,
			// and after the game is won there are no more turns.
			turn--;
			
			// Change status accordingly
			if(matchResult == PLAYER_MARK) {
				statusEl.textContent = "Your Win";
			} else if(matchResult == MACHINE_MARK) {
				statusEl.textContent = "You Lose";
			}
		}
		
		// Highlight winning move
		highlightSquares(highlight)
		
		// Update board class accordingly
		if(playing) {
			boardEl.className = "playing";
		} else {
			boardEl.className = "finished";
		}
		
		// Refresh turn counter
		refreshTurnStat();
	} else {
		// board == ""
		// There was no board saved.
		// Start a new game from scratch
		startNewGame();
	}
}

// Event handler for clicking a square
function clickedSquare(l, c) {
	if(playing && board[l][c] == 0) {
		addMark(l, c, 1);
		return true;
	} else {
		return false;
	}
}

// Test whether array "positions" is entirely composed of elements that
// equal to "mark."
// if it's, sets "highlight" elements based on "positions" x,y
// pairs with the value of 1
// Returns whether "positions" matched "mark"
function checkLineVictory(mark, positions, highlight) {
	var positionsMatch = true;
	
	// Checking line
	for(var i=0; i<3; i++) {
		if(board[positions[i][0]][positions[i][1]] != mark) {
			var positionsMatch = false;
			break;
		}
	}
	
	if(positionsMatch) {
		// Set highlight 
		for(var i=0; i<3; i++) {
			highlight[positions[i][0]][positions[i][1]] = 1;
		}
	}
	
	// Return whether positions matched
	return positionsMatch;
}

// Adds the .highlight class to board elements when their position on
// the "highlight" structure has a true value
function highlightSquares(highlight) {
	for(var l=0; l<3; l++) {
		for(var c=0; c<3; c++) {
			if(highlight[l][c]) {
				squares[l][c].className += " highlighted";
			}
		}
	}
}

// Ends a turn. l, c are the line and column of the last mark added
function endTurn(l, c) {
	var mark = board[l][c];
	var victory = false;
	
	// Creates a highlight structure
	var highlight = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
	
	// Check whether the mark has completed a line or column
	victory |= checkLineVictory(mark, [[0, c], [1, c], [2, c]], highlight);
	victory |= checkLineVictory(mark, [[l, 0], [l, 1], [l, 2]], highlight);
	
	// Check for the diagonals
	if((l == 0 && c == 0) || (l == 1 && c == 1) || (l == 2 && c == 2)) {
		victory |= checkLineVictory(mark, [[0, 0], [1, 1], [2, 2]], highlight);
	}
	if((l == 0 && c == 2) || (l == 1 && c == 1) || (l == 2 && c == 0)) {
		victory |= checkLineVictory(mark, [[0, 2], [1, 1], [2, 0]], highlight);
	}
	
	if(victory) {
		highlightSquares(highlight);
		
		// Update display
		if(playerTurn) {
			statusEl.textContent = "You Win";
			score.victories += 1;
			endGame();
		} else {
			statusEl.textContent = "You Lose";
			score.defeats += 1;
			endGame();
		}
	} else if(turn < 8) {
		// Continue game
		turn += 1;
		refreshTurnStat();
		
		playerTurn = !playerTurn;
		if(!playerTurn) {
			machineTurn();
			return // machineTurn calls this method anyway
		}
	} else {
		// End game in a draw
		statusEl.textContent = "Draw";
		score.ties += 1;
		endGame();
	}
	
	if(!playing) {
		boardEl.className = "finished";
	}
	
	setCookie("board", JSON.stringify(board));
}

function endGame() {
	playing = false;
	
	// Update score
	for(var key in score) {
		scoreEls[key].textContent = score[key];
	}
	
	// Save score
	setCookie("score", JSON.stringify(score));
}

// Returns how many marks of each player a given set of positions has
// And which positions are empty
// This is used by the CPU turn to figure out where is the best place to put
// its mark
function getLineStats(positions) {
	// Output structure
	var lineStats = {
		empty: [],
		machineMarks: 0,
		playerMarks: 0
	}
	
	for(var i=0; i<3; i++) {
		var position = positions[i];
		var l = position[0];
		var c = position[1];
		var mark = board[l][c];
		
		if(mark  == NO_MARK) {
			lineStats.empty.push(position);
		} else if(mark  == PLAYER_MARK) {
			lineStats.playerMarks += 1;
		} else if(mark  == MACHINE_MARK) {
			lineStats.machineMarks += 1;
		}
	}
	
	return lineStats;
}

// Takes place when the player has played his play and is now time for the
// machine to do something
function machineTurn() {
	// The machine plays like this:
	// If there is a spot that will make the machine win, chose that spot.
	// If there is a spot that, in the next turn, will let the player win,
	// chose that spot.
	// If there are no obvious spot choose a random spot.
	// Each spot is assigned a weight that determines its chance to be randomly
	// selected. That weight is based on the following:
	// Block chances: the number of lines which have no machine marks that this
	// spot is part of. Blocking means preventing the player from winning.
	// Win chances: the number of lines which don't have a player mark that this
	// spot is part of. Meaning the machine can win through this line.
	// Win progress: One point for each line that has one machine mark and no
	// player marks. For example:
	// M P P    P = Player
	// 1 2 0    M = Machine
	// M 1 1    012 = Win Progress
	// By the way, the highest win progress is 3
	// P 2 1    But this doesn't happen because the machine would choose the
	// M 3 2    center in the third turn in order to prevent the player from
	// M M P    winning the game.
	// Edge: Any spot that isn't the center spot gains an extra point, because
	// The center spot sucks.
	// These stats are used to calculate a spot weight, given by the formula:
	// (1 + WC + BC) ^ (E + WP + BC)
	// Example Weights
	// 4     3     4       P     9    16      P    27    64
	// 3     1     3  ->   M    25     9  ->  M   625     9
	// 4     3     4       2     3    16      P     M     9
	// Example Probabilities
	// 13%  10%  13%       P    11%  20%      P    3%    8%
	// 10%   3%  10%  ->   M    31%  11%  ->  M   85%    1%
	// 13%  10%  13%       2%    3%  20%      P     M    1%
	
	
	//          3 + 3
	//     
	//      
	
	// A structure where square stats will be placed
	// The stats will be used to decide which spot will be used by the machine
	// If neither a spot that gives the machine a win or prevents its loss exists
	var boardStats = [[null, null, null],
	                  [null, null, null],
	                  [null, null, null]];
	
	// Spots that form a line of 3 machine marks
	var victorySpots = [];
	
	// Empty spots in lines containing 2 player marks already
	var preventDefeatSpots = [];
	
	// Column stats
	var allLineSquares = [
		// Each of the three lines
		[[0, 0], [1, 0], [2, 0]],
		[[0, 1], [1, 1], [2, 1]],
		[[0, 2], [1, 2], [2, 2]],
		
		// Each of the three columns
		[[0, 0], [0, 1], [0, 2]],
		[[1, 0], [1, 1], [1, 2]],
		[[2, 0], [2, 1], [2, 2]],
		
		// Both diagonals
		[[0, 0], [1, 1], [2, 2]],
		[[0, 2], [1, 1], [2, 0]],
	]
	
	for(var i = 0; i < allLineSquares.length; i++) {
		var lineSquares = allLineSquares[i];
		var lineStats = getLineStats(lineSquares);
		
		if(lineStats.playerMarks == 0 && lineStats.machineMarks == 2) {
			// There are 0 player marks here and 2 machine marks
			// Marking the remaining space wins the game
			victorySpots.push(lineStats.empty[0]);
		} 
		
		if(lineStats.playerMarks == 2 && lineStats.machineMarks == 0) {
			// There are 2 player marks here and 0 machine marks
			// Marking the remaining space can prevent the machine from losing
			preventDefeatSpots.push(lineStats.empty[0]);
		}
		
		if(lineStats.playerMarks == 0) {
			// If there are no player marks in a line
			// It's possible to win the game using that line
			lineStats.winChance = true;
		}
		
		if(lineStats.machineMarks > 0) {
			lineStats.marked = true;
		}
		
		if(lineStats.machineMarks == 0 && lineStats.playerMarks > 0) {
			// If there are no machine marks in a line
			// It's possible for the player to win the game with that line
			// Putting something here might help prevent loss
			lineStats.blockChance = true;
		}
		
		// Store data in the squares
		for(var j = 0; j < lineSquares.length; j++) {
			var p = lineSquares[j];
			var l = p[0];
			var c = p[1];
			
			var squareStats = boardStats[l][c];
			if(squareStats === null) {
				boardStats[l][c] = squareStats = {
					winChances: 0,
					winProgress: 0,
					blockChances: 0,
					lines: []
				};
			}
			
			squareStats.lines.push(lineStats)
			if(lineStats.winChance) {
				squareStats.winChances += 1;
				
				if(lineStats.marked) {
					squareStats.winProgress += 1;
				}
			}
			
			if(lineStats.blockChance) {
				squareStats.blockChances += 1;
			}
		}
	}
	
	// Find the best spots in the board to place a mark
	var bestSpots = [];
	var chosenIndex, chosenSpot;
	
	if(victorySpots.length > 0) {
		// The best spots are the spots that win the game
		// Even if there are spots that can prevent the player from forming a line
		// As long as the machine wins in this turn there's nothing to worry about
		bestSpots = victorySpots;
		
		// Choose a random spot
		chosenIndex = Math.floor(Math.random() * bestSpots.length);
		chosenSpot = bestSpots[chosenIndex];
	} else if(preventDefeatSpots.length > 0) {
		// If the player is one turn away from forming a line, the machine can
		// still prevent him from winning if it uses this turn to do so
		bestSpots = preventDefeatSpots;
		
		// Choose a random spot
		chosenIndex = Math.floor(Math.random() * bestSpots.length);
		chosenSpot = bestSpots[chosenIndex];
	} else {
		// If you can't win in this turn and you aren't about to lose,
		// the decision can become complex
		
		// Holds the computed value of the current best possible choices
		var totalChance = 0;
		var possibleSquares = [];
		
		// For each empty spot, calculate its value as a game choice.
		// If the value is equal to the highest value,
		// add it to the best possible choices
		// If it's higher, leave it as the only the best possible choice
		for(var l=0; l<3; l++) {
			for(var c=0; c<3; c++) {
				// Can't use a square which is already used
				if(board[l][c] !== NO_MARK)
					continue
					
				var squareStats = boardStats[l][c];
				
				// Calculate how good this spot is, mathematically speaking
				var value = 1 + squareStats.winChances + squareStats.blockChances;
				
				if(squareStats.lines.length === 4) {
					// The center spot sucks, don't want to choose it.
					value = Math.pow(
						value, 0 + squareStats.winProgress + squareStats.blockChances
					)
				} else {
					value = Math.pow(
						value, 1 + squareStats.winProgress + squareStats.blockChances
					)
				}
				
				// Add to possible squares
				// Value represents its relative chance in the poll
				totalChance += value;
				possibleSquares.push({chance: value, spot: [l, c]})
			}
		}
		
		// Choose a random spot
		chosenIndex = Math.random() * totalChance;
		var chanceIter = 0;
		for(var i = 0; i < possibleSquares.length; i++) {
			chanceIter += possibleSquares[i].chance;
			if(chosenIndex <= chanceIter) {
				chosenSpot = possibleSquares[i].spot;
				break;
			}
		}
	}
	
	// Add mark and end turn
	addMark(chosenSpot[0], chosenSpot[1], 2);
	endTurn(chosenSpot[0], chosenSpot[1]);
}

// Adds a mark somewhere and updates elements' classes accordingly
function addMark(l, c, v) {
	board[l][c] = v;
	if(v == 1) {
		squares[l][c].className += " marked cross";
	} else if(v == 2) {
		squares[l][c].className += " marked circle";
	}
}

// Saves a piece of information
function setCookie(name, value) {
	name = COOKIE_PREFIX + name;
	
	// Use local storage instead if available
	if(window.localStorage) {
		localStorage[name] = value
	} else {
		var date = new Date();
		date.setTime(date.getTime() + (COOKIE_LIFESPAN * 24 * 60 * 60 * 1000));
		var expires = "; expires=" + date.toGMTString();
		
		document.cookie = name + "=" + value + expires + ";";
	}
}

// Loads a piece of information
function getCookie(name) {
	name = COOKIE_PREFIX + name;
	
	// Use local storage instead if available
	if(window.localStorage) {
		value = localStorage[name]
		if(value !== undefined) {
			// If value is undefined we try to load from cookies
			return value;
		}
	}
	
	// Try to load the data from cookies
	start = document.cookie.indexOf(name + "=");
	if(start != -1) {
		valueStart = start + name.length + 1;
		valueEnd = document.cookie.indexOf(";", valueStart);
		if(valueEnd == -1) {
			valueEnd = document.cookie.length;
		}
		return unescape(document.cookie.substring(valueStart, valueEnd));
	}
	
	return "";
}

// Makes the board height the same as its width
function resizeBoard() {
	var boardContainerEl = document.getElementById("board-container");
	boardEl.style.height = "" + boardContainerEl.clientWidth + "px";
}

// Event handler for window resize
// Queues resizeBoard to run in a way that doesn't fire resizeBoard too often
function queueResizeBoard() {
	if(!resizeBoard.queued) {
		// Setting flag
		resizeBoard.queued = true;
		
		// Queueing runResizeBoard
		if(window.requestAnimationFrame) {
			 window.requestAnimationFrame(runResizeBoard);
		} else {
			setTimeout(runResizeBoard, 66);
		}
	}
	
	function runResizeBoard() {
		resizeBoard();
		
		// Resetting flag
		resizeBoard.queued = false;
	}
};