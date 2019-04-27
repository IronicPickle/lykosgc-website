    // Libraries
var express = require("express"),
    router = express.Router(),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    Gamedig = require("gamedig"),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    // DB models
    Users = require("../models/users");

// --- GET Routes ---

// GET - Main page
router.get("/", csrfProtection, function(req, res, next) {
  res.render("pages/servers/servers_index", {
    authenticator: tools.authenticator,
    _csrf: req.csrfToken()
  });
});

// --- POST Routes ---

// POST - Arma III server status
router.post("/status/minecraft", csrfProtection, function(req, res, next) {
  Gamedig.query({
    type: "minecraft",
    host: "localhost"
  },
  function(err, state) {
    if(state) {
      res.sendStatus(state);
    } else {
      res.sendStatus(504);
    }
  });
});

// --- DELETE Routes ---



module.exports = router;
