var latlons = new Array();
var cities = new Array();
var updateCities = new Array();
var time = new Array();
var center = {lat: 40.33984690463874, lng: -9.140625};
var clearScreen = false;
var created = false;
var lock = true;

function getRandomCities(restartCount) {

	var cityCount;

	if(created) {
		var restartCount = document.getElementById("cityCount").value;
		zeroEverything(restartCount);
	} else if(restartCount) {
		cityCount = restartCount;
	} else {
		cityCount = document.getElementById("cityCount").value;
	}

    if(cityCount < 0) {
        window.alert("Invalid number!");
        return;
    } else if(cityCount > 2) {
    	window.alert("Upgrade to see more than 2 cities!");
        cityCount = 2;
    }

    var locations2 = getLocations();

    if(locations2.length < cityCount) {
    	cityCount = locations2.length;
	}

    var sum = 0;
    for (i = 0; i < cityCount; i++) {
        var randomCity = locations2[Math.floor(Math.random() * locations2.length)];
        var index = cities.indexOf(randomCity);
        if((Number(cities.length) >= Number(locations2.length))) {
            //window.alert("We found " + sum + " more cities out of " + cityCount 
            //                                                        + "! No more cities in the database!");
            if(sum == 0) {
                return;
            }
        }
        else if(index > -1) {
            //window.alert("collision");
            i--;
        } else {
            //window.alert("no collision");
            cities.push(randomCity);
            sum++;
        }
    }

    console.log(cities);

    for (i = 0; i < cities.length; i++) {
	    geoCoder(cities[i]).then(function(response) {
		  console.log("Success!", response);
		}, function(error) {
		  console.error("Failed!", error);
		})
	}

for (i = 0; i < latlons.length; i++) {
	    getTime(latlons[i]).then(function(response) {
		  console.log("Success!", response);
		}, function(error) {
		  console.error("Failed!", error);
		})
	}

	//console.log(lock);

    //for (i = 0; i < cities.length; i++) {
	//	geoCoder(cities[i]);
   // }
    //window.alert("We found what you're looking for!");

	showMap();

    document.getElementById('cityCount').value = "";
    created = true;
}

function geoCoder(city) {
	// Return a new promise
	return new Promise(function(resolve, reject) {
		var result = city.split(', ');

		var request = new XMLHttpRequest();
	    var method = 'GET';
	    var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=+' + result[0] 
	                                                                            + ', +' 
	                                                                            + result[1];
	    request.open(method, url);
	    request.onload = function() {
			if(request.status == 200) {
				var data = JSON.parse(request.responseText);
				var lat = data.results[0].geometry.location.lat;
				var lon = data.results[0].geometry.location.lng;
				var latlon = lat + ", " + lon;
				updateCities.push(city);
				latlons.push(latlon);
				resolve(request.response);
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

function getTime(latlon) {
	// Return a new promise
	return new Promise(function(resolve, reject) {
	    var request = new XMLHttpRequest();
	    var method = 'GET';
	    var timestamp = Math.floor((new Date()).getTime() / 1000).toString(); // utc
	    var url = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + latlon 
	                                                                             + '&timestamp=' 
	                                                                             + timestamp;
	    request.open(method, url);
	    request.onload = function() {
			if(request.status == 200) {
				var data = JSON.parse(request.responseText);
				var dstOffset = data.dstOffset;
				var rawOffset = data.rawOffset;

		        if(data.timeZoneId != null) {
					var Cur_Date = new Date();
					var UTC = Cur_Date.getTime() + (Cur_Date.getTimezoneOffset() * 60000);
					var Loc_Date = new Date(UTC + (1000*rawOffset) + (1000*dstOffset));
					time.push(Loc_Date.toLocaleTimeString());
				}
				resolve(request.response);
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

	       	console.log("updateCities: " + updateCities + "\ntime: " + time + "\nlatlons: " + latlons);

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
	            else{
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

function reFocus(controlDiv, map) {
    // Set CSS for the control border.
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

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Center Map';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function() {
      map.setCenter(center);
      map.setZoom(1);
    });
}

function clearWindows(controlDiv, map) {
    // Set CSS for the control border.
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

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Show Markers';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function() {
        clearScreen = true;
        showMap();
        clearScreen = false;
    });
}

function restoreWindows(controlDiv, map) {
    // Set CSS for the control border.
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

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Show Data';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function() {
        showMap();
    });
}

function zeroEverything(restartCount) {
	latlons = [];
	cities = [];
    time = [];
    updateCities = [];
    document.getElementById('cityCount').value = "";
    created = false;
    getRandomCities(restartCount);
}

function getLocations() {
	var locations = [
                  	 "Vienna, Austria",
					 "Towson, Maryland",
					 "Manchester, England",
					 "Rio de Janeiro, Brazil",
					 "Bangui, Central African Republic",
					 "Barcelona, Spain",
					 "Moscow, Russia",
					 "Miami, Florida",
					 "Chicago, Illinois",
					 "Los Angeles, California",
					 "Istanbul, Turkey"
                ];

	var clone = locations.slice(0);
	return clone;
}
