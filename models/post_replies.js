var mongoose = require("mongoose");

// Article Schema
var postRepliesSchema = mongoose.Schema({
  parentID:{
    type: String,
    require: true
  },
  parentTitle:{
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
  date:{
    type: Date,
    require: true,
    default: Date.now
  },
  pinned:{
    type: Boolean,
    required: false
  },
  editInfo:{
    type: JSON,
    required: true,
    default: []
  }
}, {collection: "postreplies"});

var PostReplies = module.exports = mongoose.model("PostReplies", postRepliesSchema);
