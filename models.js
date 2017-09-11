const WIDTH=600;//meter
const HEIGHT=600;//meter

class Field{	
	constructor(){
		/*cells field*/
		this.cells=new Array(WIDTH);
		
		let i=WIDTH;
		
		while(i-->0){
			let j=HEIGHT;
			this.cells[i]=new Array(HEIGHT);
			while(j-->0){
				this.cells[i][j]=new Cell();
			}				
		}
	}	
}

/*quare meter*/
class Cell{
	constructor(price){
		this.isDead=false;
		this.price=price?price:0;
	}
}

class PolygonField{
	constructor(subCells,isExplodable){
		this.cells=subCells;		
		this.isExplodable=isExplodable||false;
	}
}

class Wind{
	/*0, 45, 90, .. ,315*/
	constructor(angle,duration,power){
		this.angle=angle;
		this.duration=duration;
		this.power=power;
	}
}
 

/*EXPORT*/
module.exports.Field=Field
module.exports.Cell=Cell
module.exports.Wind=Wind
module.exports.PolygonField=PolygonField