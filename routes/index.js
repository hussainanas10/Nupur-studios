var express = require('express');
const bodyParser = require('body-parser');
const Products = require('../models/products')
const User = require('../models/user');
const Cart = require('../models/cart');
const Categories = require('../models/categories');
const Reviews = require('../models/reviews');
const Settings = require('../models/settings');
const Dashboard = require('../models/dashboard');
const Post = require('../models/posts');
var nodemailer = require("nodemailer");
var passport = require('passport');
var multer  = require('multer');
// const { model } = require('mongoose');
var router = express.Router();

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next()
  else
    res.redirect('/');

}

var storage = multer.diskStorage({
  destination: process.cwd()+'/public/images/uploads',
  filename: function(req,file,cb){
          console.log(file.originalname);             
          cb(null,file.originalname);
  }
});
var upload = multer({storage:storage});


router.use(bodyParser.json());

router.get('/',function(req, res, next) {
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
  Products.find({})
  .then((products)=>{
      Categories.find({})
      .then((categories)=>{
        req.session.destroy();
        res.render('home',{products:products,categories:categories});
      })  
    })
  })
});



router.post('/login', (req, res, next) => {
  passport.authenticate('local',(err,user,info)=>{
    if (err) {
      return next(err); // will generate a 500 error
    }

    if (!user) {
      req.flash('success_msg','Wrong Login or Password');
      res.redirect(req.get('referer'))
      next
    }
    console.log(user.password);
    if(user.isVerified == false){
      req.flash('success_msg','Email not verified');
      res.redirect(req.get('referer'))
      next
    }
    
    if(req.body.password != user.password)
    req.login(user, function(err){
      if(err){
        return next(err);
      }
      req.session.loggedin = true;
      res.statusCode = 200;
      res.redirect('/home');
      next;        
    });
  })(req, res,next);
  
});

router.post('/home', function (req, res, next) {
  res.redirect('/home')
})


router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.loggedin = false;
    req.session.destroy;
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/register',function(req,res){
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    // console.log("1212"+settings);
    res.render('my-account',{settings:settings})
  })
})
router.get('/about',function(req,res){
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    res.render('about',{settings:settings})
  })
})

router.get('/contact',function(req,res){
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    res.render('contact',{settings:settings})
  })
})
router.post('/contact',function(req,res){
  Settings.findOne({name:'nupur'})
  .then((setting)=>{
    // console.log(setting);
    var smtpTransport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
          user: setting.emailEmail,
          pass: setting.emailPassword,
        
        }
      
    });
    
    var mailOptions;
    mailOptions={
      from: req.body.email,
      to : setting.emailEmail,
      subject : "Hi, "+req.body.email+" wants to contact u",
      html : "<html><p>Hi i am, "+req.body.username+","+req.body.message+".<br> Best regards,"+req.body.username+"</p></html>"
      }
      smtpTransport.sendMail(mailOptions, function(error, response){
      if(error){
              // console.log(error);
              res.end("error");
      }else{
              res.redirect(req.get('referer'))
              // console.log("Message sent: " + response.message);
          }
      }); 
  })

})


router.get('/blog',function(req,res){
  Post.Posts.find({})
  .then((posts)=>{
    Post.PostCategory.find({})
    .then((categories)=>{
      Post.PostTag.find({})
      .then((tags)=>{
        res.render('blog',{posts:posts,categories:categories,tags:tags})
      })
    })
  })
})

router.get('/blog/:blogId',function(req,res){
  Post.Posts.find({})
  .then((posts)=>{
    Post.Posts.findById(req.params.blogId)
    .populate({
      path:'comments',
      populate:{
        path:'user',
        model:'User'
      }
    })
    .exec()
    .then((post)=>{
      Post.PostCategory.find({})
      .then((categories)=>{
        Post.PostTag.find({})
        .then((tags)=>{
          res.render('single-blog',{post:post,posts:posts,categories:categories,tags:tags})
        })
      })
    })
  })
  // res.render('single-blog')
})

router.post('/blog/comment/:blogId',function(req,res){
  if(req.user){
    Post.Posts.findByIdAndUpdate(req.params.blogId,{$push:{comments:{user:req.user.id,comment:req.body.comment,date:Date.now()}}})
    .then((post)=>{
      res.redirect(req.get('referer'))
    })
  }else{
    res.redirect(req.get('referer'))
  }
})

router.route('/dashboard')
.get(isLoggedIn,(req,res)=>{
   if(req.session.loggedin){
        User.findById(req.user.id)
        .then((user)=>{
            Dashboard.Messages.find({$or:[{senderId:req.user.id},{recieverId:req.user.id}]})
            .then((messages)=>{
                Dashboard.Orders.findOne({userId:req.user.id})
                .populate({
                    path:'items',
                    populate:{
                        path:'productId',
                        model:'Products'
                    }
                })
                .exec()
                .then((orders)=>{
                    Dashboard.Saved.findOne({userId:req.user.id})
                    .then((saved)=>{
                        var revenue =0;
                        if(orders.items){
                          for(var i=0;i<=orders.items.length-1;i++){
                            if(orders.items[i].plan=="basic"){
                              revenue+=orders.items[i].productId.basicPrice*orders.items[i].qty;
                            }
                            else if(orders.items[i].plan=="standard"){
                              revenue+=orders.items[i].productId.standardPrice*orders.items[i].qty;
                            }
                            else if(orders.items[i].plan=="premium"){
                              revenue+=orders.items[i].productId.premiumPrice*orders.items[i].qty;
                            }
                          }
                        }

                        res.render('dashboard',{user:user, messages:messages, orders:orders , saved:saved,revenue:revenue});  
                    })
                })
            })    
        })

   }else{
    res.redirect('/');
   }
})
.post((req,res)=>{ 
    if(req.body.currentPassword != ""){
        if(req.body.currentPassword == user[0].password){
            if(req.body.newPassword == req.body.confirmPassword){
                User.findByIdAndUpdate(req.user.id,{$set: { password:req.body.newPassword,firstName:req.body.firstName,lastName:req.body.lastName,username:req.body.username,email:req.body.email}},{new:true})
                .then((user)=>{
                    res.redirect(req.get('referer'));
                })

            }else{
                req.flash('error_msg','new password and confirm password do not match')
                res.redirect(req.get('referer'));

            }
        }else{
            req.flash('error_msg','wrong current passsword')
            res.redirect(req.get('referer'));
        }

    }else{

        User.findByIdAndUpdate(req.user.id,{$set: {firstName:req.body.firstName,lastName:req.body.lastName,username:req.body.username,email:req.body.email}},{new:true})
        .then((user)=>{
            res.redirect(req.get('referer'));
        })    
    }
});


router.route('/categories')
.get((req,res)=>{
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    Products.find({category:(req.query.category).toString().split('+').join(' ')})
    .then((products)=>{        
      res.render('category',{category:(req.query.category).toString().split('+').join(' '), products:products,settings:settings});
  })
  })

})

router.route('/categories/list')
.get((req,res)=>{
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    Products.find({category:(req.query.category).toString().split('+').join(' ')})
      .then((products)=>{
          res.render('product-list',{category:(req.query.category).toString().split('+').join(' '), products:products,settings:settings});
    })
  });
})

router.route('/products/details/:productId')
.get((req,res)=>{
        Products.findById(req.params.productId)
        .then((product)=>{
            Products.find({category: product.category})
            .then((products)=>{
                Reviews.find({productId:req.params.productId})
                .populate("productId userId")
                .exec()
                .then((reviews)=>{
                        var r5=0,r4=0,r3=0,r2=0,r1=0,avg=0;
                        if(reviews.length){
                          for(var i=0;i<=reviews.length-1;i++){
                            if(reviews[i].rating == '1')r1++;
                            if(reviews[i].rating == '2')r2++;
                            if(reviews[i].rating == '3')r3++;
                            if(reviews[i].rating == '4')r4++;
                            if(reviews[i].rating == '5')r5++;
                            avg=reviews[i].rating;
                        }
                        avg = Math.round(avg/(reviews.length*5)*5);
                        }
                        var rating ={
                            'r1':r1,
                            'r2':r2,
                            'r3':r3,
                            'r4':r4,
                            'r5':r5,
                            'avg':avg
                        }
                        console.log(avg);
                        
                        product.rating = rating.avg;
                        product.save()
                        .then(()=>{
                          res.render('product-details',{product:product , products:products, reviews:reviews, rating:rating});
                        })  
                })
            })
        })
})

router.route('/products/reviews/:productId')
.post((req,res)=>{

    if(req.session.loggedin){
        var review = {
            "productId":req.params.productId,
            "comment":req.body.comment,
            "rating":req.body.rating,
            "userId":req.session.userId
        }
        Reviews.create(review)
        .then(()=>{
            res.redirect(req.get('referer'));
        })                
    }else{
        res.redirect('/')
    }

})

router.route('/products/favorites/:productId')
.get((req,res)=>{
    if(req.session.loggedin){
        Products.findById(req.params.productId)
        .then((product)=>{
            product.favorites++;
            product.save()
            .then((product)=>{
                Dashboard.Saved.findOne({userId:req.user.id})
                .then((saved)=>{
                        Dashboard.Saved.update({userId:req.user.id},{$push: {productId: req.params.productId }},{new:true})
                        .then((results)=>{
                            res.redirect(req.get('referer'))
                        })
                })
            });
        })
    }else{
        req.flash('error_msg','Login to add to Favorites')
        res.redirect(req.get('referer'));
    }
})


router.route('/profile')
.get(isLoggedIn,(req,res,next)=>{
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    User.findById(req.user.id)
    .then((user)=>{
      res.render('user',{user:user,settings:settings})
    })
  });
})
.post(upload.single('profilePhoto'),(req,res,next)=>{
  User.findByIdAndUpdate(req.user.id,{$set:{
    profilePhoto:req.file.filename,
    username:req.body.username,
    email:req.body.email,
    firstName:req.body.firstName,
    lastName:req.body.lastName,
    address:req.body.address,
    city:req.body.city,
    country:req.body.country,
    phone:req.body.phone,
    aboutme:req.body.aboutme,
  }})
  .then(()=>{
    res.redirect('/profile')
    next
  })
})

router.route('/messages')
.get(isLoggedIn,(req,res,next)=>{
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    Dashboard.Messages.find({})
    .then((messages)=>{
      res.render('messages',{messages:messages,settings:settings})
    })
  });
})
.post((req,res,next)=>{
  User.find({admin:true})
  .then((users)=>{
    var arr=[];
    for(var i=0;i<=users.length-1;i++){
      arr.push({senderId:req.user.id,recieverId:users[i].id,content:req.body.content})
    }
    Dashboard.Messages.insertMany(arr)
    .then(()=>{
      res.redirect('/messages')
      next
    })
  })
})

router.route('/orders')
.get(isLoggedIn,(req,res,next)=>{
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    Dashboard.Orders.findOne({userId:req.user.id})
    .populate({
        path:'items',
        populate:{
            path:'productId',
            model:'Products'
        }
    })
    .exec()
    .then((orders)=>{
      res.render('orders',{orders:orders,settings:settings})
    })
  });
})

router.route('/bookmarks')
.get(isLoggedIn,(req,res,next)=>{
  Settings.findOne({name:'nupur'})
  .then((settings)=>{
    Dashboard.Saved.findOne({userId:req.user.id})
    .populate("productId")
    .exec()
    .then((saved)=>{
        res.render('bookmarks',{saved:saved,settings:settings})
    })
  });
})
module.exports = router;
