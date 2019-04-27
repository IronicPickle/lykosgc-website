$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  // ---

	// --- Initial setup
  var socket = io("/sync");
  socketSetup(socket);
  joinNowEvents();
  syncEvents();
});
// Join now container events
function joinNowEvents() {
  $("#join_button_img").off("mouseover").on("mouseover", function() {
    $(this).velocity({
      width: ["64%", "60%"],
      marginTop: ["0%", "2%"],
      marginLeft: ["18%", "20%"],
      marginRight: ["18%", "20%"]
    }, {
      duration: 1500,
      easing: [100, 5],
      queue: false
    });
  });
  $("#join_button_img").off("mouseleave").on("mouseleave", function() {
    $(this).velocity({
      width: ["60%", "64%"],
      marginTop: ["2%", "0%"],
      marginLeft: ["20%", "18%"],
      marginRight: ["20%", "18%"]
    }, {
      duration: 1500,
      easing: [100, 10],
      queue: false
    });
  });
  $("#join_button_img").off("click").on("click", function() {
    var width = parseInt($(this).css("width"));
    $(this).velocity({
      transform: ["rotate(360deg)", "rotate(0deg)"]
    }, {
      duration: 1500,
      easing: [100, 10],
      queue: false
    });
  });
}
// Sync open container events
function syncEvents() {
  $("#page_cover").click(function() {
    toggleSyncContainer(false);
  });
  $("#sync_open_button").off("click").on("click", function() {
    toggleSyncContainer(true);
  });
}
// Toggles sync container
function toggleSyncContainer(state) {
  if(state) {
    $("#sync_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
  } else {
    $("#sync_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
}
var counterInterval;
// Sync setup
function syncSetup(socket, data) {
  toggleNotification(false);
  $("#sync_button").off();
  buttonEvents();
  if(data.syncStage == 0) {
    window.clearInterval(counterInterval);
    $("#sync_status, #sync_open_stage").text("Stage: Unsynced ✖");
    $("#sync_status_text").html(
      "<div id='sync_spacer'></div>"+
      "<br/>"+
      "Your account is currently unsynced.<br/>Press 'Sync' to start the Synchronisation process."+
      "<br/><br/>"+
      "<div id='sync_spacer'></div>"
    )
    $("#sync_button")
      .text("Sync")
      .on("click", function() {
        toggleNotification(true, "loader", "Starting account sync...");
        socket.emit("start");
      });
  } else if(data.syncStage == 1) {
    counterInterval = counter(data.time - 1);
    window.location.href = "ts3server://lykosgc.uk?port=9987&token=" + data.privKey;
    $("#sync_status, #sync_open_stage").text("Stage: Waiting");
    $("#sync_status_text").html(
      "<div id='sync_spacer'></div>"+
      "<br/>"+
      "<p id='sync_counter_text'>Account Sync beginning in:</p>"+
      "<p id='sync_counter_number'>" + data.time + "</p>"+
      "<div id='sync_spacer'></div>"+
      "<br/>"+
      "Sync attempt: 1/" + data.maxAttempt +
      "<br/><br/>"+
      "<div id='sync_spacer'></div>"+
      "<br/><br/>"+
      "Accept the notification to open teamspeak."+
      "<br/><br/>"+
      "or"+
      "<br/><br/>"+
      "Use the privilege key listed below."+
      "<input id='sync_key' type='text' value='" + data.privKey + "' readonly/>"
    )
    $("#sync_key").on("focus", function() {
      $(this).select();
    });
  } else if(data.syncStage == 2) {
    window.clearInterval(counterInterval);
    counterInterval = counter(data.time - 1);
    $("#sync_status, #sync_open_stage").text("Stage: Syncing");
    $("#sync_status_text").html(
      "<div id='sync_spacer'></div>"+
      "<br/>"+
      "<p id='sync_counter_text'>Sync failed, retrying in:</p>"+
      "<p id='sync_counter_number'>" + data.time + "</p>"+
      "<div id='sync_spacer'></div>"+
      "<br/>"+
      "Sync attempt: " + (data.attempt+1) + "/" + data.maxAttempt+
      "<br/><br/>"+
      "<div id='sync_spacer'></div>"
    )
    $("#sync_key").on("focus", function() {
      $(this).select();
    });
  } else if(data.syncStage == 3) {
    window.clearInterval(counterInterval);
    $("#sync_status, #sync_open_stage").text("Stage: Synced");
    $("#sync_status_text").html(
      "<div id='sync_spacer'></div>"+
      "<br/>"+
      "<p id='sync_counter_text'>Your account has been synced successfully.</p>"+
      "<br/>"+
      "<div id='sync_spacer'></div>"+
      "<br/>"
    )
    $("#sync_button")
      .text("Re-sync")
      .on("click", function() {
        toggleNotification(true, "loader", "Starting account sync...");
        socket.emit("start");
      });
  }
}
// Sync counter
function counter(wait) {
  var counterInterval = setInterval(function() {
    $("#sync_counter_number").text(wait);
    wait = wait - 1;
  }, 1000);
  return counterInterval;
}
// Sync socket setup
function socketSetup(socket) {
  socket.on("connect", function() {
    socket.emit("initialise");
  });
  socket.on("disconnect", function(data) {
    socket.connect();
  });
  socket.on("initialise", function(data) {
    syncSetup(socket, data);
  });
  socket.on("start", function(data) {
    syncSetup(socket, data);
  });
  socket.on("Error", function(data) {
    toggleNotification(true, "alert", "Unexpected error", 5000);
  });
}
