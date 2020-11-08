var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pages = new Schema({
    name:{
        type:String,
    },
    url:{
        type:String
    },
})
const Pages = mongoose.model('pages',pages);

module.exports = Pages;