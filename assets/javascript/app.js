 // Initialize Firebase
 var config = {
   apiKey: "AIzaSyBx9uPZZTyw4AyEWwBTwB6Cl0o3kyPSKz8",
   authDomain: "roulette-project.firebaseapp.com",
   databaseURL: "https://roulette-project.firebaseio.com",
   projectId: "roulette-project",
   storageBucket: "roulette-project.appspot.com",
   messagingSenderId: "52492766979"
 };
 firebase.initializeApp(config);

 //For Here API
 var appId = "ZfRJXkOh1WKLZLV14MDE";
 var appCode = "9NvfebHqxDHv33VtQXDsCg";

 // populated by here api
 var userLatitude;
 var userLongitude;
 var midPoint;

 //for HERE coffee/tea code
 var suggestedLocations;
 var selectedLocation;
 var restLat;
 var restLong;
 var restName;

 //firebase database
 var database = firebase.database();

 //variable to read data from form
 var userName = "";
 var userEmail = "";
 var user1Prof = "";
 var user2Prof = "";
 var user1Act = "";
 var user2Act = "";
 var userAddress;

 //stores last child values
 var lastChildAdded = null;

 //populated by firebase
 var matchedPersonName;
 var myName;

 //max distance between 2 users in miles
 var distanceThreshold = 5;

 //holds the setTimeout function for displaying unmatched msg
 var displayUnmatchedMsg;

 //list of professions
 var professions = ['Application Developer', 'Applications Engineer', 'Associate Developer', 'Computer Programmer', 'Developer', 'Front End Developer', 'Java Developer', 'Junior Programmer', 'Junior Software Engineer', 'Junior Web Developer', 'Programmer Analyst', 'Senior Applications Engineer', 'Senior Programmer', 'Senior Software Engineer', 'Senior System Architect', 'Senior System Designer', 'Senior Systems Software Engineer', 'Senior Web Administrator', 'Senior Web Developer', 'Software Architect', 'Software Developer', 'Software Engineer', 'Software Quality Assurance Analyst', 'Student', 'System Architect', 'Systems Software Engineer', 'Web Administrator', 'Webmaster'];

 //so that match happens only once
 var currentUserMatched = false;

 //list of friendship activities 
 var activities = ['Yoga', 'Board Games', 'Sports', 'Fitness', 'Hiking', 'Fishing', 'Gardening', 'Art', 'Music', 'Food'];

 function hideMatchedResults() {
   $("#matchedResults").hide();
 }

 function showMatchedResults() {
   $("#matchedResults").show();
 }

 function hideUnmatchedResults() {
   $("#unmatchedResults").hide();
 }

 function showUnmatchedResults() {
   $("#unmatchedResults").show();
 }

 function hideMainContent() {
   $("#mainContent").hide();
 }

 function showMainContent() {
   $("#mainContent").show();
 }

 //muirl type radio buttons
 function addRadioButtonListener() {
   $(document).ready(function() {
     $('input[type="radio"]').click(function() {
       var demovalue = $(this).val();
       $("div.myDiv").hide();
       $("#show" + demovalue).show();
     });
     groupMuirl();
   });
 }
 // group muirl angular
 function groupMuirl() {
   var app = angular.module("muirlApp", []);
   app.controller("myCtrl", function($scope) {
     $scope.products = [];
     $scope.addItem = function() {
       $scope.errortext = "";
       if (!$scope.addMe) {
         return;
       }
       if ($scope.products.indexOf($scope.addMe) == -1) {
         $scope.products.push($scope.addMe);
       } else {
         $scope.errortext = "Email already on list.";
       }
     }
     $scope.removeItem = function(x) {
       $scope.errortext = "";
       $scope.products.splice(x, 1);
     }
   });
 }

 function createDropdownContent() {

   //User dropdowns + professions

   for (var i = 0; i < professions.length; i++) {
     $('<option/>', {
       value: professions[i],
       html: professions[i]
     }).appendTo('#user1 select');
     $('<option/>', {
       value: professions[i],
       html: professions[i]
     }).appendTo('#user2 select');
   }

   $('#user1').change(function() {
     user1Prof = $("#user1 option:selected").text();
     console.log('Prof1:', user1Prof)

   });

   $('#user2').change(function() {
     user2Prof = $("#user2 option:selected").text();
     console.log('Prof2:', user2Prof);
   });

   //activities
   for (var i = 0; i < activities.length; i++) {
     // console.log(activities.length);
     $('<option/>', {
       value: activities[i],
       html: activities[i]
     }).appendTo('#user3 select');
     $('<option/>', {
       value: activities[i],
       html: activities[i]
     }).appendTo('#user4 select');
   }

   $('#user3').change(function() {
     user1Act = $("#user3 option:selected").text();
     console.log('Act1:', user1Act);
   });

   $('#user4').change(function() {
     user2Act = $("#user4 option:selected").text();
     console.log('Act2:', user2Act);
   });
 }

 function setUserInfo() {
   userName = $("#username").val().trim();
   userEmail = $("#email").val().trim();
   user1Prof = $("#profession1").val().trim();
   user2Prof = $("#profession2").val().trim();
   // user1Act = $("#activity1").val().trim();
   // user2Act = $("#activity2").val().trim();

 }

 //coverts a long lat to a text address and sets it in the text box
 function getUserGeoAddress(latitude, longitude) {
   $.ajax({
     url: 'https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?prox=' + latitude + ',' + longitude + '',
     type: 'GET',
     dataType: 'jsonp',
     jsonp: 'jsoncallback',
     data: {
       mode: 'retrieveAddresses',
       maxresults: '1',
       gen: '9',
       app_id: 'h8bxzedipYeOeMK6Yyi0',
       app_code: 'Zte-5udXFmEcJ8-43bG6_g'
     },
     success: function(data) {
       var geoAddress = data.Response.View[0].Result[0].Location.Address.City + ", " + data.Response.View[0].Result[0].Location.Address.State + " " + data.Response.View[0].Result[0].Location.Address.PostalCode;
       console.log("Geo Addr " + geoAddress);
       userAddress = geoAddress;
       $('#userAddress').val(userAddress);
     }
   });
 }

 function addListnerOnAutoFill() {
   $("#autofill-small, #autofill-large").on("click", function() {
     event.preventDefault();
     $("#autofill-small, #autofill-large").addClass("clicked");
     intializeUserGeo();
   });
 }

 //try to get user geo location from browser and store it in 
 //global variables (userLatitude, userLongitude, userAddress)
 function intializeUserGeo() {
   if ("geolocation" in navigator) {

     // check if geolocation is supported/enabled on current browser
     navigator.geolocation.getCurrentPosition(

       function success(position) {
         // for when getting location is a success

         console.log('latitude', position.coords.latitude, 'longitude', position.coords.longitude);
         userLatitude = position.coords.latitude;
         userLongitude = position.coords.longitude;
         getUserGeoAddress(userLatitude, userLongitude);
         gotUserLocation = true;
       },
       function error(error_message) {
         // for when getting location results in an error
         console.error('An error has occured while retrieving location', error_message);
         alert("Please enter your address to continue.");
         $("#autofill-small, #autofill-large").removeClass("clicked");
       });
   } else {
     // geolocation is not supported
     // get your location some other way
     console.log('geolocation is not enabled on this browser');
     alert("Please enter your address to continue.");
     $("#autofill-small, #autofill-large").removeClass("clicked");
   }
 }

 function addListenerOnGo() {
   $("#go").on("click", function() {
     event.preventDefault();
     userAddress = $("#userAddress").val().trim();
     console.log(userAddress);
     if (userAddress == "") {
       alert("Please enter a valid address to continue");
     } else {
       getAddressByTextInput();
     }
   });
 }
 // stores all users' info in firebase
 function getAddressByTextInput() {
   if (!($("#autofill-small, #autofill-large").hasClass("clicked"))) {
     console.log("searching for location id for " + userAddress);
     //autocomplete text key (used for getting location id of user address)
     var locIdURL = "http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=" + appId + "&app_code=" + appCode + "&query=" + userAddress + "&beginHighlight=<b>&endHighlight=</b>";
     console.log("using api " + locIdURL);
     $.ajax({
       url: locIdURL,
       type: "GET"
     }).then(function(data) {
       console.log(data);
       //not alerting this
       if (data.length == 0 || data == null) {
         alert("Sorry couldn't find your address, please enter a valid postal address.");
       }
       //getting the location id for the user address
       //chose [0] index as it shows the closest match to the user input
       locationId = data.suggestions[0].locationId;
       console.log("Found location id " + locationId);
       getUserCoords(locationId);
     });
   } else {

     setUserInfo();
     pushInfoInFireBase();
   }
 }

 //from location id get long and lat and 
 //store it in global variables (userLatitude, userLongitude)
 function getUserCoords(locationID) {
   console.log("searching for cordinates for " + locationID)

   //geocoder key (used for getting lat and long from user's location id)
   var locIdCoordURL = "http://geocoder.api.here.com/6.2/geocode.json?locationid=" + locationID + "&jsonattributes=1&gen=9&app_id=" + appId + "&app_code=" + appCode;
   console.log("using api " + locIdCoordURL)
   $.ajax({
     url: locIdCoordURL,
     type: "GET"
   }).then(function(data) {
     // console.log(data);
     userLatitude = data.response.view[0].result[0].location.displayPosition.latitude;
     userLongitude = data.response.view[0].result[0].location.displayPosition.longitude;
     console.log("Latitude " + userLatitude + " Longitude " + userLongitude);

     setUserInfo();
     pushInfoInFireBase();
   });
 }

 function ensureRadianIsAvailable() {
   /** Converts numeric degrees to radians */
   if (typeof(Number.prototype.toRad) === "undefined") {
     Number.prototype.toRad = function() {
       return this * Math.PI / 180;
     }
   }
 }

 function ensureDegreesIsAvailable() {
   //-- Define degrees function
   if (typeof(Number.prototype.toDeg) === "undefined") {
     Number.prototype.toDeg = function() {
       return this * (180 / Math.PI);
     }
   }
 }

 function distance(lon1, lat1, lon2, lat2) {
   var R = 3958.756; // Radius of the earth in mi
   var dLat = (lat2 - lat1).toRad(); // Javascript functions in radians
   var dLon = (lon2 - lon1).toRad();
   var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
     Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
     Math.sin(dLon / 2) * Math.sin(dLon / 2);
   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   var d = R * c; // Distance in km
   return d;
 }

 function distanceMatch(dist) {
   return dist < distanceThreshold;
 }

 //check if users' location are within the distanceThreshold
 function isCloseBy(currUser, pastUser) {
   var dist = distance(pastUser.val().userLong, pastUser.val().userLat, currUser.val().userLong, currUser.val().userLat);
   return distanceMatch(dist);
 }

 function middlePoint(lng1, lat1, lng2, lat2) {
   //-- Longitude difference
   var dLng = (lng2 - lng1).toRad();

   //-- Convert to radians
   lat1 = lat1.toRad();
   lat2 = lat2.toRad();
   lng1 = lng1.toRad();

   var bX = Math.cos(lat2) * Math.cos(dLng);
   var bY = Math.cos(lat2) * Math.sin(dLng);
   var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY));
   var lng3 = lng1 + Math.atan2(bY, Math.cos(lat1) + bX);

   //-- Return result
   return [lng3.toDeg(), lat3.toDeg()];

 }

 function findMidpointOfUsers(currUser, pastUser) {
   midPoint = middlePoint(pastUser.val().userLong, pastUser.val().userLat, currUser.val().userLong, currUser.val().userLat);

   console.log("Midpoint of users is " + midPoint);
   console.log("Midpoint Latitude is " + midPoint[1] + ", " + "Midpoint Longitude is " + midPoint[0]);
 }

 //get suggested restaurant locations near the midpoint of users' locations
 function getRestAddress(latitude, longitude) {

   $.ajax({
     url: "https://places.cit.api.here.com/places/v1/discover/explore?at=" + midPoint[1] + "," + midPoint[0] + "&cat=coffee-tea&app_id=" + appId + "&app_code=" + appCode,
     type: "GET"
   }).then(function success(data) {
     // console.log('Suggested locations ', data.results.items)
     suggestedLocations = data.results.items;
     // console.log(suggestedLocations)
     randomLocation(suggestedLocations);
   });
 }

 //from sugested location pick a random location and populate globale variables
 function randomLocation(suggestedLocations) {
   var obj_keys = Object.keys(suggestedLocations);
   var ran_key = obj_keys[Math.floor(Math.random() * obj_keys.length)];
   selectedLocation = suggestedLocations[ran_key];
   console.log(selectedLocation);
   console.log("Selected restaurant latitude is " + selectedLocation.position[0]);
   console.log("Selected restaurant longitude is " + selectedLocation.position[1]);
   restLat = selectedLocation.position[0];
   restLong = selectedLocation.position[1];
   restName = selectedLocation.title;
   $("#selectedLoc").html(restName);
   console.log("restaurant Name is " + restName);
   //calling map and lyft function here to populate it with
   //chosen restaurant co-ordinates
   loadMapAndLyft();
 }

 function matchPeople(currUser, pastUser) {
   console.log("Trying to match " + currUser.val().name + " and " + pastUser.val().name);
   //if both the users are not matched
   if (!pastUser.val().matched && !currentUserMatched) {
     console.log("trying to match " + currUser.val().name + " and " + pastUser.val().name + " because both of them are unmatched");
     //to ensure current user is only matched once
     currentUserMatched = true;
     database.ref(currUser.key + "/matched").set(true);
     database.ref(pastUser.key + "/matched").set(true);
     database.ref(currUser.key + "/matchedWith").set(pastUser.key);
     database.ref(pastUser.key + "/matchedWith").set(currUser.key);
     database.ref(currUser.key + "/matchedOn").set(firebase.database.ServerValue.TIMESTAMP);
     database.ref(pastUser.key + "/matchedOn").set(firebase.database.ServerValue.TIMESTAMP);
     return true;
   }
   return false;
 }

 function showUnMatchedFlow() {
   hideMatchedResults();
   hideMainContent();
   showUnmatchedResults();
 }

 function getMatchingProfessions() {

   //retrieve last child added to database
   database.ref().endAt().limitToLast(1).on('child_added', function(snapshot) {
     lastChildAdded = snapshot;
     myName = lastChildAdded.val().name;
   });
   console.log("My details " + JSON.stringify(lastChildAdded));

   // to ensure if we do not find a matching user profession in firebase 
   //           then we show unmatched message
   showUnMatchedFlow();

   //query FB to get users with profession matching the seeking profession of current user
   database.ref().orderByChild("myProfession").equalTo(lastChildAdded.val().seekingProf).on("child_added", function(snapshot2) {

     // further match the user such that 
     // other user is seeking for current user's profession
     // they are close by 
     // ensure the user is not matched with himself
     // only matched unmatched users
     if ((snapshot2.val().seekingProf == lastChildAdded.val().myProfession) &&
       isCloseBy(lastChildAdded, snapshot2) &&
       (snapshot2.key != lastChildAdded.key) &&
       (!snapshot2.val().matched)) {
       if (matchPeople(lastChildAdded, snapshot2)) {

         console.log("Matched with " + snapshot2.val().name + " and their details are " + JSON.stringify(snapshot2));

         matchedPersonName = snapshot2.val().name;
         userLatitude = lastChildAdded.val().userLat;
         userLongitude = lastChildAdded.val().userLong;
         setRestaurant(lastChildAdded, snapshot2);
         hideUnmatchedResults();
         hideMainContent();
         loadMatchedResultContent();
         showMatchedResults();
       } else {
         showUnMatchedFlow();
       }
     } else {
       // we had a user matching by profession but he did not pass further criteria
       showUnMatchedFlow();
     }
   });
 }
 //get a restaurant at mid point of the two locations of matched people.
 function setRestaurant(lastChildAdded, snapshot2) {
   findMidpointOfUsers(lastChildAdded, snapshot2);
   getRestAddress(restLat, restLong);
 }

 function loadMapAndLyft() {
   console.log("in lyft user lat " + userLatitude + " user long " + userLongitude)
   console.log("in lyft rest lat " + restLat + " rest long " + restLong)
   //For embedded map
   var gmapCanvas = document.querySelector('#gmap_canvas2');
   var origin = userLatitude + "," + userLongitude //'userLatitude,userLongitude'
   var destination = restLat + "," + restLong //Destination Lat/Lon
   var gMapApiKey = ''

   gmapCanvas.src = src = "https://www.google.com/maps/embed/v1/directions?origin=" + userLatitude + "," + userLongitude + "&destination=" + restLat + "," + restLong + "&mode=driving&mode=walking&mode=transit&key=" + gMapApiKey

   //Lyft button for page reload
   var OPTIONS = {
     scriptSrc: './assets/javascript/lyftWebButton.min.js',
     namespace: '',
     clientId: 'IfVUwWo8Br21',
     clientToken: 'ulNahyBUpqJ4rIWNYu8hf5UXw4ArAlrJL6zOocAIOTvr+T67SNnVsVxoRRbrYGYBzZ5eL6suAQ5gB/KMBHg0+WiDGGCvJDZjk3iSqrdGkBnam4QagJaZMwU=',
     location: {
       pickup: {
         latitude: userLatitude,
         longitude: userLongitude,
       },
       destination: {
         latitude: restLat,
         longitude: restLong,
       },
     },
     parentElement: document.getElementById('lyft-web-button-parent'),
     queryParams: {
       credits: ''
     },
     theme: 'hot-pink medium',
   };
   (function(t) {
     var n = this.window,
       e = this.document;
     n.lyftInstanceIndex = n.lyftInstanceIndex || 0;
     var a = t.parentElement,
       c = e.createElement("script");
     c.async = !0, c.onload = function() {
       n.lyftInstanceIndex++;
       var e = t.namespace ? "lyftWebButton" + t.namespace + n.lyftInstanceIndex : "lyftWebButton" + n.lyftInstanceIndex;
       n[e] = n.lyftWebButton, t.objectName = e, n[e].initialize(t)
     }, c.src = t.scriptSrc, a.insertBefore(c, a.childNodes[0])
   }).call(this, OPTIONS);
 }

 function loadMatchedResultContent() {
   $("#myName").html(myName);
   $("#matchName").html(matchedPersonName);
 }

 function pushInfoInFireBase() {
   database.ref().push({
     name: userName,
     email: userEmail,
     myProfession: user1Prof,
     seekingProf: user2Prof,
     userLat: userLatitude,
     userLong: userLongitude,
     dateAdded: firebase.database.ServerValue.TIMESTAMP,
     matched: false,
     matchedWith: "",
     matchedOn: ""
   });
   //This is a work around to avoid race condition
   getMatchingProfessions();
 }

 //Add listeners on 2. button in the app
 //1. get location button
 //2. go button 
 function addListeners() {
   addRadioButtonListener();
   addListnerOnAutoFill();
   addListenerOnGo();
 }

 function init() {
   //add listner
   addListeners();

   //hide post match html elements
   hideMatchedResults();
   hideUnmatchedResults();

   //ensure functions available
   ensureRadianIsAvailable();
   ensureDegreesIsAvailable();

   //populate dropdown values
   createDropdownContent();
 }

 init();