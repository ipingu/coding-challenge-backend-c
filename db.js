var tsv = require("node-tsv-json");
var MongoClient = require('mongodb').MongoClient

var filename = process.argv[2];
var database = "cities";
var databaseUrl = process.env.DB_URL || "mongodb://localhost:27017/test";
var dropBeforeInsertion = true;

var loadLocationsFromTsv = function(source, drop) {
	console.log("Load database from file " + source);
	tsv({
	    	input: filename,  
	    	parseRows: true
	 	}, function(err, result) {
		    if(err) {
		    	console.error(err);
		    } else {
		    	var locations = modelizeLocations(result);
		  		insertLocationsInDatabase(locations, drop);
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
			loc : [parseFloat(current[4]), parseFloat(current[5])]
		}

		locations.push(location);
	}

	return locations;
}

var insertLocationsInDatabase = function(locations, drop) {
	MongoClient.connect(databaseUrl, function(err, db) {
		console.log("Connected to MongoDB server at url " + databaseUrl);
	
		if (drop) {
			db.collection(database).drop();
		}

		for (var i = 0, len = locations.length; i < len; i++) {  		
			console.log("Insert location", locations[i]);    

	  		db.collection(database).insert(locations[i], null, function (error, results) {
			    if (error) throw error;
			});	
	  	}

	  	console.log("Create 2d Index");
	  	db.collection(database).ensureIndex( { "loc": "2d" });

	  	db.collection(database).count(function(err, count) {
	    	if (err) throw err;

	    	console.log(count);
    	});

  		db.close();
	});
}

// Use connect method to connect to the server

loadLocationsFromTsv(filename, dropBeforeInsertion);

