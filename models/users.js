var mongoose = require("mongoose");

// Article Schema
var usersSchema = mongoose.Schema({
  username:{
    type: String,
    require: true
  },
  password:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  dobDay:{
    type: String,
    required: true
  },
  dobMonth:{
    type: String,
    required: true
  },
  dobYear:{
    type: String,
    required: true
  },
  name:{
    type: String,
    require: false,
    default: ""
  },
  gender:{
    type: String,
    require: false,
    default: ""
  },
  country:{
    type: String,
    require: false,
    default: ""
  },
  city:{
    type: String,
    require: false,
    default: ""
  },
  tagLine:{
    type: String,
    require: false,
    default: "New Member"
  },
  imgRoute:{
    type: String,
    require: false,
    default: ""
  },
  joinDate:{
    type: Date,
    require: true,
    default: Date.now
  },
  groups:{
    type: Array,
    require: false,
    default: ["member"]
  },
  syncStage:{
    type: Number,
    require: false,
    default: 0
  },
  privKey:{
    type: String,
    require: false
  },
  syncRankID:{
    type: String,
    require: false
  },
  tsUUID:{
    type: String,
    require: false
  },
  tsCLDBID:{
    type: Number,
    require: false
  },
  active:{
    type: Boolean,
    required: true
  },
  confirmHash:{
    type: String,
    required: false
  },
  confirmExpiry: {
    type: Date,
    required: false
  },
  resetHash:{
    type: String,
    required: false
  },
  resetExpiry: {
    type: Date,
    required: false
  }
}, {collection: "users"});

var Users = module.exports = mongoose.model("Users", usersSchema);
