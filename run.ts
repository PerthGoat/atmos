/// <reference path="atmos.ts" />

let atmos_sim_container : any = document.getElementById("atmos_sim_container");

let easy_read_tile_map = [
"XXXXXXXXXXXXXXXXXXXXXXXXX",
"X#######################X",
"X#000000000#00000000000#X",
"X#000000000#00000000000#X",
"X#000000000#00000000000#X",
"X#####0##########00#####X",
"X#####0##########00#####X",
"X#####0##########00#####X",
"X#####0##########00#####X",
"X###0000000####0000000##X",
"X###000000000000000000##X",
"X###0000000####0000000##X",
"X########0##############X",
"X########0##############X",
"X########000000000######X",
"X#########00000000######X",
"X#######################X",
"XXXXXXXXXXXXXXXXXXXXXXXXX",
];

let myTileGrid : Tile[][] = AtmosContiner.ConvertTileStringArrayToObject(easy_read_tile_map);

let ac : AtmosContiner = new AtmosContiner(myTileGrid);

ac.DrawTilesToContainer(atmos_sim_container);

//console.log(ac.GetTileByCoordinates(13, 0));

function runSim() {
	ac.SimulateAtmosForTiles();
	setTimeout(runSim, 50);
}

runSim();
