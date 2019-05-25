exports = module.exports = function(app, botSync, next) {
      // Libraries

      // Custom libraries
  var tools = require("../../utility_lib/tools"),
      // Data/Config
      allGroups = require("../../config/groups.json"),
      syncConfig = require("../../config/botsync.json"),
      socketConfig = require("../../config/socket.json"),
      botsyncConfig = require("../../config/botsync.json"),
      botID = botsyncConfig.main.botLogin.botId,
      // DB models
      Users = require("../../models/users");
  tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/bot/login", "POST", {"Content-Type": "application/json"}, JSON.stringify(botsyncConfig.main.botLogin), function(authData) {
    try {
      var token = JSON.parse(authData).token;
    } catch(err) {
      tools.log("socketIO", err, socketConfig.main, null, true, "BotSync");
    }
    tools.log("socketIO", "\x1b[92mBot authorisation successful!", socketConfig.main, null, false, "BotSync");

    // Socket.io setup
    botSync.on("connection", function(socket) {
      var user = socket.client.request.user; // Get user object
      if(!user.username) user.username = "Anonymous";
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSocket connected.", socketConfig.main, {socket: socket});
      socket.on("disconnect", function(cause) {
        tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mSocket dropped connection, cause: " + cause + ".", socketConfig.main, {socket: socket});
      });
      socket.on("getUpdate", function() {
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/bot/instances", "GET", {"Content-Type": "application/json", "Authorization": "bearer " + token}, "", function(data) {
          try {
            var data = JSON.parse(data);
          } catch(err) {
            tools.log("socketIO", err, socketConfig.main, null, true, "BotSync");
            socket.emit("parseError");
            return;
          }
          var instances = [];
          for(var i in data) {
            if(data[i].name.includes("Music")) {
              instances.push(data[i]);
            }
          }
          instances.sort(function(a, b) {
            var textA = a.nick.toUpperCase(),
                textB = b.nick.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
          });
          socket.emit("update", instances);
        });
      });
      socket.on("getInstanceUpdate", function(data) {
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        var uuid = socket.rooms[Object.keys(socket.rooms)[0]],
            playerOffset = (!data) ? 0 : data.playerOffset;
            type = (!data) ? 0 : data.type;
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+uuid+"/event/getInstanceUpdate", "POST", {"Content-Type": "application/json"}, JSON.stringify({password: botsyncConfig.main.botConnect.password}), function(data) {
          socket.emit("instanceUpdate", {instanceData: data, playerOffset: playerOffset, type: type});
        });
      });
      socket.on("selectInstance", function(data) {
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        for(var i in socket.rooms) {
          socket.leave(socket.rooms[i]);
        }
        socket.join(data.uuid);
        socket.emit("instanceUpdatePending", {type: "instanceSelect"});
      });
      socket.on("togglePower", function(data) {
        if(!tools.authenticator(user, 70)) { // Authorization
          socket.emit("unauthorised", {route: "togglePower", required: "moderator"});
          return;
        }
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+data.uuid+"/event/togglePower", "POST", {"Content-Type": "application/json"}, JSON.stringify({password: botsyncConfig.main.botConnect.password}), function(data) {

        });
      });
      socket.on("toggleTrack", function(data) {
        if(!tools.authenticator(user, 10)) { // Authorization
          socket.emit("unauthorised", {route: "togglePower", required: "regular"});
          return;
        }
        var uuid = socket.rooms[Object.keys(socket.rooms)[0]];
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+uuid+"/event/toggleTrack", "POST", {"Content-Type": "application/json"}, JSON.stringify({password: botsyncConfig.main.botConnect.password}), function(data) {

        });
      });
      socket.on("seek", function(data) {
        if(!tools.authenticator(user, 10)) { // Authorization
          socket.emit("unauthorised", {route: "togglePower", required: "regular"});
          return;
        }
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        var uuid = socket.rooms[Object.keys(socket.rooms)[0]];
        if(!data.ms) return;
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+uuid+"/event/seek", "POST", {"Content-Type": "application/json"}, JSON.stringify({ms: data.ms, password: botsyncConfig.main.botConnect.password}), function(data) {
          setTimeout(function() {
            botSync.in(uuid).emit("instanceUpdatePending", {type: "seekUpdate"});
          }, 1000)
        });
      });
      socket.on("volumeChange", function(data) {
        if(!tools.authenticator(user, 10)) { // Authorization
          socket.emit("unauthorised", {route: "volumeChange", required: "regular"});
          return;
        }
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        var uuid = socket.rooms[Object.keys(socket.rooms)[0]];
        if(!data.vol) return;
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+uuid+"/event/volumeChange", "POST", {"Content-Type": "application/json"}, JSON.stringify({vol: data.vol, password: botsyncConfig.main.botConnect.password}), function(data) {
          setTimeout(function() {
            botSync.in(uuid).emit("instanceUpdatePending", {type: "volumeChange"});
          }, 1000)
        });
      });
      socket.on("submitURL", function(data) {
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        var uuid = socket.rooms[Object.keys(socket.rooms)[0]],
            errors = [];
        data.username = user.username;
        // Data Validation
        if(typeof data.type != "string") {
          errors.push({error: "typeIsInvalid", message: "Type is invalid.", fields: ["url"]});
        } if(data.type != "play" && data.type != "queue") {
          errors.push({error: "typeIsInvalid", message: "Type is invalid.", fields: ["url"]});
        }
        if(typeof data.url != "string") {
          errors.push({error: "urlIsInvalid", message: "URL is invalid.", fields: ["url"]});
        }
        if(data.type == "play") {
          if(!tools.authenticator(user, 10)) { // Authorization
            socket.emit("unauthorised", {route: "submitURLPlay", required: "regular"});
            return;
          }
        }
        if(errors.length != 0) return {message: "invalidDetails", errors: errors};
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+uuid+"/event/submitURL", "POST", {"Content-Type": "application/json"}, JSON.stringify({data: data, password: botsyncConfig.main.botConnect.password}), function(data) {

        });
      });
      socket.on("skip", function(data) {
        try {
          data = JSON.parse(data);
        } catch(err) {
          return;
        }
        var uuid = socket.rooms[Object.keys(socket.rooms)[0]],
            errors = [];
        data.username = user.username;
        // Data Validation
        if(typeof data.type != "string") {
          errors.push({error: "typeIsInvalid", message: "Type is invalid.", fields: ["url"]});
        } if(data.type != "force") {
          errors.push({error: "typeIsInvalid", message: "Type is invalid.", fields: ["url"]});
        }
        if(data.type == "force") {
          if(!tools.authenticator(user, 10)) { // Authorization
            socket.emit("unauthorised", {route: "skipForce", required: "moderator"});
            return;
          }
        }
        if(errors.length != 0) return {message: "invalidDetails", errors: errors};
        tools.HTTPRequest(botsyncConfig.main.botConnect.address, botsyncConfig.main.botConnect.port, "/api/v1/b/"+botID+"/i/"+uuid+"/event/skip", "POST", {"Content-Type": "application/json"}, JSON.stringify({data: data, password: botsyncConfig.main.botConnect.password}), function(data) {

        });
      });
    });

    // Error handler
    function errorHandler(socket, err) {
      //socket.emit("error", err.code.toString());
      //errorHandler(socket, {code: 500, full: err});
      if(err.code == 500) tools.log("socketIO", err.full, socketConfig.main, {socket: socket}, true);
    }
  });
}
