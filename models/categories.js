var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var categories = new Schema({
    category:{
        type:String,
    },
    status:{
        type:String,
    },
    reference:{
        type:String,
    },
    subcategories:[{
         type:String
    }],

    description:{
        type:String,
    }
})

module.exports = mongoose.model('Categories',categories);
