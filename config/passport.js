var LocalStrategy = require("passport-local").Strategy,
    Users = require("../models/users"),
    bcrypt = require("bcryptjs");

module.exports = function(passport){
  // Local Strategy
  passport.use(new LocalStrategy(function(username, password, done){
    var errors = [];
    // Match Username
    Users.findOne({username:username}).exec().then(function(user) {
      if(!user) {
        errors.push({error: "usernameNoMatch", message: "Username doesn't match.", fields: ["username"]});
        errors.push({error: "passwordError", message: "", fields: ["password"]});
        return done(null, errors, null);
      }
      // Match password
      bcrypt.compare(password, user.password, function(err, isMatch) {

        if(err) return done(user, null, err);
        if(isMatch) {
          return done(user, null, null);
        } else {
          errors.push({error: "passwordIncorrect", message: "Password is incorrect.", fields: ["password"]});
          return done(null, errors, null);
        }
      });
    }).catch(function(err) {
      return done(null, null, err);
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(id, done) {
    Users.findById(id).exec().then(function(user) {
      done(null, user);
    }).catch(function(err) {
      done(err, null);
    });
  });

}
