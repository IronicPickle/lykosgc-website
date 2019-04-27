var mongoose = require("mongoose");

// Article Schema
var postLocationsSchema = mongoose.Schema({
  location:{
    type: String,
    require: true
  },
  locationString:{
    type: String,
    require: true
  },
  category:{
    type: String,
    require: true
  },
  order:{
    type: Number,
    require: true
  },
  perm:{
    type: Number,
    require: true
  },
  postCount:{
    type: Number,
    require: true,
    default: 0
  },
  replyCount:{
    type: Number,
    require: true,
    default: 0
  },
  archived:{
    type: Boolean,
    require: true,
    default: false
  }
}, {collection: "postlocations"});

var PostLocations = module.exports = mongoose.model("PostLocations", postLocationsSchema);
