var express = require('express');
var mongoose = require("mongoose")
mongoose.Promise = require('bluebird');

var port = process.env.PORT || process.argv[2] || 9999;
var databaseUrl = process.env.DB_URL || "mongodb://localhost:27017/test";
var db = mongoose.connect(databaseUrl);

var schema = new mongoose.Schema({
	name: String,
	loc: {
		type: [Number],
		index: '2d'
	}
});

var cities = mongoose.model("cities", schema);


var convertDocumentToSuggestion = function(document) {
	return {
		"name" : document.name,
		"latitude" : document.loc[0],
		"longitude" : document.loc[1],
		"score" : 0
	}
}

/** Query database with GEO position or only by name. */
var buildQuery = function(term, latitude, longitude, kilometers) {
    // options i = case insensitive
    console.log("geo", kilometers / 6371);
    if (kilometers > 0 && latitude && longitude) {
        return {
            name:  {$regex : term, $options: 'i'},
            loc: {
                $near: [longitude, latitude],
                $maxDistance: kilometers / 6371
            }
        }
    }

    return {
        name:  {$regex : term, $options: 'i'}
    }
}

// API Configuration
var app = express();
app.use(express.static('public'));

app.get('/suggestions', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var query = buildQuery(req.query.q, req.query.latitude, req.query.longitude,  req.query.distance);
    console.log(query);
    cities.find(query)
        .exec()
        .then(function(rows) {
            var suggestions = [];
            for (var i = 0, len = rows.length; i < len; i++) {
        	   suggestions.push(convertDocumentToSuggestion(rows[i]));
            }
            res.send(JSON.stringify({ "suggestions" : suggestions}));
        })
        .catch(function(err) {
            console.log("Error while querying locations:", err);
            res.send({ "suggestions" : []});
        });
});

console.log('Server running at http://127.0.0.1:%d/suggestions', port);
app.listen(port);