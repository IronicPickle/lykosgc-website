var mongoose = require("mongoose");

// Article Schema
var postSchema = mongoose.Schema({
  title:{
    type: String,
    require: true
  },
  body:{
    type: String,
    require: true
  },
  author:{
    type: String,
    require: true
  },
  location:{
    type: String,
    require: true
  },
  date:{
    type: Date,
    require: true,
    default: Date.now
  },
  replyCount: {
    type: Number,
    require: true,
    default: 0
  },
  pinned:{
    type: Boolean,
    required: true,
    default: false
  },
  locked:{
    type: Boolean,
    required: true,
    default: false
  },
  editInfo:{
    type: JSON,
    required: true,
    default: []
  },
  viewInfo:{
    type: JSON,
    required: true
  }
}, {collection: "posts"});

var Posts = module.exports = mongoose.model("Posts", postSchema);
