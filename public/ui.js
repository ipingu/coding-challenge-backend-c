  var MapModule = (function() {

      var map;
      var defaultMapCenter = {
          lat: 45.45286,
          lng: -73.58781
      }; // Montreal FTW
      var markers = [];
      var searchArea;
      var urlSuggestionsApi = "/suggestions";
      var uiSearchInput = $("#searchLocationsInput");
      var uiKilometersInput = $("#searchKilometersInput");
      
      var _getSearchTerm = function() {
          return uiSearchInput.val();
      };
      
      var _getSearchAreaInKilometers = function() {
          return uiKilometersInput.val() || 0;
      };

      var _addMarker = function(name, lat, lng) {
          var marker = new google.maps.Marker({
              position: {
                  lat: lat,
                  lng: lng
              },
              title: name,
              map: map
          });

          markers.push(marker);
          return marker;
      };
      
      var _setWindowOnMarker = function(marker, suggestion) {
    	  marker.addListener('click', function() {
        	  var infowindow = new google.maps.InfoWindow({
	          	    content: "<div><h2>" + suggestion.name + "</h2><ul>"
	          	    		+ "<li>Score : " + suggestion.score + "</li>"
	          	    		+ (suggestion.distance ? "<li>Distance : " + suggestion.distance + "</li>" : "")
	          	    		+ "</ul></div>"
	          });
        	  infowindow.open(map, marker);
          });
      }
      
      var _clearMarkers = function() {
          for (var i = 0; i < markers.length; i++) {
              markers[i].setMap(null);
          }
          markers = [];
      };
      
      var _clearSearchArea = function() {
    	  if (this.searchArea) {
    		  this.searchArea.setMap(null);
    	  }
      }

      var _showSearchArea = function(lat, lng, kilometers) {
    	  _clearSearchArea();
    	  
          this.searchArea = new google.maps.Circle({
              strokeColor: '#00FF00',
              strokeOpacity: 0.30,
              strokeWeight: 2,
              fillColor: '#00FF00',
              fillOpacity: 0.15,
              map: map,
              center: {
                  lat: lat,
                  lng: lng
              },
              radius: kilometers * 1000
          });
      };

      var _callSuggestionsApi = function(term, lat, lng, kilometers) {
          _clearMarkers();
    	  _clearSearchArea();

     	 if (kilometers > 0) {
    		 _showSearchArea(lat, lng, kilometers);
    	 }
    	  
          $.ajax({
              url: urlSuggestionsApi,
              data: {
                  q: term,
                  latitude: lat,
                  longitude: lng,
                  distance: kilometers
              }
          }).done(function(data) {        	 
             $.each(data.suggestions, function(key, value) {
                  var marker = _addMarker(value.name, parseFloat(value.latitude), parseFloat(value.longitude));
                  _setWindowOnMarker(marker, value);
             });
          });
      };


      var createMap = function(mapId) {
          map = new google.maps.Map(document.getElementById(mapId), {
              zoom: 12,
              center: defaultMapCenter
          });

          var controlDiv = $("<div id=\"customControlBar\">");

          var searchLocationsPanel = $("<div>");
          uiSearchInput = $("<input id=\"searchLocationsInput\" placeholder=\"City or Place\">");
          uiKilometersInput = $("<input id=\"searchKilometersInput\" placeholder=\"Distance in Kilometers\" type=\"number\">");
          searchLocationsPanel.append(uiSearchInput);
          searchLocationsPanel.append(uiKilometersInput);
          controlDiv.append(searchLocationsPanel.get(0));

         uiKilometersInput.on('change', function() {
            var mapCenter = map.getCenter();
            searchSuggestionsInArea(_getSearchTerm(), mapCenter.lat(), mapCenter.lng(), _getSearchAreaInKilometers());
          });

          uiSearchInput.on('change', function() {
            var mapCenter = map.getCenter();
            searchSuggestionsInArea(_getSearchTerm(), mapCenter.lat(), mapCenter.lng(), _getSearchAreaInKilometers());
          });
          
          map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv.get(0));
      };

      var searchSuggestions = function(term) {
          _callSuggestionsApi(term);
      };

      var searchSuggestionsInArea = function(term, lat, lng, radius) {
          _callSuggestionsApi(term, lat, lng, radius);
      };

      return {
          init: createMap,
          searchSuggestions: searchSuggestions,
          searchSuggestionsInArea: searchSuggestionsInArea
      };

  })();