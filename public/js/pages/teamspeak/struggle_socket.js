// Initializes socket setup
function socketSetup(socket, _csrf, loginTimeout) {
  var loginTimeout = socketConnecting(socket, loginTimeout);
  socket.on("connect", function() {
    socketConnect(socket, loginTimeout);
  });
  socket.on("disconnect", function() {
    socketDisconnect(socket);
  });
  socket.on("connect_error", function() {
    socketDisconnect(socket);
  });
  socket.on("connect_timeout", function() {
    socketDisconnect(socket);
  });
  socket.on("firstTime", function() {
    firstTimeSetup();
  });
  socket.on("notSynced", function() {
    notSyncedSetup();
  });
  socket.on("detailsError", function(errors) {
    toggleNotification(true, "alert", "Some details are invalid!", 5000);
    renderErrors(errors);
  });
  socket.on("detailsSuccess", function() {
    toggleNotification(true, "loader", "Success!", 1000);
    toggleDetailsInputContainer(false);
    socket.emit("getData", JSON.stringify({allRaids: false}));
  });
  socket.on("updatePending", function() {
    if(typeof currMoney != "undefined") socket.emit("addMoney", JSON.stringify({money: currMoney}));
    socket.emit("getData", JSON.stringify({allRaids: false}));
  });
  socket.on("update", function(data) {
    socketUpdate(socket, data);
    socket.emit("updated");
  });
  socket.on("notification", function(data) {
    toggleNotification(true, data.type, data.message, data.time);
  });
  socket.on("refresh", function(data) {
    var i = data;
    toggleNotification(true, "loader", "Remote Refresh: Refreshing page in "+i+" second(s)...");
    var interval = setInterval(function() {
      i = i - 1;
      toggleNotification(true, "loader", "Remote Refresh: Refreshing page in "+i+" second(s)...");
    }, 1000);
    setTimeout(function() {location.reload()}, i*1000);
  });
  socket.on("error", function(data) {
    toggleNotification(true, "alert", "Unexpected error", 5000);
  });
}
// Chain for socket connecting
function socketConnecting(socket, loginTimeout) {
  toggleNotification(true, "loader", "Connecting...");
  $("title").text("TS Struggle - Connecting...");
  $("body").children()
    .not("#first_time_container")
    .not("#notification_container")
    .not("#top_container")
    .css("opacity", "0");
  return loginTimeoutSetup();
}
// Chain for socket connection ? Shows ui
function socketConnect(socket, loginTimeout) {
  $("title").text("TS Struggle - Connected");
  toggleNotification(true, "loader", "Connected", 1000);
  clearTimeout(loginTimeout);
  $("body").children().css("opacity", "1");
  otherEvents(socket);
  socket.emit("initialise");
}
// Chain for socket disconnection ? Hides ui
function socketDisconnect(socket) {
  $("title").text("TS Struggle - Disconnected");
  toggleNotification(true, "loader", "Disconnected, reconnecting...");
  $("body").children().css("opacity", "0");
  $("#notification_container").css("opacity", "1");
  otherEvents(socket);
  socket.connect();
}
// Chain for socket update ? updates ui elements
function socketUpdate(socket, data) {
  coinEvents(socket, JSON.parse(JSON.stringify(data)), true);
  $("body").css("opacity", "1");
  updateUserInfo(socket, JSON.parse(JSON.stringify(data)));
  updateVillages(socket, JSON.parse(JSON.stringify(data.villages)));
  updateMoney(socket, JSON.parse(JSON.stringify(data)));
  updateUnits(socket, JSON.parse(JSON.stringify(data)));
  updateStats(socket, JSON.parse(JSON.stringify(data)));
  updateRaidResults(socket, JSON.parse(JSON.stringify(data)));
  updateTimes(JSON.parse(JSON.stringify(data)));
  var type = $("#manage_layout_title").text().toLowerCase();
  if(type == "offense") {
    updateLayout(socket, JSON.parse(JSON.stringify(data)), "offense");
  } else {
    updateLayout(socket, JSON.parse(JSON.stringify(data)), "defence");
  }
  for(var i in updateInterval) {
    clearInterval(updateInterval[i]);
    updateInterval.splice(i);
  }
  var interval = setInterval(function() {
    socket.emit("addMoney", JSON.stringify({money: currMoney}));
  }, 1000 * 60)
  updateInterval.push(interval);
}
