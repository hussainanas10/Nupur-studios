var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var coupons = new Schema({
   name:{
    type:String,
   },
   code:{
    type:String,
   },
   type:{
    type:String,
   },
   value:{
    type:String,
   },
   status:{
    type:String,
   },
   startDate:{
    type:Date,
   },
   endDate:{
    type:Date,
   }
},{
    timestamps:true,
})

module.exports = mongoose.model('Coupons',coupons);