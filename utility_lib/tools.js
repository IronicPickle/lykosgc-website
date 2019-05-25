// Random Generator
module.exports = {
  randomString: function(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  },
  appendLog: function(path, message) {
    var fs = require("fs"),
        now = new Date();
    message = "\n"+message;
    message = message.replace(/\n/g, "\n["+now.toUTCString()+"] ");
    fs.appendFile(__dirname +  "/.." + path, message, function(err) {
      if(err) {
        if(!fs.existsSync(__dirname +  "/.." + path.substring(0, path.lastIndexOf("/")))) {
          fs.mkdirSync(__dirname +  "/.." + path.substring(0, path.lastIndexOf("/")));
        }
        fs.writeFile(__dirname +  "/.." + path, message, function(err) {
          if(err) {
          }
        });
      }
    });
  },
  log: function(type, message, config, data, isErr, nameOverride) {
    var prefix = require("./prefix"),
        errPrefix = (isErr) ? prefix.error() : "",
        name = "\x1b[0m",
        ip = "\x1b[0m";
    if(data) {
      if(data.socket) {
        name = "{"+data.socket.nsp.name.slice(1).charAt(0).toUpperCase() + data.socket.nsp.name.slice(2)+"}\x1b[0m ";
        ip = " \x1b[93m- "+this.getIP.socket(data.socket)+"\x1b[0m";
      } else if(data.res) {
        name = "{"+data.res.req.method+"}\x1b[0m ";
        ip = " \x1b[93m- "+this.getIP.res(data.res)+"\x1b[0m";
      }
    }
    if(nameOverride)   name = "{"+nameOverride+"}\x1b[0m ";
    var line = prefix[type]()+name+errPrefix+message+ip;
    if(config.debug) console.log(prefix.time()+line);
    if(config.debug && isErr) console.log(message);
    if(config.log) this.appendLog(config.logPath+"/"+type+".log", line.replace(/\x1b\[[0-9]*m/g, ""));
  },
  getIP: {
    res: function(res) {
      return res.req.ip.substr(7);
    },
    socket: function(socket) {
      if(socket.handshake) {
        return (socket.handshake.address.substr(7));
      } else {
        return (socket.socket._peername.address.substr(7));
      }
    }
  },
  clearLog: function(path) {
    var fs = require("fs");
    fs.writeFile(__dirname +  "/.." + path, "", function(err) {});
  },
  getTimeElapsed: function(date) {
    var since = new Date() - date;
    var secondsSince = since/1000;
    var minutesSince = secondsSince/60;
    var hoursSince = minutesSince/60;
    var daysSince = hoursSince/24;
    var weeksSince = daysSince/7;
    var monthsSince = daysSince/30;
    var yearsSince = daysSince/365.25;

    if(yearsSince > 1) {
      sinceTime = Math.floor(yearsSince);
      since = Math.floor(yearsSince) + " year"
    } else if(monthsSince > 1) {
      sinceTime = Math.floor(monthsSince);
      since = Math.floor(monthsSince) + " month"
    } else if(weeksSince > 1) {
      sinceTime = Math.floor(weeksSince);
      since = Math.floor(weeksSince) + " week"
    } else if(daysSince > 1) {
      sinceTime = Math.floor(daysSince);
      since = Math.floor(daysSince) + " day"
    } else if(hoursSince > 1) {
      sinceTime = Math.floor(hoursSince);
      since = Math.floor(hoursSince) + " hour"
    } else if(minutesSince > 1) {
      sinceTime = Math.floor(minutesSince);
      since = Math.floor(minutesSince) + " minute"
    } else {
      sinceTime = Math.floor(secondsSince);
      since = Math.floor(secondsSince) + " second"
    };

    if(sinceTime > 1) {
      since = since + "s ago";
    } else {
      since = since + " ago"
    };

    return since;
  },
  authenticator: function(user, power) {
    if(!user) { // Checks if user is logged in
      return false;
    } if(!user.groups) { // Checks if user is logged in
      return false;
    }
    // Library requires
    var prefix = require("./prefix"),
        groups = require("../config/groups.json"),
        userGroups = user.groups,
        highestPower = 0;
    for(var i = 0; i < userGroups.length; i++) { // Comparison for loops
      for(ii in groups) {
        if(userGroups[i] == groups[ii].name) {
          if(groups[ii].power >= highestPower) {
            highestPower = groups[ii].power;
          }
        }
      }
    }

    // Data handler
    //console.log("Required power: " + power)
    //console.log("Highest power: " + highestPower)
    if(highestPower >= power) {
      //console.log("Access granted!")
      return(true)
    } else {
      //console.log("Access denied!")
      return(false)
    }
  },
  sanitizeBody: function(content, purge) {
    var sanitizeHtml = require('sanitize-html');
    if(!purge) {
      var cleanBody = sanitizeHtml(content, {
        allowedTags: [ 'p', 'strong', 'b', 'u', 'em', 's', 'a', 'img', 'hr', 'ol', 'ul', 'li', 'blockquote', 'h1', 'h2', 'h3', 'pre', 'div', 'span', 'small', 'big', 'sub', 'sup' ],
        allowedAttributes: {
          a: [ 'href' ],
          img: [ 'src', 'alt', 'id' ],
        },
        selfClosing: [ '*' ],
        allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
        allowedSchemesByTag: {},
        allowProtocolRelative: true,
        transformTags: {
          'img': sanitizeHtml.simpleTransform('img', {id: 'auto_img'})
        }
      });
    } else {
      var cleanBody = sanitizeHtml(content, {
        allowedTags: []
      });
    }
    if (cleanBody.length <= 0) {
      return "<b> GENERATED TEXT: </b> <br><br> ... <br><br> Looks like there isn't anything here."
    } else {
      return cleanBody
    }
  },
  HTTPRequest: function(host, port, path, method, headers, body, callback) {
    var http =  require("http");
    var chunks = [];
    var options = {
      host: host,
      path: path,
      port: port,
      method: method,
      headers: headers
    }
    var req1 = http.request(options, function (res1) {
      res1.on("data", function(data) {
        chunks.push(data);
      });
      res1.on("end", function() {
        var data = Buffer.concat(chunks);
        callback(data.toString());
      });
    });
    req1.on("error", function(err) {
      callback(err);
    });
    req1.write(body);
    req1.end();
  },
  sendConfirmEmail: function(email, next, callback) {
    var nodemailer = require("nodemailer"),
        md5 = require("md5"),
        tools = require("../utility_lib/tools"),
        Users = require("../models/users"), // DB models
        globalConfig = require("../config/global.json"), // Global config
        transporter = nodemailer.createTransport(globalConfig.email.transporter), // Email config
        hash = md5(tools.randomString(16, "aA#!")), // Email hash
        html = require(".."+globalConfig.email.confirm.html).replace("$_hash", hash), // Email HTML
        options = { // Email options
          from: globalConfig.email.from,
          to: email,
          subject: globalConfig.email.confirm.subject,
          text: "",
          html: html
        },
        expiry = new Date().setDate(new Date().getDate() + 1);
    Users.updateOne({email: email}, {confirmHash: hash, confirmExpiry: expiry}).exec().then(function() {
      // Email sender
      transporter.sendMail(options, function(err, info) {
        if(err) return next({code: 500, full: err}); // Mail sender error check
        tools.log("server", "Email sent to: " + email + "\nEmail ID: " + info.messageId + "\nResponse: " + info.response, globalConfig.main);
        callback(info);
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  },
  generateEmailSession: function(req, username) {
    var md5 = require("md5"),
        tools = require("../utility_lib/tools"),
        hash = md5(tools.randomString(16, "aA#!"));
    req.session.confirmID = hash;
    req.session.confirmUser = username;
    return hash;
  },
  sendResetEmail: function(email, next, callback) {
    var nodemailer = require("nodemailer"),
        md5 = require("md5"),
        tools = require("../utility_lib/tools"),
        Users = require("../models/users"), // DB models
        globalConfig = require("../config/global.json"), // Global config
        transporter = nodemailer.createTransport(globalConfig.email.transporter), // Email config
        hash = md5(tools.randomString(16, "aA#!")), // Email hash
        html = require(".."+globalConfig.email.reset.html).replace("$_hash", hash), // Email HTML
        options = { // Email options
          from: globalConfig.email.from,
          to: email,
          subject: globalConfig.email.reset.subject,
          text: "",
          html: html
        },
        expiry = new Date().setDate(new Date().getDate() + 1);
    Users.updateOne({email: email}, {resetHash: hash, resetExpiry: expiry}).exec().then(function() {
      // Email sender
      transporter.sendMail(options, function(err, info) {
        if(err) return next({code: 500, full: err}); // Mail sender error check
        tools.log("server", "Email sent to: " + email + "\nEmail ID: " + info.messageId + "\nResponse: " + info.response, globalConfig.main);
        callback(info);
      });
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }
}
