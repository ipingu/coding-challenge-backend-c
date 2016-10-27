var express = require('express');
var mongoose = require("mongoose")
var app = express();

var databaseUrl = 'mongodb://localhost:27017/test';

var db = mongoose.connect(databaseUrl);

var schema = new mongoose.Schema({
	name: String,
	loc: {
		type: [Number],
		index: '2d'
	}
});

var cities = mongoose.model("cities", schema);

app.get('/suggestions', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    var suggestions = suggest(req.query.q, req.query.latitude, req.query.longitude);
    res.send(JSON.stringify(suggestions, null, 3)); // pretty for tests purpose
});

var suggestion = function(name, latitude, longitude, score) {
	return {
		"name" : name,
		"latitude" : latitude,
		"longitude" : longitude,
		"score" : score
	}
}

var suggest = function(term, longitude, latitude) {
    if (!term) {
        console.log("Usage : suggestions <term> <longitude> <latitude>");
        return;
    }

	console.log("Query:", term, "longitude:", longitude, "latitude:", latitude);

    var suggestions = [];

    var coordinates = [];
    coordinates[0] = longitude;
    coordinates[1] = latitude;

    // options i = case insensitive
    // TODO what about accents ? Diacritic insensitivity
    cities.find({
        name:  {$regex : term, $options: 'i'},
        loc: {
            $near: coordinates,
            $maxDistance: 10
        }   
 	
    }).exec(function(err, locations) {
    	if (err) throw err;

        for (var i = 0, len = locations.length; i < len; i++) {     
    	   console.log("Location found", JSON.stringify(locations[i], null, 4));	   
        }
		mongoose.disconnect();
    });
    /*
	mongoose.connect(databaseUrl, function(err, db) {
		if (err) throw err;

		var res = db.collection(database).findOne(  {name: search}  );
		console.log(res);
	});

    suggestions.push(suggestion(search, latitude, longitude, 1));
    suggestions.push(suggestion(search, latitude, longitude, 0));
    suggestions.push(suggestion(search, latitude, longitude, 0.3));
    suggestions.push(suggestion(search, latitude, longitude, 0.2));
    suggestions.push(suggestion(search, latitude, longitude, 0.9));
	*/
    suggestions.sort(function(a,b){return b.score - a.score});

	return { "suggestions" : suggestions};
}

suggest(process.argv[2], process.argv[3], process.argv[4]);

//app.listen(8080);