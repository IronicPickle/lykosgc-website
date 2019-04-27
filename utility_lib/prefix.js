// Console logging prefix
module.exports = {
  time: function() {
    return "\x1b[93m|"+new Date().toLocaleTimeString()+"|: \x1b[37m";
  },
  error: function() {
    return "\x1b[91mError:\x1b[0m ";
  },
  server: function() {
    return "\x1b[33m[Server] ";
  },
  router: function() {
    return "\x1b[36m[Router] ";
  },
  socketIO: function() {
    return "\x1b[96m[Socket.IO] ";
  }
}
