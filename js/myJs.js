const controllButton=document.getElementById('start-button');
const mainCanvas=document.getElementById('field')
const ctx=mainCanvas.getContext("2d");
const chartCtx = document.getElementById("graph").getContext("2d");

const WIDTH=mainCanvas.width;
const HEIGHT=mainCanvas.height;

/*bounds coordinates values on field*/
const MAX_POSITIVE=12.2;
const MIN_NEGATIVE=-12.2;
const METERS_IN_GRADUATION=100;

/*fire spped related to wind spped*/
const FIRE_SPEED_FROM_WIND_FACTOR=0.1;/*Default 0.1*/
const ANIMATION_SPEED=10; // less - faster

/*determines gradiation of chart and animation*/
const GRADIATION_TIME_PERIOD=0.1;/*hours*/

/*lake points for drawing*/
const lakePoints	=	[[MAX_POSITIVE,1.8],[5.7,2],[3.5,3],[3.7,4],[3.6,5.2],[1.2,MAX_POSITIVE]];
/*lake as precision polygon in order to calculate square taken from fire*/
const lakePointsPrecisionPolygon	=	[[MAX_POSITIVE,1.8],[3.68,3],[3.62,3.4],[3.7,4],
										[3.7,4.5],[3.58,4.8],[3.3,5.2],[1.2,MAX_POSITIVE],
										[MAX_POSITIVE,MAX_POSITIVE],[MAX_POSITIVE,1.8]];

const airportPoints=[[MIN_NEGATIVE,-1.5],[-4,-1.5],[-2,-3],[-2,MIN_NEGATIVE],[MIN_NEGATIVE,MIN_NEGATIVE],[MIN_NEGATIVE,-1.5]];
const explodableAreaPoints=[[4,-2],[5,-2],[5,-5],[2.5,-5],[2.5,-3],[4,-2]];
const sanatoriumPoints=[[2,5],[3.4,5],[3.65,4.6],[3.65,4.5],[3.7,4],[3.68,3.2],[3.78,3],[5.7,2],[2,2],[2,5]];
const livingAreaPoints=[[MIN_NEGATIVE,2],[-6,2],[-6,3],[-5,3],[-5,4],[-4,4],[-4,5],[-3,5],[-3,6],[-2,6],[-2,MAX_POSITIVE],[MIN_NEGATIVE,MAX_POSITIVE],[MIN_NEGATIVE,2]];

const AIRPORT_DAMAGE_PRICE	=	10000000;//hrn
const SANATORY_DAMAGE_PRICE	=	300000;//hrn

/* extra 20 meters by perimeter of forest */
const EXPLODABLE_AREA_DAMAGE_PRICE	=	500000;//hrn
const LIVING_AREA_DAMAGE_PRICE_PER_SQUARE_METER	=	20000;//hrn
const FOREST_DAMAGE_PRICE_PER_SQUARE_METER	=	10000;//hrn

const EXPLODABLE_FOREST_EFFECT=20;/*meters*/

/*always 8-angle!*/
let firePosition=[[0.05,0.05],[0.05,0.05],[0.05,-0.05],[0.05,-0.05],[-0.05,-0.05],[-0.05,-0.05],[-0.05,0.05],[-0.05,0.05]];

let damagesData=[];

let isAirPortAlive=true;
let isExplodableAreaAlive=true;
let isSanatoriumAlive=true;
let isLiveAreaAlive=true;

let areasDamagePrice=0;
/*tempor variable*/
let lastDamage=0;

/*indexes of points being involved is wind shifting for specific angles*/
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
};

class Wind{
	/**
	*@param angle - wind angle OX related
	*@param duration - duration in hours
	*@param speed - speed in meters/hour
	*/
	constructor(angle,duration,speed){
		this.angle=angle;
		this.duration=duration;
		this.speed=speed/METERS_IN_GRADUATION*3600;//kilometers/seconds
	}
}

/*original values*/
const windStack=[new Wind(0,1,1),new Wind(135,0.5,1),
					new Wind(270,1,0.5),new Wind(315,2,0.5),
					new Wind(90,1,0.5),new Wind(135,2.5,0.5),
					new Wind(45,2,1),new Wind(0,0.5,0.5),
					new Wind(180,1,1),new Wind(225,0.5,0.5)];
	

/*init field function*/
function initField (data){
	
	drawCoordinatesLines();
	
	/*draw living area*/
	drawLivingArea(livingAreaPoints);
	
	/*draw airport*/
	drawAiroport(airportPoints);
	/*draw explodable area*/
	drawExplodableArea(explodableAreaPoints);
	
	/*draw sanatorium*/
	drawSanatorium(sanatoriumPoints);
	/*draw lake*/
	drawLake(lakePoints);
	
	/*draw initial fired area*/
	drawFiredArea(firePosition)
}

function drawCoordinatesLines(){
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
}

function scaleCoordinates (x,y){
	/* HEIGHT/2 -> MAX_POSITIVE */
	y=-y;
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
		x:(x/METERS_IN_GRADUATION),
		y:(y/METERS_IN_GRADUATION)
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
		
	for(let i =1;i<points.length;i++){
		let pair2=scaleCoordinates(points[i][0],points[i][1]);
		ctx.lineTo(pair2.x,pair2.y);
	}
	if(isBoomed){
		ctx.fillStyle = '#FF0000';
		ctx.fill();		
	}
	ctx.stroke();
	ctx.closePath()
	
}

function drawLivingArea(points){
	drawFigure(points,false);
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

function drawFiredArea(points){
	ctx.beginPath();
	let bPoint=scaleCoordinates(points[0][0],points[0][1])
	ctx.moveTo(bPoint.x, bPoint.y);
	
	for(let i=1;i< points.length;i++){
		let point=scaleCoordinates(points[i][0],points[i][1])
		ctx.lineTo(point.x,point.y);
	}
	ctx.closePath();
	ctx.fillStyle = '#FF0000';
	ctx.fill();
	ctx.stroke();	
	
	/*always redraw lake!*/
	drawLake(lakePoints);
	/*draw in order to make viewable*/
	drawLivingArea(livingAreaPoints);
	drawCoordinatesLines();
		
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
	else	
	/*closest point of polygon*/
	if(pointIsInPoly({x:firePosition[4][0],y:firePosition[4][1]},convertArrayToPointsArray(explodableAreaPoints))){
		console.log('Explodable Area boomed!')
		isExplodableAreaAlive=false;	
		drawExplodableArea(explodableAreaPoints,true/*boomed*/)
	}

	else
	/*closest point of polygon*/
	if(pointIsInPoly({x:firePosition[3][0],y:firePosition[3][1]},convertArrayToPointsArray(explodableAreaPoints))){
		console.log('Explodable Area boomed!')
		isExplodableAreaAlive=false;	
		drawExplodableArea(explodableAreaPoints,true/*boomed*/)
	}

	/*whole destroying*/
	if(!isExplodableAreaAlive){
	    /*explorable storage*/
        areasDamagePrice+=EXPLODABLE_AREA_DAMAGE_PRICE;

        /*extra 20 meters by perimeter*/
        let perimeter=getPerimeterInMeters(explodableAreaPoints);
        areasDamagePrice+=EXPLODABLE_FOREST_EFFECT*perimeter*FOREST_DAMAGE_PRICE_PER_SQUARE_METER;
	}
}

function getPerimeterInMeters(points){
    let accumulator=0.;

    /*first and last points of array*/
    let a = points[0][0] - points[points.length-1][0];
    let b = points[0][1] - points[points.length-1][1];
    accumulator+=Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION;

    for(let i=0;i<points.length-1;i++){
        a = points[i][0] - points[i+1][0];
        b = points[i][1] - points[i+1][1];
        accumulator+=Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION;
    }

    return accumulator;
}

function checkAirportBoomed(){
	if(!isAirPortAlive)
		return;
	//closest point of airoport it is (-2,-3);
	if(pointIsInPoly({x:-2,y:-3},convertArrayToPointsArray(firePosition))){
		console.log('Airport boomed!')
		isAirPortAlive=false;
		drawAiroport(airportPoints,true/*boomed*/);
	}
	else
	/*closestpoint of polygon*/
	if(pointIsInPoly({x:firePosition[3][0],y:firePosition[3][1]},convertArrayToPointsArray(airportPoints))){
		console.log('Airport boomed!')
		isAirPortAlive=false;	
		drawAiroport(airportPoints,true/*boomed*/);
	}

	/*whole destroying*/
	if(!isAirPortAlive){
        areasDamagePrice+=AIRPORT_DAMAGE_PRICE;
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
		drawLake(lakePoints);
	}

    /*whole destroying*/
	if(!isSanatoriumAlive){
	    areasDamagePrice+=SANATORY_DAMAGE_PRICE;
    }
}


/*starts wind*/
function startWindExperiment(){
	windShift(windStack.pop())		
}

function windShift(wind){
	if(wind===undefined)
		return;

	let btime=GRADIATION_TIME_PERIOD;
	/*shifting fire*/
	let shiftPointsIndexes=shiftInvolvedPoins[wind.angle];

	/*calculate shift vector*/
	let shiftOX=(Math.cos(toRadians(wind.angle)))*wind.speed*btime;/*kilometers*/
	let shiftOY=(Math.sin(toRadians(wind.angle)))*wind.speed*btime;/*kilometers*/
	
	
	let timer=setInterval(()=>{
		for(let key in shiftPointsIndexes){
			/*index of point*/
			let i=shiftPointsIndexes[key];
			
			firePosition[i][0]/*x*/+=shiftOX*FIRE_SPEED_FROM_WIND_FACTOR;			
			firePosition[i][1]/*y*/+=shiftOY*FIRE_SPEED_FROM_WIND_FACTOR;			
		}
		
		
		/*redrawing fire*/
		drawFiredArea(firePosition);
		
		/*investigate damaged area*/
		countDamage();
		
		/*rebuild chart*/
		buildChart();

		/*cancelint timer*/
		btime+=GRADIATION_TIME_PERIOD;

		if(btime>wind.duration){
		    console.log()
			windShift(windStack.pop());
			clearInterval(timer);
		}

	},ANIMATION_SPEED)

}

function toRadians (angle) {
	return angle * (Math.PI / 180);
}


/*determines firs iteration step*/
let isFirtsIteration=true;
function countDamage(){
	let burnedPrice=getBurnedSquarePrice();
    
	/*add summ of exploration and forest price*/
	let resultDamage=areasDamagePrice + burnedPrice;
	console.log(resultDamage)
	
	/*add new data to chart*/
	if(!isFirtsIteration){
		damagesData.push((resultDamage-lastDamage)>0?(resultDamage-lastDamage):0.);
	}
	else{
		isFirtsIteration=false;
	}
	
    
	/*remember last step*/
	lastDamage = burnedPrice;    
}

/**
*counts only forest and living area price
*does not count EXPLORATION PRICE!!!
*/
function getBurnedSquarePrice(){
    /*brakhmaputra formula is used*/
    /*first rectangle*/
    let userPoints=firePosition.slice(4);
    let p=getPerimeterInMeters(userPoints)/2;
    let summaryBurnedForestSquare=1; // summary forest square

    let a = userPoints[0][0] - userPoints[3][0];
    let b = userPoints[0][1] - userPoints[3][1];
    summaryBurnedForestSquare*=(p-Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION);

    for(let i=0;i<userPoints.length-1;i++){
        a = userPoints[i][0] - userPoints[i+1][0];
        b = userPoints[i][1] - userPoints[i+1][1];

        summaryBurnedForestSquare*=(p-Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION);
    }

    summaryBurnedForestSquare=Math.sqrt(summaryBurnedForestSquare);
	
	/*second rectangle*/
    userPoints=firePosition.slice(4,8);
    p=getPerimeterInMeters(userPoints)/2;

    let summarySquareSecondHalf=1;

    a = userPoints[0][0] - userPoints[3][0];
    b = userPoints[0][1] - userPoints[3][1];
    summarySquareSecondHalf*=(p-Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION);


    for(let i=0;i<userPoints.length-1;i++){
        let a = userPoints[i][0] - userPoints[i+1][0];
        let b = userPoints[i][1] - userPoints[i+1][1];
        summarySquareSecondHalf*=(p-Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION);
    }
    summarySquareSecondHalf=Math.sqrt(summarySquareSecondHalf);
	
    summaryBurnedForestSquare+=summarySquareSecondHalf;

    /*middle path*/

    userPoints=[firePosition[7],firePosition[0],firePosition[4],firePosition[5]]
    p=getPerimeterInMeters(userPoints)/2;

    summarySquareSecondHalf=1;

    a = userPoints[0][0] - userPoints[3][0];
    b = userPoints[0][1] - userPoints[3][1];
    summarySquareSecondHalf*=(p-Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION);


    for(let i=0;i<userPoints.length-1;i++){
        let a = userPoints[i][0] - userPoints[i+1][0];
        let b = userPoints[i][1] - userPoints[i+1][1];
        summarySquareSecondHalf*=(p-Math.sqrt( a*a + b*b )*METERS_IN_GRADUATION);
    }
    summarySquareSecondHalf=Math.sqrt(summarySquareSecondHalf);
	summaryBurnedForestSquare+=summarySquareSecondHalf;
	/*find getBurnedLivingAreaSquare*/
	let burnedLivingAreaSquare	=	getBurnedLivingAreaSquare();
	let burnedSanatoriumSquare	=	getCoveredFigureSquare(sanatoriumPoints);
	let burnedExplodableAreaSquare	=	getCoveredFigureSquare(explodableAreaPoints);
	let burnedAirportSquare		=	getCoveredFigureSquare(airportPoints);
	let imaginaryBurnedLakeSquare	=	getCoveredFigureSquare(lakePointsPrecisionPolygon);
	console.log("imaginaryBurnedLakeSquare "+imaginaryBurnedLakeSquare );
	console.log("burnedSanatoriumSquare "+burnedSanatoriumSquare );
	
	/*remove not forest areas*/
	summaryBurnedForestSquare-=burnedLivingAreaSquare;
	summaryBurnedForestSquare-=burnedSanatoriumSquare;
	summaryBurnedForestSquare-=burnedExplodableAreaSquare;
	summaryBurnedForestSquare-=burnedAirportSquare;
	summaryBurnedForestSquare-=imaginaryBurnedLakeSquare;
	/*summary price*/
    return summaryBurnedForestSquare*FOREST_DAMAGE_PRICE_PER_SQUARE_METER
			+	burnedLivingAreaSquare*LIVING_AREA_DAMAGE_PRICE_PER_SQUARE_METER;			
			
}

/**
*@returns total burned square of living area
*/
//TODO fix
function getBurnedLivingAreaSquare(){
	
	const DELTA=0.05; //kilometer //50 meters square
	
	let summarySquare=0.
	/*iterative project of checking small pieces 100x100m of horizontal line*/
	
	/*iteration through lines*/
	for(let i=1;i<livingAreaPoints.length-2;i+=2){
		bottomPoint=livingAreaPoints[i];
		topPoint=livingAreaPoints[i+1];
		
		let horizontalCoordinate=bottomPoint[0];//x - coordinate
		
		/*iteration throught horizontal lyne*/
		while(horizontalCoordinate>MIN_NEGATIVE+DELTA-0.025){
		
			let verticalCoordinate=bottomPoint[1];//y -coordinate

			while(verticalCoordinate < topPoint[1]-DELTA+0.025/*y*/){
				/*iteration throught vertical line*/
				//TODO check if inside flame! O_O
				
				if(pointIsInPoly({x:horizontalCoordinate,y:verticalCoordinate},convertArrayToPointsArray(firePosition))
					&&
				   pointIsInPoly({x:(horizontalCoordinate-DELTA),y:(verticalCoordinate+DELTA)},convertArrayToPointsArray(firePosition))
				)
				{
					//console.log('HOUSE IN FIRE');
					summarySquare+=DELTA*DELTA;/*meters*/
				}
				verticalCoordinate+=DELTA;
			}
			horizontalCoordinate-=DELTA;
		}
		
	}
	console.log('Summary burned house square '+ summarySquare)
	return summarySquare*METERS_IN_GRADUATION*METERS_IN_GRADUATION;
}


/**
*@returns covered by fire airport or explodable area square (airport does not burn after explore)
*/
//TODO fix method
function getCoveredFigureSquare(figurePoints){
	
	const DELTA=0.05; //kilometer //50 meters square
	
	let summarySquare=0.
	/*iterative project of checking small pieces 100x100m of horizontal line*/
	
	/*iteration through lines*/
	let leftX=findLeftX(figurePoints);
	let rightX=findRightX(figurePoints);
	let topY=findTopY(figurePoints);
	let bottomY=findBottomY(figurePoints);
	
	console.log("\n\n"+leftX)
	console.log(rightX)
	console.log(topY)
	console.log(bottomY)
	
	let xCoordinate=rightX;//x - coordinate
	
	/*iteration throught horizontal lyne*/
	while(xCoordinate>leftX){
	
		let yCoordinate=bottomY;//y -coordinate

		while(yCoordinate < topY){
			/*iteration throught vertical line*/			
			if(	/*as we check containing rectangle (not polygon) - we should check if square inside polygon*/
				pointIsInPoly({x:xCoordinate,y:yCoordinate},convertArrayToPointsArray(figurePoints))
				&&
				/*check fire*/
				pointIsInPoly({x:xCoordinate,y:yCoordinate},convertArrayToPointsArray(firePosition))				
			)
			{
				//console.log('HOUSE IN FIRE');
				summarySquare+=DELTA*DELTA;/*meters*/
			}
			yCoordinate+=DELTA;
		}
		xCoordinate-=DELTA;
	}
	
	return summarySquare*METERS_IN_GRADUATION*METERS_IN_GRADUATION;
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
	let points=[];
	for(let i=0;i<arr.length;i++){
		points.push({x:arr[i][0],y:arr[i][1]});
	}
	return points;
}

//===============HELPS FUNCTION BEGIN
function findRightX(points){
	let resultX=points[0][0];//x
	
	for(let i=0;i<points.length;i++){
		if(resultX < points[i][0]/*x*/){
			resultX=points[i][0];
		}
	}	
	
	return resultX;
}

function findLeftX(points){
	let resultX=points[0][0];//x
	
	for(let i=0;i<points.length;i++){
		if(resultX > points[i][0]/*x*/){
			resultX=points[i][0];
		}
	}	
	
	return resultX;
}

function findTopY(points){
	let resultY=points[0][1];//x
	
	for(let i=0;i<points.length;i++){
		if(resultY < points[i][1]/*x*/){
			resultY=points[i][1];
		}
	}	
	
	return resultY;
}

function findBottomY(points){
	let resultY=points[0][1];//x
	
	for(let i=0;i<points.length;i++){
		if(resultY > points[i][1]/*x*/){
			resultY=points[i][1];
		}
	}
	
	return resultY;
}
//===============HELPS FUNCTION ENDS

function buildChart(){
	let labels=[];
	let data=[];
	
	
	for(let i=1;i<damagesData.length;i++){
		labels.push(Math.round(GRADIATION_TIME_PERIOD*i*100)/100);
	}

	let config = {
		type: 'line',
		data: {
		    labels: labels,
		    datasets: [{
		        label: "Cost of fire damage",
		        backgroundColor: window.chartColors.blue,
		        borderColor: window.chartColors.red,
		        data: damagesData,
		        fill: false,
		    }]
		},
		options: {
		    responsive: true,
		    title:{
		        display:true,
		        text:'Damages Chart'
		    },
		    tooltips: {
		        mode: 'index',
		        intersect: false,
		    },
		    hover: {
		        mode: 'nearest',
		        intersect: true
		    },
		    scales: {
		        xAxes: [{
		            display: true,
		            scaleLabel: {
		                display: true,
		                labelString: 'Hour'
		            }
		        }],
		        yAxes: [{
		            display: true,
		            scaleLabel: {
		                display: true,
		                labelString: 'hrn'
		            }
		        }]
		    }
		}
	};

	
	window.myLine = new Chart(chartCtx, config);
            
}

/*set controllers and initialize field*/
document.addEventListener("DOMContentLoaded", function(event) { 
	initField();
  
	controllButton.addEventListener('click',(e)=>{
		startWindExperiment();	
	});
});



