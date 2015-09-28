// Project  : The Nearest Irish Pub
// Author   : Damian Bilski
// Version  : v.2.0 
// Date     : 20 Jun 2014


var map,
    infowindow,
    myLocation = new google.maps.LatLng(53.3450903, -6.263803199999984) /* default : Temple Bar, Dublin, Ireland */ ,
    searchBar,
    searchNoGeo,
    stepsArray = [],
    pubs = [],
    currentPub = 0,
    is_mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
var Map, Pub, Contact, URL, UI = {};
var services = {
    directions: {
        set: new google.maps.DirectionsService(),
        display: new google.maps.DirectionsRenderer()
    },
    matrix: new google.maps.DistanceMatrixService(),
    geomarker: new GeolocationMarker()
}

/* 
if(url) {
    if(geo) {
        geo_to_url
    } else {
        
    }
} else {
    if(geo) {
        search  
    } 
}

if (url && geo) {
    geo_to_url   
} else if (geo) {
    searchPlace
} else {
    error   
}

*/
Map = {
    init: function () {
        var options = {
            center: myLocation,
            zoom: 15,
            disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById("map"), options);
        // SET SERVICES
        services.search = new google.maps.places.PlacesService(map);
        services.directions.display.setMap(map);
        if (Modernizr.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                if (!!URL.check()) {
                    Pub.getById(URL.check());
                } else {
                    Map.search();
                }
            }, function () {
                Map.message("Browser disabled GeoLocation");
                $("#no-geolocation").foundation("reveal", "open");
            });
        }
        var searchBoxes = ["search-box", "modal-search-box"];
        for (var i = 0; i < searchBoxes.length; i++) {
            var input = document.getElementById(searchBoxes[i]);
            var obj = new google.maps.places.SearchBox(input);
            obj.addListener('places_changed', function () {
                var place = this.getPlaces();
                myLocation = place[0].geometry.location;
                if (!!URL.check()) {
                    Pub.getById(URL.check());
                } else {
                    Map.search();
                }
                $("#no-geolocation").foundation("reveal", "close");
            });
        }
        if (is_mobile) {
            UI.view.geomarker();
        }
        google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
            $("body").removeClass("loading");
        });
    },
    search: function () {
        var request = {
            location: myLocation,
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: ['bar', 'cafe', 'food', 'liquor_store', 'lodging', 'meal_delivery', 'meal_takeaway', 'night_club', 'restaurant'],
            keyword: ['irish pub', 'irish', 'pub']
        };
        services.search.nearbySearch(request, Map.callback);
    },
    callback: function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            pubs = results;
            var destinations = [];
            for (var i = 0; i < pubs.length; i++) {
                destinations.push(pubs[i].geometry.location);
            }
            var request = {
                origins: [myLocation],
                destinations: destinations,
                travelMode: google.maps.TravelMode.WALKING
            }
            services.matrix.getDistanceMatrix(request, function (response, status) {
                if (status == google.maps.DistanceMatrixStatus.OK) {
                    for (var i = 0; i < response.originAddresses.length; i++) {
                        var results = response.rows[i].elements;
                        for (var j = 0; j < results.length; j++) {
                            pubs[j].distance = results[j].distance.text;
                            pubs[j].duration = results[j].duration.text;
                        }
                    }
                    Map.directions(myLocation, pubs[currentPub]);
                } else {
                    Map.message(status);
                }
            });
        } else {
            Map.message(status);
        }
    },
    directions: function (from, to) {
        $("#container address").addClass("loading");
        for (var i = 0; i < stepsArray.length; i++) {
            stepsArray[i].setMap(null);
        }
        stepsArray = [];
        var request = {
            origin: from,
            destination: to.geometry.location,
            travelMode: google.maps.TravelMode.WALKING
        };
        services.directions.set.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                services.directions.display.setDirections(response);
                var myRoute = response.routes[0].legs[0];
                for (var i = 0; i < myRoute.steps.length; i++) {
                    Map.marker(myRoute.steps[i].start_location, myRoute.steps[i].instructions);
                }
                Map.marker(to.geometry.location, "<b>" + to.name + "</b>", true);
                UI.view.nextPubButton();
                UI.view.prevPubButton();
                UI.view.mainInfo();
                URL.set();
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
        console.log("Get by ID : " + id);
        $("nav.pagination").hide();
        var request = {
            placeId: id
        }
        services.search.getDetails(request, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                pubs.push(place);
                var request = {
                    origins: [myLocation],
                    destinations: [place.geometry.location],
                    travelMode: google.maps.TravelMode.WALKING
                }
                services.matrix.getDistanceMatrix(request, function (response, status) {
                    if (status == google.maps.DistanceMatrixStatus.OK && response.rows[0].elements[0].status == "OK") {
                        console.log(response.rows[0].elements[0].status);
                        for (var i = 0; i < response.originAddresses.length; i++) {
                            var results = response.rows[i].elements;
                            for (var j = 0; j < results.length; j++) {
                                pubs[j].distance = results[j].distance.text;
                                pubs[j].duration = results[j].duration.text;
                            }
                        }
                        Map.directions(myLocation, place);
                    } else {
                        Map.message(status + ", " + response.rows[0].elements[0].status);
                    }
                });
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
    view: {
        nextPubButton: function () {
            $("nav.pagination .next .pag-pub-name").text(pubs[Pub.count.next()].name);
            $("nav.pagination .next .pag-pub-distance").text(pubs[Pub.count.next()].distance + " (" + pubs[Pub.count.next()].duration + " walking)");
            $("nav.pagination .next").attr("href", "@" + pubs[Pub.count.next()].place_id);
        },
        prevPubButton: function () {
            $("nav.pagination .prev .pag-pub-name").text(pubs[Pub.count.prev()].name);
            $("nav.pagination .prev .pag-pub-distance").text(pubs[Pub.count.prev()].distance + " (" + pubs[Pub.count.next()].duration + " walking)");
            $("nav.pagination .prev").attr("href", "@" + pubs[Pub.count.prev()].place_id);
        },
        mainInfo: function () {
            $("#container .pub-name a").attr("href", URL.link()).text(pubs[Pub.count.next()].name).text(pubs[currentPub].name);
            $("#container .pub-matrix .pub-distance").text(pubs[currentPub].distance);
            $("#container .pub-matrix .pub-time").text(pubs[currentPub].duration);
            if (pubs[currentPub].photos) {
                var imageURL = pubs[currentPub].photos[0].getUrl({
                    'maxWidth': 100,
                    'maxHeight': 100
                })
                $("#container .pub-image").attr("src", imageURL);
            } else {
                Map.message("Add Image Placeholder");
            };
            var request = {
                placeId: pubs[currentPub].place_id
            }
            services.search.getDetails(request, function (place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    var isOpen;
                    if (place.opening_hours) {
                        place.opening_hours.open_now ? isOpen = "Open :)" : isOpen = "Closed :(";
                    } else {
                        var isOpen = "";
                    }
                    $("#container .pub-open").text(isOpen)
                    $("#container .pub-address").text(place.formatted_address);
                    $("#container .pub-phone a").attr("href", "tel:" + place.formatted_phone_number).text(place.international_phone_number);

                    $("#container address").removeClass("loading");
                } else {
                    Map.message("UI.view.mainInfo()");
                }
            })
        },
        geomarker: function () {
            services.geomarker.setCircleOptions({
                fillColor: '#808080'
            });
            google.maps.event.addListenerOnce(services.geomarker, 'position_changed', function () {
                map.setCenter(this.getPosition());
                map.fitBounds(this.getBounds());
            });
            google.maps.event.addListener(services.geomarker, 'geolocation_error', function (e) {
                alert('There was an error obtaining your position. Message: ' + e.message);
            });
            services.geomarker.setMap(map);
        }
    },
    buttons: {
        next: function () {
            currentPub++;
            currentPub >= pubs.length ? currentPub = 0 : currentPub;
            UI.buttons.common();
        },
        prev: function () {
            currentPub--;
            currentPub < 0 ? currentPub = pubs.length - 1 : currentPub;
            UI.buttons.common();
        },
        common: function () {
            URL.set();
            Map.directions(myLocation, pubs[currentPub]);
        }
    }
}
Contact = {
    init: function () {}
}
URL = {
    check: function () {
        if (window.location.href.indexOf("@") > -1) {
            var url = window.location.href;
            var place_id = url.substr(url.indexOf("@") + 1);
            return place_id;
        }
    },
    set: function () {
        history.pushState(currentPub, null, "@" + pubs[currentPub].place_id);
        document.title = pubs[currentPub].name + " - The Nearst Pub";
    },
    link: function () {
        return "http://maps.google.com/maps?saddr=" + encodeURI(myLocation + "&daddr=" + pubs[currentPub].name + ", " + pubs[currentPub].vicinity);
    }
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
$("button.toggleInfo").click(function (e) {
    $("address.pub-info").toggleClass("short");
});
window.addEventListener('popstate', function (e) {
    if (e.state == null) {
        Map.message("Error : " + e.state);
    } else {
        currentPub = e.state;
        Map.directions(myLocation, pubs[currentPub]);
    }
});
Map.init();