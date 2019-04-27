    // Libraries
var express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools");

// --- GET Routes ---

// GET - Login page
router.get("/", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  res.render("pages/user/login", {
    authenticator: tools.authenticator,
    _csrf: req.csrfToken()
  });
});

// --- POST Routes ---

// POST - Login
router.post("/", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  var errors = [];
  if(typeof req.body.username != "string") {
    errors.push({error: "usernameIsInvalid", message: "Username is invalid.", fields: ["username"]});
  } else if(req.body.username.length <= 0) {
    errors.push({error: "usernameInvalidLength", message: "Username is required.", fields: ["username"]});
  }
  if(typeof req.body.password != "string") {
    errors.push({error: "passwordIsInvalid", message: "Password is invalid.", fields: ["password"]});
  } else if(req.body.password.length <= 0) {
    errors.push({error: "passwordInvalidLength", message: "Password is required.", fields: ["password"]});
  }
  if(errors.length != 0) {
    res.status(400).send({message: "invalidDetails", errors: errors});
    return;
  }
  passport.authenticate("local", function(user, authErrors, err) {
    if(authErrors) errors = errors.concat(authErrors);
    if(errors.length != 0) {
      res.status(400).send({message: "invalidDetails", errors: errors});
      return;
    } else {
      if(err) return next({code: 500, full: err});
    } if(user.active == false) {
      var hash = tools.generateEmailSession(req, user.username);
      res.status(400).send({message: "accountInactive", hash: hash});
      return;
    } if(req.body.remember == "on") {
      req.session.cookie.maxAge = (10000000*1000*60*60);
    }
    req.logIn(user, function(err, user) {
      if(err) return next({code: 500, full: err});
      res.status(200).send({message: "success"});
    });
  })(req, res, next);
});

module.exports = router;
