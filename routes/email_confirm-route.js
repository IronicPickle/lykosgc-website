    // Libraries
var express = require("express"),
    router = express.Router(),
    prefix = require("../utility_lib/prefix"),
    tools = require("../utility_lib/tools"),
    csrf = require('csurf'),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    // DB models
    Users = require("../models/users");

// --- GET Routes ---

// GET - Resend page
router.get("/confirm/:id", csrfProtection, function(req, res, next) {
  if(req.params.id != req.session.confirmID) { // Email session id check
    return next({code: 400});
  }
  res.render("pages/user/email_resend", {
    confirmID: req.session.confirmID,

    authenticator: tools.authenticator,
    _csrf: req.csrfToken()
  });
});

// GET - Email confirm
router.get("/:hash", csrfProtection, function(req, res, next) {
  Users.findOne({confirmHash: req.params.hash}, "confirmHash, confirmExpiry, username").exec().then(function(users) {
    if(users == null) return next({code: 404}); // DB output check
    if(new Date() > new Date(users.confirmExpiry)) return next({code: 403});
    Users.updateOne({username: users.username}, {$set: {active: true} }).exec().then(function() {
      Users.updateOne({username: users.username}, {$unset: {confirmHash: 1} }).exec().then(function() {
        req.session.regenerate(function(err) {
          if(err) { // Session regenerate error check
            return next({code: 500, full: err});
          }
          req.logIn(users, function(err) {
            if(err) { // Logon error check
              return next({code: 500, full: err});
            }
            res.redirect("/");
          });
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

// --- POST Routes ---

// POST - Send route
router.post("/send", csrfProtection, function(req, res, next) {
  if(req.body.confirmID != req.session.confirmID) { // Email session id check
    return next({code: 400});
  }
  Users.findOne({username: req.session.confirmUser}, "email username").exec().then(function(user) {
    tools.sendConfirmEmail(user.email, next, function(info) {
      req.session.destroy(function(err) {
        if(err) { // Session destroy error check
          return next({code: 500, full: err});
        }
        res.status(200).send();
      });
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

module.exports = router;
