// the game's canvas element
var canvas = null;
// the canvas 2d context
var ctx = null;
// An array containing a history of commands
var commandHistory = [];

// the world grid: a 2d array of tiles
var world = [[]];

// size in the world in sprite tiles
var worldWidth = 20;
var worldHeight = 20;

// size of a tile in pixels
var tileWidth = 32;
var tileHeight = 32;

var projectileHeight = 8;

// start and end of path
var pathStart = [worldWidth,worldHeight];
var pathEnd = [0,0];
var currentPath = [];

// Position of player
var posX = 0;
var posY = 0;

// Position of enemy
var posEnemyX = worldWidth-2;
var posEnemyY = 0;

var hasLost = false;
var hasWon = false;

// the html page is ready
function onload() {
	console.log('Page loaded.');
	canvas = document.getElementById('gameCanvas');
	canvas.width = worldWidth * tileWidth;
	canvas.height = worldHeight * tileHeight;
	if (!canvas) alert('Blah!');
	ctx = canvas.getContext("2d");
	if (!ctx) alert('Hmm!');

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	console.log('Creating world...');

	// create emptiness
	for (var x=0; x < worldWidth; x++) {
		world[x] = [];

		for (var y=0; y < worldHeight; y++) {
			world[x][y] = 0;
		}
	}

	// scatter some walls
	for (var x=0; x < worldWidth; x++) {
		for (var y=0; y < worldHeight; y++)
		{
			if (Math.random() > 0.80) {
				world[x][y] = 1;
				ctx.fillStyle = "white";
				ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
			}
		}
	}

	ctx.fillStyle = "grey";
	ctx.fillRect(posX, posY, tileWidth, tileHeight);
	world[posX][posY] = 4;

	ctx.fillStyle = "red";
	ctx.fillRect(posEnemyX * tileWidth, posEnemyY * tileHeight, tileWidth, tileHeight);
	world[posEnemyX][posEnemyY] = 3;

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// Check if something is moving outside the canvas
	function isOutside(nextXCord, nextYCord) {
		// Is it outside on x- or y-axis?
		var isOutsideX = (nextXCord < 0 || nextXCord > worldWidth) ? true : false;
		var isOutsideY = (nextYCord < 0 || nextYCord > worldHeight) ? true : false;
		var isOutside = (isOutsideX || isOutsideY) ? true : false;
		return isOutside;
	}	
	
	// Function to shoot a projectile
	async function shootProjectile(startX, startY, firstX, firstY) {
		var orientation = commandHistory[commandHistory.length - 1];
		// The next coordinates for the projectile.
		var nextXCord = startX;
		var nextYCord = startY;

		switch (orientation) {
			case "w":
				nextYCord -= 1;
				nextXCord = startX;

				width = projectileHeight;
				height = tileHeight;
				break;
			case "a":
				nextXCord -= 1;
				nextYCord = startY;
				break;
			case "d":
				nextXCord += 1;
				nextYCord = startY;
				break;
			case "s":
				nextYCord += 1;
				nextXCord = startX;

				width = projectileHeight;
				height = tileHeight;
				break;
		}

		if (!isOutside(nextXCord, nextYCord)) {

			// Do not update 2d world array to a projectile/abyss if there is an enemy there.
			if (nextXCord != posEnemyX && nextYCord != posEnemyY) {
				world[nextXCord][nextYCord] = 2;
			}

			if (startX != posEnemyX && startY != posEnemyY) {
				world[startX][startY] = 0;
			}
			redraw(world);

			await sleep(10);
			shootProjectile(nextXCord, nextYCord, firstX, firstY);
		} else {
			world[startX][startY] = 0;
		}

	}

	// Enemies move to player
	async function moveEnemies() {
		currentPath = [];
		pathStart = [posEnemyX, posEnemyY];
		pathEnd = [posX, posY];

		// Find shortest path to player
		currentPath = findPath(world,pathStart,pathEnd);

		world[posEnemyX][posEnemyY] = 0;

		// Returns the first decision since currentPath[0] returns the state it is in.
		posEnemyX = currentPath[1][0];
		posEnemyY = currentPath[1][1];

		// Say that the pos is an enemy block & redraw it all.
		world[posEnemyX][posEnemyY] = 3;
		redraw(world);

		// If enemy got you
		if (posX === posEnemyX && posY === posEnemyY) {
			hasLost = true;
			alert("You have lost!");
		}

		if (!hasWon) {
			await sleep(150);
			moveEnemies();
		}
	}

	window.onkeydown = function(e) {
		world[posX][posY] = 0;

		commandHistory.push(e.key);
		
		switch (e.key) {
			case "w":
				if (world[posX][posY-1] === 0) {
					posY -= 1;
				}
				break;
			case "a":
				if (world[posX-1][posY] === 0) {
					posX -= 1;
				}
				break;
			case "d":
				if (world[posX+1][posY] === 0) {
					posX += 1;
				}
				break;
			case "s":
				if (world[posX][posY+1] === 0) {
					posY += 1;
				}
				break;
			case " ":
				shootProjectile(posX, posY, posX, posY);
				break;
		}

		if (posX === worldWidth - 1) {
			alert("You have won! Now refresh to retry...");
			hasWon = true;
		}

		// 4 in the 2d array means that it's a player - see redraw().
		if (!hasLost || !hasWon) {
			world[posX][posY] = 4;
			redraw(world);
		}
	}

	moveEnemies();
}

// Redraw a new world based on the world 2d array
function redraw(world) {
	console.log(world)

	for (var x=0; x < worldWidth; x++) {
		for (var y=0; y < worldHeight; y++) {

			// choose a block to draw
			switch(world[x][y])	{
				case 1: // Wall
					ctx.fillStyle = 'white';
					break;
				case 2: // Projectile
					ctx.fillStyle = 'blue';
					break;
				case 3: // Enemy
					ctx.fillStyle = 'red';
					break;
				case 4: // Player
					ctx.fillStyle = 'grey';
					break;
				default: // Abyss
					ctx.fillStyle = 'black';
					break;
			}

			// Draw the rectangle based on what it is.
			ctx.fillRect(x*tileWidth, y*tileHeight,tileWidth, tileHeight);

		}
	}
	
	ctx.fillStyle = "grey";
	ctx.fillRect(posX*tileWidth, posY*tileHeight, tileWidth, tileHeight);
}


// Find path to player function
function findPath(thisWorld, pathStart, pathEnd) {
	// shortcuts for speed 
	var	abs = Math.abs;

	var maxWalkableTileNum = 0;

	var worldWidth = thisWorld[0].length;
	var worldHeight = thisWorld.length;
	var worldSize =	worldWidth * worldHeight;

	var localWorld = {};
	for (var x = 0; x < worldWidth; x++) {
		localWorld[x] = thisWorld[x];
	}

	// Reformat world to binary - abyss or block (0 or 1) 
	for (var x = 0; x < worldWidth; x++) {
		for (var y = 0; y < worldHeight; y++) {
			if (thisWorld[x][y] === 2 || thisWorld[x][y] === 1) {
				localWorld[x][y] = 1;
			} else {
				localWorld[x][y] = 0;
			}
		}
	}

	// distance function - Manhattan (no diagonal distances)
	var distanceFunction = ManhattanDistance;
	var findNeighbours = function(){}; // empty

	function ManhattanDistance(Point, Goal) {	// linear movement - no diagonals
		return abs(Point.x - Goal.x) + abs(Point.y - Goal.y);
	}

	// Returns neighbouring tiles.
	function Neighbours(x, y) {
		var	N = y - 1,
		S = y + 1,
		E = x + 1,
		W = x - 1,
		myN = N > -1 && canWalkHere(x, N),
		myS = S < worldHeight && canWalkHere(x, S),
		myE = E < worldWidth && canWalkHere(E, y),
		myW = W > -1 && canWalkHere(W, y),
		result = [];
		if(myN)
		result.push({x:x, y:N});
		if(myE)
		result.push({x:E, y:y});
		if(myS)
		result.push({x:x, y:S});
		if(myW)
		result.push({x:W, y:y});
		findNeighbours(myN, myS, myE, myW, N, S, E, W, result);
		return result;
	}

	// returns boolean value (world cell is available and open)
	function canWalkHere(x, y)
	{
		return ((localWorld[x] != null) &&
			(localWorld[x][y] != null) &&
			(localWorld[x][y] <= maxWalkableTileNum));
	};

	// Node function, returns a new object with Node properties
	// Used in the calculatePath function to store route costs, etc.
	function Node(Parent, Point) {
		var newNode = {
			// pointer to another Node object
			Parent:Parent,
			// array index of this Node in the world linear array
			value:Point.x + (Point.y * worldWidth),
			// the location coordinates of this Node
			x:Point.x,
			y:Point.y,
			f:0,
			g:0
		};

		return newNode;
	}

	// Path function, executes AStar algorithm operations
	function calculatePath()
	{
		// create Nodes from the Start and End x,y coordinates
		var	mypathStart = Node(null, {x:pathStart[0], y:pathStart[1]});
		var mypathEnd = Node(null, {x:pathEnd[0], y:pathEnd[1]});
		// create an array that will contain all world cells
		var AStar = new Array(worldSize);
		// list of currently open Nodes
		var Open = [mypathStart];
		// list of closed Nodes
		var Closed = [];
		// list of the final output array
		var result = [];
		// reference to a Node (that is nearby)
		var myNeighbours;
		// reference to a Node (that we are considering now)
		var myNode;
		// reference to a Node (that starts a path in question)
		var myPath;
		// temp integer variables used in the calculations
		var length, max, min, i, j;
		// iterate through the open list until none are left
		while(length = Open.length)
		{
			max = worldSize;
			min = -1;
			for(i = 0; i < length; i++)
			{
				if(Open[i].f < max)
				{
					max = Open[i].f;
					min = i;
				}
			}
			// grab the next node and remove it from Open array
			myNode = Open.splice(min, 1)[0];
			// is it the destination node?
			if(myNode.value === mypathEnd.value)
			{
				myPath = Closed[Closed.push(myNode) - 1];
				do
				{
					result.push([myPath.x, myPath.y]);
				}
				while (myPath = myPath.Parent);
				// clear the working arrays
				AStar = Closed = Open = [];
				// we want to return start to finish
				result.reverse();
			}
			else // not the destination
			{
				// find which nearby nodes are walkable
				myNeighbours = Neighbours(myNode.x, myNode.y);
				// test each one that hasn't been tried already
				for(i = 0, j = myNeighbours.length; i < j; i++)
				{
					myPath = Node(myNode, myNeighbours[i]);
					if (!AStar[myPath.value])
					{
						// estimated cost of this particular route so far
						myPath.g = myNode.g + distanceFunction(myNeighbours[i], myNode);
						// estimated cost of entire guessed route to the destination
						myPath.f = myPath.g + distanceFunction(myNeighbours[i], mypathEnd);
						// remember this new path for testing above
						Open.push(myPath);
						// mark this node in the world graph as visited
						AStar[myPath.value] = true;
					}
				}
				// remember this route as having no more untested options
				Closed.push(myNode);
			}
		} // keep iterating until the Open list is empty
		return result;
	}

	// actually calculate the a-star path!
	// this returns an array of coordinates
	// that is empty if no path is possible
	return calculatePath();

} // end of findPath() function

// start running immediately
onload();
