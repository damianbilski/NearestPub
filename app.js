var map,
    myLocation,
    pubs,
    directionsService,
    directionsDisplay,
    service,
    infowindow = new google.maps.InfoWindow();
var UI = new Object();

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        myLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        initMap();
    }, function (err) {
        console.log(err);
    });
} else {
    console.log("Geolocation is not supported by this browser.");
}

function initMap() {
    directionsService = new google.maps.DirectionsService();
    map = new google.maps.Map(document.getElementById('map'), {
        center: myLocation,
        zoom: 15
    });
    var request = {
        location: myLocation,
        radius: '500',
        types: ['bar']
    };
    service = new google.maps.places.PlacesService(map);
    var rendererOptions = {
        map: map
    }
    service.nearbySearch(request, searchResults);
    directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
}

function searchResults(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        pubs = results;
        console.log(pubs);
        var string = myLocation + "&daddr=" + pubs[0].name + ", " + pubs[0].vicinity;
        console.log("http://maps.google.com/maps?saddr=" + encodeURI(string));
        var request = {
            origin: myLocation,
            destination: results[0].geometry.location,
            travelMode: google.maps.TravelMode.WALKING
        };
        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                // console.log(distance + ", " + duration);
            }
        });
    }
}

function getPubDetails(pub_no) {
    var request = {
        origin: myLocation,
        destination: pubs[pub_no].geometry.location,
        travelMode: google.maps.TravelMode.WALKING
    };
    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            var distance = response.routes[0].legs[0].distance.text;
            var duration = response.routes[0].legs[0].duration.text;
            pubs[pub_no].distance = distance;
            pubs[pub_no].duration = duration;
            console.log(pubs[pub_no]);
        }
    });

}
UI = {

}