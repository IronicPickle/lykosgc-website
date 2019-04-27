    // Libraries
var express = require("express"),
    router = express.Router(),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    path = require("path"),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    unitsJSON = require("../config/struggle/units.json"),
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
// GET - TS Struggle game page route
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
// GET - TS Struggle leaderboard
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

// --- POST Routes ---

// --- DELETE Routes ---

// --- Functions ---

module.exports = router;
