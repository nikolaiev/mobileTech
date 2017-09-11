const PORT=3030;
const express=require('express');
const app=express();

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile('index.html');  
});

/*Main lab logic*/
require('./logic.js').controllers(app);

app.listen(PORT,(err)=>{
	if(err)
		console.log(err)
	else
		console.log('App is runnig at '+PORT)
})