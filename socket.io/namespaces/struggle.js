exports = module.exports = function(app, io, next) {
      // Libraries
  var ts3Query = require("ts3-nodejs-library"),
      http = require("http"),
      readline = require("readline"),
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });
      // Custom Libraries
      tools = require("../../utility_lib/tools"),
      struggle_tools = require("../../utility_lib/struggle_tools"),
      cooldown = require("../../utility_lib/cooldown"),
      queryConnect = require("../../utility_lib/query_connect.js"),
      // Data/Config
      unitsJSON = require("../../config/struggle/units.json"),
      attackPattern = require("../../config/struggle/attackPattern.json"),
      struggleConfig = require("../../config/struggle/struggle.json"),
      socketConfig = require("../../config/socket.json"),
      serverQueryConfig = require("../../config/serverQuery.json"),
      ts3QueryDetails = JSON.parse(JSON.stringify(serverQueryConfig.details).replace("$_name", "TS Struggle")),
      // DB models
      Users = require("../../models/users"),
      Struggle = require("../../models/struggle"),
      StruggleRaid = require("../../models/struggle_raid");

  // Socket.io setup
  io.on("connection", function(socket) {
    var user = socket.client.request.user; // Get user object
    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mSocket connected.", socketConfig.main, {socket: socket});
    Struggle.findOne({userID: user._id.toString()}, "").exec().then(function(struggle) {
      if(struggle == null) { // DB output check ? Checks if user has a profile
        return;
      }
      var timePassed = (new Date().getTime() - new Date(struggle.lastVisit).getTime())/1000;
      var workers = struggle.workers,
          totalCPS = 0;
      for(var i in workers) {
        totalCPS = totalCPS + (unitsJSON[i].cps * workers[i].amount);
      }
      var moneyEarned = totalCPS * timePassed,
          newMoney = struggle.money + moneyEarned;
      Struggle.updateOne({userID: user._id.toString()}, {$set:{money: newMoney}}).exec().then(function() {
        socket.emit("notification", {msg: "moneyEarned", type: "alert", message: "You have earned "+coinFormatter(Math.floor(moneyEarned))+" since you last played.", time: 5000});
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    }).catch(function(err) {
      errorHandler(socket, {code: 500, full: err});
    });
    socket.on("disconnect", function(cause) {
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mSocket dropped connection, cause: " + cause + ".", socketConfig.main, {socket: socket});
      Struggle.updateOne({userID: user._id.toString()}, {$set:{lastVisit: new Date()}}).exec().then(function() {
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("detailsEdit", function(profileData) {
      try {
        profileData = JSON.parse(profileData);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }

      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mUpdating user's details, updating to: Village Name: "+profileData.villageName+".", socketConfig.main, {socket: socket});
      // Input Validation
      var errors = [];
      // Village Name Validation
      if(!profileData.villageName) {
        errors.push({error: "displayNameIsEmpty", message: "Village Name is required.", fields: ["villageName"]});
      } else if(profileData.villageName.length < 6 || profileData.villageName.length > 16) {
        errors.push({error: "displayNameInvalidLength", message: "Village Name must be between 6 and 16 characters.", fields: ["villageName"]});
      }

      if(errors.length != 0) {
        socket.emit("detailsError", errors);
        return;
      }
      var newDetails = {
        villageName: profileData.villageName
      }
      Struggle.updateOne({userID: user._id.toString()}, {$set: newDetails}).exec().then(function() {
        Struggle.findOne({userID: user._id.toString()}).exec().then(function(struggle) {
          var lines = [
            "🏠 " + struggle.villageName,
            "🙍‍ " + user.username
          ]
          updateTSClient(socket, struggle.tsSGID, user.tsCLDBID, lines, function() {
            socket.emit("detailsSuccess");
            for(var i in io.connected) {
              io.connected[i].emit("updatePending");
            }
          });
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("initialise", function() {
      if(user.syncStage != 3) {
        tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mUser has not synced.", socketConfig.main, {socket: socket});
        socket.emit("notSynced");
        return;
      }
      Struggle.findOne({userID: user._id}, "money workers soldiers").exec().then(function(struggle) {
        if (struggle == null) { // Check if user has played before
          tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mNew user, creating profile.", socketConfig.main, {socket: socket});
          var newProfile = new Struggle();
          newProfile.userID = user._id;
          for(var i in unitsJSON) {
            if(unitsJSON[i].type == "worker") {
              newProfile.workers[i] = {
                amount: 0,
                assigned: 0
              }
            } if(unitsJSON[i].type == "soldier") {
              newProfile.soldiers[i] = {
                amount: 0,
                assigned: 0
              }
            }
          }
          newProfile.unitLayout = {
            defence: [],
            offense: []
          }
          newProfile.graceEnd = cooldown.generate(struggleConfig.default.grace*60*60);
          queryConnect.queryConnect(socket, ts3Query, ts3QueryDetails, function(ts3) {
            socket.ts3 = ts3;
            queryServerGroupCopy(socket.ts3, struggleConfig.main.templateGroup, "🙍 " + user.username, function(sgid) {
              if(!sgid) sgid = 0; else newProfile.tsSGID = sgid;
              queryServerGroupAddClient(socket.ts3, sgid, user.tsCLDBID, function() {
                var newLine = "                              ";
                queryDescriptionChange(socket.ts3, user.tsCLDBID, {
                  client_description: "🏠 New Village" + newLine+
                  "🙍‍ " + user.username + newLine+newLine
                }, function() {
                  ts3.logout();
                  newProfile.save().then(function() {
                    tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mProfile created.", socketConfig.main, {socket: socket});
                    socket.emit("firstTime");
                    for(var i in io.connected) {
                      io.connected[i].emit("updatePending");
                    }
                  }).catch(function(err) {
                    return next({code: 500, full: err});
                  });
                });
              });
            });
          });
        } else {
          socket.emit("updatePending");
        }
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("getData", function(data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mClient data request.", socketConfig.main, {socket: socket});
      Struggle.findOne({userID: user._id}, "").lean().exec().then(function(struggle) {
        if(struggle == null) {
          socket.updating = false;
          return;
        }
        Struggle.find({userID:{$ne:user._id}}, "userID villageName displayName money").lean().sort({"money": -1}).exec().then(function(villages) {
          var usersArray = [];
          for(var i in villages) {
            usersArray[i] = villages[i].userID;
          }
          Users.find({_id: {$in:usersArray}}, "username").exec().then(function(users) {
            for(var i in villages) {
              for(var ii in users) {
                if(villages[i].userID == users[ii]._id) {
                  villages[i].username = users[ii].username;
                }
              }
            }
            StruggleRaid.findOne({"offense.userID": user._id.toString(), status: "ongoing"}, "").exec().then(function(currentRaid) {
              var stats = struggle_tools.calcStats(unitsJSON, JSON.parse(JSON.stringify(struggle)), JSON.parse(JSON.stringify(struggle)), currentRaid, false);
              var raidSpeed = struggle_tools.calcSpeed(stats.charStats.offense.soldiers);
              if(struggleConfig.raid.speedOverride) raidSpeed = struggleConfig.raid.speedOverride;
              var viewed = {$ne: user._id.toString()};
              if(data.allRaids) viewed = user._id.toString();
              StruggleRaid.find(
                {viewed: viewed, status: "complete", $or: [{"offense.userID": user._id.toString()}, {"defence.userID": user._id.toString()}]}, "").sort({raidEnd: -1}).lean().exec().then(function(struggleRaid) {
                var userArray = [];
                for(var i in struggleRaid) {
                  userArray.push(struggleRaid[i].offense.userID);
                  userArray.push(struggleRaid[i].defence.userID);
                  if(struggleRaid[i].offense.userID.toString() == user._id.toString()) {
                    struggleRaid[i].side = "offense";
                  } else {
                    struggleRaid[i].side = "defence";
                  }
                }
                Users.find({_id: {$in: userArray}}, "username").exec().then(function(users) {
                  for(var i in struggleRaid) {
                    for(var ii in users) {
                      if(struggleRaid[i].offense.userID.toString() == users[ii]._id) {
                        struggleRaid[i].offense.username = users[ii].username;
                      } if(struggleRaid[i].defence.userID.toString() == users[ii]._id) {
                        struggleRaid[i].defence.username = users[ii].username;
                      }
                    }
                  }
                  if(struggleRaid.length > 0) {
                    for(var i in struggleRaid) {
                      StruggleRaid.updateMany(
                        {viewed: {$ne: user._id.toString()}, status: "complete", $or: [{"offense.userID": user._id.toString()}, {"defence.userID": user._id.toString()}]}, {$push: {viewed: user._id.toString()}}).exec().then(function() {
                      }).catch(function(err) {
                        errorHandler(socket, {code: 500, full: err});
                      });
                    }
                  }
                  StruggleRaid.findOne({targetVillageID: struggle._id, status: "ongoing"}, "raidStart raidEnd").exec().then(function(incommingRaid) {
                    socket.emit("update", {struggle: struggle, villages: villages, units: unitsJSON, stats: stats, results: struggleRaid, currentRaid: currentRaid, incommingRaid: incommingRaid, raidSpeed: raidSpeed});
                  }).catch(function(err) {
                    errorHandler(socket, {code: 500, full: err});
                  });
                }).catch(function(err) {
                  errorHandler(socket, {code: 500, full: err});
                });
              }).catch(function(err) {
                errorHandler(socket, {code: 500, full: err});
              });
            }).catch(function(err) {
              errorHandler(socket, {code: 500, full: err});
            });
          }).catch(function(err) {
            errorHandler(socket, {code: 500, full: err});
          });
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("updated", function() {
      socket.updating = false;
    });
    socket.on("clearGrace", function() {
      Struggle.updateOne({userID: user._id.toString()}, {$set: {graceEnd: new Date()}}).exec().then(function() {
        for(var i in io.connected) {
          var connectedUser = io.connected[i].client.request.user;
          if(connectedUser._id.toString() == user._id.toString()) {
            io.connected[i].emit("updatePending");
          }
        }
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("addMoney", function(data) {
      if(socket.updating) return;
      socket.updating = true;
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mUpdating user's money, updating to: "+data.money+".", socketConfig.main, {socket: socket});
      Struggle.updateOne({userID: user._id}, data).exec().then(function() {

      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("buyUnit", function(data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }
      tools.log("socketIO", "\x1b[97m"+user.username+" -  \x1b[92mUpdating user's units, user buying: "+data.amount+" "+data.name+"(s)", socketConfig.main, {socket: socket});
      Struggle.findOne({userID: user._id}, "money workers soldiers").lean().exec().then(function(struggle) {
        var usersUnits = Object.assign({}, struggle.workers, struggle.soldiers);
        var baseUnitCost = unitsJSON[data.name].cost;
        var unitCost = 0;
        if(unitsJSON[data.name].type == "worker") {
          var unitAmount = usersUnits[data.name].amount;
          for(var i = 0; i < data.amount; i++) {
            unitCost = unitCost + (baseUnitCost*(Math.pow(1.1, (unitAmount+i))));
          } if(unitCost == 0) {
            unitCost = (baseUnitCost*(Math.pow(1.1, (unitAmount))));
          }
        } else {
          unitCost = baseUnitCost * data.amount;
          if(unitCost == 0) {
            unitCost = baseUnitCost;
          }
        }
        struggle.money = struggle.money - unitCost;
        if(struggle.money < 0) {
          socket.updating = false;
          return;
        }
        var unitType = unitsJSON[data.name].type;
        if(unitType == "worker") {
          struggle.workers[data.name].amount = struggle.workers[data.name].amount + data.amount;
        } else if(unitType == "soldier") {
          struggle.soldiers[data.name].amount = struggle.soldiers[data.name].amount + data.amount;
        }

        Struggle.updateOne({userID: user._id}, {$set: struggle}).exec().then(function() {
          for(var i in io.connected) {
            var connectedUser = io.connected[i].client.request.user;
            if(connectedUser._id.toString() == user._id.toString()) {
              io.connected[i].emit("updatePending");
            }
          }
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("updateUnits", function(data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mUpdating user's units, changing layout.", socketConfig.main, {socket: socket});
      Struggle.findOne({userID: user._id}, "unitLayout").lean().exec().then(function(struggle) {
        var length = struggle.unitLayout[data.type].length;
        var index = struggle.unitLayout[data.type].indexOf(data.name);
        if(index == -1) {
          if(length >= 4) {
            struggle.unitLayout[data.type].splice(0, 1);
          }
        } else {
          struggle.unitLayout[data.type].splice(index, 1);
        }
        struggle.unitLayout[data.type].splice(length, 0, data.name);



        Struggle.updateOne({userID: user._id}, struggle).exec().then(function() {
          for(var i in io.connected) {
            var connectedUser = io.connected[i].client.request.user;
            if(connectedUser._id.toString() == user._id.toString()) {
              io.connected[i].emit("updatePending");
            }
          }
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("clearUnits", function(data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mUpdating user's units, clearing layout.", socketConfig.main, {socket: socket});
      Struggle.findOne({userID: user._id}, "unitLayout").lean().exec().then(function(struggle) {
        struggle.unitLayout[data.type] = [];
        Struggle.updateOne({userID: user._id}, struggle).exec().then(function() {
          for(var i in io.connected) {
            var connectedUser = io.connected[i].client.request.user;
            if(connectedUser._id.toString() == user._id.toString()) {
              io.connected[i].emit("updatePending");
            }
          }
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("updateAssign", function(data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }
      tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mUpdating user's units, changing assigned units.", socketConfig.main, {socket: socket});
      Struggle.findOne({userID: user._id}, "").lean().exec().then(function(struggle) {
        if(struggle == null) { // DB output check
          return;
        }
        StruggleRaid.findOne(
          {status: "ongoing", "offense.userID": user._id.toString()}, "").exec().then(function(struggleRaid) {
          for(var i in struggle.soldiers) {
            var away = 0;
            if(data.unit == i) {
              var newAssigned = struggle.soldiers[i].assigned + data.change;
              if(struggleRaid) {
                var unitLayout = struggleRaid.offense.unitLayout.offense;
                for(var ii in unitLayout) {
                  if(i == unitLayout[ii]) {
                    away = struggleRaid.offense.soldiers[i].assigned;
                  }
                }
              }
              if(newAssigned < 0 || newAssigned > (struggle.soldiers[i].amount - away)) {
                return;
              }
              struggle.soldiers[i].assigned = newAssigned;
              Struggle.updateOne({userID: user._id}, {$set: struggle}).exec().then(function() {
                for(var i in io.connected) {
                  var connectedUser = io.connected[i].client.request.user;
                  if(connectedUser._id.toString() == user._id.toString()) {
                    io.connected[i].emit("updatePending");
                  }
                }
              }).catch(function(err) {
                errorHandler(socket, {code: 500, full: err});
              });
            }
          }
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
    socket.on("startRaid", function(data) {
      try {
        data = JSON.parse(data);
      } catch(err) {
        errorHandler(socket, {code: 500, full: err});
      }

      Struggle.findOne({userID: user._id}, "").lean().exec().then(function(struggle) {
        if(struggle == null) { // DB output check ? Checks if user hase profile
          return;
        } if(struggle.unitLayout.offense.length <= 0) { // Checks if there are units in attacker's layout
          tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: no units in layout.", socketConfig.main, {socket: socket});
          socket.emit("notification", {msg: "layoutEmpty", type: "alert", message: "There are no units in your offense layout.", time: 5000});
          return;
        }
        var grace = cooldown.check(struggle.graceEnd);
        if(grace.diff > 0) { // Checks if user is in grace period
          tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: user in grace.", socketConfig.main, {socket: socket});
          socket.emit("notification", {msg: "gracePeriodActiveSelf", type: "alert", message: "You cannot attack while in a grace period. " + grace.message, time: 5000});
          return;
        }
        Struggle.findOne({_id: data._id}, "").exec().then(function(target) { // Gets target's data
          if(target == null) { // DB outpout check ? Checks if target exists
            return;
          } if(target.userID == user._id) { // Checks if target is self
            tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: cannot raid self.", socketConfig.main, {socket: socket});
            socket.emit("notification", {msg: "cannotRaidSelf", type: "alert", message: "You cannot raid yourself.", time: 5000});
            return;
          }
          var grace = cooldown.check(target.graceEnd);
          if(grace.diff > 0) { // Checks if the target is in a grace period
            tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: target in grace.", socketConfig.main, {socket: socket});
            socket.emit("notification", {msg: "gracePeriodActive", type: "alert", message: "That user is in a grace period. " + grace.message, time: 5000});
            return;
          }
          StruggleRaid.find({"offense.userID": struggle.userID, status: "ongoing"}, "").exec().then(function(raid) {
            if(raid.length > 0) { // DB output check ? Checks if user is already raiding
              tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: raid ongoing.", socketConfig.main, {socket: socket});
              socket.emit("notification", {msg: "raidOngoing", type: "alert", message: "You already have a raid ongoing.", time: 5000});
              return;
            }
            StruggleRaid.find({targetVillageID: target._id, status: "ongoing"}, "").exec().then(function(raid) {
              if(raid.length > 0) { // DB output check ? Checks if target is being raided
                tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: target being raided.", socketConfig.main, {socket: socket});
                socket.emit("notification", {msg: "raidOngoing", type: "alert", message: "That user is already being raided.", time: 5000});
                return;
              }
              var newRaid = new StruggleRaid(); // Constructs a new raid object
              newRaid.targetVillageID = data._id;
              newRaid.status = "ongoing";
              newRaid.offense = struggle;
              var stats = struggle_tools.calcStats(unitsJSON, JSON.parse(JSON.stringify(newRaid.offense)), null, null, false); // Runs offender's stats through stat calculation
              var totalAssigned = 0;
              var offenseArray = stats.charStats.offense.unitLayout.offense;
              for(var i in offenseArray) {
                totalAssigned = totalAssigned + stats.charStats.offense.soldiers[offenseArray[i]].assigned;
              }
              if(totalAssigned <= 0) { // Checks if user has atleast 1 unit assigned
                tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[91mRaid start failed: no units assigned.", socketConfig.main, {socket: socket});
                socket.emit("notification", {msg: "noUnits", type: "alert", message: "You have no units assigned!", time: 5000});
                return;
              }
              var raidSpeed = struggle_tools.calcSpeed(stats.charStats.offense.soldiers); // Calculates attacker's raid speed
              if(struggleConfig.raid.speedOverride) raidSpeed = struggleConfig.raid.speedOverride;
              newRaid.raidStart = new Date(); // Adds raid start time to raid object
              newRaid.raidEnd = new Date(new Date().getTime() + (raidSpeed*60*1000)); // Adds raid end time to raid object
              socket.emit("notification", {msg: "raidStarted", type: "loader", message: "Your units are on their way! ETA: " + raidSpeed + " mins", time: 5000});
              for(var i in io.connected) { // Sends update request to target client
                var targetUser = io.connected[i].client.request.user;
                if(targetUser._id.toString() == target.userID.toString()) {
                  io.connected[i].emit("updatePending");
                }
              }
              newRaid.save().then(function(newRaid) { // Saves raid object
                tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mCreated profile snapshot.", socketConfig.main, {socket: socket});
                for(var i in io.connected) { // Sends update request to attacker's client
                  var connectedUser = io.connected[i].client.request.user;
                  if(connectedUser._id.toString() == user._id.toString()) {
                    io.connected[i].emit("updatePending");
                  }
                }
                tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mStarting raid timer: " + raidSpeed + " minutes / " + (60 * raidSpeed) + " seconds / " + ((1000*60) * raidSpeed) + " ms", socketConfig.main, {socket: socket});
                setTimeout(function() { // Schedules raid using raid time
                  // Raid calculation starts after raid time 'travel time'
                  tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mRaid timer complete, calculating raid.", socketConfig.main, {socket: socket});
                  Struggle.findOne({_id: data._id}, "").exec().then(function(target) { // Gets target users data
                    if(target == null) { // DB output check
                      return;
                    }
                    StruggleRaid.findOne({"offense.userID": target.userID.toString(), status: "ongoing"}, "").exec().then(function(struggleRaid) { // Gets any ongoing raids the defender has started
                      StruggleRaid.updateOne({_id: newRaid._id}, {defence: target}).exec().then(function() { // Updates raid object with defence's data
                        var charStats = struggle_tools.calcStats(unitsJSON, JSON.parse(JSON.stringify(struggle)), JSON.parse(JSON.stringify(target)), struggleRaid, true).charStats; // Calculates stats for both attacker and defender
                            offense = charStats.offense.unitLayout.offense,
                            defence = charStats.defence.unitLayout.defence,
                            results = struggle_tools.calcRaid(JSON.parse(JSON.stringify(offense)), JSON.parse(JSON.stringify(attackPattern)), JSON.parse(JSON.stringify(charStats)));
                        tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mRaid results: Raid ID: "+newRaid._id+" Health: Offense("+results.totalHealth.offense+") Defence("+results.totalHealth.defence+")", socketConfig.main, {socket: socket});
                        results.newWorkers = struggle_tools.transferWorkers(JSON.parse(JSON.stringify(results))); // Calculates workers to be transferred based of winner
                        StruggleRaid.updateOne({_id: newRaid._id}, {status: "complete", results: results}).exec().then(function() {
                          Struggle.findOne({_id: data._id}, "").exec().then(function(target) {
                            if(target == null) {
                              return;
                            }
                            var struggleSoldiers = struggle_tools.subtractSoldiers(struggle.soldiers, results.lostUnits.offense); // Calculates attacker's lost soldiers
                            var targetSoldiers = struggle_tools.subtractSoldiers(target.soldiers, results.lostUnits.defence); // Calculates defender's lost soldiers
                            Struggle.findOne({_id: struggle._id}, "").exec().then(function(newStruggle) { // Gets attacker's data before raid calculation
                              if(newStruggle == null) { // DB output check
                                return;
                              }
                              var struggleLayout = struggle_tools.subtractLayout(struggle.soldiers, newStruggle.unitLayout); // Removes lost units from attacker's unit layout
                              var targetLayout = struggle_tools.subtractLayout(target.soldiers, target.unitLayout); // Removes lost units from defender's unit layout
                              Struggle.updateOne({userID: struggle.userID}, {soldiers: struggleSoldiers, workers: results.newWorkers.offense, unitLayout:  struggleLayout}).exec().then(function() { // Updates attacker's data
                                if(results.totalHealth.offense > results.totalHealth.defence) { // Checks if defender lost
                                  // Networth calculation
                                  var netWorth = target.money + 1;
                                  for(var i in target.soldiers) {
                                    var amount = target.soldiers[i].amount,
                                        cost = unitsJSON[i].cost,
                                        totalValue = amount * cost;
                                    netWorth = netWorth + totalValue;
                                  }
                                  for(var i in target.workers) {
                                    var amount = target.workers[i].amount,
                                        cost = unitsJSON[i].cost,
                                        totalValue = 0;
                                    for(var ii = 0; ii < amount; ii++) {
                                      totalValue = totalValue + (cost*(Math.pow(1.1, (ii))));
                                    }
                                    netWorth = netWorth + totalValue; // Total networth
                                  }
                                  // Grace period calculation
                                  var hour = 60*60, // 1 hour in seconds
                                      maxGrace = struggleConfig.raid.maxGrace, // Maximum grace period in hours
                                      gracePeriod = maxGrace/(Math.pow(netWorth, 0.1)) * hour; // Grace period

                                } else {
                                  gracePeriod = 0;
                                }
                                Struggle.updateOne({userID: target.userID}, {soldiers: targetSoldiers, workers: results.newWorkers.defence, unitLayout: targetLayout, graceEnd: cooldown.generate(gracePeriod)}).exec().then(function() { // Saves attacker's data
                                  tools.log("socketIO", "\x1b[97m"+user.username+" - \x1b[92mRaid complete.", socketConfig.main, {socket: socket});
                                  for(var i in io.connected) { // Sends update request to target client
                                    var targetUser = io.connected[i].client.request.user;
                                    if(targetUser._id.toString() == target.userID.toString() || targetUser._id.toString() == user._id.toString()) {
                                      io.connected[i].emit("updatePending");
                                    }
                                  }
                                }).catch(function(err) {
                                  errorHandler(socket, {code: 500, full: err});
                                });
                              }).catch(function(err) {
                                errorHandler(socket, {code: 500, full: err});
                              });
                            }).catch(function(err) {
                              errorHandler(socket, {code: 500, full: err});
                            });
                          }).catch(function(err) {
                            errorHandler(socket, {code: 500, full: err});
                          });
                        }).catch(function(err) {
                          errorHandler(socket, {code: 500, full: err});
                        });
                      }).catch(function(err) {
                        errorHandler(socket, {code: 500, full: err});
                      });
                    }).catch(function(err) {
                      errorHandler(socket, {code: 500, full: err});
                    });
                  }).catch(function(err) {
                    errorHandler(socket, {code: 500, full: err});
                  });
                  socket.emit("notification", {msg: "raidComplete", type: "loader", message: "Raid complete.", time: 5000});
                }, (1000*60) * raidSpeed);
              }).catch(function(err) {
                errorHandler(socket, {code: 500, full: err});
              });
            }).catch(function(err) {
              errorHandler(socket, {code: 500, full: err});
            });
          }).catch(function(err) {
            errorHandler(socket, {code: 500, full: err});
          });
        }).catch(function(err) {
          errorHandler(socket, {code: 500, full: err});
        });
      }).catch(function(err) {
        errorHandler(socket, {code: 500, full: err});
      });
    });
  });

  // Error handler
  function errorHandler(socket, err) {
    //socket.emit("error", err.code.toString());
    if(err.code == 500) tools.log("socketIO", err.full, socketConfig.main, {socket: socket}, true);
  }

  // Console commands
  function commands() {
    rl.question("", function(input) {
      input = input.split(" ");
      if(input[0] == "struggle") {
        if(input[1] == "clients") {
          if(input[2] == "refresh") {
            var i = 3;
            tools.log("socketIO", "\x1b[93mForced client refresh triggered!", socketConfig.main);
            tools.log("socketIO", "\x1b[93mRefreshing "+ Object.keys(io.connected).length +" clients in "+i+" seconds...", socketConfig.main);
            io.emit("refresh", i);
          } else if(input[2] == "list") {
            var i = 3;
            tools.log("socketIO", "\x1b[93mThere are currently: "+ Object.keys(io.connected).length +" clients connected to Teamspeak Struggle.", socketConfig.main);
          }
        } else if(input[1] == "teamspeak") {
          if(input[2] == "refresh") {
            tools.log("socketIO", "\x1b[93mForced teamspeak scoreboard refresh triggered!", socketConfig.main);
            var botID = "dc665715-c168-40dc-87d9-c315ffe9b3a2",
                instanceID = "90f7197c-f715-4f0a-86ec-3f5248f05fd6";
            tools.HTTPRequest("localhost", "8087", "/api/v1/b/"+botID+"/i/"+instanceID+"/event/refresh", "POST", {"Content-Type": "application/json"}, JSON.stringify({"foo": "bar"}), function(data) {

            });
          }
        }
      }
      commands();
    });
  }
  commands();

  function nthWord(str, n) {
    var regex = new RegExp('^((\\S+ ){1})(\\S+)');
    return str.match(regex);
  };

  // Updates teamspeak client with info
  function updateTSClient(socket, tsSGID, tsCLDBID, lines, callback) {
    queryConnect.queryConnect(socket, ts3Query, ts3QueryDetails, function(ts3) {
      socket.ts3 = ts3;
      var newLine = "                              "
      queryDescriptionChange(socket.ts3, tsCLDBID, {
        client_description: lines[0] + newLine+
        lines[1] + newLine+newLine
      }, function() {
        ts3.logout();
        callback();
      });
    });
  }

  // Copies a server group using a template rank.
  function queryServerGroupCopy(ts3, sgid, rankName, callback) {
    ts3.serverGroupCopy(sgid, 0, 1, rankName).then(function(data) {
      callback(data.sgid);
    })
    .catch(function(err) {
      callback();

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
  // Changes a client's description.
  function queryDescriptionChange(ts3, cldbid, properties, callback) {
    ts3.clientDBEdit(cldbid, properties).then(function() {
      callback();
    }).catch(function(err) {
      callback();

    });
  }
  // Cost formatter
  function numberFormatter(int) {
    return Math.floor(int).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  // Coin formatter
  function coinFormatter(int) {
    var gold = numberFormatter(Math.floor(int/10000)),
        silver = Math.floor((int%10000)/100),
        bronze = Math.floor(int%100),
        message = gold + " gold " + silver + " silver " + bronze + " bronze";
    return message;
  }
}
