module.exports = function(botSync) {
      // Libraries
  var express = require("express"),
      router = express.Router(),
      csrf = require("csurf"),
      csrfProtection = csrf({ cookie: false }),
      path = require("path"),
      // Custom libraries
      tools = require("../utility_lib/tools"),
      unitsJSON = require("../config/struggle/units.json"),
      // Data/Config
      botsyncConfig = require("../config/botsync.json"),
      // DB models
      Users = require("../models/users"),
      Struggle = require("../models/struggle"),
      StruggleRaid = require("../models/struggle_raid");

  // --- GET Routes ---

  // GET - Main page
  router.get("/", csrfProtection, function(req, res, next){
    res.render("pages/teamspeak/teamspeak", {
      authenticator: tools.authenticator,
      _csrf: req.csrfToken()
    });
  });
  // GET - TS Struggle page
  router.get("/struggle", csrfProtection, function(req, res, next){
    /*res.status(200).send("Struggle has been closed. Will be re-released soon^tm.");
    return;*/
    res.render("pages/teamspeak/struggle", {
      units: unitsJSON,

      authenticator: tools.authenticator,
      _csrf: req.csrfToken()
    });
  });
  // GET - TS Struggle leaderboard
  router.get("/struggle/info", csrfProtection, function(req, res, next) {
    Struggle.find({}, "").sort({"money": -1}).limit(parseInt(req.query.villageLimit)).lean().exec().then(function(villages) {
      var usersArray = [];
      for(var i in villages) {
        usersArray[i] = villages[i].userID;
        var timePassed = (new Date().getTime() - new Date(villages[i].lastVisit).getTime())/1000,
            netWorth = villages[i].money,
            soldiers = villages[i].soldiers,
            workers = villages[i].workers,
            totalCPS = 0;
        for(var ii in soldiers) {
          var amount = soldiers[ii].amount,
              cost = unitsJSON[ii].cost,
              totalValue = amount * cost;
          netWorth = netWorth + totalValue;
        }
        for(var ii in workers) {
          totalCPS = totalCPS + (unitsJSON[ii].cps * workers[ii].amount); // Calculates total CPS
          // Calculates networth
          var amount = workers[ii].amount,
              cost = unitsJSON[ii].cost,
              totalValue = 0;
          for(var iii = 0; iii < amount; iii++) {
            totalValue = totalValue + (cost*(Math.pow(1.1, (iii))));
          }
          netWorth = netWorth + totalValue; // Total networth
        }
        var moneyEarned = totalCPS * timePassed,
            newMoney = netWorth + moneyEarned;
        villages[i].money = newMoney;
      }
      Users.find({_id: {$in:usersArray}}, "username").exec().then(function(users) {
        for(var i in villages) {
          for(var ii in users) {
            if(villages[i].userID == users[ii]._id) {
              villages[i].username = users[ii].username;
            }
          }
        }
        // Villages array sort ~ Sorts by money in descending order
        var sorted = [];
        for(var i in villages) { // Cycles through villages
          if(i == 0) {
            sorted[0] = villages[0];
          } else {
            for(var ii in sorted) { // Tests current village against sorted array
              if(villages[i].money > sorted[ii].money) { // Greater than
                sorted.splice(ii, 0, villages[i]);
                break;
              } else if((parseInt(ii) + 1) == sorted.length) { // Less than
                sorted.push(villages[i]);
              }
            }
          }
        }
        villages = sorted;
        StruggleRaid.find({status: "complete"}, "").sort({"raidEnd": -1}).limit(parseInt(req.query.raidLimit)).exec().then(function(raids) {
          res.status(200).send(JSON.stringify({villages: villages, raids: raids}));
        }).catch(function(err) {
          return next({code: 500, full: err});
        });
      }).catch(function(err) {
        return next({code: 500, full: err});
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  });
  // GET - TS Struggle help img
  router.get("/struggle/help", csrfProtection, function(req, res, next) {
    var img = req.query.img,
        imgPath = path.resolve(__dirname + "/../public/images/struggle/"+img+".png");
    fs.access(imgPath, fs.F_OK, function(err) {
      if(err) {
        return next({code: 404});
      }
      res.status("200").sendFile(imgPath);
    });
  });
  // GET - WEB UI pages
  router.get("/botsync", csrfProtection, function(req, res, next) {
    res.render("pages/teamspeak/botsync", {

      authenticator: tools.authenticator,
      _csrf: req.csrfToken()
    });
  });
  // GET - WEB UI pages
  router.post("/botsync/update", function(req, res, next) {
    var type = req.body.data.type,
        password = req.body.password;
    if(password != botsyncConfig.main.botConnect.password) return;
    if(type == "botDisconnect") {
      setTimeout(function() {
        botSync.emit("updatePending");
      }, 2500);
    } else {
      botSync.emit("updatePending");
    }
  });
  // GET - WEB UI pages
  router.post("/botsync/instanceUpdate", function(req, res, next) {
    var type = req.body.data.type,
        password = req.body.password;
    console.log(req.body)
    if(password != botsyncConfig.main.botConnect.password) return;
    botSync.in(req.body.data.uuid).emit("instanceUpdatePending", {type: type});
  });

  // --- POST Routes ---

  // --- DELETE Routes ---

  // --- Functions ---
  return router;
}
