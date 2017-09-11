const MODELS=require('./models');

let field= new MODELS.Field()


let controllers =(app)=>{
	app.get('/test',(req,res)=>{
		//let Field=new MODELS.Field;
		res.send('hello submodule!');
	});	
};

initStandartField=(field)=>{
	
}

/*EXPORT*/
module.exports.controllers=controllers;
