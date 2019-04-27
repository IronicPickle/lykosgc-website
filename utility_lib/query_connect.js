module.exports = {
  queryConnect: function(socket, ts3Query, ts3QueryDetails, callback) {
    var tools = require("../utility_lib/tools"),
        socketConfig = require("../config/socket.json"),
        ts3;
    if(!ts3) { // Checks if server query if connected.
      tools.log("socketIO", "\x1b[92mConnecting to server query.", socketConfig.main, {socket: socket});
      ts3 = new ts3Query(ts3QueryDetails);

      ts3.on("ready", function(data) {
        callback(ts3);
      });
      ts3.on("error", function(err) {
        if(err.message == "nickname is already in use") {
          tools.log("socketIO", "\x1b[91mServer Query already logged in, reusing session.", socketConfig.main, {socket: socket});
          callback(ts3);
        } else {
          tools.log("socketIO", err, socketConfig.main, {socket: socket});
        }
      });
      ts3.on("close", function(data) {
        tools.log("socketIO", "\x1b[91mServer Query connection closed, cause: " + data + ".", socketConfig.main, {socket: socket});
      });
    }
  }
}
