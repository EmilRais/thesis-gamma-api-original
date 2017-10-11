#!/usr/bin/env node
const Engine = require("tingodb")({ memStore: true });
const Random = require("randomstring");
  
const Configuration = require("./Configuration");
const App = require("./Server");
const Validator = require("./utilities/Validator");
const Facebook = require("./utilities/Facebook")(Configuration.facebook);
const Factory = require("./utilities/Factory");
const Logger = require("./utilities/Logger");
const Calendar = require("./utilities/Calendar");
const MongoClient = require('mongodb').MongoClient
const ObjectID = require("mongodb").ObjectID;

const buildAndRunServer = (database) => {
	const state = {};

	state.database = database;
	state.validator = new Validator(state);
	state.facebook = Facebook(state);
	state.factory = new Factory(state);
	state.logger = Logger(state);
	state.calendar = Calendar(state);

	const app = App(state);

	var server = app.listen(3000, function () {
		var port = this.address().port;
		console.log("Listening to port %s", port);
	});
};

const mongo = (callback) => {
	console.log("Using production database");
	var url = "mongodb://127.0.0.1/database";
	MongoClient.connect(url, function(error, database) {
		if ( error ) return console.log(error.message);
	  	console.log("Connected to database");
	 
	  	callback(database);
	});
};

const tingo = (callback) => {
	console.log("Using development database");
	const database = new Engine.Db(`build/database${ Random.generate(7) }`, {});

	const administrator = { username: "administrator", password: "some-password" };
	database.collection("Administrators").insert(administrator, (error) => {
		if ( error ) return console.log(error.message);

		const settings = { _id: new ObjectID().toHexString(), paymentMode: "Free" };
		database.collection("Settings").insert(settings, (error) => {
			if ( error ) return console.log(error.message);
			
			callback(database);
		});
	});
};

const mode = process.env.NODE_ENV || "development";
const database = mode == "production" ? mongo(buildAndRunServer) : tingo(buildAndRunServer);
