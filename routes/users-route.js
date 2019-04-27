    // Libraries
var express = require("express"),
    router = express.Router(),
    csrf = require('csurf'),
    csrfProtection = csrf({ cookie: false }),
    csrfProtectionFromQuery = csrf({ cookie: false,  value(req) { return req.query._csrf } }),
    fs = require("fs"),
    formidable = require("formidable"),
    jimp = require("jimp"),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    groups = require("../config/groups.json"),
    // DB models
    Users = require("../models/users"),
    Posts = require("../models/posts"),
    PostReplies = require("../models/post_replies"),
    PostLocations = require("../models/post_locations");

// --- GET Routes ---

// GET - logout
router.get("/logout", csrfProtection, function(req, res, next) {
  if(tools.authenticator(req.user, 5)) {
    req.logout();
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});
// GET - User profile
router.get("/:name", csrfProtection, function(req, res, next) {
  Users.findOne({username: req.params.name}, "username email dobDay dobMonth dobYear name gender country city tagLine joinDate groups").exec().then(function(userInfo) {
    if(userInfo == null) { // DB find check
      return next({code: 404});
    }
    Posts.count({author: userInfo._id}).exec().then(function(threads) {
      PostReplies.count({author: userInfo._id}).exec().then(function(replies) {
        res.render("pages/user/user", {
          userInfo: userInfo,
          userStats: {threads: threads, replies: replies},
          groups: groups,

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
});
// GET - User info
router.get("/info/:id", csrfProtection, function(req, res, next){
  Users.findOne({_id: req.params.id}, "username email dobDay dobMonth dobYear name gender country city tagLine imgRoute joinDate groups").exec().then(function(userInfo){
    if(userInfo == null) { // DB output check
      return next({code: 404});
    }
    var data = {
      userInfo: userInfo,
      groups: groups
    };
    res.status(200).send(data);
  });
});
// GET - Post activity
router.get("/activity/posts", csrfProtection, function(req, res, next){
  req.query.limit = parseInt(req.query.limit);
  if(typeof req.query.limit != "number" || !Number.isInteger(req.query.limit)) {
    return next({code: 400});
  } req.query.skip = parseInt(req.query.skip);
  if(typeof req.query.skip != "number" || !Number.isInteger(req.query.skip)) {
    return next({code: 400});
  }
  Posts.find({author: req.query.user_id}, "date title body location").limit(req.query.limit).skip(req.query.skip).sort({date: -1}).exec().then(function(posts) {
    PostLocations.find({}, "location locationString").exec().then(function(locations) {
      for(key1 in posts) {
        posts[key1].body = tools.sanitizeBody(posts[key1].body, true);
        for(key2 in locations) {
          if(posts[key1].location == locations[key2].location) {
            posts[key1] = {
              _id: posts[key1]._id,
              date: posts[key1].date,
              title: posts[key1].title,
              body: posts[key1].body,
              location: posts[key1].location,
              locationString: locations[key2].locationString
            }
          }
        }
      }
      res.send(posts);
    });
  });
});
// GET - Replies activity
router.get("/activity/replies", csrfProtection, function(req, res, next){
  req.query.limit = parseInt(req.query.limit);
  if(typeof req.query.limit != "number" || !Number.isInteger(req.query.limit)) {
    return next({code: 400});
  } req.query.skip = parseInt(req.query.skip);
  if(typeof req.query.skip != "number" || !Number.isInteger(req.query.skip)) {
    return next({code: 400});
  }
  PostReplies.find({author: req.query.user_id}, "date parentID parentTitle body").limit(req.query.limit).skip(req.query.skip).sort({date: -1}).exec().then(function(replies) {
    for(key in replies) {
      replies[key].body = tools.sanitizeBody(replies[key].body, true);
    };
    res.send(replies);
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// --- POST Routes ---

// POST - Upload avatar
router.post("/avatar/upload", csrfProtectionFromQuery, function (req, res, next){
  if(!tools.authenticator(req.user, 5)) {
    return next({code: 403});
  } if(req.user._id != req.query.userID && !tools.authenticator(req.user, 75)) {
    return next({code: 403});
  }
  var posX = parseInt(req.query.posX),
      posY = parseInt(req.query.posY);
  if(typeof posX != "number" || !Number.isInteger(posX)) { // Data type check
    return next({code: 400});
  } if(typeof posY != "number" || !Number.isInteger(posY)) { // Date type check
    return next({code: 400});
  } if(posX < 0 || posY < 0) { // Checks if coords are less than 0
    return next({code: 400});
  }
  var form = new formidable.IncomingForm(); // Binds new form
  form.parse(req); // Parses form
  form.on("fileBegin", function (name, file) {
    console.log("Creating temporary file");
    file.path = __dirname + "/../public/images/temp_upload/" + req.query.userID;
  });
  form.on("file", function (name, file) {
    console.log("Converting and creating permament file");
    jimp.read(file.path, function(err, image) {
      if(err) {
        return next({code: 500});
      }
      posX = Math.floor(posX);
      posY = Math.floor(posY);
      if(image.bitmap.height < 360) {
        image.resize(jimp.AUTO, 360)
      } if(image.bitmap.width < 360) {
        image.resize(360, jimp.AUTO)
      } if(image.bitmap.height > 800) {
        image.resize(jimp.AUTO, 800)
      } if(image.bitmap.width > 1000) {
        image.resize(1000, jimp.AUTO)
      }
      var width = image.bitmap.width,
          height = image.bitmap.height;
      if(posX > (width-360) || posY > (height-360)) {
        return next({code: 400});
      }
      image
        .crop(posX, posY, 360, 360)
        .write(__dirname + "/../public/images/avatars/" + req.query.userID);
      res.sendStatus(200);
    });
    console.log("Removing temporary file");
    fs.unlink("" + file.path, function(err) {
      if(err) {
        return next({code: 500});
      }
    });
  });
});
// POST - Edit user
router.post("/edit/:id", csrfProtection, function(req, res, next) {
  try {
    var userData = JSON.parse(req.body.userData);
  } catch(err) {
    return next({code: 400});
  }
  if(!tools.authenticator(req.user, 5)) { // Authorization
    return next({code: 403});
  } if(req.user._id == req.body.userData._id) { // Authorization
    return next({code: 403});
  }
  // Input Validation
  var errors = [];
  // Name Validation
  if(typeof userData.name != "string") {
    errors.push({error: "nameIsInvalid", message: "Name is invalid.", fields: ["username"]});
  } else if(userData.name.length > 50) {
    errors.push({error: "nameInvalidLength", message: "Names cannot exceed 50 characters.", fields: ["username"]});
  }
  // Gender Validation
  if(typeof userData.gender != "string") {
    errors.push({error: "genderIsInvalid", message: "Gender is invalid.", fields: ["gender"]});
  } else if(userData.gender.length > 10) {
    errors.push({error: "genderInvalidLength", message: "Gender cannot exceed 10 characters.", fields: ["gender"]});
  }
  // City Validation
  if(typeof userData.city != "string") {
    errors.push({error: "cityIsInvalid", message: "City is required.", fields: ["city"]});
  } else if(userData.city.length > 100) {
    errors.push({error: "cityInvalidLength", message: "City cannot exceed 100 characters.", fields: ["city"]});
  }
  // Country Validation
  if(typeof userData.country != "string") {
    errors.push({error: "countryIsInvalid", message: "Country is invalid.", fields: ["country"]});
  } else if(userData.country.length > 100) {
    errors.push({error: "countryInvalidLength", message: "Country cannot exceed 100 characters.", fields: ["country"]});
  }
  // Tag Line Validation
  if(typeof userData.name != "string") {
    errors.push({error: "tagLineInvalid", message: "Tag line is invalid.", fields: ["tagLine"]});
  } else if(userData.tagLine.length > 50) {
    errors.push({error: "tagLineInvalidLength", message: "Tag Line cannot exceed 50 characters.", fields: ["tagLine"]});
  }
  var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      dob = new Date(userData.dobYear, monthArray.indexOf(userData.dobMonth), userData.dobDay);
  if(dob == "Invalid Date") {
    errors.push({error: "dobIsInvalid", message: "Date of Birth is invalid.", fields: ["dobDay", "dobMonth", "dobYear"]});
  } else {
    // Calculates age and handles leap years.
    var age = (new Date(Date.now() - Date.parse(dob)).getFullYear()) - 1970,
        months = {January: 31, Febuary: 28, Match: 31, April: 30, May: 31, June: 30, July: 31, August: 31, September: 30, October: 31, November: 30, December: 31};
    if(userData.dobYear % 4 != 0) { // Common Year
    } else if(userData.dobYear % 100 != 0) { // Leap Year
      months.Febuary = 29;
    } else if(userData.dobYear % 400 != 0) { // Common Year
    } else { // Leap Year
      months.Febuary = 29;
    }
    var days = months[month];
    // Date of Birth Validation
    if(monthArray.indexOf(userData.dobMonth) < 0) {
      errors.push({error: "dobMonthIsInvalid", message: "Date of Birth Month is invalid.", fields: ["dobMonth"]});
    } else if(age <= 13) {
      errors.push({error: "dobInvalidAge", message: "Users must be over 13 years to sign up.", fields: ["dobDay", "dobMonth", "dobYear"]});
    } else if(userData.dobDay < 1 && userData.dobDay > days) {
      errors.push({error: "dobDayIsInvalid", message: "Date of Birth Day is invalid.", fields: ["dobDay"]});
    }
  }

  if(errors.length != 0) {
    res.status(500).send({message: "invalidDetails", errors: errors});
    return next();
  }

  Users.updateOne({_id:req.params.id}, {$set:userData}).exec().then(function() {
    res.status(200).send({message: "success"});
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// --- DELETE Routes ---

module.exports = router;
