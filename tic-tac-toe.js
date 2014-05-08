playerTurn = true;

board = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
squares = [[],[],[]];
turn = 0;
playing = false;
score = { victories: 0, ties: 0, defeats: 0 }
scoreEls = {
	victories: document.getElementById("wins"),
	ties: document.getElementById("draws"),
	defeats: document.getElementById("losses")
}
for(var l=0; l<3; l++) {
	for(var c=0; c<3; c++) {
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

boardEl = document.getElementById("board");
boardEl.removeAttribute("hidden");

turnEl = document.getElementById("turn-stat");
statusEl = document.getElementById("status");

document.getElementById("new-game").addEventListener("click", startNewGame);

loadGame();

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

function startNewGame() {
	board = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	turn = 0;
	playing = true;
	boardEl.className = "playing";
	
	for(var l=0; l<3; l++) {
		for(var c=0; c<3; c++) {
			squares[l][c].className = "square";
		}
	}
	if(Math.random() < 0.5) {
		playerTurn = true;
	} else {
		playerTurn = false;
		machineTurn();
	}
	statusEl.textContent = "Your Turn";
	refreshTurnStat();
	
	setCookie("board", JSON.stringify(board), 60);
}


function loadGame() {
	turn = 0;
	var savedScore = getCookie("score")
	if(savedScore != "") {
		score = JSON.parse(savedScore);
		for(var key in score) {
			scoreEls[key].textContent = score[key];
		}
	}
	var savedBoard = getCookie("board");
	if(savedBoard != "") {
		board = JSON.parse(savedBoard);
		for(var l=0; l<3; l++) {
			for(var c=0; c<3; c++) {
				var mark = board[l][c];
				var square = squares[l][c];
				square.className = "square";
				if(mark != 0) {
					turn++;
					if(mark == 1) {
						square.className += " marked cross";
					} else if(mark == 2){
						square.className += " marked circle";
					}
				}
			}
		}
		
		var highlight = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		var matchResult = 0;
		var tests = []
		for(var l=0; l<3; l++) {
			tests.push([[l, 0], [[l, 0], [l, 1], [l, 2]]]);
		}
		for(var c=0; c<3; c++) {
			tests.push([[0, c], [[0, c], [1, c], [2, c]]]);
		}
		tests.push([[1, 1], [[0, 0], [1, 1], [2, 2]]]);
		tests.push([[1, 1], [[0, 2], [1, 1], [2, 0]]]);
		
		for(var i=0; i<tests.length; i++) {
			var l = tests[i][0][0];
			var c = tests[i][0][1];
			var test = tests[i][1];
			var mark = board[l][c];
			if(mark != 0) {
				if(checkLineVictory(mark, test, highlight)) {
					matchResult = mark;
				}
			}
		}
		playing = !(matchResult != 0 | turn >= 8);
		
		if(matchResult == 0) {
			if(turn >= 8) {
				statusEl.textContent = "Draw";
			} else {
				statusEl.textContent = "Your Turn";
			}
		}
		else {
			if(matchResult == 1) {
				statusEl.textContent = "Your Win";
			}
			else if(matchResult == 2) {
				statusEl.textContent = "You Lose";
			}
			
			turn--;
		}
		
		highlightSquares(highlight)
		
		if(playing) {
			boardEl.className = "playing";
		} else {
			boardEl.className = "finished";
		}
		
		refreshTurnStat();
	} else {
		startNewGame();
	}
}

function clickedSquare(l, c) {
	if(playing && board[l][c] == 0) {
		addMark(l, c, 1);
		return true;
	} else {
		return false;
	}
}

function checkLineVictory(mark, positions, highlight) {
	var line = true;
	for(var i=0; i<3; i++) {
		if(board[positions[i][0]][positions[i][1]] != mark) {
			var line = false;
			break;
		}
	}
	if(line) {
		for(var i=0; i<3; i++) {
			highlight[positions[i][0]][positions[i][1]] = 1;
		}
	}
	return line;
}

function highlightSquares(highlight) {
	for(var l=0; l<3; l++) {
		for(var c=0; c<3; c++) {
			if(highlight[l][c]) {
				squares[l][c].className += " highlighted";
			}
		}
	}
}

function endTurn(l, c) {
	var mark = board[l][c];
	var victory = false;
	var highlight = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
	victory |= checkLineVictory(mark, [[0, c], [1, c], [2, c]], highlight);
	victory |= checkLineVictory(mark, [[l, 0], [l, 1], [l, 2]], highlight);
	
	if((l == 0 && c == 0) || (l == 1 && c == 1) || (l == 2 && c == 2)) {
		victory |= checkLineVictory(mark, [[0, 0], [1, 1], [2, 2]], highlight);
	}
	if((l == 0 && c == 2) || (l == 1 && c == 1) || (l == 2 && c == 0)) {
		victory |= checkLineVictory(mark, [[0, 2], [1, 1], [2, 0]], highlight);
	}
	
	if(victory) {
		highlightSquares(highlight);
		
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
		turn += 1;
		refreshTurnStat();
		
		playerTurn = !playerTurn;
		if(!playerTurn) {
			machineTurn();
			return // machineTurn calls this method anyway
		}
	} else {
		statusEl.textContent = "Draw";
		score.ties += 1;
		endGame();
	}
	
	if(!playing) {
		boardEl.className = "finished";
	}
	
	setCookie("board", JSON.stringify(board), 60);
}

function endGame() {
	playing = false;
	for(var key in score) {
		scoreEls[key].textContent = score[key];
	}
	setCookie("score", JSON.stringify(score), 60);
}

function getLineStats(positions) {
	var test = {empty: [], machineMarks: 0, playerMarks: 0}
	for(var i=0; i<3; i++) {
		var p = positions[i];
		var v = board[p[0]][p[1]]
		if(v == 0) {
			test.empty.push([p[0], p[1]]);
		} else if(v == 1) {
			test.playerMarks += 1;
		} else if(v == 2) {
			test.machineMarks += 1;
		}
	}
	return test;
}

function machineTurn() {
	var marked = false
	var stats = [];
	var spots = {win: [], preventLoss: [], empty: [], good: []};
	var surePoints = []
	for(var c=0; c<3; c++) {
		stats.push(getLineStats([[0, c], [1, c], [2, c]]));
	}
	for(var l=0; l<3; l++) {
		stats.push(getLineStats([[l, 0], [l, 1], [l, 2]]));
	}
	stats.push(getLineStats([[0, 0], [1, 1], [2, 2]]));
	stats.push(getLineStats([[0, 2], [1, 1], [2, 0]]));
	
	for(var i=0; i<stats.length; i++) {
		var empty = stats[i].empty;
		if(stats[i].playerMarks == 0 && stats[i].machineMarks == 2) {
			spots.win.push(empty[0]);
		} else if(stats[i].playerMarks == 2 && stats[i].machineMarks == 0) {
			spots.preventLoss.push(empty[0]);
		} else if(stats[i].playerMarks == 0 && stats[i].machineMarks == 1) {
			spots.good.push(empty[0]);
			spots.good.push(empty[1]);
		} else {
			for(var j=0; j<empty.length; j++) {
				spots.empty.push(empty[j]);
			}
		}
	}
	
	var chosenSpots;
	if(spots.win.length > 0) {
		chosenSpots = spots.win;
	} else if(spots.preventLoss.length > 0) {
		chosenSpots = spots.preventLoss;
	} else if(spots.good.length > 0) {
		chosenSpots = spots.good;
	} else {
		chosenSpots = spots.empty;
	}
	
	var chosenSpot = chosenSpots[Math.floor(Math.random() * chosenSpots.length)];
	addMark(chosenSpot[0], chosenSpot[1], 2);
	endTurn(chosenSpot[0], chosenSpot[1]);
}

function addMark(l, c, v) {
	board[l][c] = v;
	if(v == 1) {
		squares[l][c].className += " marked cross";
	} else if(v == 2) {
		squares[l][c].className += " marked circle";
	}
}

function setCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}