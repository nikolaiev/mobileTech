const controllButton=document.getElementById('start-button');
const mainCanvas=document.getElementById('field')
const ctx=mainCanvas.getContext("2d");

const WIDTH=mainCanvas.width;
const HEIGHT=mainCanvas.height;

/*boundes coordinates values on field*/
const MAX_POSITIVE=6.1;
const MIN_NEGATIVE=-6.1;
const PI=3.1415926;
/*fire spped related to wind spped*/

const FIRE_SPEED_FROM_WIND_FACTOR=0.5;/*Default 0.1*/
const lakePoins=[[MAX_POSITIVE,1.8],[5.7,2],[3.5,3],[3.7,4],[3.6,5.2],[1.2,MAX_POSITIVE]];
const airoportPoints=[[MIN_NEGATIVE,-1.5],[-4,-1.5],[-4,-1.5],[-2,-3],[-2,-3],[-2,MIN_NEGATIVE],[MIN_NEGATIVE,MIN_NEGATIVE],[MIN_NEGATIVE,-1.5]];
const explodableAreaPoints=[[4,-2],[5,-2],	[5,-2],[5,-5],[5,-5],[2.5,-5],[2.5,-5],[2.5,-3],[2.5,-3],[4,-2]];
const sanatoriumPoints=[[2,5],[3,5],[3,5],[3.4,5],[2,5],[2,2],[2,2],[5.7,2],[3.4,5]];

/*always 8-angle!*/
let firePosition=[[0.05,0.05],[0.05,0.05],[0.05,-0.05],[0.05,-0.05],[-0.05,-0.05],[-0.05,-0.05],[-0.05,0.05],[-0.05,0.05]];
/*indexes of points being involved is wind shifting for specific angles*/

let isAirPortAlive=true;
let isExplodableAreaAlive=true;
let isSanatoriumAlive=true;
let isLiveAreaAlive=true;

/*shitty map*/
let shiftInvolvedPoins = {
	0	:[0,1,2,3],
	45	:[7,0,1,2],
	90	:[6,7,0,1],
	135	:[5,6,7,0],
	180	:[4,5,6,7],
	225	:[3,4,5,6],
	270	:[2,3,4,5],
	315	:[1,2,3,4]
}

class Wind{
	/**
	*@param angle - wind angle OX related
	*@param duration - duration in hours
	*@param speed - speed in meters/hour
	*/
	constructor(angle,duration,speed){
		this.angle=angle;
		this.duration=duration;
		this.speed=speed/1000*3600;//kilometers/seconds
	}
}

/*const windStack=[new Wind(0,1,1),new Wind(135,0.5,1),
					new Wind(270,1,0.5),new Wind(315,2,0.5),
					new Wind(90,1,0.5),new Wind(135,2.5,0.5),
					new Wind(45,2,1),new Wind(0,0.5,0.5),
					new Wind(180,1,1),new Wind(225,0.5,0.5)];*/

const windStack=[new Wind(0,1,1),new Wind(135,0.5,1),
					new Wind(270,1,0.5),new Wind(315,2,0.5),
					new Wind(90,1,0.5),new Wind(135,2.5,0.5),
					new Wind(45,2,1),new Wind(0,0.5,0.5),
					new Wind(180,1,1),new Wind(225,5,0.5)];
					
					

/*init field function*/
function initField (data){
	
	ctx.lineWidth=1;
	
	/*OX*/
	ctx.beginPath();
	ctx.moveTo(WIDTH/2+0.5,0);
	ctx.lineTo(WIDTH/2+0.5,HEIGHT);
	ctx.stroke();
	
	/*OY*/
	ctx.moveTo(0.5,HEIGHT/2+0.5);
	ctx.lineTo(WIDTH+0.5,HEIGHT/2+0.5);
	ctx.stroke();
	ctx.closePath();
	
	/*draw living area*/
	drawLine(MIN_NEGATIVE,2,-6,2);
	drawLine(-6,2,-6,3);
	drawLine(-6,2,-6,3);
	drawLine(-6,3,-5,3);
	drawLine(-5,3,-5,4);
	drawLine(-5,4,-4,4);
	drawLine(-4,4,-4,5);
	drawLine(-4,5,-3,5);
	drawLine(-3,5,-3,6);
	drawLine(-3,6,-2,6);
	drawLine(-2,6,-2,MAX_POSITIVE);
	
	/*draw airport*/
	drawAiroport(airoportPoints);
	/*draw explodable area*/
	drawExplodableArea(explodableAreaPoints);
	
	/*draw sanatorium*/
	drawSanatorium(sanatoriumPoints);
	/*draw lake*/
	drawLake(lakePoins);
	
	/*draw initial fired area*/
	drawFiredArea(firePosition)
}

function scaleCoordinates (x,y){
	/* HEIGHT/2 -> MAX_POSITIVE */
	//TODO
	y=-y
	x+=MAX_POSITIVE;//0..12.2
	y+=MAX_POSITIVE;//0..12.2
	
	return {
		x:WIDTH/2./MAX_POSITIVE*x,
		y:HEIGHT/2./MAX_POSITIVE*y
	}	
}

function scaleShiftVector(x,y/*meters*/){
	//y=-y;
	return {
		x:(x/1000),
		y:(y/1000)
	}
}

function drawLake(points){
	var bPoint=scaleCoordinates(points[0][0],points[0][1])
	ctx.beginPath();
	ctx.moveTo(bPoint.x, bPoint.y);
	
	for (i = 1; i < points.length - 2; i ++)
	{
		var fPoint=scaleCoordinates(points[i][0],points[i][1])
		var sPoint=scaleCoordinates(points[i+1][0],points[i+1][1])
		var xc = (fPoint.x + sPoint.x) / 2;
		var yc = (fPoint.y + sPoint.y) / 2;
		ctx.quadraticCurveTo(fPoint.x, fPoint.y, xc, yc);
	}
		
	var ePoint=scaleCoordinates(points[i+1][0],points[i+1][1]);
	// curve through the last two points
	ctx.quadraticCurveTo(sPoint.x, sPoint.y, ePoint.x,ePoint.y);
	var cornerPoint=scaleCoordinates(MAX_POSITIVE,MAX_POSITIVE);
	ctx.lineTo(cornerPoint.x,cornerPoint.y);
	ctx.fillStyle = '#00AAFF';
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
	
	
}

function drawFigure(points,isBoomed){
	ctx.beginPath()
	let pair1=scaleCoordinates(points[0][0],points[0][1]);
	
	ctx.moveTo(pair1.x,pair1.y);
		
	for(let i =1;i<points.length-1;i++){
		let pair2=scaleCoordinates(points[i+1][0],points[i+1][1]);
		ctx.lineTo(pair2.x,pair2.y);
	}
	if(isBoomed){
		console.log('BOOMMMEDDDD~!!!')
		ctx.fillStyle = '#FF0000';
		ctx.fill();		
	}
	ctx.stroke();
	ctx.closePath()
	
}

function drawAiroport(points,isBoomed){
	drawFigure(points,isBoomed);
}

function drawSanatorium(points,isBoomed){
	drawFigure(points,isBoomed)
}

function drawExplodableArea(points,isBoomed){
	drawFigure(points,isBoomed);
}

function drawLine(x1,y1,x2,y2){
	ctx.lineWidth=1;
	
	let pair1=scaleCoordinates(x1,y1);
	let pair2=scaleCoordinates(x2,y2);
	
	ctx.moveTo(pair1.x,pair1.y);
	ctx.lineTo(pair2.x,pair2.y);
	ctx.stroke();
}

function drawFiredArea(points){
	ctx.beginPath()
	var bPoint=scaleCoordinates(points[0][0],points[0][1])
	ctx.moveTo(bPoint.x, bPoint.y);
	
	for(let i=1;i< points.length;i++){
		var point=scaleCoordinates(points[i][0],points[i][1])
		ctx.lineTo(point.x,point.y);
	}
	ctx.closePath();
	ctx.fillStyle = '#FF0000';
	ctx.fill();
	ctx.stroke();	
	
	/*always redraw lake!*/
	drawLake(lakePoins);
		
	checkAirportBoomed();
	checkExplodableAreaBoomed();	
	checkSanatoriumBoomed();
}

function checkExplodableAreaBoomed(){
	if(!isExplodableAreaAlive)
		return;
	//closest point of airoport it is (-2,-3);
	if(pointIsInPoly({x:2.5,y:-3},convertArrayToPointsArray(firePosition))){
		console.log('Explodable Area boomed!')
		isExplodableAreaAlive=false;
		drawExplodableArea(explodableAreaPoints,true/*boomed*/)
	}
	
	/*closestpoint of polygon*/
	if(pointIsInPoly({x:firePosition[4][0],y:firePosition[4][1]},convertArrayToPointsArray(explodableAreaPoints))){
		console.log('Explodable Area boomed!')
		isExplodableAreaAlive=false;	
		drawExplodableArea(explodableAreaPoints,true/*boomed*/)
	}
}

function checkAirportBoomed(){
	if(!isAirPortAlive)
		return;
	//closest point of airoport it is (-2,-3);
	if(pointIsInPoly({x:-2,y:-3},convertArrayToPointsArray(firePosition))){
		console.log('Airport boomed!')
		isAirPortAlive=false;
		drawAiroport(airoportPoints,true/*boomed*/);
	}
	
	/*closestpoint of polygon*/
	if(pointIsInPoly({x:firePosition[3][0],y:firePosition[3][1]},convertArrayToPointsArray(airoportPoints))){
		console.log('Airport boomed!')
		isAirPortAlive=false;	
		drawAiroport(airoportPoints,true/*boomed*/);
	}	
}

function checkSanatoriumBoomed(){
	if(!isSanatoriumAlive)
		return;
	//closest point of sanatorium it is (-2,-3);
	if(pointIsInPoly({x:2,y:2},convertArrayToPointsArray(firePosition))){
		console.log('Sanatorium boomed!')
		isSanatoriumAlive=false;
		drawSanatorium(sanatoriumPoints,true/*boomed*/);
		drawLake(lakePoins);
	}
}


/*starts wind*/
function startWindExperiment(){
	var currnetWind=null;
	
	let timer=setInterval(()=>{
		currnetWind=windStack.pop()
		if(currnetWind===undefined){
			clearInterval(timer);
			return;
		}
		
		console.log("Wind with parameters : ")
		console.log("angle : " + currnetWind.angle);
		console.log("speed : " + currnetWind.speed);
		console.log("duration : " + currnetWind.duration);
		console.log("\n\n")
		
		/*shifting fire*/
		shiftFireWithWind(currnetWind,firePosition);
		
		/*redrawing fire*/
		drawFiredArea(firePosition);
		
		//TODO count damage!!
		//draw graphics!
		//redrawGraphic();
		
	},1000);
	
	
	
	
}

function shiftFireWithWind(wind,startFirePosition){
	let shiftPointsIndexes=shiftInvolvedPoins[wind.angle]
	
	/*calculate shift vector*/
	let shiftOX=(Math.cos(toRadians(wind.angle)))*wind.speed*wind.duration;/*kilometers*/
	let shiftOY=(Math.sin(toRadians(wind.angle)))*wind.speed*wind.duration;/*kilometers*/
	
	//TODO get rid off pointless points
	for(let key in shiftPointsIndexes){
		/*index of point*/
		let i=shiftPointsIndexes[key];
		startFirePosition[i][0]/*x*/+=shiftOX*FIRE_SPEED_FROM_WIND_FACTOR;
		startFirePosition[i][1]/*y*/+=shiftOY*FIRE_SPEED_FROM_WIND_FACTOR;
	}

	function toRadians (angle) {
	  return angle * (Math.PI / 180);
	}	
}

/*determines is Point inside Polygon*/
function pointIsInPoly(p, polygon) {
    var isInside = false;
    var minX = polygon[0].x, maxX = polygon[0].x;
    var minY = polygon[0].y, maxY = polygon[0].y;
    for (var n = 1; n < polygon.length; n++) {
        var q = polygon[n];
        minX = Math.min(q.x, minX);
        maxX = Math.max(q.x, maxX);
        minY = Math.min(q.y, minY);
        maxY = Math.max(q.y, maxY);
    }

    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
        return false;
    }

    var i = 0, j = polygon.length - 1;
    for (i, j; i < polygon.length; j = i++) {
        if ( (polygon[i].y > p.y) != (polygon[j].y > p.y) &&
                p.x < (polygon[j].x - polygon[i].x) * (p.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x ) {
            isInside = !isInside;
        }
    }
    return isInside;
}

function convertArrayToPointsArray(arr){
	var points=[];
	for(let i=0;i<arr.length;i++){
		points.push({x:arr[i][0],y:arr[i][1]});
	}
	return points;
}


/*set controllers and initialize field*/
document.addEventListener("DOMContentLoaded", function(event) { 
	initField();
  
	controllButton.addEventListener('click',(e)=>{
		startWindExperiment();	
	});
});



