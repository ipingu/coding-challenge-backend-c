var express = require('express');
var mongoose = require("mongoose")
mongoose.Promise = require('bluebird');
var lev = require('levenshtein');
var removeDiacritics = require('diacritics').remove;

/** Constants */
var port = process.env.PORT || process.argv[2] || 9999;
var databaseUrl = process.env.DB_URL || "mongodb://localhost:27017/test";
var proximityScoringWeight = 0.3;
var termSimilarityScoringWeight = 0.7;




/** Convert document from database to the expected API format */
var convertDocumentToSuggestion = function(document) {
    return {
        "name": document.name,
        "latitude": document.loc[1],
        "longitude": document.loc[0],
    }
}

/** Enhance the returned object with some valuables information (distance, scoring...) */
var enhanceSuggestion = function(suggestion, searchTerm, searchDistance, searchLongitude, searchLatitude) {
    suggestion.termSimilarity = 1 - lev(suggestion.name, searchTerm).valueOf() / suggestion.name.length;

    if (searchDistance > 0) {
        var distance = calculateDistanceBetweenTwoPoints(suggestion.longitude, suggestion.latitude, searchLongitude, searchLatitude);
        suggestion.distance = distance;
        suggestion.proximityRatio = 1 - distance / searchDistance;
    }

    suggestion.score = proximityScoringWeight * (suggestion.proximityRatio || 1) + (suggestion.termSimilarity * termSimilarityScoringWeight);
}

/** Calculate distance between two GEO points 
 * FROM http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula */
var calculateDistanceBetweenTwoPoints = function(sourceLong, sourceLat, targetLong, targetLat) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(targetLat - sourceLat); // deg2rad below
    var dLon = deg2rad(targetLong - sourceLong);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(sourceLat)) * Math.cos(deg2rad(targetLat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

/** Helper to convert from degrees to radian */
var deg2rad = function(deg) {
    return deg * (Math.PI / 180)
}

/** Query database with GEO position or only by name. */
var buildQuery = function(term, longitude, latitude, kilometers) {
	var searchTerm = removeDiacritics(term);
	
    // options i = case insensitive, maxDistance in meters
    if (kilometers > 0 && latitude && longitude) {
        return {
            searchable: {
                $regex: searchTerm,
                $options: 'i'
            },
            loc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: kilometers * 1000
                }
            }
        }
    }

    return {
    	searchable: {
            $regex: searchTerm,
            $options: 'i'
        }
    }
}

// mongoose schema, maybe not necessary as we could use simply use mongo client 
var schema = new mongoose.Schema({
    name: String,
    loc: {
        type: [Number],
        index: '2d'
    }
});
var cities = mongoose.model("cities", schema);

// Configure Express to serve UI files and expose REST services
var app = express();
app.use(express.static('public'));
module.exports = app; // to allow tests

// Bind service to retrieve suggestions
app.get('/suggestions', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var query = buildQuery(req.query.q, req.query.longitude, req.query.latitude, req.query.distance);

    cities.find(query)
        .exec()
        .then(function(rows) {
            var suggestions = [];
            for (var i = 0, len = rows.length; i < len; i++) {
                var suggestion = convertDocumentToSuggestion(rows[i]);
                enhanceSuggestion(suggestion, req.query.q, req.query.distance, req.query.longitude, req.query.latitude);

                suggestions.push(suggestion);
            }
            res.status(suggestions.length == 0 ? 404 : 200)
                .send(JSON.stringify({
                    "suggestions": suggestions
                }));
        })
        .catch(function(err)  {
            console.log("Error while querying locations:", err);
            res.status(404).send({
                "suggestions": []
            });
        });
});

// Connect to database and start server listening
var db = mongoose.connect(databaseUrl);
app.listen(port);

console.log('Server running at http://127.0.0.1:%d/suggestions', port);