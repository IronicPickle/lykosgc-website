    // Libraries
var express = require("express"),
    router = express.Router(),
    prefix = require("../utility_lib/prefix"),
    tools = require("../utility_lib/tools"),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    // Data/configs
    globalConfg = require("../config/global.json"),
    // DB models
    Posts = require("../models/posts"),
    PostLocations = require("../models/post_locations"),
    Users = require("../models/users");

// --- GET Routes ---

// GET - Index page
router.get("/", csrfProtection, function(req, res, next) {
  var locationMirror = globalConfg.other.indexMirror;
  PostLocations.find({}, "location locationString category perm").exec().then(function(forums) {
    Users.find({}, "username joinDate").limit(5).sort({joinDate: -1}).exec().then(function(users) {
      Posts.find({}, "").limit(10).sort({date: -1}).lean().exec().then(function(threads) {
        var userArray = [];
        for(var i in threads) {
          userArray.push(threads[i].author);
        }
        Users.find({_id: {$in: userArray}}, "username").exec().then(function(threadUsers) {
          for(var i in threads) {
            for(var ii in threadUsers) {
              if(threads[i].author == threadUsers[ii]._id) {
                threads[i].authorInfo = threadUsers[ii];
              }
            }
          }
          res.render("index", {
            locationMirror: locationMirror,
            forums: forums,
            newUsers: users,
            newThreads: threads,

            getTimeElapsed: tools.getTimeElapsed,
            authenticator: tools.authenticator,
            _csrf: req.csrfToken()
          });
        }).catch(function(err) {
          return next({code: 500, full: err});
        });
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

// GET - Invalid page
router.get("/:invalid", csrfProtection, function(req, res, next) {
  return next({code: 404});
});

module.exports = router;
