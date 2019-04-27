var mongoose = require("mongoose");

// Article Schema
var struggleRaidSchema = mongoose.Schema({
  offense:{
    type: Object,
    require: true
  },
  defence:{
    type: Object,
    require: true
  },
  results:{
    type: Object,
    require: true
  },
  status:{
    type: String,
    require: true
  },
  raidStart:{
    type: Date,
    require: true
  },
  raidEnd:{
    type: Date,
    require: true
  },
  viewed:{
    type: Array,
    require: true,
    default: []
  },
  targetVillageID:{
    type: String,
    require: true
  }
}, {collection: "struggleraid"});

var StruggleRaid = module.exports = mongoose.model("StruggleRaid", struggleRaidSchema);
