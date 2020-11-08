const express = require('express');
const bodyParser = require('body-parser');
const cartRouter = express.Router();
const Products = require('../models/products')
const User = require('../models/user')
const Cart = require('../models/cart')
const Coupons = require('../models/coupons')
const Categories = require('../models/categories');
const Dashboard = require('../models/dashboard');
const checksum_lib = require('../paytm/checksum.js');
const Settings = require('../models/settings');
cartRouter.use(bodyParser.urlencoded({extended: true}));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
      return next()
    else
      res.redirect('/');
  
  }
  

cartRouter.route('/')
.get(isLoggedIn,(req,res)=>{
    if(req.session.loggedin){
        Cart.findOne({userId:req.user.id})
        .populate({
            path:'items',
            populate:{
                path:'productId',
                model:'Products'
            }
        })
        .exec()
        .then((cart)=>{
                var tot=0;
                for(var i=0;i<=cart.items.length-1;i++) {
                if(cart.items[i].plan == "basic") {
                    tot+=cart.items[i].qty*cart.items[i].productId.basicPrice;
                }else if(cart.items[i].plan == "standard"){
                    tot+=cart.items[i].qty*cart.items[i].productId.standardPrice;
                }else if(cart.items[i].plan == "premium"){
                    tot+=cart.items[i].qty*cart.items[i].productId.premiumPrice;
                }
                }
                cart.total = tot;
                cart.discount = 0;
                cart.save()
                .then(()=>{
                    req.flash('success_msg','This is cart')
                    res.render('cart',{cart:cart});
                })
        })
    }else{
        req.flash('success_msg','You are not Logged in')
        res.redirect(req.get('referer'))
        next();
    }
})

cartRouter.route('/coupon')
.post((req,res,next)=>{
    Coupons.findOne({code:req.body.coupon})
    .then((coupon)=>{
        if(coupon){
            if(coupon.status == "Active"){
                if(coupon.type=="Fixed"){
                    Cart.findOneAndUpdate({userId:req.user.id},{$set:{discount:coupon.value}})
                    .then(()=>{
                        res.redirect('/cart')
                        next 
                    })
                }else{
                    Cart.findOne({userId:req.user.id})
                    .then((cart)=>{
                        cart.discount = (coupon.value*cart.total)/100;
                        cart.save()
                        .then(()=>{
                            res.redirect('/cart')
                            next
                        })
                    })
                }
            }else{
                req.flash('success_msg',"Invalid Coupon");
                res.locals.redirect = "/cart";
                next();
            }
        }else{
            req.flash('success_msg',"Invalid Coupon");
            res.locals.redirect = "/cart";
            next();
        }
    })
})

cartRouter.route('/add/:productId')
.get(isLoggedIn,(req,res,next)=>{
    if(req.session.loggedin){
        Cart.findOne({userId:req.user.id})
        .then((cart)=>{
                Cart.update({userId:req.user.id},{$push: {items: {productId: req.params.productId, plan:req.query.plan,qty:1} }},{new:true})
                .then((results)=>{
                    res.redirect('/cart')
                    next
                })
        })
    }else{
        req.toastr.error('You are not Logged in')
        res.redirect('/')
    }
})

cartRouter.route('/increase/:productId')
.get(isLoggedIn,(req,res)=>{
    Cart.findOne({userId:req.user.id})
        .then((cart)=>{
            for(var i=0;i<=cart.items.length-1;i++) {
               if(cart.items[i].productId == req.params.productId){
                   cart.items[i].qty++;
               }
            }
            cart.save()
            .then(()=>{
                res.redirect("/cart")
                next
            })
            
        })
})

cartRouter.route('/decrease/:productId')
.get(isLoggedIn,(req,res)=>{
    Cart.findOne({userId:req.user.id})
    .then((cart)=>{
        for(var i=0;i<=cart.items.length-1;i++) {
           if(cart.items[i].productId == req.params.productId){
               cart.items[i].qty--;
           }
        }
        cart.save()
        .then(()=>{
            res.redirect("/cart")
            next
        })
        
    })
})

cartRouter.route('/remove/:productId')
.get(isLoggedIn,(req,res,next)=>{
    if(req.session.loggedin){
        Cart.findOne({userId:req.user.id})
        .then((cart)=>{
            for(var i=0;i<=cart.items.length-1;i++) {
                if(cart.items[i].productId == req.params.productId){
                    cart.items[i].remove();
                }
            }
            cart.save()
            .then(()=>{
                res.redirect("/cart");
                next
            })           
        })
    }else{
        req.flash('success_msg','You are not Logged in')
        res.redirect('/')
    }
})

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

cartRouter.route('/checkout')
.get(isLoggedIn,(req,res,next)=>{
    if(req.session.loggedin){
        var price=req.query.price;
        Cart.findOne({userId:req.user.id})
        .then((cart)=>{
            var arr=[];
            var orderId = makeid(5);
            for(var i=0;i<=cart.items.length-1;i++){
              arr.push({productId:cart.items[i].productId,qty:cart.items[i].qty,plan:cart.items[i].plan,date:Date.now(),orderId:orderId,})
            }
            Dashboard.Orders.findOneAndUpdate({userId:req.user.id},{$push:{items:arr}},{new:true})
            .then((orders)=>{
                for(var i=0;i<=cart.items.length-1;i++) {
                    cart.items[i].remove();      
                }
                cart.save()
                .then(()=>{
                    console.log(price);
                    Settings.findOne({name:'nupur'})
                    .then((setting)=>{
                       
                    var paytmParams = {
                        "MID" : setting.merchantId,
                        "WEBSITE" : setting.website,
                        "INDUSTRY_TYPE_ID" : setting.industryType,
                        "CHANNEL_ID" : setting.channelId,
                        "ORDER_ID" : 'TEST_'  + new Date().getTime(),
                        "CUST_ID" : req.user.id.toString(),
                        "MOBILE_NO" : req.user.phone,
                        "EMAIL" : req.user.email,
                        "TXN_AMOUNT" : price,
                        "CALLBACK_URL" : setting.callbackUrl,
                    };
                
                    checksum_lib.genchecksum(paytmParams, setting.merchantKey, function(err, checksum){
                        var url = setting.transactionUrl;
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.write('<html>');
                        res.write('<head>');
                        res.write('<title>Merchant Checkout Page</title>');
                        res.write('</head>');
                        res.write('<body>');
                        res.write('<center><h1>Please do not refresh this page...</h1></center>');
                        res.write('<form method="post" action="' + url + '" name="paytm_form">');
                        for(var x in paytmParams){
                            res.write('<input type="hidden" name="' + x + '" value="' + paytmParams[x] + '">');
                        }
                        res.write('<input type="hidden" name="CHECKSUMHASH" value="' + checksum + '">');
                        res.write('</form>');
                        res.write('<script type="text/javascript">');
                        res.write('document.paytm_form.submit();');
                        res.write('</script>');
                        res.write('</body>');
                        res.write('</html>');
                        res.end();
                    });
                    })
                })

            })
        })
    }
    else{

    }
})

module.exports = cartRouter;