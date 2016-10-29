var express = require('express');
var mongoose = require("mongoose")
mongoose.Promise = require('bluebird');

var app = express();

var databaseUrl = 'mongodb://localhost:27017/test';
var serverPort = process.env.PORT || process.argv[2] || 9999;
var db = mongoose.connect(databaseUrl);

var schema = new mongoose.Schema({
	name: String,
	loc: {
		type: [Number],
		index: '2d'
	}
});

var cities = mongoose.model("cities", schema);

// front-end
app.use(express.static('public'));

// API
app.get('/suggestions', function(req, res) {
    suggest(req, res);
});

var convertDocumentToSuggestion = function(document) {
	return {
		"name" : document.name,
		"latitude" : document.loc[0],
		"longitude" : document.loc[1],
		"score" : 0
	}
}

var buildQuery = function(term, latitude, longitude, maxDistance) {
    if (latitude && longitude && maxDistance) {
        // options i = case insensitive
        // TODO what about accents ? Diacritic insensitivity
        return {
            name:  {$regex : term, $options: 'i'},
            loc: {
                $near: [longitude, latitude],
                $maxDistance: maxDistance
            }
        }
    }

    return {
        name:  {$regex : term, $options: 'i'}
    }
}

var suggest = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var query = buildQuery(req.query.q, req.query.latitude, req.query.longitude,  req.query.distance);

    cities.find(query)
        .exec()
        .then(function(rows) {
            var suggestions = [];
            for (var i = 0, len = rows.length; i < len; i++) {
        	   suggestions.push(convertDocumentToSuggestion(rows[i]));
            }
            res.send(JSON.stringify({ "suggestions" : suggestions}, null, 3));
        })
        .catch(function(err) {
            console.log("Error while querying locations:", err);
            res.send({ "suggestions" : []});
        });

}

console.log("Listening on port", serverPort);
app.listen(serverPort);
