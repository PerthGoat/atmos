// mappings for decoding the level ascii
let decode_mappings = {
	"#" : "WALL",
	"0" : "FLOOR",
	"X" : "SPACE",
	"V" : "GEN"
};

// class that holds tags for attributes
class TagHolder {
	private tagPairs : any;
	
	constructor() {
		 this.tagPairs = [];
	}
	
	public AddTagPair(s1 : string, a2 : any) : void {
		if(this.tagPairs[s1] === undefined) {
			this.tagPairs[s1] = a2;
		}
	}
	
	public GetByTag(tag : string) : any {
		return this.tagPairs[tag];
	}
	
	public SetByTag(tag : string, a2 : any) : void {
		this.tagPairs[tag] = a2;
	}
	
	public RemoveTag(tag : string) : void {
		delete this.tagPairs[tag];
	}
}

// holds a tile, x coord, y, coord
// z holds all tags such as tile type and attributes
class Tile {
	constructor(
		public x : number,
		public y : number,
		public z : TagHolder
	) {}
}

function cancelCtx() {
	globalContextMenu.HideContextMenu();
}

function setTo(s : string) {
	globalContextMenu.SetTileTypeTo(s);
	cancelCtx();
}

class ContextMenu {
	private context_menu_obj : any;
	private current_target : Tile;
	
	constructor() {
		this.context_menu_obj = document.getElementById("context_menu");
	}
	
	public showContextMenuEdit(x : number, y : number, tileTarget : Tile) {
		this.current_target = tileTarget;
		this.context_menu_obj.style.display = "inline-block";
		this.context_menu_obj.style.top = y + "px";
		this.context_menu_obj.style.left = x + "px";
	}
	
	public HideContextMenu() {
		this.context_menu_obj.style.display = "none";
	}
	
	public SetTileTypeTo(s : string) {
		if(s === "FLOOR") {
			this.current_target.z.SetByTag("OXYGEN", 255);
		} else if(s === "SPACE") {
			this.current_target.z.SetByTag("OXYGEN", -100000);
		} else {
			this.current_target.z.RemoveTag("OXYGEN");
		}
		
		this.current_target.z.SetByTag("TYPE", s);
	}
}

// global context menu
let globalContextMenu : ContextMenu = new ContextMenu();

// atmos container holds tiles
class AtmosContiner {
	private AtmosTileGrid : Tile[][];
	private LastDrawContainer : any;
	
	constructor(tileGrid? : Tile[][]) {
		if(tileGrid !== undefined) {
			this.AtmosTileGrid = tileGrid;
		} else {
			this.AtmosTileGrid = [];
		}
	}
	
	public static ConvertTileStringArrayToObject(strArr : string[]) : Tile[][] {
		
		let Tile_Set : Tile[][] = [];
		let y : number = 0;
		
		strArr.forEach((el) => {
			
			let Tile_Single_Set : Tile[] = [];
			
			for(let i : number = 0;i < el.length;i++) {
				// create a tagholder and keep track of tile type
				let newTileTags : TagHolder = new TagHolder();
				newTileTags.AddTagPair("TYPE", decode_mappings[el[i]]);
				
				// add oxygen for atmos stuff only on floor tiles
				if(newTileTags.GetByTag("TYPE") !== "WALL" && newTileTags.GetByTag("TYPE") !== "GEN") {
					if(newTileTags.GetByTag("TYPE") === "SPACE") {
						newTileTags.AddTagPair("OXYGEN", -100000);
					} else {
						newTileTags.AddTagPair("OXYGEN", 255);
					}
				}
				
				// create the new tile and add it to the tile mappings
				let newTile : Tile = new Tile(i, y, newTileTags);
				Tile_Single_Set.push(newTile);
			}
			
			Tile_Set.push(Tile_Single_Set);
			y++;
			
		});
		
		return Tile_Set;
	}
	
	public SetAtmosTileGrid(tileGrid : Tile[][]) {
		this.AtmosTileGrid = tileGrid;
	}
	
	public GetTileByCoordinates(x : number, y : number) : Tile {
		if(this.AtmosTileGrid[y] === undefined) {
			return undefined;
		}
		
		return this.AtmosTileGrid[y][x];
	}
	
	// passed by reference so no return value
	// attempts to equalize oxygen between 2 tiles
	private equalize_oxygen_between_tiles(t1 : Tile, t2 : Tile) {
		// skip if one doesn't have the oxygen attribute or exist
		if(t1 === undefined || t2 === undefined) {
			return;
		}
		
		if(t1.z.GetByTag("OXYGEN") === undefined || t2.z.GetByTag("OXYGEN") === undefined) {
			if(t1.z.GetByTag("TYPE") === "GEN") {
				if(t2.z.GetByTag("OXYGEN") !== undefined && t2.z.GetByTag("OXYGEN") < 255) {
					t2.z.SetByTag("OXYGEN", t2.z.GetByTag("OXYGEN") + 5);
				}
			}
			if(t2.z.GetByTag("TYPE") === "GEN") {
				if(t1.z.GetByTag("OXYGEN") !== undefined && t1.z.GetByTag("OXYGEN") < 255) {
					t1.z.SetByTag("OXYGEN", t1.z.GetByTag("OXYGEN") + 5);
				}
			}
			return;
		}
		
		// start equalizing oxygen
		// if oxygen is not equal
		if(t1.z.GetByTag("OXYGEN") != t2.z.GetByTag("OXYGEN")) {
			
			let diff : number = Math.abs(Math.abs(t1.z.GetByTag("OXYGEN")) - Math.abs(t2.z.GetByTag("OXYGEN")));
			
			//let abs_diff : number = diff < 0 ? -diff : diff;
			
			let transfer_ratio = Math.log(diff);
				
			// then start equalizing
			if(t1.z.GetByTag("OXYGEN") > t2.z.GetByTag("OXYGEN")) {
				t1.z.SetByTag("OXYGEN", t1.z.GetByTag("OXYGEN") - transfer_ratio);
				t2.z.SetByTag("OXYGEN", t2.z.GetByTag("OXYGEN") + transfer_ratio);
			} else {
				t2.z.SetByTag("OXYGEN", t2.z.GetByTag("OXYGEN") - transfer_ratio);
				t1.z.SetByTag("OXYGEN", t1.z.GetByTag("OXYGEN") + transfer_ratio);
			}
		}
	}
	
	private SimulateSingleTile(t : Tile) {
		// oxygen simulation
		
		// trys to equalize oxygen up down left right
		
		let next_tile : Tile = this.GetTileByCoordinates(t.x + 1, t.y);
		this.equalize_oxygen_between_tiles(t, next_tile);
		
		next_tile = this.GetTileByCoordinates(t.x - 1, t.y);
		this.equalize_oxygen_between_tiles(t, next_tile);
		
		next_tile = this.GetTileByCoordinates(t.x, t.y + 1);
		this.equalize_oxygen_between_tiles(t, next_tile);
		
		next_tile = this.GetTileByCoordinates(t.x, t.y - 1);
		this.equalize_oxygen_between_tiles(t, next_tile);
	}
	
	private ClickSingleTile(e : any, st : Tile) {
		globalContextMenu.showContextMenuEdit(e.clientX, e.clientY, st);
	}
	
	public DrawTilesToContainer(container : any) {
		this.LastDrawContainer = container;
		
		container.innerHTML = ""; // reset the container
		
		this.AtmosTileGrid.forEach((tileRow) => {
			tileRow.forEach((singleTile) => {
				// setup
				let new_div = document.createElement("DIV");
				new_div.classList.add("tile");
				
				// get tile type
				let tile_type : string = singleTile.z.GetByTag("TYPE");
				
				// style tile color based on type
				
				// make floor more red and less green as oxygen gets lower
				if(tile_type === "FLOOR") {
					new_div.style.backgroundColor = `rgb(${255 - singleTile.z.GetByTag("OXYGEN")}, ${singleTile.z.GetByTag("OXYGEN")}, 0)`;
				}
				
				// finish up the classing
				new_div.classList.add(tile_type);
				
				new_div.onclick = (e) => {
					this.ClickSingleTile(e, singleTile);
				};
				
				container.appendChild(new_div); // draw
			});
			container.appendChild(document.createElement("BR"));
		});
	}
	
	public RedrawTilesToHomeContainer() {
		let container : any = this.LastDrawContainer;
		
		let current_grid_elem_cnt = 0;
		
		let all_tiles_from_thing = document.getElementById("atmos_sim_container").getElementsByClassName("tile");
		
		this.AtmosTileGrid.forEach((tileRow) => {
			tileRow.forEach((singleTile) => {
				let current_tile : any = all_tiles_from_thing[current_grid_elem_cnt++];
				
				current_tile.className = ""; // clear out old data
				//current_tile.style.backgroundColor = "";
				
				current_tile.classList.add("tile");
				
				// get tile type
				let tile_type : string = singleTile.z.GetByTag("TYPE");
				
				// style tile color based on type
				
				// make floor more red and less green as oxygen gets lower
				if(tile_type === "FLOOR") {
					current_tile.style.backgroundColor = `rgb(${255 - singleTile.z.GetByTag("OXYGEN")}, ${singleTile.z.GetByTag("OXYGEN")}, 0)`;
				}
				
				// finish up the classing
				current_tile.classList.add(tile_type);
			});
		});
	}
	
	public SimulateAtmosForTiles() {	
		this.AtmosTileGrid.forEach((tileRow) => {
			tileRow.forEach((singleTile) => {
				this.SimulateSingleTile(singleTile);
			});
		});
		
		this.RedrawTilesToHomeContainer();
	}
}