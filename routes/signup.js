var nodemailer = require("nodemailer");
var express = require('express');
var User = require('../models/user');
const Products = require('../models/products');
const Cart = require('../models/cart');
const Setting = require('../models/settings');
const Dashboard = require('../models/dashboard');
var registerRoute = express.Router();
var passport = require('passport');
const Settings = require("../models/settings");
const dotenv = require('dotenv').config();



var mailOptions,host,link;
let rand;
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 

registerRoute.route('/')
.post(function(req,res,next){
    // console.log(req.body);
// res.end('sent')
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: setting.emailEmail,
                pass: setting.emailPassword
            }
        });
      
        rand=makeid(12);
        host=req.get('host');
        link="http://"+req.get('host')+"/signup/verify?id="+rand;
        mailOptions={
        to : req.body.email,
        subject : "Please confirm your Email account",
        html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
        }
        smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
                console.log(error);
                res.end("error");
        }else{
                // console.log("Message sent: " + response.message);
                User.register(new User({username: req.body.username , email: req.body.email ,registerToken: rand }), 
                    req.body.password, (err, user) => {
                    if(err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                    }
                    else {
                    passport.authenticate('local')(req, res, () => {
                        Cart.create({userId:req.user.id});
                        Dashboard.Saved.create({userId:req.user.id})
                        Dashboard.Orders.create({userId:req.user.id})
                        res.statusCode = 200;
                        // req.flash('success_msg','please verify email sents');
                        res.end('sent')
                        // res.redirect(req.get('referer'))
                    });
                    }
                });
            }
        }); 
    })
   
})


registerRoute.route('/verify')
.get(function(req,res){
  console.log(req.protocol+":/"+req.get('host'));
      console.log("Domain is matched. Information is from Authentic email");

        User.findOneAndUpdate({ registerToken: req.query.id }, { $set: { isVerified: true } }, (err, user) => {
            if(!err){
                if(user){
                    res.redirect('/');
                }else if(!user){
                    res.send('invalid email')
                }
            }
            if (err) console.log("Something wrong when updating data!");

        });

})


module.exports = registerRoute;
