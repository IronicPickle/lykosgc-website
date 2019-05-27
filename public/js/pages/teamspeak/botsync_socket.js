// Initializes socket setup
function socketSetup(socket, _csrf) {
  socketConnecting(socket);
  socket.on("connect", function() {
    socketConnect(socket);
    socket.emit("getUpdate");
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
  socket.on("error", function(data) {
    toggleNotification(true, "alert", "Unexpected error", 5000);
  });
  socket.on("parseError", function(data) {
    toggleNotification(true, "alert", "Botsync is unavailable right now, please try again later.");
    toggleUI(false);
  });
  socket.on("unauthorised", function(data) {
    toggleNotification(true, "alert", "You must be a " + data.required + " to do that.", 2000);
  });
  socket.on("updatePending", function(data) {
    socket.emit("getUpdate");
  });
  socket.on("update", function(data) {
    constructInstanceList(socket, data);
    selectInstance(socket, data[0].uuid);
    toggleNotification(false);
  });
  socket.on("instanceUpdatePending", function(data) {
    socket.emit("getInstanceUpdate", JSON.stringify({playerOffset: 1500, type: data.type, sent: new Date()}));
  });
  socket.on("instanceUpdate", function(data) {
    try {
      var instanceData = JSON.parse(data.instanceData)[0];
    } catch(err) {
      return;
    }
    instanceData.playerOffset = data.playerOffset;
    instanceData.type = data.type;
    var ping = (new Date() - new Date(data.sent)) / 2;
    instanceData.sent = new Date(data.sent) - ping;
    for(var i in seekBarIntervals) {
      clearInterval(seekBarIntervals[i]);
    }
    constructInstance(socket, instanceData);
  });
}
// Chain for socket connecting
function socketConnecting(socket) {
  toggleNotification(true, "loader", "Connecting...");
  $("title").text("TS Bot Sync - Connecting...");
}
// Chain for socket connection ? Shows ui
function socketConnect(socket, loginTimeout) {
  $("title").text("TS Bot Sync - Connected");
  toggleNotification(true, "loader", "Connected", 1000);
}
// Chain for socket disconnection ? Hides ui
function socketDisconnect(socket) {
  $("title").text("TS Bot Sync - Disconnected");
  toggleNotification(true, "loader", "Disconnected, reconnecting...");
  socket.connect();
}
