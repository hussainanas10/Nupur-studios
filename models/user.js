var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    isVerified:{
        type:Boolean,
        default:false,
    },
    username:{
        type:String,
    },
    registerToken:{
        type:String,
    },
    firstName:{
        type:String,
    },
    lastName:{
        type:String,
    },
    admin:   {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
        default:''
    },
    city: {
        type: String,
    },
    country: {
        type: String,
    },
    profilePhoto: {
        type:String
    },
    aboutme: {
        type:String
    },
    orders: [{ type:Schema.Types.ObjectId , ref: 'Orders' }],
    cart: [{ type:Schema.Types.ObjectId , ref: 'Cart' }],
    saved: [{ type:Schema.Types.ObjectId , ref: 'Saved' }],
    messages: [{ type:Schema.Types.ObjectId , ref: 'Messages' }]
});

User.plugin(passportLocalMongoose,{usernameField:'email'});


module.exports = mongoose.model('User', User);