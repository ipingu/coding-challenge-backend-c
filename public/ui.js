  var MapModule = (function() {

      var map;
      var defaultMapCenter = {
          lat: 45.45286,
          lng: -73.58781
      };
      var markers = [];
      var urlSuggestionsApi = "/suggestions";
      var uiSearchInput = $("#searchLocationsInput");

      var _getSearchTerm = function() {
          return uiSearchInput.val();
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
      };

      var _kilometersFromRadius = function(kilometers) {
          return kilometers ? kilometers * 1000 : 0;
      };

      var _clearMarkers = function() {
          for (var i = 0; i < markers.length; i++) {
              markers[i].setMap(null);
          }
          markers = [];
      };

      var _showSearchArea = function(lat, lng, radius) {
          var searchArea = new google.maps.Circle({
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
              radius: radius
          });
      };

      var _callSuggestionsApi = function(term, lat, lng, kilometers) {
          _clearMarkers();

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
                  _addMarker(value.name, parseFloat(value.latitude), parseFloat(value.longitude));
             });
          });
      };


      var createMap = function(mapId) {
          map = new google.maps.Map(document.getElementById(mapId), {
              zoom: 12,
              center: defaultMapCenter
          });

          var controlDiv = document.createElement('div');

          var searchLocationsPanel = $("<div>");
          uiSearchInput = $("<input id=\"searchLocationsInput\">");
          var searchLocationsButton = $("<button>Search</button>");
          searchLocationsPanel.append(uiSearchInput);
          searchLocationsPanel.append(searchLocationsButton);
          controlDiv.appendChild(searchLocationsPanel.get(0));

          uiSearchInput.on('keypress', function() {
            searchSuggestions(_getSearchTerm());
          });
          
          searchLocationsButton.on('click', function() {
            searchSuggestions(_getSearchTerm());
          });

          controlDiv.index = 1;
          controlDiv.style['padding-top'] = '10px';
          controlDiv.style.clear = 'both';
          map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
      };

      var searchSuggestions = function(term) {
          _callSuggestionsApi(term);
      };

      var searchSuggestionsInArea = function(term, lat, lng, kilometers) {
          _showSearchArea(lat, lng, _kilometersFromRadius(kilometers));
          _callSuggestionsApi(term, lat, lgn, kilometers);
      };

      return {
          init: createMap,
          searchSuggestions: searchSuggestions,
          searchSuggestionsInArea: searchSuggestionsInArea
      };

  })();