// Project  : The Nearest Irish Pub
// Author   : Damian Bilski
// Version  : v.2.0 
// Date     : 20 Jun 2014


var map,
    geocoder,
    infowindow,
    myLocation,
    searchService,
    matrixService,
    directionsDisplay,
    directionsService,
    stepsArray = [],
    pubs = {},
    currentPub = 0;
var Map, Pub, Contact, URL, UI = new Object();

function history_api() {
    return !!(window.history && history.pushState);
}
Map = {
    init: function () {
        if (Modernizr.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                Map.load();
            }, function () {
                Map.message("Browser disabled GeoLocation");
            })
        } else {
            Map.message("Your browser doesn\'t support GeoLocation")
        }
    },
    load: function () {
        matrixService = new google.maps.DistanceMatrixService();
        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        var options = {
            center: myLocation,
            zoom: 15,
            disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('map'), options);
        searchService = new google.maps.places.PlacesService(map);
        directionsDisplay.setMap(map);
        if (window.location.href.indexOf("@") > -1) {
            var url = window.location.href;
            var id = url.substr(url.indexOf("@") + 1);
            Pub.getById(id);
        } else {
            Map.search();
        }
        google.maps.event.addListener(map, 'tilesloaded', function (evt) {
            $("map").removeClass("loading");
        });
    },
    search: function () {
        var request = {
            location: myLocation,
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: ['bar', 'cafe', 'food', 'liquor_store', 'lodging', 'meal_delivery', 'meal_takeaway', 'night_club', 'restaurant'],
            keyword: ['irish pub', 'irish', 'pub']
        };
        searchService.nearbySearch(request, Map.callback);
    },
    callback: function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            pubs = results;
            var destinations = [];
            for (var i = 0; i < pubs.length; i++) {
                destinations.push(pubs[i].geometry.location);
            }
            console.log(pubs[currentPub]);
            var request = {
                origins: [myLocation],
                destinations: destinations,
                travelMode: google.maps.TravelMode.WALKING
            }
            matrixService.getDistanceMatrix(request, function (response, status) {
                if (status == google.maps.DistanceMatrixStatus.OK) {
                    for (var i = 0; i < response.originAddresses.length; i++) {
                        var results = response.rows[i].elements;
                        for (var j = 0; j < results.length; j++) {
                            pubs[j].distance = results[j].distance.text;
                            pubs[j].duration = results[j].duration.text;
                        }
                    }
                    Map.directions(myLocation, pubs[currentPub].geometry.location);
                } else {
                    Map.message(status);
                }
            });
        } else {
            Map.message(status);
        }
    },
    directions: function (from, to) {
        for (var i = 0; i < stepsArray.length; i++) {
            stepsArray[i].setMap(null);
        }
        stepsArray = [];
        var request = {
            origin: from,
            destination: to,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                directionsDisplay.setOptions({
                    suppressMarkers: true
                });
                var myRoute = response.routes[0].legs[0];
                for (var i = 0; i < myRoute.steps.length; i++) {
                    Map.marker(myRoute.steps[i].start_location, myRoute.steps[i].instructions);
                }
                Map.marker(pubs[currentPub].geometry.location, "<b>" + pubs[currentPub].name + "</b>", true);
                $("nav.pagination .pag-pub-name").text(pubs[Pub.count.next()].name);
                $("nav.pagination .pag-pub-distance").text(pubs[Pub.count.next()].distance + " (" + pubs[Pub.count.next()].duration + " walking)");
            } else {
                Map.message("directionsService : " + status);
            }
        });
    },
    marker: function (place, content, open) {
        infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            map: map,
            position: place
        });
        google.maps.event.addListener(marker, 'click', function () {
            infowindow.setContent(content);
            infowindow.open(map, marker);
        });
        if (open) {
            infowindow.setContent(content);
            infowindow.open(map, marker);
        }
        stepsArray.push(marker);
        // return marker;
    },
    message: function (msg) {
        console.log("Message : " + msg);
    }
}
Pub = {
    getById: function (id) {
        // Pub.details(id);
        console.log("Get by ID");
        var request = {
            placeId: id
        }
        searchService.getDetails(request, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // Map.directions(myLocation, place.geometry.location);
            } else {
                console.log("getById status : " + status);
                Map.search();
            }
        });
    },
    count: {
        next: function () {
            return currentPub + 1 > pubs.length - 1 ? 0 : currentPub + 1;
        },
        prev: function () {
            return currentPub - 1 < 0 ? pubs.length - 1 : currentPub - 1;
        }
    }
}
UI = {
    buttons: {
        next: function () {
            currentPub++;
            currentPub >= pubs.length ? currentPub = 0 : currentPub;
            Map.directions(myLocation, pubs[currentPub].geometry.location);
        },
        prev: function () {
            currentPub--;
            currentPub < 0 ? currentPub = pubs.length - 1 : currentPub;
            Map.directions(myLocation, pubs[currentPub].geometry.location);
        }
    }
    /* function () {
            var id = pubs[currentPub].place_id;
            var name = pubs[currentPub].name;
            //  var distance
            console.log(id + ", " + name);
        } */
}
Contact = {
    init: function () {}
}
URL = {
    check: function () {
        var url = window.location.href;
        var array = url.substr(url.indexOf('localhost/')).split('/');
        for (var i = 0; i < array.length; i++) {
            var obj = array[i];
            obj == "" ? array[i] = "pub" : null;
        }
        return array[1];
    },
    set: function (url) {
            var obj = {
                LatLng: pubs[currentPub].geometry.location
            };
            history.pushState(obj, null, url);
        }
        /*,
            link: "http://maps.google.com/maps?saddr=" + encodeURI(myLocation + "&daddr=" + pubs[0].name + ", " + pubs[0].vicinity), */
}
switch (URL.check()) {
case "search":
    Search.init();
    break;
case "contact":
    Contact.init();
    break;
default:
    Map.init();
}
$("nav.pagination .next").click(function (e) {
    e.preventDefault;
    UI.buttons.next();
    return false;
});
$("nav.pagination .prev").click(function (e) {
    e.preventDefault;
    UI.buttons.prev();
    return false;
});
window.onpopstate = function (event) {
    if (event && event.state) {

        Map.directions(myLocation, event.state.LatLng);
    }
}