angular.module('headcount.events', [])

.controller('EventsController', function ($scope, Links, $http, $window) {

  // Stores all events that were created by you or that you were invited to
  $scope.events = [];
  $scope.event = {};
  $scope.showEvent = false;
  $scope.showNewEvent = true;

  /* userList currently populates with all users of Headcount. invitedUsers
   * gets pushed with any users you invite.
   */

  $scope.userList = [];
  $scope.invitedUsers = [];

  $scope.hasStripe = false;
  $scope.needInfo = false;

  $scope.clickedEvent = {};
  $scope.display = false;

  $scope.displayNewEvent = function() {
    console.log('displayNewEvent');
    $scope.showNewEvent = true;
  };

  $scope.displayEvent = function(link) {
    console.log('displayEvent');
    $scope.showEvent = true;
    $scope.event = link;
    $scope.event.display = true;
  };

  // Event object that's populated via creation form and then posted for creation
  $scope.newEvent = {
    title: 'Title goes here',
    description: 'Description goes here',
    expiration: new Date(new Date().setDate(new Date().getDate() + 20)),
    thresholdPeople: 10,
    thresholdMoney: 100
  };



  /* addInvite pushes a user to the invitedUsers array, then removes one from userList
   * and vice versa for removeInvite.
   */

  $scope.addInvite = function(user) {
    var index = $scope.userList.indexOf(user);
    $scope.invitedUsers.push($scope.userList.splice(index, 1)[0]);
  };

  $scope.removeInvite = function(user) {
    var index = $scope.invitedUsers.indexOf(user);
    $scope.userList.push($scope.invitedUsers.splice(index, 1)[0]);
  };

  // Fetch events that were created by you.

  $scope.fetchEvents = function () {
    return $http({
      method: 'GET',
      url: '/events-fetch'
    })
    .then(function(resp) {
      if (resp.data.length >= 1) {
        $scope.events = resp.data;
      } else {
        console.log("THERE ARE NO EVENTS TO FETCH!!!");
      }
    });
  };

  /* Fetches invited events. We're using two methods, one to fetch invite IDs, which are
   * then fed to another method which actually fetches the events.
   */


  $scope.fetchInviteIDs = function () {
    return $http({
      method: 'GET',
      url: '/invite-events-fetch'
    })
    .then(function(resp) {
      $scope.fetchInviteEvents(resp.data);
    });
  };

  $scope.fetchInviteEvents = function (ids) {
    return $http({
      method: 'POST',
      url: '/invite-events-fetch',
      data: {ids: ids}
    })
    .then(function(resp) {
        for (var i = 0; i < resp.data.length; i++) {
          $scope.events.push(resp.data[i]);
        }
    });
  };
  $scope.fetchInviteIDs();
  $scope.fetchEvents();

  // Fetches users from the database that are not current user

  $scope.fetchUsers = function () {
    return $http({
      method: 'GET',
      url: '/users-fetch'
    })
    .then(function(resp) {
      $scope.userList = resp.data;
      //console.log("USER LIST!!!" + $scope.userList);
    });
  };

  // Creates an event with $scope.newEvent data

  $scope.createEvent = function() {
    $scope.newEvent.invited = $scope.invitedUsers;
    return $http({
      method: 'POST',
      url: '/events-create',
      data: $scope.newEvent
    })
    .then(function(resp) {
      $window.location.href = "/";
    });
  };

  $scope.acceptOrDeclineInvite = function(acceptOrDeclineBoolean) {
    console.log('accepting invite?', acceptOrDeclineBoolean)

    var eventId = this.event.id;
    return $http({
      method: 'POST',
      url: '/invite-response',
      data: {
        eventId: eventId,
        accepted: acceptOrDeclineBoolean
      }
    })
    .then(function(resp) {   
    });
  };

  $scope.checkStripe = function($event){
    var currentUser = sessionStorage.getItem('user');
    return $http({
      method: 'POST',
      url : '/users/checkUser',
      data : {'username': currentUser}
    })
    .then(function(resp){
      $scope.lastEvent = $event.title;
      $scope.owner = $event.owner;

      // change database entries:
        // increase committed people
      if ($event.thresholdPeople > 1){
        $event.thresholdMoney -= $event.thresholdMoney/$event.thresholdPeople;
        $event.thresholdPeople --;
      } else if ($event.thresholdPeople === 1){
        // threshold reached! trigger funding
        $scope.triggerFunding = true;
        $event.thresholdMoney -= $event.thresholdMoney/$event.thresholdPeople;
        $event.thresholdPeople --;
      }
      // console.log($event.$$hashKey);
      // $scope.buttonClicked.($event.$$hashkey) = true;
      // 
      console.log(resp.data);
      console.log('checking')
      if (resp.data.hasStripeId === true){
        $scope.hasStripe = true;
      } else {
        $scope.needInfo = true;
      }
    });
  };

  $scope.hasNotAuthorizedVenmo = true;

  $scope.checkVenmoDetails = function($event){
    var currentUser = sessionStorage.getItem('user');
    return $http({
      method: 'POST',
      url : '/users/checkUser',
      data : {'username': currentUser}
    })
    .then(function(resp){
      var hasVenmoInfo = resp.data.hasVenmoInfo;

      if (!hasVenmoInfo) {
        console.log('You have not authorized your Venmo account yet!');
      }

      $scope.hasNotAuthorizedVenmo = !hasVenmoInfo;
    });
  };



  $scope.checkVenmoDetails();

  $scope.showDetails = function(){
    if ($scope.showCreate === true){
      $scope.showCreate = false;
    } else {
      $scope.showCreate = true;
    }
  };

});
