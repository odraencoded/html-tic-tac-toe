HTML Tic Tac Toe
================

A simple tic-tac-toe game made in HTML & Javascript. Play it online at [http://odraencoded.github.io/html-tic-tac-toe/](http://odraencoded.github.io/html-tic-tac-toe/)

##### Program Details

The machine is programmed to choose a random spot to play, but the the probability of choosing a spot depends on factors calculated in its turn. No brute-force / game trees are used to calculate the odds of choosing each square.

There is an average 5% chance the machine will choose a terrible square to play in, but most of the time it will choose a better spot. It's not an dumb machine that can be defeated easily but it's not invincible either.

The program uses cookies or HTML5's localstorage (if available) to save the game data. This includes an array containing the board state and your overall score.
