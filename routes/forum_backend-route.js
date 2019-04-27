    // Libraries
var express = require("express"),
    router = express.Router(),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    // DB models
    Posts = require("../models/posts"),
    PostLocations = require("../models/post_locations"),
    PostCategories = require("../models/post_categories");

// --- GET Routes ---

// --- POST Routes ---

// POST - Modify category
router.post("/category", csrfProtection, function(req, res, next) {
  if(!tools.authenticator(req.user, 75)) { // Authorization
    return next({code: 403});
  }
  try {
    var data = JSON.parse(req.body.data);
  } catch(err) {
    return next({code: 400, full: err});
  }
  var errors = [];
  if(data.action == "add" || data.action == "edit") {
    // Input validation
    if(typeof data.title != "string") {
      errors.push({error: "titleIsInvalid", message: "Title is invalid.", fields: ["title"]});
    } else if(data.title.length <= 0) {
      errors.push({error: "titleIsEmpty", message: "Title is required.", fields: ["title"]});
    } else if(data.title.match(/[^a-zA-Z0-9-_ ]/g)) {
      errors.push({error: "titleIsInvalid", message: "Titles must only contain letters, numbers, - and _.", fields: ["title"]});
    }
    if(typeof data.order != "number") {
      errors.push({error: "orderIsInvalid", message: "Order is invalid.", fields: ["order"]});
    } else if(!Number.isInteger(data.order)) {
      errors.push({error: "orderNotInt", message: "Order should be an integer.", fields: ["order"]});
    }
  }
  if(data.action == "edit" || data.action == "archive") {
    if(typeof data.data != "object" || data.data == null) {
      errors.push({error: "dataInvalid", message: "Data is invalid.", fields: ["none"]});
    }
  }
  if(errors.length != 0) {
    res.status(400).send({message: "errors", errors: errors});
    return next();
  }

  if(data.action == "add") {
    var newCategory = new PostCategories();
    newCategory.categoryString = data.title;
    newCategory.category = data.title.toLowerCase().replace(/\s/g, '_');
    newCategory.order = data.order;

    newCategory.save().then(function() {
      res.status(200).send({message: "success"});
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  } else if(data.action == "edit") {
    var newCategory = {
      categoryString: data.title,
      category: data.title.toLowerCase().replace(/\s/g, '_'),
      order: data.order
    }
    PostCategories.updateOne({_id: data.data._id}, newCategory).exec().then(function() {
      PostLocations.updateOne({category: data.data.category}, {$set:{category: data.title.toLowerCase().replace(/\s/g, '_')}}).exec().then(function() {
        res.status(200).send({message: "success"});
      }).catch(function(err) {
        return next({code: 500, full: err});
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  } else if(data.action == "archive") {
    PostLocations.updateMany({category: data.data.category}, {archived: "true"}).exec().then(function() {
      PostCategories.updateOne({_id: data.data._id}, {archived: "true"}).exec().then(function() {
        res.status(200).send({message: "success"});
      }).catch(function(err) {
        return next({code: 500, full: err});
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }
});

// POST - Modify forum
router.post("/forum", csrfProtection, function(req, res, next) {
  if(!tools.authenticator(req.user, 75)) { // Authorization
    return next({code: 403});
  }
  try {
    var data = JSON.parse(req.body.data);
  } catch(err) {
    return next({code: 400, full: err});
  }
  var errors = [];
  if(data.action == "add" || data.action == "edit") {
    // Input validation
    if(typeof data.title != "string") {
      errors.push({error: "titleIsInvalid", message: "Title is invalid.", fields: ["title"]});
    } else if(data.title.length <= 0) {
      errors.push({error: "titleIsEmpty", message: "Title is required.", fields: ["title"]});
    } else if(data.title.match(/[^a-zA-Z0-9-_ ]/g)) {
      errors.push({error: "titleIsInvalid", message: "Titles must only contain letters, numbers, - and _.", fields: ["title"]});
    }
    if(typeof data.order != "number") {
      errors.push({error: "orderIsInvalid", message: "Order is invalid.", fields: ["order"]});
    } else if(!Number.isInteger(data.order)) {
      errors.push({error: "orderNotInt", message: "Order should be an integer.", fields: ["order"]});
    }

    if(data.action == "add") { // If a forum is being created
      if(typeof data.category != "string") {
        errors.push({error: "categoryIsInvalid", message: "A category is invalid.", fields: ["none"]});
      } else if(data.category.length == 0) {
        errors.push({error: "categoryIsEmpty", message: "A category is required.", fields: ["none"]});
      }
    }

    if(typeof data.perm != "number") {
      errors.push({error: "permIsInvalid", message: "A permission is required.", fields: ["perm"]});
    } else if(!Number.isInteger(data.perm)) {
      errors.push({error: "permNotInt", message: "Permissions should be an integer.", fields: ["perm"]});
    }
  }

  if(data.action == "edit" || data.action == "archive") {
    if(typeof data.data != "object" || data.data == null) {
      errors.push({error: "dataInvalid", message: "Data is invalid.", fields: ["none"]});
    }
  }

  if(errors.length != 0) {
    res.status(400).send({message: "errors", errors: errors});
    return next();
  }

  if(data.action == "add") {
    var newForum = new PostLocations();
    newForum.locationString = data.title;
    newForum.location = data.title.toLowerCase().replace(/\s/g, '_');
    newForum.category = data.category;
    newForum.order = data.order;
    newForum.perm = data.perm;

    newForum.save().then(function() {
      res.status(200).send({message: "success"});
    }).catch(function(err) {
      return next({code: 500, full: errors});
    });
  } else if(data.action == "edit") {
    var newForum = {
      locationString: data.title,
      location: data.title.toLowerCase().replace(/\s/g, '_'),
      order: data.order,
      perm: data.perm
    }
    PostLocations.findOne({_id: data.data._id}, "").exec().then(function(location) {
      if(location == null) { // DB output check
        return next({code: 404});
      }
      Posts.update({location: location.location}, {location: newForum.location}).exec().then(function() {
        PostLocations.updateOne({_id: data.data._id}, newForum).exec().then(function() {
          res.status(200).send({message: "success"});
        }).catch(function(err) {
          return next({code: 500, full: err});
        });
      }).catch(function(err) {
        return next({code: 500, full: err});
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  } else if(data.action == "archive") {
    PostLocations.updateOne({_id: data.data._id}, {archived: "true"}).exec().then(function() {
      res.status(200).send({message: "success"});
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }
});

// --- DELETE Routes ---

// DELETE - Delete post



module.exports = router;
