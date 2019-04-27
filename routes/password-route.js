    // Libraries
var express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    bcrypt = require("bcryptjs"),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools");
    // DB models
    Users = require("../models/users"),

// --- GET Routes ---

// GET - Change password page
router.get("/change", csrfProtection, function(req, res, next) {
  if(!tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  res.render("pages/user/password_change", {
    authenticator: tools.authenticator,
    _csrf: req.csrfToken()
  });
});

// GET - Reset password
router.get("/reset", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  res.render("pages/user/password_reset", {
    authenticator: tools.authenticator,
    _csrf: req.csrfToken()
  });
});

// GET - Reset password change
router.get("/reset/change/:hash", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  Users.findOne({resetHash: req.params.hash}, "resetHash").exec().then(function(user) {
    if(!user) return next({code: 404});
    res.render("pages/user/password_reset_change", {
      userID: user._id,
      hash: user.resetHash,

      authenticator: tools.authenticator,
      _csrf: req.csrfToken()
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// --- POST Routes ---

// POST - Change password
router.post("/change", csrfProtection, function(req, res, next) {
  if(!tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  req.body.username = req.user.username;
  // Input Validation
  var errors = [];
  // Old password validation
  if(typeof req.body.password != "string") {
    errors.push({error: "passwordIsInvalid", message: "Password is invalid.", fields: ["password"]});
  } if(req.body.password.length <= 0) {
    errors.push({error: "passwordInvalidLength", message: "Password is required.", fields: ["password"]});
  }
  // New password validation
  if(typeof req.body.new_password != "string") {
    errors.push({error: "passwordIsInvalid", message: "Password is invalid.", fields: ["new_password", "new_password_confirm"]});
  } else if(req.body.new_password.length < 8 || req.body.new_password.length > 100) {
    errors.push({error: "passwordInvalidLength", message: "Passwords must be between 8 and 100 characters.", fields: ["new_password", "new_password_confirm"]});
  } else if((req.body.new_password == req.body.new_password_confirm) == false) {
    errors.push({error: "passwordsNoMatch", message: "Passwords do not match.", fields: ["new_password", "new_password_confirm"]});
  }
  passport.authenticate("local", function(user, authErrors, err) {
    if(authErrors) errors = errors.concat(authErrors);
    if(errors.length != 0) {
      res.status(400).send({message: "invalidDetails", errors: errors});
      return;
    } else {
      if(err) return next({code: 500, full: err});
    }
    bcrypt.genSalt(10, function(err, salt) {
      if(err) return next({code: 500, full: err}); // Bcrypt error check
      bcrypt.hash(req.body.new_password, salt, function(err, hash) {
        if(err) return next({code: 500, full: err}); // Bcrypt error check
        Users.updateOne({_id: req.user._id}, {password: hash}).exec().then(function() {
          res.status(200).send({message: "success", username: req.user.username});
        }).catch(function(err) {
          return next({code: 500, full: err});
        });
      })
    });
  })(req, res, next);
});

// POST - Reset password
router.post("/reset", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  // Input Validation
  var errors = [];
  // Old password validation
  if(typeof req.body.email != "string") {
    errors.push({error: "emailIsInvalid", message: "Email is invalid.", fields: ["email"]});
  } if(req.body.email.length <= 0) {
    errors.push({error: "emailInvalidLength", message: "Email is required.", fields: ["email"]});
  }
  if(errors.length != 0) {
    res.status(400).send({message: "invalidDetails", errors: errors});
    return;
  }
  Users.findOne({email: req.body.email}, "email username").exec().then(function(user) {
    if(user == null) {
      errors.push({error: "emailNoExist", message: "That email isn't registered.", fields: ["email"]});
    }
    if(errors.length != 0) {
      res.status(400).send({message: "invalidDetails", errors: errors});
      return;
    }
    tools.sendResetEmail(user.email, next, function(info) {
      res.status(200).send({message: "success"});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// POST - Reset password change
router.post("/reset/change", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  // Input Validation
  var errors = [];
  // New password validation
  if(typeof req.body.password != "string") {
    errors.push({error: "passwordIsInvalid", message: "Password is invalid.", fields: ["password", "password_confirm"]});
  } else if(req.body.password.length < 8 || req.body.password.length > 100) {
    errors.push({error: "passwordInvalidLength", message: "Passwords must be between 8 and 100 characters.", fields: ["password", "password_confirm"]});
  } else if((req.body.password == req.body.password_confirm) == false) {
    errors.push({error: "passwordsNoMatch", message: "Passwords do not match.", fields: ["password", "password_confirm"]});
  }
  if(errors.length != 0) {
    res.status(400).send({message: "invalidDetails", errors: errors});
    return;
  }
  Users.findOne({_id: req.body._userID, resetHash: req.body._hash}, "resetHash resetExpiry username").exec().then(function(user) {
    if(!user) return next({code: 404});
    if(new Date() > new Date(user.resetExpiry)) return next({code: 403});
    bcrypt.genSalt(10, function(err, salt) {
      if(err) return next({code: 500, full: err}); // Bcrypt error check
      bcrypt.hash(req.body.password, salt, function(err, hash) {
        if(err) return next({code: 500, full: err}); // Bcrypt error check
        Users.updateOne({_id: user._id}, {password: hash, $unset: {resetHash: user.resetHash}}).exec().then(function() {
          res.status(200).send({message: "success"});
        }).catch(function(err) {
          return next({code: 500, full: err});
        });
      });
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

module.exports = router;
