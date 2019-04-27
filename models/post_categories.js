var mongoose = require("mongoose");

// Article Schema
var postCategoriesSchema = mongoose.Schema({
  category:{
    type: String,
    require: true
  },
  categoryString:{
    type: String,
    require: true
  },
  order:{
    type: Number,
    require: true
  },
  archived:{
    type: Boolean,
    require: true,
    default: false
  }
}, {collection: "postcategories"});

var PostCategories = module.exports = mongoose.model("PostCategories", postCategoriesSchema);
