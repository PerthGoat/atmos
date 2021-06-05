// mappings for decoding the level ascii
var decode_mappings = {
    "#": "WALL",
    "0": "FLOOR",
    "X": "SPACE",
    "V": "GEN"
};
// class that holds tags for attributes
var TagHolder = /** @class */ (function () {
    function TagHolder() {
        this.tagPairs = [];
    }
    TagHolder.prototype.AddTagPair = function (s1, a2) {
        if (this.tagPairs[s1] === undefined) {
            this.tagPairs[s1] = a2;
        }
    };
    TagHolder.prototype.GetByTag = function (tag) {
        return this.tagPairs[tag];
    };
    TagHolder.prototype.SetByTag = function (tag, a2) {
        this.tagPairs[tag] = a2;
    };
    TagHolder.prototype.RemoveTag = function (tag) {
        delete this.tagPairs[tag];
    };
    return TagHolder;
}());
// holds a tile, x coord, y, coord
// z holds all tags such as tile type and attributes
var Tile = /** @class */ (function () {
    function Tile(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Tile;
}());
function cancelCtx() {
    globalContextMenu.HideContextMenu();
}
function setTo(s) {
    globalContextMenu.SetTileTypeTo(s);
    cancelCtx();
}
var ContextMenu = /** @class */ (function () {
    function ContextMenu() {
        this.context_menu_obj = document.getElementById("context_menu");
    }
    ContextMenu.prototype.showContextMenuEdit = function (x, y, tileTarget) {
        this.current_target = tileTarget;
        this.context_menu_obj.style.display = "inline-block";
        this.context_menu_obj.style.top = y + "px";
        this.context_menu_obj.style.left = x + "px";
    };
    ContextMenu.prototype.HideContextMenu = function () {
        this.context_menu_obj.style.display = "none";
    };
    ContextMenu.prototype.SetTileTypeTo = function (s) {
        if (s === "FLOOR") {
            this.current_target.z.SetByTag("OXYGEN", 255);
        }
        else if (s === "SPACE") {
            this.current_target.z.SetByTag("OXYGEN", -100000);
        }
        else {
            this.current_target.z.RemoveTag("OXYGEN");
        }
        this.current_target.z.SetByTag("TYPE", s);
    };
    return ContextMenu;
}());
// global context menu
var globalContextMenu = new ContextMenu();
// atmos container holds tiles
var AtmosContiner = /** @class */ (function () {
    function AtmosContiner(tileGrid) {
        if (tileGrid !== undefined) {
            this.AtmosTileGrid = tileGrid;
        }
        else {
            this.AtmosTileGrid = [];
        }
    }
    AtmosContiner.ConvertTileStringArrayToObject = function (strArr) {
        var Tile_Set = [];
        var y = 0;
        strArr.forEach(function (el) {
            var Tile_Single_Set = [];
            for (var i = 0; i < el.length; i++) {
                // create a tagholder and keep track of tile type
                var newTileTags = new TagHolder();
                newTileTags.AddTagPair("TYPE", decode_mappings[el[i]]);
                // add oxygen for atmos stuff only on floor tiles
                if (newTileTags.GetByTag("TYPE") !== "WALL" && newTileTags.GetByTag("TYPE") !== "GEN") {
                    if (newTileTags.GetByTag("TYPE") === "SPACE") {
                        newTileTags.AddTagPair("OXYGEN", -100000);
                    }
                    else {
                        newTileTags.AddTagPair("OXYGEN", 255);
                    }
                }
                // create the new tile and add it to the tile mappings
                var newTile = new Tile(i, y, newTileTags);
                Tile_Single_Set.push(newTile);
            }
            Tile_Set.push(Tile_Single_Set);
            y++;
        });
        return Tile_Set;
    };
    AtmosContiner.prototype.SetAtmosTileGrid = function (tileGrid) {
        this.AtmosTileGrid = tileGrid;
    };
    AtmosContiner.prototype.GetTileByCoordinates = function (x, y) {
        if (this.AtmosTileGrid[y] === undefined) {
            return undefined;
        }
        return this.AtmosTileGrid[y][x];
    };
    // passed by reference so no return value
    // attempts to equalize oxygen between 2 tiles
    AtmosContiner.prototype.equalize_oxygen_between_tiles = function (t1, t2) {
        // skip if one doesn't have the oxygen attribute or exist
        if (t1 === undefined || t2 === undefined) {
            return;
        }
        if (t1.z.GetByTag("OXYGEN") === undefined || t2.z.GetByTag("OXYGEN") === undefined) {
            if (t1.z.GetByTag("TYPE") === "GEN") {
                if (t2.z.GetByTag("OXYGEN") !== undefined && t2.z.GetByTag("OXYGEN") < 255) {
                    t2.z.SetByTag("OXYGEN", t2.z.GetByTag("OXYGEN") + 5);
                }
            }
            if (t2.z.GetByTag("TYPE") === "GEN") {
                if (t1.z.GetByTag("OXYGEN") !== undefined && t1.z.GetByTag("OXYGEN") < 255) {
                    t1.z.SetByTag("OXYGEN", t1.z.GetByTag("OXYGEN") + 5);
                }
            }
            return;
        }
        // start equalizing oxygen
        // if oxygen is not equal
        if (t1.z.GetByTag("OXYGEN") != t2.z.GetByTag("OXYGEN")) {
            var diff = Math.abs(Math.abs(t1.z.GetByTag("OXYGEN")) - Math.abs(t2.z.GetByTag("OXYGEN")));
            //let abs_diff : number = diff < 0 ? -diff : diff;
            var transfer_ratio = Math.log(diff);
            // then start equalizing
            if (t1.z.GetByTag("OXYGEN") > t2.z.GetByTag("OXYGEN")) {
                t1.z.SetByTag("OXYGEN", t1.z.GetByTag("OXYGEN") - transfer_ratio);
                t2.z.SetByTag("OXYGEN", t2.z.GetByTag("OXYGEN") + transfer_ratio);
            }
            else {
                t2.z.SetByTag("OXYGEN", t2.z.GetByTag("OXYGEN") - transfer_ratio);
                t1.z.SetByTag("OXYGEN", t1.z.GetByTag("OXYGEN") + transfer_ratio);
            }
        }
    };
    AtmosContiner.prototype.SimulateSingleTile = function (t) {
        // oxygen simulation
        // trys to equalize oxygen up down left right
        var next_tile = this.GetTileByCoordinates(t.x + 1, t.y);
        this.equalize_oxygen_between_tiles(t, next_tile);
        next_tile = this.GetTileByCoordinates(t.x - 1, t.y);
        this.equalize_oxygen_between_tiles(t, next_tile);
        next_tile = this.GetTileByCoordinates(t.x, t.y + 1);
        this.equalize_oxygen_between_tiles(t, next_tile);
        next_tile = this.GetTileByCoordinates(t.x, t.y - 1);
        this.equalize_oxygen_between_tiles(t, next_tile);
    };
    AtmosContiner.prototype.ClickSingleTile = function (e, st) {
        globalContextMenu.showContextMenuEdit(e.clientX, e.clientY, st);
    };
    AtmosContiner.prototype.DrawTilesToContainer = function (container) {
        var _this = this;
        this.LastDrawContainer = container;
        container.innerHTML = ""; // reset the container
        this.AtmosTileGrid.forEach(function (tileRow) {
            tileRow.forEach(function (singleTile) {
                // setup
                var new_div = document.createElement("DIV");
                new_div.classList.add("tile");
                // get tile type
                var tile_type = singleTile.z.GetByTag("TYPE");
                // style tile color based on type
                // make floor more red and less green as oxygen gets lower
                if (tile_type === "FLOOR") {
                    new_div.style.backgroundColor = "rgb(" + (255 - singleTile.z.GetByTag("OXYGEN")) + ", " + singleTile.z.GetByTag("OXYGEN") + ", 0)";
                }
                // finish up the classing
                new_div.classList.add(tile_type);
                new_div.onclick = function (e) {
                    _this.ClickSingleTile(e, singleTile);
                };
                container.appendChild(new_div); // draw
            });
            container.appendChild(document.createElement("BR"));
        });
    };
    AtmosContiner.prototype.RedrawTilesToHomeContainer = function () {
        var container = this.LastDrawContainer;
        var current_grid_elem_cnt = 0;
        var all_tiles_from_thing = document.getElementById("atmos_sim_container").getElementsByClassName("tile");
        this.AtmosTileGrid.forEach(function (tileRow) {
            tileRow.forEach(function (singleTile) {
                var current_tile = all_tiles_from_thing[current_grid_elem_cnt++];
                current_tile.className = ""; // clear out old data
                //current_tile.style.backgroundColor = "";
                current_tile.classList.add("tile");
                // get tile type
                var tile_type = singleTile.z.GetByTag("TYPE");
                // style tile color based on type
                // make floor more red and less green as oxygen gets lower
                if (tile_type === "FLOOR") {
                    current_tile.style.backgroundColor = "rgb(" + (255 - singleTile.z.GetByTag("OXYGEN")) + ", " + singleTile.z.GetByTag("OXYGEN") + ", 0)";
                }
                // finish up the classing
                current_tile.classList.add(tile_type);
            });
        });
    };
    AtmosContiner.prototype.SimulateAtmosForTiles = function () {
        var _this = this;
        this.AtmosTileGrid.forEach(function (tileRow) {
            tileRow.forEach(function (singleTile) {
                _this.SimulateSingleTile(singleTile);
            });
        });
        this.RedrawTilesToHomeContainer();
    };
    return AtmosContiner;
}());
/// <reference path="atmos.ts" />
var atmos_sim_container = document.getElementById("atmos_sim_container");
var easy_read_tile_map = [
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
var myTileGrid = AtmosContiner.ConvertTileStringArrayToObject(easy_read_tile_map);
var ac = new AtmosContiner(myTileGrid);
ac.DrawTilesToContainer(atmos_sim_container);
//console.log(ac.GetTileByCoordinates(13, 0));
function runSim() {
    ac.SimulateAtmosForTiles();
    setTimeout(runSim, 50);
}
runSim();
