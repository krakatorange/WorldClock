/*
	If you need to test something, search for the keyword "test" and you'll
	find where to test certain data flow.
*/

/*
	Global variables.
*/
var latlons = new Array();
var cities = new Array();
var updateCities = new Array();
var time = new Array();
var center = {lat: 40.33984690463874, lng: -9.140625}; // Italy is our map center
var clearScreen = false;
var created = false;

/*
	This function sets up a current dataset, retrieves a number of cities
	from the dataset, sends cities for geocoding/time assignment, and
	launches a map.
*/
function getRandomCities(restartCount) {
	var cityCount;

	if(created) {
		var restartCount = document.getElementById("cityCount").value;
		zeroEverything(restartCount);
	}
	else if(restartCount) {
		cityCount = restartCount;
	}
	else {
		cityCount = document.getElementById("cityCount").value;
	}
    if(cityCount < 0) {
        window.alert("Invalid number!");
        return;
    }

    // Retrieve a list of cities to choose from
    var locations = getLocations();
    if(locations.length < cityCount) {
    	cityCount = locations.length;
	}

	// Generate selected number of cities
    randomIzer(cityCount, locations);

    // Test which cities are about to go into the Geocoder
    console.log(cities);

    // Send cities through Geocoding API
    for (i = 0; i < cities.length; i++) {
	    geoCoder(cities[i]).then(function(response) {
		  console.log("Success!", response);
		}, function(error) {
		  console.error("Failed!", error);
		})
	}

	// Show the map
	showMap();
    document.getElementById('cityCount').value = "";
    created = true;
}

/*
	This function pushes random cities into an array while avoiding duplicates.
*/
function randomIzer(cityCount, locations) {
	var sum = 0;
    for (i = 0; i < cityCount; i++) {
        var randomCity = locations[Math.floor(Math.random() * locations.length)];
        var index = cities.indexOf(randomCity);
        if((Number(cities.length) >= Number(locations.length))) {
        	/* This may or may not be deprecated, it was used to display the
        	   status of adding new cities to the current cities on the map.
            /*window.alert("We found " + sum 
                                       + " more cities out of " 
            						   + cityCount 
                                       + "! No more cities in the database!");
			*/
            if(sum == 0) {
                return;
            }
        }
        else if(index > -1) {
            //window.alert("collision");
            i--;
        }
        else {
            //window.alert("no collision");
            cities.push(randomCity);
            sum++;
        }
    }
}

/*
	This function sends city names to the Geocoder API, acquires coordinates, and injects
	the coordinates into the getTime function.
*/
function geoCoder(city) {
	// Return a new promise
	return new Promise(function(resolve, reject) {
		var result = city.split(', ');

		var request = new XMLHttpRequest();
	    var method = 'GET';
	    var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=+' + result[0] 
	                                                                            + ', +' 
	                                                                            + result[1];
	    request.open(method, url, false);
	    request.onload = function() {
			if(request.status == 200) {
				var data = JSON.parse(request.responseText);
				if(data.results[0]) {
					var lat = data.results[0].geometry.location.lat;
					var lon = data.results[0].geometry.location.lng;
					var latlon = lat + ", " + lon;
					updateCities.push(city);
					latlons.push(latlon);

					// Send coordinates through Time Zone API
					getTime(latlon).then(function(response) {
					console.log("Success!", response);
					}, function(error) {
					console.error("Failed!", error);
					})
				} 
				else {
					return;
				}
				// Use this to test responses from the Geocoder API
				//resolve(request.response);
			}
			else {
				reject(Error(request.statusText));
			}
	    };
	    request.onerror = function() {
	    	reject(Error("Network Error"));
	    };
	    // Make the request
	    request.send();
	});
}

/*
	This function sends coordinates (Latitude, Longitude) to the Time Zone API, acquires timezone
	offsets, and calculates the time based on the sum of the offsets and current timestamp.
*/
function getTime(latlon) {
	// Return a new promise
	return new Promise(function(resolve, reject) {
	    var request = new XMLHttpRequest();
	    var method = 'GET';
	    var timestamp = Math.floor((new Date()).getTime() / 1000).toString(); // UTC
	    var url = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + latlon 
	                                                                             + '&timestamp=' 
	                                                                             + timestamp;
	    request.open(method, url, false);
	    request.onload = function() {
			if(request.status == 200) {
				var data = JSON.parse(request.responseText);
				var dstOffset = data.dstOffset;
				var rawOffset = data.rawOffset;

				// Get more recent timestamp and calculate time from offsets
		        if(data.timeZoneId != null) {
					var Cur_Date = new Date();
					var UTC = Cur_Date.getTime() + (Cur_Date.getTimezoneOffset() * 60000);
					var Loc_Date = new Date(UTC + (1000 * rawOffset) + (1000 * dstOffset));
					time.push(Loc_Date.toLocaleTimeString());
				}
				// Use this to test responses from the Time Zone API
				//resolve(request.response);
	      	}
	      	else {
		    	reject(Error(request.statusText));
		    }
	    };
	    request.onerror = function() {
	    	reject(Error("Network Error"));
	    };
	    // Make the request
	    request.send();
	});
}

/*
	This function initializes a map using the Google Maps API, creates a panel
	of buttons for the map, plots all locations on the map using markers, and
	labels each marker using info windows with the locations respective city
	name and time.
*/
function showMap() {
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 1,
		center: center,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

    var centerControlDiv = document.createElement('div');
    var centerControl = new reFocus(centerControlDiv, map);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(centerControlDiv);

    var clearControlDiv = document.createElement('div');
    var clearControl = new clearWindows(clearControlDiv, map);
    clearControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(clearControlDiv);

    var restoreControlDiv = document.createElement('div');
    var restoreControl = new restoreWindows(restoreControlDiv, map);
    restoreControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(restoreControlDiv);

    for (var i = 0; i < time.length; i++) {
    	var latlon = latlons[i].split(', ');
        var lat = latlon[0];
        var lon = latlon[1];

        // Use this for testing information that is being placed on the map
       	console.log("updateCities: "+updateCities+"\ntime: "+time+"\nlatlons: "+latlons);

        var red = updateCities[i] + "\n" + time[i];

        var infowindow = new google.maps.InfoWindow({
            content: red,
            maxWidth: 130
        });

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lon),
            map: map,
            myinfowindow: infowindow
        });
        if(!clearScreen) {
            infowindow.open(map, marker);
        }

        google.maps.event.addListener(marker, 'click', function() {
            if(!marker.open){
                this.myinfowindow.open(map, this);
                marker.open = true;
            }
            else {
                this.myinfowindow.close(map, this);
                marker.open = false;
            }
            google.maps.event.addListener(map, 'click', function() {
                this.myinfowindow.close(map, this);
                marker.open = false;
            });
        });
    }
}

/*
	This function creates a button on the map to reset the
	map zoom. 
*/
function reFocus(controlDiv, map) {
    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Center the map';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Center Map';
    controlUI.appendChild(controlText);

    // Setup the click event listeners
    controlUI.addEventListener('click', function() {
      map.setCenter(center);
      map.setZoom(1);
    });
}

/*
	This function creates a button on the map to clear all
	info windows from the screen.
*/
function clearWindows(controlDiv, map) {
    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Drop the info windows';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Show Markers';
    controlUI.appendChild(controlText);

    // Setup the click event listeners
    controlUI.addEventListener('click', function() {
        clearScreen = true;
        showMap();
        clearScreen = false;
    });
}

/*
	This function creates a button on the map to bring all
	info windows back on the screen.
*/
function restoreWindows(controlDiv, map) {
    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Restore the info windows';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Show Data';
    controlUI.appendChild(controlText);

    // Setup the click event listeners
    controlUI.addEventListener('click', function() {
        showMap();
    });
}

/*
	This function zeros all global arrays if the restart
	button is clicked, or if a new query is submit.
*/
function zeroEverything(restartCount) {
	latlons = [];
	cities = [];
    time = [];
    updateCities = [];
    document.getElementById('cityCount').value = "";
    created = false;
    getRandomCities(restartCount);
}
