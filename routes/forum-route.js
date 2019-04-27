    // Libraries
var express = require("express"),
    router = express.Router(),
    csrf = require("csurf"),
    csrfProtection = csrf({ cookie: false }),
    // Custom libraries
    tools = require("../utility_lib/tools"),
    groups = require("../config/groups.json"),
    // DB models
    Users = require("../models/users"),
    Posts = require("../models/posts"),
    PostReplies = require("../models/post_replies"),
    PostLocations = require("../models/post_locations"),
    PostCategories = require("../models/post_categories");

// --- GET Routes ---

// GET - Category index route
router.get("/", csrfProtection, function(req, res, next) {
  PostLocations.find({}, "location locationString category categoryString order perm postCount replyCount archived").sort({order: 1}).exec().then(function(locations) {
    if(locations == []) { // DB output check
      return next({code: 404});
    }
    PostCategories.find({}, "category categoryString order archived").sort({order: 1}).exec().then(function(categories) {
      if(categories == []) { // DB output check
        return next({code: 404});
      }
      Users.find({}, "").limit(5).sort({joinDate: -1}).exec().then(function(users) {
        Posts.find({}, "").limit(10).sort({date: -1}).lean().exec().then(function(threads) {
          var userArray = [];
          for(var i in threads) {
            userArray.push(threads[i].author);
          }
          Users.find({_id: {$in: userArray}}, "").exec().then(function(threadUsers) {
            for(var i in threads) {
              for(var ii in threadUsers) {
                if(threads[i].author == threadUsers[ii]._id) {
                  threads[i].authorInfo = threadUsers[ii];
                }
              }
            }
            res.render("pages/forum/forum_index", {
              locations: locations,
              categories: categories,
              groups: groups,
              newUsers: users,
              newThreads: threads,

              getTimeElapsed: tools.getTimeElapsed,
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
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// GET - Forum index route
router.get("/category/:category", csrfProtection, function(req, res, next) {
  PostLocations.find({category: req.params.category}, "location locationString category categoryString order perm postCount replyCount archived").sort({order: 1}).exec().then(function(locations) {
    if(locations == []) { // DB output check
      return next({code: 404});
    }
    PostCategories.findOne({category: req.params.category}, "category categoryString order postCount replyCount archived").exec().then(function(category) {
      if(category == null) { // DB output check
        return next({code: 404});
      }
      Users.find({}, "").limit(5).sort({joinDate: -1}).exec().then(function(users) {
        Posts.find({}, "").limit(10).sort({date: -1}).lean().exec().then(function(threads) {
          var userArray = [];
          for(var i in threads) {
            userArray.push(threads[i].author);
          }
          Users.find({_id: {$in: userArray}}, "").exec().then(function(threadUsers) {
            for(var i in threads) {
              for(var ii in threadUsers) {
                if(threads[i].author == threadUsers[ii]._id) {
                  threads[i].authorInfo = threadUsers[ii];
                }
              }
            }
            res.render("pages/forum/forum_sub_index", {
              locations: locations,
              category: category,
              groups: groups,
              newUsers: users,
              newThreads: threads,

              getTimeElapsed: tools.getTimeElapsed,
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
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// GET - Forum page
router.get("/info", csrfProtection, function(req, res, next) {
  var forum = req.query.forum;
  if(req.query.page) {
    req.query.page = parseInt(req.query.page);
    if(typeof req.query.page != "number" || !Number.isInteger(req.query.page)) {
      return next({code: 500});
    }
    var page = req.query.page;
    var skip = req.query.page * 20;
  } else {
    var page = 0;
    var skip = 0;
  }
  if(page < 0) { // Request check
    return next({code: 404});
  }
  Posts.find({location: req.query.forum, pinned: false}, "title body author pinned locked date viewInfo replyCount editInfo").limit(20).skip(skip).sort({date: -1}).lean().exec().then(function(threads) {
    Posts.find({location: req.query.forum, pinned: true}, "title body author pinned locked date viewInfo replyCount editInfo").sort({date: -1}).lean().exec().then(function(pinnedThreads) {
      for(var i in pinnedThreads) {
        threads.splice(0, 0, pinnedThreads[i]);
      }
      for(var i in threads) {
        threads[i].body = tools.sanitizeBody(threads[i].body);
        threads[i].permission = {
          isLoggedIn: tools.authenticator(req.user, 5),
          isAdmin: tools.authenticator(req.user, 75),
          isAuthor: (tools.authenticator(req.user, 5)) ? req.user._id == threads[i].author : false
        }
      }
      Posts.count({location: req.query.forum, pinned: false}).exec().then(function(max) {
        if(max == null) { // DB output check
          return next({code: 500});
        } if(skip > max) { // DB output/request check
          return next({code: 404});
        }
        var data = {threads: threads, max: max, forum: req.query.forum};
        res.status(200).send(data);
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

// GET - Sub forums
router.get("/sub/:location", csrfProtection, function(req, res, next) {
  PostLocations.find({}, "location locationString category perm").exec().then(function(forums) {
    for(var i in forums) {
      if(forums[i].location == req.params.location) {
        var location = forums[i];
      }
    }
    PostCategories.findOne({category: location.category}, "category categoryString").exec().then(function(category) {
      if(category == null) { // DB output check
        return next({code: 500});
      }
      Users.find({}, "").limit(5).sort({joinDate: -1}).exec().then(function(users) {
        Posts.find({}, "").limit(10).sort({date: -1}).lean().exec().then(function(threads) {
          var userArray = [];
          for(var i in threads) {
            userArray.push(threads[i].author);
          }
          Users.find({_id: {$in: userArray}}, "").exec().then(function(threadUsers) {
            for(var i in threads) {
              for(var ii in threadUsers) {
                if(threads[i].author == threadUsers[ii]._id) {
                  threads[i].authorInfo = threadUsers[ii];
                }
              }
            }
            res.render("pages/forum/forum_sub", {
              forums: forums,
              location: location,
              category: category,
              newUsers: users,
              newThreads: threads,

              getTimeElapsed: tools.getTimeElapsed,
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
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// GET - Replies
router.get("/replies/info/:postId", csrfProtection, function(req, res, next) {
  if(req.query.page) {
    req.query.page = parseInt(req.query.page);
    if(typeof req.query.page != "number" || !Number.isInteger(req.query.page)) {
      return next({code: 500});
    }
    var page = parseInt(req.query.page);
    var skip = parseInt(req.query.page) * 10;
  } else {
    var page = 0;
    var skip = 0;
  }
  if(page < 0) { // Request check
    return next({code: 404});
  }
  Posts.findOne({_id: req.params.postId}, "").lean().exec().then(function(post) {
    if(post == null) { // DB output check
      return next({code: 404});
    }
    PostReplies.find({parentID: req.params.postId}, "parentID body author date editInfo").limit(10).skip(skip).lean().exec().then(function(replies) {
      PostReplies.count({parentID: req.params.postId}).exec().then(function(max) {
        if(max == null) { // DB output check
          return next({code: 500});
        } if(skip > max) { // DB output/request check
          return next({code: 404});
        }
        replies.unshift(post);
        for(var i in replies) { // Sanitizes reply body
          replies[i].body = tools.sanitizeBody(replies[i].body);
          replies[i].permission = {
            isLoggedIn: tools.authenticator(req.user, 5),
            isAdmin: tools.authenticator(req.user, 75),
            isAuthor: (tools.authenticator(req.user, 5)) ? req.user._id == replies[i].author : false
          }
        }
        var data = {replies: replies, max: max};
        res.status(200).send(data);
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

// GET - Post page
router.get("/:id", csrfProtection, function(req, res, next) {
  Posts.findOne({_id: req.params.id}, "_id title body author date location pinned locked editInfo viewInfo").exec().then(function(post) {
    // View counter
    if(!tools.authenticator(req.user, 5)) {
      if(!viewCheckIP(req, post)) {
        post.viewInfo.push({ip: req.ip.substr(7)});
      }
    } else {
      if(!viewCheckUsername(req, post)) {
        if(!viewCheckIP(req, post)) {
          post.viewInfo.push({ip: req.ip.substr(7), username: req.user.username});
        } else {
          for(key in post.viewInfo) {
            if(post.viewInfo[key].ip == req.ip.substr(7)) {
              post.viewInfo[key].username = req.user.username;
            }
          }
        }
      }
    }
    Posts.updateOne({_id: req.params.id}, {$set:{"viewInfo": post.viewInfo}}).exec().then(function() {
      PostLocations.findOne({location: post.location}, "location locationString category perm").exec().then(function(location) {
        if(location == null) { // DB output check
          return next({code: 404});
        }
        PostCategories.findOne({category: location.category}, "category categoryString").exec().then(function(category) {
          if(category == null) { // DB output check
            return next({code: 404});
          }
          res.render("pages/forum/forum_post", {
            post: post,
            location: location,
            category: category,

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
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// --- POST Routes ---

// POST - Add post
router.post("/add", csrfProtection, function(req, res, next) {
  PostLocations.findOne({location: req.query.forum}, "location locationString postCount perm").exec().then(function(forum) {
    if(forum == null) { // DB output check
      return next({code: 404});
    } if(!tools.authenticator(req.user, forum.perm)) { // Authorization
      return next({code: 403})
    }
    // Input validation
    var errors = [];

    if(typeof req.body.title != "string") {
      errors.push({error: "titleInvalid", message: "Title is invalid.", fields: ["title"]});
    } else if(req.body.title.length < 10 || req.body.title.length > 40) {
      errors.push({error: "titleInvalidLength", message: "Titles must be between 10 and 40 characters.", fields: ["title"]});
    }
    if(typeof req.body.body != "string") {
      errors.push({error: "bodyInvalid", message: "Body is invalid.", fields: ["body"]});
    } else if(req.body.body.length < 20 || req.body.body.length > 5000) {
      errors.push({error: "bodyInvalidLength", message: "Posts must be between 20 and 5,000 characters.", fields: ["body"]});
    }

    if(errors.length != 0) {
      res.status(500).send({message: "errors", errors: errors});
      return next();
    }
    PostLocations.update({location: forum.location}, {$set:{"postCount": forum.postCount += 1}}).exec().then(function() {
      var newPost = new Posts();
      newPost.title = req.body.title;
      newPost.body = req.body.body;
      newPost.author = req.user._id;
      newPost.location = forum.location;
      newPost.viewInfo = [{username: req.user.username, ip: req.ip.substr(7)}];
      newPost.save().then(function() {
        res.status(200).send("success");
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

// POST - Edit post
router.post("/edit/:id", csrfProtection, function(req, res, next){
  Posts.findOne({_id: req.params.id}, "editInfo author").exec().then(function(post) {
    if(post == null) { // DB output check
      return next({code: 404});
    } if(!tools.authenticator(req.user, 5)) { // Authorization
      return next({code: 403});
    } if(!tools.authenticator(req.user, 75) && req.user._id != post.author) { // Authorization
      return next({code: 403});
    }

    // Input validation
    var errors = [];

    if(typeof req.body.title != "string") {
      errors.push({error: "titleIsInvalid", message: "Title is invalid.", fields: ["title"]});
    } else if(req.body.title.length < 10 || req.body.title.length > 40) {
      errors.push({error: "titleInvalidLength", message: "Titles must be between 10 and 40 characters.", fields: ["title"]});
    }
    if(typeof req.body.body != "string") {
      errors.push({error: "bodyIsInvalid", message: "Dody is invalid.", fields: ["body"]});
    } else if(req.body.body.length < 20 || req.body.body.length > 5000) {
      errors.push({error: "bodyInvalidLength", message: "Posts must be between 20 and 5,000 characters.", fields: ["body"]});
    }

    if(errors.length != 0){
      res.status(500).send({message: "errors", errors: errors});
      return next();
    }
    post.editInfo.push({author: req.user._id, date: new Date().toISOString()})
    var editPost = {
      title: req.body.title,
      body: req.body.body,
      editInfo: post.editInfo
    }
    Posts.updateOne({_id: req.params.id}, {$set:editPost}).exec().then(function() {
      res.status(200).send("success");
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// POST - Add reply
router.post("/replies/add/:id", csrfProtection, function(req, res, next) {
  Posts.findOne({_id: req.params.id}, "title replyCount location").exec().then(function(post) {
    if(post == null) { // DB output check
      return next({code: 404});
    }
    PostLocations.findOne({location: post.location}, "location replyCount perm").exec().then(function(location) {
      if(!tools.authenticator(req.user, location.perm)) { // Authorization
        return next({code: 403});
      }
      var errors = [];
      // Input validation
      if(typeof req.body.body != "string") {
        errors.push({error: "bodyInvalid", message: "Body is invalid.", fields: ["body"]});
      } else if(req.body.body.length < 20 || req.body.body.length > 5000) {
        errors.push({error: "bodyInvalidLength", message: "Replies must be between 20 and 5,000 characters.", fields: ["body"]});
      }
      if(errors.length != 0) {
        res.status(500).send({message: "errors", errors: errors});
        return next();
      }
      var postReply = new PostReplies();
      postReply.body = req.body.body;
      postReply.author = req.user._id;
      postReply.parentID = req.params.id;
      postReply.parentTitle = post.title;
      postReply.save().then(function() {
        var newCount = post.replyCount + 1;
        Posts.updateOne({_id: req.params.id}, {$set:{replyCount: newCount}}).exec().then(function() {
          PostLocations.update({location: location.location}, {$set:{replyCount: location.replyCount += 1}}).exec().then(function() {
            res.status(200).send("success");
          }).catch(function(err) {
            return next({code: 500, full: err});
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
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// POST - Edit reply
router.post("/replies/edit/:id", csrfProtection, function(req, res, next){
  PostReplies.findOne({_id: req.params.id}, "author parentID editInfo").exec().then(function(reply) {
    if(reply == null) { // DB output check
      return next({code: 404});
    } if(!tools.authenticator(req.user, 5)) { // Authorization
      return next({code: 403});
    } if(!tools.authenticator(req.user, 75) && req.user._id != reply.author) { // Authorization
      return next({code: 403});
    }
    // Input validation
    var errors = [];

    if(typeof req.body.body != "string") {
      errors.push({error: "bodyInvalid", message: "Body is invalid.", fields: ["body"]});
    } else if(req.body.body.length < 20 || req.body.body.length > 5000) {
      errors.push({error: "bodyInvalidLength", message: "Replies must be between 20 and 5,000 characters.", fields: ["body"]});
    }

    if(errors.length != 0) {
      res.status(500).send({message: "errors", errors: errors});
      return next();
    }
    reply.editInfo.push({author: req.user._id, date: new Date().toISOString()})
    var editReply = {
      body: req.body.body,
      editInfo: reply.editInfo
    }
    PostReplies.updateOne({_id: req.params.id}, {$set: editReply}).exec().then(function() {
      res.status(200).send("success");
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// POST - Pin post
router.post("/pin/:id", csrfProtection, function(req, res, next) {
  if(!tools.authenticator(req.user, 75)) { // Authorization
    return next({code: 403});
  }
  Posts.findOne({_id: req.params.id}, "pinned").exec().then(function(post) {
    if(post == null) { // DB output check
      return next({code: 404});
    }
    Posts.updateOne({_id: req.params.id}, {$set:{pinned: !post.pinned}}).exec().then(function() {
      res.status(200).send("success");
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// POST - Lock post
router.post("/lock/:id", csrfProtection, function(req, res, next) {
  if(!tools.authenticator(req.user, 75)) { // Authorization
    return next({code: 403});
  }
  Posts.findOne({_id: req.params.id}, "locked").exec().then(function(post) {
    if(post == null) { // DB output check
      return next({code: 404});
    }
    Posts.updateOne({_id: req.params.id}, {$set:{locked: !post.locked}}).exec().then(function(err) {
      res.status(200).send("success");
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// --- DELETE Routes ---

// DELETE - Delete post
router.delete("/delete/:id", csrfProtection, function(req, res, next) {
  Posts.findOne({_id: req.params.id}, "location replyCount author").exec().then(function(post) { // Finds target post
    if(post == null) { // DB output check
      return next({code: 500});
    } if(!tools.authenticator(req.user, 75) && req.user._id != post.author) { // Authorization
      return next({code: 403});
    }
    PostLocations.findOne({location: post.location}, "location postCount replyCount").exec().then(function(location) { // Finds post's forum
      PostLocations.updateOne({location: location.location}, {$set:{"replyCount": location.replyCount -= post.replyCount, "postCount": location.postCount -= 1}}).exec().then(function() { // Updates post's forum with new reply and post count
        PostReplies.remove({parentID: req.params.id}).exec().then(function(err) { // Removes post's replies
          Posts.remove({_id: req.params.id}).exec().then(function() { // Removes post
            res.status(200).send(location.location);
          }).catch(function(err) {
            return next({code: 500, full: err});
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
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

// DELETE - Delete reply
router.delete("/replies/delete/:id", csrfProtection, function(req, res, next) {
  PostReplies.findOne({_id: req.params.id}, "parentID author").exec().then(function(reply) { // Finds reply
    if(reply == null) { // DB output check
      return next({code: 404});
    } if(!tools.authenticator(req.user, 5)) { // Authorization
      return next({code: 403});
    } if(!tools.authenticator(req.user, 75) && req.user._id != reply.author) { // Authorization
      return next({code: 403});
    }
    Posts.findOne({_id: reply.parentID}, "replyCount location").exec().then(function(post) { // Finds reply's post
      if(post == null) { // DB output check
        return next({code: 500});
      }
      Posts.updateOne({_id: reply.parentID}, {$set:{replyCount: post.replyCount -= 1}}).exec().then(function() { // Updates reply's post with updated reply count
        PostLocations.findOne({"location": post.location}, "location replyCount").exec().then(function(location) { // Finds reply's forum
          PostLocations.updateOne({"location": location.location}, {$set:{"replyCount": location.replyCount -= 1}}).exec().then(function() { // Updates reply's forum with updates reply count
            PostReplies.remove({"_id": req.params.id}).exec().then(function() { // Remove reply
              res.status(200).send("success");
            }).catch(function(err) {
              return next({code: 500, full: err});
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
    }).catch(function(err) {
      return next({code: 500, full: err});
    });
  }).catch(function(err) {
    return next({code: 500, full: err});
  });
});

function viewCheckIP(req, post) {
  for(key in post.viewInfo) {
    if(post.viewInfo[key].ip == req.ip.substr(7)) {
      return true;
    }
  }
  return false;
};
function viewCheckUsername(req, post) {
  for(key in post.viewInfo) {
    if(post.viewInfo[key].username == req.user.username) {
      return true;
    }
  }
  return false;
};

module.exports = router;
