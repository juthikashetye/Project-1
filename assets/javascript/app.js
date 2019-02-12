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
   var geoAddress;
   var locationId;
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
   var userAddress;

   //stores last child values
   var lastChildAdded = null;

   //populated by firebase
   var matchedPersonName;
   var myName;

   //max distance between 2 users in miles
   var distanceThreshold = 5;

   //list of professions
   var professions = ['Application Developer', 'Applications Engineer', 'Associate Developer', 'Computer Programmer', 'Developer', 'Front End Developer', 'Java Developer', 'Junior Programmer', 'Junior Software Engineer', 'Junior Web Developer', 'Programmer Analyst', 'Senior Applications Engineer', 'Senior Programmer', 'Senior Software Engineer', 'Senior System Architect', 'Senior System Designer', 'Senior Systems Software Engineer', 'Senior Web Administrator', 'Senior Web Developer', 'Software Architect', 'Software Developer', 'Software Engineer', 'Software Quality Assurance Analyst', 'Student', 'System Architect', 'Systems Software Engineer', 'Web Administrator', 'Webmaster'];

   function hideResults() {
     $("#results").hide();
   }

   function showResults() {
     $("#mainContent").hide();
     $("#results").show();
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
   }

   function setUserInfo() {
     userName = $("#username").val().trim();
     userEmail = $("#email").val().trim();
     user1Prof = $("#profession1").val().trim();
     user2Prof = $("#profession2").val().trim();
   }

   function getUserGeoAddress(latitude, longitude) {
     $.ajax({
       url: 'https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?prox=' + userLatitude + ',' + userLongitude + '',
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
         geoAddress = data.Response.View[0].Result[0].Location.Address.City + "," + " " + data.Response.View[0].Result[0].Location.Address.State + " " + data.Response.View[0].Result[0].Location.Address.PostalCode;
         $('#userAddress').val(geoAddress);
         userAddress = geoAddress;
         console.log(userAddress);
       }
     });
   };

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

           $("#go").on("click", function() {
             event.preventDefault();
             setUserInfo();
             pushInfoInFireBase();

           });
         },
         function error(error_message) {
           // for when getting location results in an error
           console.error('An error has occured while retrieving location', error_message);
           alert("Please enter your address to continue.");
           getAddressByTextInput();

         });
     } else {
       // geolocation is not supported
       // get your location some other way
       console.log('geolocation is not enabled on this browser');
       alert("Please enter your address to continue.");
       //getAddressByTextInput();
     }
   }

   // stores all users' info in firebase
   function getAddressByTextInput() {
     $("#go").on("click", function() {

       event.preventDefault();
       userAddress = $("#userAddress").val().trim();
       if (userAddress == "") {
         alert("Please enter a valid address to continue");
       } else {
         //user info
         userAddress = $("#userAddress").val().trim();
         console.log(userAddress);
         setUserInfo();

         //autocomplete text key (used for getting location id of user address)
         var locIdURL = "http://autocomplete.geocoder.api.here.com/6.2/suggest.json?app_id=" + appId + "&app_code=" + appCode + "&query=" + userAddress + "&beginHighlight=<b>&endHighlight=</b>";

         $.ajax({
           url: locIdURL,
           type: "GET"
         }).then(function(data) {
           // console.log(data);

           //getting the location id for the user address
           //chose [0] index as it shows the closest match to the user input
           locationId = data.suggestions[0].locationId;
           // console.log(locationId);
           getUserCoords();
         });
       }
     });
   }

   function getUserCoords() {

     //geocoder key (used for getting lat and long from user's location id)
     var locIdCoordURL = "http://geocoder.api.here.com/6.2/geocode.json?locationid=" + locationId + "&jsonattributes=1&gen=9&app_id=" + appId + "&app_code=" + appCode;

     $.ajax({
       url: locIdCoordURL,
       type: "GET"
     }).then(function(data) {
       // console.log(data);
       userLatitude = data.response.view[0].result[0].location.displayPosition.latitude;
       userLongitude = data.response.view[0].result[0].location.displayPosition.longitude;
       console.log(userLatitude);
       console.log(userLongitude);

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
     console.log("Midpoint Latitude is " + midPoint[1], "Midpoint Longitude is " + midPoint[0]);
   }

   function getRestAddress(latitude, longitude) {

     $.ajax({
       url: "https://places.cit.api.here.com/places/v1/discover/explore?at=" + midPoint[1] + "," + midPoint[0] + "&cat=coffee-tea&app_id=" + appId + "&app_code=" + appCode,
       type: "GET"
     }).then(function success(data) {
       // console.log('Suggested locations ', data.results.items)
       suggestedLocations = data.results.items;
       // console.log(suggestedLocations)
       function randomLocation() {
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
         console.log(restName);
       }
       randomLocation();
     });
   }

   function matchPeople(currUser, pastUser) {
     console.log("Trying to match " + currUser.val().name + " and " + pastUser.val().name)
     if (!currUser.val().matched && !pastUser.val().matched) {
       console.log("trying to match " + currUser.val().name + " and " + pastUser.val().name + " because both of them are unmatched");

       //db.ref("-Users/-KUanJA9egwmPsJCxXpv/displayName").set("New trainer");

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

   function getMatchingProfessions() {

     //retrieve last child added to database
     database.ref().endAt().limitToLast(1).on('child_added', function(snapshot) {
       lastChildAdded = snapshot;
       myName = lastChildAdded.val().name;
     });
     console.log("My details " + JSON.stringify(lastChildAdded));

     database.ref().orderByChild("myProfession").equalTo(lastChildAdded.val().seekingProf).on("child_added", function(snapshot2) {

       if ((snapshot2.val().seekingProf == lastChildAdded.val().myProfession) &&
         isCloseBy(lastChildAdded, snapshot2) &&
         (snapshot2.key != lastChildAdded.key) &&
         (!snapshot2.val().matched)) {
         if (matchPeople(lastChildAdded, snapshot2)) {
           lastChildAdded.val().matched = true;
           console.log("Matched with " + snapshot2.val().name + " and their details are " + JSON.stringify(snapshot2));
           matchedPersonName = snapshot2.val().name;
           findMidpointOfUsers(lastChildAdded, snapshot2);
           getRestAddress(restLat, restLong);

           loadMatchedResultPage();
           showResults();
         }
       }
       // else {
       //   loadUnmatchedResultPage();
       // }
     });
     database.ref().endAt().limitToLast(1).on('child_added', function(snapshot) {
       lastChildAdded = snapshot;
     });
   }

   function loadMatchedResultPage() {

     $("#myName").html(myName);
     $("#matchName").html(matchedPersonName);
   }

   function loadUnmatchedResultPage() {
     $("body").text("Sorry, we couldn't find you a match right now. We will notify you know when we find one.")
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
     getMatchingProfessions();
   }

   function init() {
     hideResults();
     ensureRadianIsAvailable();
     ensureDegreesIsAvailable();
     createDropdownContent();
     intializeUserGeo();
   }

   init();