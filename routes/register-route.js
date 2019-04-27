    // Libraries
var express = require("express"),
    router = express.Router(),
    bcrypt = require("bcryptjs"),
    validator = require("validator"),
    csrf = require('csurf'),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    // DB models
    Users = require("../models/users");

// --- GET Routes ---

// GET - Register page
router.get("/", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  res.render("pages/user/register", {
    authenticator: tools.authenticator,
    _csrf: req.csrfToken()
  });
});

// --- POST Routes ---

// POST - Register
router.post("/", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  }
  try {
    var userData = JSON.parse(req.body.userData);
  } catch(err) {
    return next({code: 400});
  }
  // Input Validation
  var errors = [];
  // Username Validation
  if(typeof userData.username != "string") {
    errors.push({error: "usernameIsInvalid", message: "Username is invalid.", fields: ["username"]});
  } else if(userData.username.length < 6 || userData.username.length > 16) {
    errors.push({error: "usernameInvalidLength", message: "Usernames must be between 6 and 16 characters.", fields: ["username"]});
  } else if(userData.username.match(/[^a-zA-Z0-9-_]/g)) {
    errors.push({error: "usernameIsInvalid", message: "Usernames must only contain letters, numbers, - and _.", fields: ["username"]});
  }
  // Email Validation
  if(typeof userData.email != "string") {
    errors.push({error: "emailIsInvalid", message: "Email is invalid.", fields: ["email"]});
  } else if(userData.email.length > 100) {
    errors.push({error: "emailInvalidLength", message: "Email cannot be over 100 characters.", fields: ["email"]});
  } else if(validator.isEmail(userData.email) == false) {
    errors.push({error: "emailIsInvalid", message: "Email is not valid.", fields: ["email"]});
  }
  // Password Validation
	if(typeof userData.password != "string") {
		errors.push({error: "passwordIsInvalid", message: "Password is invalid.", fields: ["password", "password_confirm"]});
  } else if(userData.password.length < 8 || userData.password.length > 100) {
    errors.push({error: "passwordInvalidLength", message: "Passwords must be between 8 and 100 characters.", fields: ["password", "password_confirm"]});
	} else if((userData.password == userData.password_confirm) == false) {
		errors.push({error: "passwordsNoMatch", message: "Passwords do not match.", fields: ["password", "password_confirm"]});
	}
  var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dob = new Date(userData.dob_year, monthArray.indexOf(userData.dob_month), userData.dob_day);
  if(dob == "Invalid Date") {
    errors.push({error: "dobIsInvalid", message: "Date of Birth is invalid.", fields: ["dob_day", "dob_month", "dob_year"]});
  } else {
    // Calculates age and handles leap years.
    var age = (new Date(Date.now() - Date.parse(dob)).getFullYear()) - 1970,
        months = {January: 31, Febuary: 28, Match: 31, April: 30, May: 31, June: 30, July: 31, August: 31, September: 30, October: 31, November: 30, December: 31};
    if(userData.dob_year % 4 != 0) { // Common Year
    } else if(userData.dob_year % 100 != 0) { // Leap Year
      months.Febuary = 29;
    } else if(userData.dob_year % 400 != 0) { // Common Year
    } else { // Leap Year
      months.Febuary = 29;
    }
    var days = months[userData.month];
    // Date of Birth Validation
    if(monthArray.indexOf(userData.dob_month) < 0) {
      errors.push({error: "dobMonthIsInvalid", message: "Date of Birth Month is invalid.", fields: ["dob_month"]});
    } else if(age <= 13) {
      errors.push({error: "dobInvalidAge", message: "Users must be over 13 years to sign up.", fields: ["dob_day", "dob_month", "dob_year"]});
    } else if(userData.dob_day < 1 && userData.dob_day > days) {
      errors.push({error: "dobDayIsInvalid", message: "Date of Birth Day is invalid.", fields: ["dob_day"]});
    }
  }
  // TnD Validation
  if(userData.tnd != "on") {
    errors.push({error: "tndIsEmpty", message: "Terms and conditions must be agreed to.", fields: ["tnd"]});
  }

  // Username existence check
  Users.findOne({username: userData.username}, "username").exec().then(function(users) {
    if(users) {
      errors.push({error: "usernameInUse", message: "Username is already in use.", fields: ["username"]});
    }
    Users.findOne({email: userData.email}, "email").exec().then(function(users) {
      if(users) {
        errors.push({error: "emailInUse", message: "Email is already in use.", fields: ["email"]});
      }
      if(errors.length != 0) {
        res.status(500).send({message: "invalidDetails", errors: errors});
        return next();
      }
      var newUser = new Users();
      newUser.username = userData.username;
      newUser.display_name = userData.username;
      newUser.email = userData.email;
      newUser.password = userData.password;
      newUser.dobDay = userData.dob_day;
      newUser.dobMonth = userData.dob_month;
      newUser.dobYear = userData.dob_year;
      newUser.active = false;

      bcrypt.genSalt(10, function(err, salt) {
        if(err) return next({code: 500, full: err}); // Bcrypt error check
        bcrypt.hash(newUser.password, salt, function(err, hash) {
          if(err) return next({code: 500, full: err}); // Bcrypt error check
          newUser.password = hash;
          newUser.save().then(function() {
            tools.sendConfirmEmail(newUser.email, next, function(info) {
              var hash = tools.generateEmailSession(req, newUser.username);
              res.status(200).send({message: "success", hash: hash});
            });
          }).catch(function(err) {
            return next({code: 500, full: err});
          });
        });
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

module.exports = router;
