// Initilization Message
process.stdout.write('\033c');
var logStr = `
--- --- --- --- --- --- --- ---
Initalizing...
--- --- --- --- --- --- --- ---
Libraries`
console.log(logStr); // Startup
// Libraries
var express = require("express"),
    app = express(),
    http = require("http").Server(app);
    bodyParser = require("body-parser"),
    path = require("path"),
    mongoose = require("mongoose"),
    session = require("express-session"),
    MongoStore = require("connect-mongo")(session),
    passport = require("passport"),
    passportSocketIo = require("passport.socketio"),
    cookieParser = require("cookie-parser"),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    fs = require("fs"),
    // Custom libraries
    tools = require("./utility_lib/tools"),
    // Data/configs
    globalConfig = require("./config/global.json"),
    socketConfig = require("./config/socket.json"),
    // DB models
    Users = require("./models/users"),
    Posts = require("./models/posts"),
    PostReplies = require("./models/post_replies");
// Require extensions
require.extensions[".html"] = function (module, filename) {
  module.exports = fs.readFileSync(filename, "utf8");
}

if(globalConfig.main.log && !globalConfig.main.logAppend) tools.clearLog(globalConfig.main.logPath + "/server.log");
if(globalConfig.router.log && !globalConfig.router.logAppend) tools.clearLog(globalConfig.router.logPath + "/router.log");
if(socketConfig.main.log && !socketConfig.main.logAppend) tools.clearLog(socketConfig.main.logPath + "/socketIO.log");

var logStr = `Setup`;
console.log(logStr); // Startup
// Database setup
mongoose.Promise = require("bluebird");
mongoose.connect(globalConfig.database.details.database, { // Connect to db
  useMongoClient: true
}).then(function(db) {
  tools.log("server", "Connected to: " + db.host + ":" + db.port, globalConfig.main, null, null, "Database");
}).catch(function(err) {
  tools.log("server", err, globalConfig.main, null, true, "Database");
});

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, globalConfig.router.views));
// Public resource path
app.use(express.static(path.join(__dirname, globalConfig.router.public)));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Express Session Middleware
app.use(session({
  cookie: { expires: false},
  secret: globalConfig.keys.session,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// Passport strategy
require("./config/passport")(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get("*", function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

// Socket.IO
var io = require("socket.io")(http);
function authSuccess(data, accept) {
  tools.log("socketIO", "\x1b[92mSocket authorised.", socketConfig.main);
  accept(null, true);
}
function authFail(data, message, error, accept) {
  if(error) {
    tools.log("socketIO", message, socketConfig.main, null, true);
  }
  tools.log("socketIO", "\x1b[91mSocket not authorised.", socketConfig.main);
}
function authAnyway(data, message, error, accept) {
  if(error) {
    tools.log("socketIO", message, socketConfig.main, null, true);
  }
  tools.log("socketIO", "\x1b[92mSocket not authorised, accepting anyway.", socketConfig.main);
  accept(null, true);
}
function socketAuth(force) {
  return passportSocketIo.authorize({
    key: "connect.sid",
    secret: globalConfig.keys.session,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    passport: passport,
    cookieParser: cookieParser,
    success: authSuccess,
    fail: (force) ? authAnyway : authFail
  })
}

// Namespaces
var sync = io.of("/sync").use(socketAuth(false));
app.sync = sync;
require("./socket.io/namespaces/sync.js")(app, sync);
var struggle = io.of("/struggle").use(socketAuth(false));
app.struggle = struggle;
require("./socket.io/namespaces/struggle.js")(app, struggle);
var botSync = io.of("/botSync").use(socketAuth(true));
app.botSync = botSync;
require("./socket.io/namespaces/botsync.js")(app, botSync);

var logStr = `Routing`;
console.log(logStr); // Setup
// --- Routing and Serving --- //

// Log request
app.use("/*", function(req, res, next) {
  if(req.originalUrl != "/") {
    tools.log("router", req.originalUrl, globalConfig.router, {res: res});
  }
  return next();
});
// User routes
var login = require("./routes/login-route");
app.use("/login", login);
var register = require("./routes/register-route");
app.use("/register", register);
var users = require("./routes/users-route");
app.use("/users", users);
var emailConfirm = require("./routes/email_confirm-route");
app.use("/email_confirm", emailConfirm);
var password = require("./routes/password-route");
app.use("/password", password);
// Forum routes
var forum = require("./routes/forum-route");
app.use("/forum", forum);
var forum_backend = require("./routes/forum_backend-route");
app.use("/forum_backend", forum_backend);
// Other Routes
var servers = require("./routes/servers-route");
app.use("/servers", servers);
var teamspeak = require("./routes/teamspeak-route")(botSync);
app.use("/teamspeak", teamspeak);
// Index route
var index = require("./routes/index-route");
app.use("/", index);
process.stdout.write('\033c');
var logStr = `
--- --- --- --- --- --- --- ---
Starting Server...
--- --- --- --- --- --- --- ---`
console.log(logStr);


// Port Setup
var listener = http.listen(process.env.PORT || globalConfig.main.port, function(){
  process.stdout.write('\033c');
  var logStr = `
--- --- --- --- --- --- --- ---
Server started
--- --- --- --- --- --- --- ---
Listening on port: `+listener.address().port+`
\nServer Details
--- --- --- --- --- --- --- ---
Version `+process.version+`
Working Directory: `+process.cwd()+`
Platform: `+process.platform+`
Time elapsed `+(process.cpuUsage().user+process.cpuUsage().user)/1000+`ms
--- --- --- --- --- --- --- ---\n`
  console.log(logStr);
  tools.log("server", "Server started", globalConfig.main);
});

app.use(csrf({ cookie: false }));
// Error handling
app.use(function(err, req, res, next) {
  if(err.code == 500) {
    tools.log("router", err.full, globalConfig.router, {res: res}, true);
  } else if(err.code) {
    res.status(err.code).send("");
  } else {
    tools.log("router", err, globalConfig.router, {res: res}, true);
  }
  /*res.render("pages/error_page", {
    name: "Bad Request",
    code: "400",
    desc: "There was a problem with the request.",
    authenticator: tools.authenticator,
  });*/
});
