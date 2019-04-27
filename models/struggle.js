var mongoose = require("mongoose");

// Article Schema
var struggleSchema = mongoose.Schema({
  userID:{
    type: String,
    require: true
  },
  villageName:{
    type: String,
    require: true,
    default: "New Village"
  },
  money:{
    type: Number,
    require: true,
    default: 0
  },
  workers:{
    type: Object,
    require: true,
    default: {}
  },
  soldiers:{
    type: Object,
    require: true,
    default: {}
  },
  unitLayout:{
    type: Object,
    require: true,
    default: []
  },
  graceEnd:{
    type: Date,
    require: false
  },
  lastVisit:{
    type: Date,
    require: true,
    default: new Date()
  },
  tsSGID:{
    type: String,
    require: false
  },
}, {collection: "struggle"});

var Struggle = module.exports = mongoose.model("Struggle", struggleSchema);
