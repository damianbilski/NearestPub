// Project  : The Nearest Irish Pub
// Author   : Damian Bilski
// Version  : v.2.0 
// Date     : 20 Jun 2014

var map, service, geocoder, infowindow, myLocation, directionsDisplay, directionsService = new google.maps.DirectionsService(),
    stepsArray = [],
    currentPub = 0,
    pubs;
var Pubs, Search, Contact, Map, URL = new Object();

function history_api() {
    return !!(window.history && history.pushState);
}
Pubs = {
    init: function () {
        console.log("Pubs.init()");
        if (Modernizr.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                console.log(myLocation);
                Map.init();
            }, Search.init("Think there's sheep on the road!", "Try another spot!", "Browser disabled GeoLocation"))
        } else {
            Search.init("Your browser doesn\'t support GeoLocation", "Where abouts are ya?")
        }
    },
    details: function (placeId) {
        var request = {
            placeId: placeId
        }
        var latLng;
        service.getDetails(request, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                geocoder.geocode({
                    "latLng": place.geometry.location
                }, function (results, status) {
                    var path;
                    if (status == google.maps.GeocoderStatus.OK) {
                        console.log(results.formatted_address);
                        var city, country;
                        $.each(results, function (i, val) {
                            $.each(val['address_components'], function (i, val) {
                                if (val['types'] == "locality,political") {
                                    if (val['long_name'] != "") {
                                        city = val["long_name"];
                                    }
                                }
                                if (val["types"] == "country,political") {
                                    if (val["long_name"] != "") {
                                        country = val["long_name"];
                                    }
                                }
                            });
                        });
                        path = encodeURI("/" + country + "/" + city + "/");
                    } else {
                        alert('Geocoder failed due to: ' + status);
                        path = "/";
                    }
                    var id = "@" + placeId;
                    var next_id;
                    currentPub + 1 >= pubs.length ? next_id = pubs[0].place_id : next_id = pubs[currentPub + 1].place_id;
                    console.log(next_id);
                    $("#nextPub").attr("href", path + "@" + next_id);
                    URL.set(path + id);
                });
            }
        });
    },
    next: function () {
        currentPub++;
        currentPub >= pubs.length ? currentPub = 0 : null;
        Pubs.details(pubs[currentPub].place_id);
        Map.directions(myLocation, pubs[currentPub].geometry.location);
    },
    getById: function (id) {
        Pubs.details(id);
        console.log("Get by ID");
        var request = {
            placeId: id
        }
        service.getDetails(request, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                Map.directions(myLocation, place.geometry.location);
            } else {
                console.log("getById status : " + status);
            }
        });
    }
}
Search = {
    init: function (title, msg) {}
}
Contact = {
    init: function () {}
}
Map = {
    init: function () {
        console.log("Map.init()");
        map = new google.maps.Map(document.getElementById('map'), options);
        service = new google.maps.places.PlacesService(map);
        geocoder = new google.maps.Geocoder();
        var options = {
            center: myLocation,
            zoom: 14,
            disableDefaultUI: true
        };
        directionsDisplay = new google.maps.DirectionsRenderer({
            map: map
        });
        google.maps.event.addListener(map, 'tilesloaded', function (evt) {
            $("map").removeClass("loading");
            console.log("loaded!");
        });
        Map.search();
    },
    search: function () {
        var request = {
            location: myLocation,
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: ['bar', 'cafe', 'food', 'liquor_store', 'lodging', 'meal_delivery', 'meal_takeaway', 'night_club', 'restaurant'],
            keyword: ['irish pub', 'irish', 'pub']
        };
        service.nearbySearch(request, Map.callback);
    },
    callback: function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            pubs = results;
            if (window.location.href.indexOf("@") > -1) {
                var url = window.location.href;
                var id = url.substr(url.indexOf("@") + 1);
                Pubs.getById(id);
            } else {
                Pubs.details(pubs[currentPub].place_id);
                Map.directions(myLocation, pubs[currentPub].geometry.location);
            }
        } else {
            console.log(status);
        }
    },
    marker: function (place, content) {
        infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            map: map,
            position: place
        });
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.setContent(content);
            infowindow.open(map, this);
        });
        return marker;
    },
    directions: function (from, to) {
        for (var i = 0; i < stepsArray.length; i++) {
            stepsArray[i].setMap(null);
        }
        stepsArray = [];
        var request = {
            origin: from,
            destination: to,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                var myRoute = response.routes[0].legs[0];
                for (var i = 0; i < myRoute.steps.length; i++) {
                    stepsArray.push(Map.marker(myRoute.steps[i].start_location, myRoute.steps[i].instructions));
                }
            } else {
                console.log(response);
            }
        });
    }
}
URL = {
    test: function () {
        var url = window.location.href;
        var array = url.substr(url.indexOf('localhost/')).split('/');
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            obj == "" ? array[i] = "pub" : null;
        }
        return array[1];
    },
    set: function (url) {
        console.log("Geometry.location :" + pubs[currentPub].geometry.location);
        var obj = {
            LatLng: pubs[currentPub].geometry.location
        };
        history.pushState(obj, null, url);
    }
}
console.log(URL.test());
switch (URL.test()) {
case "search":
    Search.init();
    break;
case "contact":
    Contact.init();
    break;
default:
    Pubs.init();
}
$("#nextPub").click(function (e) {
    e.preventDefault;
    Pubs.next();
    return false;
});
window.onpopstate = function (event) {
    if (event && event.state) {
        console.log(event.state);
        Map.directions(myLocation, event.state.LatLng);
    }
}