// the game's canvas element
var canvas = null;
// the canvas 2d context
var ctx = null;
// an image containing all sprites
var spritesheet = null;
// true when the spritesheet has been downloaded
var spritesheetLoaded = false;

var commandHistory = [];

// the world grid: a 2d array of tiles
var world = [[]];

// size in the world in sprite tiles
var worldWidth = 30;
var worldHeight = 30;

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
var posEnemyX = 30;
var posEnemyY = 0;

// the html page is ready
function onload() {
	console.log('Page loaded.');
	canvas = document.getElementById('gameCanvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvas.addEventListener("click", canvasClick, false);
	if (!canvas) alert('Blah!');
	ctx = canvas.getContext("2d");
	if (!ctx) alert('Hmm!');

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "grey";
	ctx.fillRect(posX, posY, tileWidth, tileHeight);

	ctx.fillStyle = "red";
	ctx.fillRect(posEnemyX * tileWidth, posEnemyY * tileHeight, tileWidth, tileHeight);

	console.log('Spritesheet loaded.');
	spritesheetLoaded = true;
	
	console.log('Creating world...');

	// create emptiness
	for (var x=0; x < worldWidth; x++)
	{
		world[x] = [];

		for (var y=0; y < worldHeight; y++)
		{
			world[x][y] = 0;
		}
	}

	// scatter some walls
	for (var x=0; x < worldWidth; x++)
	{
		for (var y=0; y < worldHeight; y++)
		{
			if (Math.random() > 0.80) {
				world[x][y] = 1;
				ctx.fillStyle = "white";
				ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
			}
		}
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// Check if something is moving outside the canvas
	function isOutside(nextXCord, nextYCord) {
		// Is it outside on x axis?
		let isOutside = (nextXCord < 0 || nextXCord > worldWidth) ? true : false;

		// Is it outside on y axis?
		isOutside = (nextYCord < 0 || nextYCord > worldHeight) ? true : false;

		return isOutside;
	}	
	
	// Function to shoot a projectile
	async function shootProjectile(startX, startY, firstX, firstY) {
		var orientation = commandHistory[commandHistory.length - 1];
		// The next coordinates for the projectile.
		var nextXCord = startX;
		var nextYCord = startY;
		var width = tileWidth;
		var height = projectileHeight;

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
		
		if (nextXCord === posEnemyX && nextYCord === posEnemyY) {
			alert("Hit!")
			ctx.fillStyle = "black";
			ctx.fillRect(posEnemyX * tileWidth, posEnemyY * tileHeight, tileWidth, tileHeight);
		}
		ctx.fillStyle = "black";
		ctx.fillRect(startX * tileWidth, startY * tileHeight, tileWidth, tileHeight);
	
		ctx.fillStyle = "blue";
		ctx.fillRect(nextXCord * tileWidth, nextYCord * tileHeight, width, height);
	
		if (!isOutside()) {
			console.log(posEnemyX + " : " + posEnemyY);
			await sleep(10);
			shootProjectile(nextXCord, nextYCord, firstX, firstY);
		}
	}

	// Enemies move to player
	async function moveEnemies() {
		currentPath = [];
		pathStart = [posEnemyX, posEnemyY];
		pathEnd = [posX, posY];
		currentPath = findPath(world,pathStart,pathEnd);

		ctx.clearRect(posEnemyX * tileWidth, posEnemyY * tileHeight, tileWidth, tileHeight);
		ctx.fillStyle = "black";
		ctx.fillRect(posEnemyX * tileWidth, posEnemyY * tileHeight, tileWidth, tileHeight);

		posEnemyX = currentPath[1][0];
		posEnemyY = currentPath[1][1];

		ctx.fillStyle = "red";
		ctx.fillRect(posEnemyX * tileWidth, posEnemyY * tileHeight, tileWidth, tileHeight);
		
		await sleep(150);
		moveEnemies();
	}

	window.onkeydown = function(e) {
		ctx.clearRect(posX * tileWidth, posY * tileHeight, tileWidth, tileHeight);
		ctx.fillStyle = "black";
		ctx.fillRect(posX * tileWidth, posY * tileHeight, tileWidth, tileHeight);
		console.log(e);

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

		ctx.fillStyle = "grey";
		ctx.fillRect(posX * tileWidth, posY * tileHeight, tileWidth, tileHeight);
	}

	moveEnemies();

}


function redraw()
{

	console.log('redrawing...');

	for (var x=0; x < worldWidth; x++)
	{
		for (var y=0; y < worldHeight; y++)
		{

			// choose a sprite to draw
			switch(world[x][y])
			{
			case 1:
				ctx.fillStyle = 'white';
				break;
			default:
				ctx.fillStyle = 'black';
				break;
			}

			ctx.fillRect(x*tileWidth, y*tileHeight,
			tileWidth, tileHeight);

		}
	}

	// draw the path
	console.log('Current path length: '+currentPath.length);
	for (rp=0; rp<currentPath.length; rp++)
	{
		switch(rp)
		{
		case 0:
			ctx.fillStyle = 'green'; // start
			break;
		case currentPath.length-1:
			ctx.fillStyle = 'red'; // end
			break;
		default:
			ctx.fillStyle = 'grey'; // path node
			break;
		}

		ctx.fillRect(currentPath[rp][0]*tileWidth,
		currentPath[rp][1]*tileHeight,
		tileWidth, tileHeight);
	}		
}

// handle click events on the canvas
function canvasClick(e)
{
	var x;
	var y;

	// grab html page coords
	if (e.pageX != undefined && e.pageY != undefined)
	{
		x = e.pageX;
		y = e.pageY;
	}
	else
	{
		x = e.clientX + document.body.scrollLeft +
		document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop +
		document.documentElement.scrollTop;
	}

	// make them relative to the canvas only
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	// return tile x,y that we clicked
	var cell =
	[
	Math.floor(x/tileWidth),
	Math.floor(y/tileHeight)
	];

	// now we know while tile we clicked
	console.log('we clicked tile '+cell[0]+','+cell[1]);

	pathStart = pathEnd;
	pathEnd = cell;

	// calculate path
	currentPath = findPath(world,pathStart,pathEnd);
	redraw();
}

// world is a 2d array of integers (eg world[10][15] = 0)
// pathStart and pathEnd are arrays like [5,10]
function findPath(world, pathStart, pathEnd)
{
	// shortcuts for speed
	var	abs = Math.abs;
	var	max = Math.max;
	var	pow = Math.pow;
	var	sqrt = Math.sqrt;

	var maxWalkableTileNum = 0;

	var worldWidth = world[0].length;
	var worldHeight = world.length;
	var worldSize =	worldWidth * worldHeight;

	// which heuristic should we use?
	// default: no diagonals (Manhattan)
	var distanceFunction = ManhattanDistance;
	var findNeighbours = function(){}; // empty

	// distanceFunction functions
	// these return how far away a point is to another

	function ManhattanDistance(Point, Goal)
	{	// linear movement - no diagonals - just cardinal directions (NSEW)
		return abs(Point.x - Goal.x) + abs(Point.y - Goal.y);
	}

	function Neighbours(x, y)
	{
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

	// returns every available North East, South East,
	// South West or North West cell - no squeezing through
	// "cracks" between two diagonals
	function DiagonalNeighbours(myN, myS, myE, myW, N, S, E, W, result)
	{
		if(myN)
		{
			if(myE && canWalkHere(E, N))
			result.push({x:E, y:N});
			if(myW && canWalkHere(W, N))
			result.push({x:W, y:N});
		}
		if(myS)
		{
			if(myE && canWalkHere(E, S))
			result.push({x:E, y:S});
			if(myW && canWalkHere(W, S))
			result.push({x:W, y:S});
		}
	}

	// returns every available North East, South East,
	// South West or North West cell including the times that
	// you would be squeezing through a "crack"
	function DiagonalNeighboursFree(myN, myS, myE, myW, N, S, E, W, result)
	{
		myN = N > -1;
		myS = S < worldHeight;
		myE = E < worldWidth;
		myW = W > -1;
		if(myE)
		{
			if(myN && canWalkHere(E, N))
			result.push({x:E, y:N});
			if(myS && canWalkHere(E, S))
			result.push({x:E, y:S});
		}
		if(myW)
		{
			if(myN && canWalkHere(W, N))
			result.push({x:W, y:N});
			if(myS && canWalkHere(W, S))
			result.push({x:W, y:S});
		}
	}

	// returns boolean value (world cell is available and open)
	function canWalkHere(x, y)
	{
		return ((world[x] != null) &&
			(world[x][y] != null) &&
			(world[x][y] <= maxWalkableTileNum));
	};

	// Node function, returns a new object with Node properties
	// Used in the calculatePath function to store route costs, etc.
	function Node(Parent, Point)
	{
		var newNode = {
			// pointer to another Node object
			Parent:Parent,
			// array index of this Node in the world linear array
			value:Point.x + (Point.y * worldWidth),
			// the location coordinates of this Node
			x:Point.x,
			y:Point.y,
			// the heuristic estimated cost
			// of an entire path using this node
			f:0,
			// the distanceFunction cost to get
			// from the starting point to this node
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
