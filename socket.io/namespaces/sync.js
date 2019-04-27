exports = module.exports = function(app, sinusbot, next) {
      // Libraries
  var ts3Query = require("ts3-nodejs-library"),
      // Custom libraries
      tools = require("../../utility_lib/tools"),
      queryConnect = require("../../utility_lib/query_connect.js"),
      // Data/Config
      allGroups = require("../../config/groups.json"),
      serverQueryConfig = require("../../config/serverQuery.json"),
      ts3QueryDetails = JSON.parse(JSON.stringify(serverQueryConfig.details).replace("$_name", "Account Sync")),
      syncConfig = require("../../config/sync.json"),
      socketConfig = require("../../config/socket.json"),
      // DB models
      Users = require("../../models/users");

  // Socket.io setup
  sinusbot.on("connection", function(socket) {
    var user = socket.client.request.user, // Get user object
        botID,
        token,
        botUUID;
    socket.custom = {};
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSocket connected.", socketConfig.main, {socket: socket});
    socket.on("disconnect", function(cause) {
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mSocket dropped connection, cause: " + cause + ".", socketConfig.main, {socket: socket});
      for(var i in socket.custom.cooldownTimeout) {
        clearTimeout(socket.custom.cooldownTimeout[i]);
      }
      for(var i in socket.custom.counterInterval) {
        clearInterval(socket.custom.counterInterval[i]);
      }
      for(var i in socket.custom.failTimeout) {
        clearTimeout(socket.custom.failTimeout[i]);
      }
      if(cause != "server namespace disconnect") {
        if(socket.custom.inProgress) {
          tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mSync failed: socket disconnected.", socketConfig.main, {socket: socket});
          removeTempRank(socket, function() {
            socket.ts3.logout();

            Users.updateOne({_id: user._id}, {syncStage: 0}).exec().then(function() { // Reset sync stage in case of error
              socket.custom.inProgress = false;
            }).catch(function(err) {
              return;
            });
          });
        }
      } else {
        socket.ts3.logout();
      }
    });
    socket.on("initialise", function(data) {
      socket.emit("initialise", {syncStage: user.syncStage});
    });
    socket.on("start", function(data) {
      if(socket.custom.inProgress) {
        tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mSync failed: duplicate sync attempt.", socketConfig.main, {socket: socket});
        return;
      }
      socket.custom.inProgress = true;
      if(!socket.custom.cooldownTimeout) {
        socket.custom.cooldownTimeout = [];
      } if(!socket.custom.counterInterval) {
        socket.custom.counterInterval = [];
      } if(!socket.custom.failTimeout) {
        socket.custom.failTimeout = [];
      }
      queryConnect.queryConnect(socket, ts3Query, ts3QueryDetails, function(ts3) {
        socket.ts3 = ts3;
        startChain(socket);
      });
    });
  });

  // Error handler
  function errorHandler(socket, err) {
    //socket.emit("error", err.code.toString());
    if(err.code == 500) tools.log("socketIO", err.full, socketConfig.main, {socket: socket}, true);
  }

  // Starts account sync chain
  function startChain(socket) {
    var user = socket.client.request.user; // Get user object
    if(user.tsUUID) { // Remove current ranks if account is already synced
      removeRanks(socket, function() {
        createTempRank(socket);
      });
    } else {
      createTempRank(socket, null);
    }
  }
  // Removes user's current synced teamspeak ranks.
  function removeRanks(socket, callback) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mRemoving previous ranks.", socketConfig.main, {socket: socket});
    var groups = user.groups; // Get user's groups
    var called = false;
    var i = 0;
    while(i < groups.length) {
      for(var ii in allGroups) {
        if(groups[i] == allGroups[ii].name) {
          var groupID = allGroups[ii].TsSGID;
          queryServerGroupDelClient(socket.ts3, user.tsCLDBID, groupID, function() {
            if(!called && i == groups.length) {
              called = true;
              callback();
            }
          });
        }
      }
      i++
    }
  }
  // Creates a temporary pending rank.
  function createTempRank(socket) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mCreating pending rank.", socketConfig.main, {socket: socket});
    var hash = tools.randomString(16, "aA19"); // Create temporary rank name/hash
    var rankName = "pending_" + hash;
    queryServerGroupCopy(socket.ts3, syncConfig.main.templateGroup, rankName, function(sgid) {
      queryPrivilegeKeyAdd(socket.ts3, sgid, function(token) {
        socket.custom.tempSGID = sgid;
        socket.custom.tempToken = token;
        Users.updateOne({_id: user._id}, {syncRankID: sgid, privKey: token, syncStage: 1}).exec().then(function() { // Store token, key and stage
          socket.emit("start", {privKey: token, syncStage: 1, maxAttempt: syncConfig.main.attempts, time: syncConfig.main.grace}); // Emit stage 1 - Waiting
          beginCooldown(socket); // Begin cooldown ~ 10secs
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      });
    });
  }
  // Starts grace period before sync attempts occur.
  function beginCooldown(socket) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSync grace period started.", socketConfig.main, {socket: socket});
    // Start cooldown
    var cooldownTimeout = setTimeout(function() {
      // Begin account sync
      beginSync(socket);
    }, syncConfig.main.grace * 1000);
    socket.custom.cooldownTimeout.push(cooldownTimeout);
  }
  // Begins sync attempts.
  function beginSync(socket) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSync started.", socketConfig.main, {socket: socket});
    var attempt = 1;

    Users.updateOne({_id: user._id}, {syncStage: 2}).exec().then(function() { // Store sync stage
      var counterInterval = setInterval(function() { // Continous stage 2 emits as attempts
        attempt = attempt + 1; // Increase attempt
        attemptSync(socket, attempt);
      }, syncConfig.main.wait * 1000);
      socket.custom.counterInterval.push(counterInterval);
      var failTimeout = syncFailCatch(socket);
      socket.custom.failTimeout.push(failTimeout);
      attemptSync(socket, attempt); // Initial sync attempt
    }).catch(function(err) {
      errorHandler(socket, {code: 500, full: err});
    });
  }
  // Failure catch incase user's account isn't synced.
  function syncFailCatch(socket) {
    var user = socket.client.request.user; // Get user object
    return setTimeout(function() {
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mSync failed: key not used.", socketConfig.main, {socket: socket});
      removeTempRank(socket, function() {
        socket.ts3.logout();

        Users.updateOne({_id: user._id}, {syncStage: 0}).exec().then(function() { // Store sync stage
          socket.custom.inProgress = false;
          socket.emit("start", {syncStage: 0}); // Emit stage 0 - Unsynced
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      });
    }, ((syncConfig.main.wait * 1000) * (syncConfig.main.attempts - 1)) + 500);
  }
  // Attempts to perform a sync.
  function attemptSync(socket, attempt) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSync attempt: "+attempt+".", socketConfig.main, {socket: socket});
    checkPendingRank(socket, function(tsUUID, tsCLDBID) {
      syncSuccess(socket, tsUUID, tsCLDBID);
    });
    socket.emit("start", {syncStage: 2, attempt: attempt, maxAttempt: syncConfig.main.attempts, time: syncConfig.main.wait});
  }
  // Checks if user has claimed the temporary pending rank.
  function checkPendingRank(socket, callback) {
    var sgid = socket.custom.tempSGID;
    queryServerGroupClientList(socket.ts3, sgid, function(data) {
      if(data) {
        var tsUUID = data.client_unique_identifier;
        var tsCLDBID = data.cldbid;
        addRanks(socket, tsUUID, function() {
          callback(tsUUID, tsCLDBID);
        });
      }
    });
  }
  // Assigns user's website ranks to their now linked teamspeak account.
  function addRanks(socket, tsUUID, callback) {
    var user = socket.client.request.user; // Get user object
    queryGetClient(socket.ts3, tsUUID, function(ts3Client) {
      var groups = user.groups; // Get users groups
      var called = false;
      var i = 0;
      while(i < groups.length) {
        for(var ii in allGroups) {
          if(groups[i] == allGroups[ii].name) {
            var groupID = allGroups[ii].TsSGID;
            queryServerGroupAddClient(socket.ts3, groupID, user.tsCLDBID, function() {
              if(!called && i == groups.length) {
                called = true
                callback();
              }
            });
          }
        }
        i++
      }
    });
  }
  // Performs cleanup once sync is complete.
  function syncSuccess(socket, tsUUID, tsCLDBID) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSync successful.", socketConfig.main, {socket: socket});
    for(var i in socket.custom.counterInterval) {
      clearInterval(socket.custom.counterInterval[i]);
    }
    for(var i in socket.custom.failTimeout) {
      clearTimeout(socket.custom.failTimeout[i]);
    }
    removeTempRank(socket, function() {
      socket.ts3.logout();

      Users.updateOne({_id: user._id}, {syncStage: 3, tsUUID: tsUUID, tsCLDBID: tsCLDBID}).exec().then(function() { // Store sync stage
        socket.emit("start", {syncStage: 3}); // Emit stage 3 - Synced
        socket.disconnect();
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
  }
  // Removes temporary tank and privilege key
  function removeTempRank(socket, callback) {
    var sgid = socket.custom.tempSGID;
    var token = socket.custom.tempToken;
    for(var i in socket.custom.counterInterval) {
      clearInterval(socket.custom.counterInterval[i]); // Clears counter
    }
    queryServerGroupDel(socket.ts3, sgid, function() {
      queryPrivilegeKeyDel(socket.ts3, token, function() {
        callback();
      })
    });
  }

  // --- Server query commands ---
  // Gets client object using uuid.
  function queryGetClient(ts3, uuid, callback) {
    ts3.getClientByUID(uuid).then(function(ts3Client) {
      callback(ts3Client);
    }).catch(function(err) {

    });
  }
  // Removes a server group from a user using a client object.
  function queryServerGroupDelClient(ts3, cldbid, sgid, callback) {
    ts3.serverGroupDelClient(cldbid, sgid).then(function() {
      callback();
    })
    .catch(function(err) {
      if(err.message == "empty result set") {
        callback();
      } else {

      }
    });
  }
  // Copies a server group using a template rank.
  function queryServerGroupCopy(ts3, sgid, rankName, callback) {
    ts3.serverGroupCopy(sgid, 0, 1, rankName).then(function(data) {
      callback(data.sgid);
    })
    .catch(function(err) {

    });
  }
  // Adds a privlege key for a server group.
  function queryPrivilegeKeyAdd(ts3, sgid, callback) {
    ts3.privilegeKeyAdd(0, sgid).then(function(data) {
      callback(data.token);
    })
    .catch(function(err) {

    });
  }
  // Removes a server group.
  function queryServerGroupDel(ts3, sgid, callback) {
    ts3.serverGroupDel(sgid, 1).then(function() {
      callback();
    }).catch(function(err) {

    });
  }
  // Removes a privlege key for a server group.
  function queryPrivilegeKeyDel(ts3, token, callback) {
    ts3.privilegeKeyDelete(token).then(function(data) {
      callback();
    })
    .catch(function(err) {

    });
  }
  // Gets a list of clients that are in a server group.
  function queryServerGroupClientList(ts3, sgid, callback) {
    ts3.serverGroupClientList(sgid, 1).then(function(data) {
      callback(data);
    }).catch(function(err) {

    });
  }
  // Adds a client to a server group using a client object.
  function queryServerGroupAddClient(ts3, sgid, cldbid, callback) {
    ts3.serverGroupAddClient(cldbid, sgid).then(function() {
      callback();
    }).catch(function(err) {
      callback();

    });
  }
}
