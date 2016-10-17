var tsv = require("node-tsv-json");
var MongoClient = require('mongodb').MongoClient

var filename = process.argv[2];
var database = "Cities";
var databaseUrl = "mongodb://localhost:27017/";

var loadLocationsFromTsv = function(source) {
	console.log("Load database from file " + source);
	tsv({
	    	input: filename,  
	    	parseRows: true
	 	}, function(err, result) {
		    if(err) {
		    	console.error(err);
		    } else {
		    	var locations = modelizeLocations(result);
		  		insertLocationsInDatabase(locations);
		    }
		}
	);
} 

var modelizeLocations = function(array) {
	var locations = [];

	for (var i = 0, len = array.length; i < len; i++) {
		var current = array[i];	
		var location = {
			"name" : current[1],
			loc : {
				type : "Point",
				coordinates : [current[5], current[4]]
			}
		}
		locations.push(location);
	}

	return locations;
}

var insertLocationsInDatabase = function(locations) {
	MongoClient.connect(databaseUrl, function(err, db) {
		console.log("Connected to MongoDB server at url " + databaseUrl);
	
		for (var i = 0, len = locations.length; i < len; i++) {  		
			console.log("Insert " + locations[i].name + "/" + locations[i].loc.coordinates[0] + "/" + locations[i].loc.coordinates[1]);    

	  		db.collection(database).save(locations[i], null, function (error, results) {
			    if (error) throw error;
			});	
	  	}

	  	console.log("Create 2dsphere Index");
	  	db.collection(database).ensureIndex( { "loc": "2d" });

	  	db.collection(database).find(function(err, locations) {
	    	if (err) throw err;

	    	console.log(locations);
    	});

		console.log("Close connection to MongoDB server");
  		db.close();
	});
}

// Use connect method to connect to the server

loadLocationsFromTsv(filename);

