const express = require('express');
const multer = require('multer');
// const path = require('path')
const User = require('../models/user');
const Products = require('../models/products')
const Categories = require('../models/categories')
const Coupons = require('../models/coupons')
const Pages = require('../models/page')
const Settings = require('../models/settings')
const Menu = require('../models/menu')
const Dashboard = require('../models/dashboard')
const bodyParser = require('body-parser');
const adminRouter = express.Router();
const passport = require('passport');
const Post = require('../models/posts');


function isLoggedIn(req, res, next) {
    // console.log("hello" + req.isAuthenticated())
    if (req.isAuthenticated())
        if(req.user.admin == true){
            return next()            
        }else{
            res.redirect('/')
        }
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


adminRouter.use(bodyParser.urlencoded({extended: true}));

adminRouter.route('/')
.get((req,res)=>{
    req.session.destroy();
    res.render('admin/login')
})
.post((req,res,next)=>{
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
        
        if(user.admin == false){
            req.flash('success_msg','Email not verified');
            res.redirect(req.get('referer'))
            next 
        }
        req.login(user, function(err){
          if(err){
            return next(err);
          }
          req.session.loggedin = true;
          res.statusCode = 200;
          res.redirect('/admin/dashboard');
          next;        
        });
      })(req, res,next);             
});

adminRouter.route('/dashboard')
.get(isLoggedIn,(req,res)=>{
    User.find({})
    .then((users)=>{
        Products.find({})
        .then((products)=>{
            Dashboard.Orders.find({})
            .populate({
                path:'items',
                populate:{
                    path:'productId',
                    model:'Products'
                }
            })
            .populate('userId')
            .exec()
            .then((orders)=>{
                var orderNos=0,revenue=0;
                if(orders.length){
                    for(var i=0;i<=orders.length-1;i++){
                        if(orders[i].items.length){
                            for(var j=0;j<=orders[i].items.length-1;j++){
                                if(orders[i].items[j].plan=="basic"){
                                    revenue+=orders[i].items[j].productId.basicPrice*orders[i].items[j].qty;
                                }
                                else if(orders[i].items[j].plan=="standard"){
                                    revenue+=orders[i].items[i].productId.standardPrice*orders[i].items[j].qty;
                                }
                                else if(orders[i].items[j].plan=="premium"){
                                    revenue+=orders[i].items[j].productId.premiumPrice*orders[i].items[j].qty;
                                }
                                }
                        }
                        orderNos+=orders[i].items.length;
                    }
                }
                res.render('admin/index',{users:users ,orders:orders, products:products, orderNos:orderNos, revenue:revenue})  
            })
        })
    })
})

adminRouter.route('/reports')
.get(isLoggedIn,(req,res)=>{
    var date = new Date();
    var compMonth = date.getMonth()-1;
    var compYear = date.getFullYear();
    Dashboard.Orders.find({})
    .populate({
        path:'items',
        populate:{
            path:'productId',
            model:'Products'
        }
    })
    .populate('userId')
    .exec()
    .then((orders)=>{
        res.render('admin/reports',{compMonth:compMonth,compYear:compYear,orders:orders})
    })
})

adminRouter.route('/editProfile')
.get(isLoggedIn,(req,res)=>{
    res.render('admin/edit_profile',{user:req.user})
})
.post(upload.single('profilePhoto'),(req,res,next)=>{
    User.findByIdAndUpdate(req.user.id,{
        $set: {
        profilePhoto:req.file.filename,
        email:req.body.email,
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        phone:req.body.phone,
        }
    },{new:true})
    .then((user)=>{
        res.redirect('/admin/editProfile')
        next
    })
})

adminRouter.route('/changePassword')
.get(isLoggedIn,(req,res)=>{
    res.render('admin/change_password')
})
.post((req,res,next)=>{
    User.findById(req.user.id)
    .then((user)=>{
    if(req.body.newPassword == req.body.confirmPassword){
        user.changePassword(req.body.oldPassword,req.body.newPassword)
        .then(()=>{
            res.redirect('/admin/dashboard')
            next
        })
    }else{
        req.flash('success_msg',"passwords do not match")
        res.redirect('/admin');
        next
    }
    })
})


adminRouter.route('/updater')
.get(isLoggedIn,(req,res)=>{
        res.render('admin/updater')
})

adminRouter.route('/posts')
.get(isLoggedIn,(req,res)=>{
    Post.Posts.find({})
    .then((posts)=>{
        res.render('admin/posts',{posts:posts})
    })
})

adminRouter.route('/posts/delete/:postId')
.get(isLoggedIn,(req,res,next)=>{
    Post.Posts.findByIdAndDelete(req.params.postId)
    .then(()=>{
        res.redirect('/admin/posts')
        next
    })
})

adminRouter.route('/posts/popular/:postId')
.get(isLoggedIn,(req,res,next)=>{
    Post.Posts.findById(req.params.postId)
    .then((posts)=>{
        Post.Posts.findByIdAndUpdate(req.params.postId,{$set:{popular:!posts.popular}})
        .then(()=>{
            res.redirect('/admin/posts')
            next
        })
    })
})

var cpUpload = upload.fields([{ name: 'image', maxCount: 1 },{ name: 'cover', maxCount: 1 }]) 
adminRouter.route('/add-post')
.get(isLoggedIn,(req,res)=>{
    Post.PostCategory.find({})
    .then((categories)=>{
        res.render('admin/add_post',{categories:categories})
    })
})
.post(cpUpload,(req,res,next)=>{
    Post.Posts.create({
        title:req.body.title,
        author:req.body.author,
        content:req.body.content,
        image:req.files['image'][0].filename,
        cover:req.files['cover'][0].filename,
        category:req.body.category,
        tags:req.body.tags,
    })
    .then((posts)=>{
        res.redirect('/admin/posts')
        next
    })
})

adminRouter.route('/post-categories')
.get(isLoggedIn,(req,res)=>{
    Post.PostCategory.find({})
    .then((categories)=>{
        res.render('admin/post_categories',{categories:categories})
    })
})
.post((req,res,next)=>{
    Post.PostCategory.create(req.body)
    .then(()=>{
        res.redirect('/admin/post-categories')
        next
    })
})

adminRouter.route('/post-tags')
.get(isLoggedIn,(req,res)=>{
    Post.PostTag.find({})
    .then((tags)=>{
        res.render('admin/post_tags',{tags:tags})
    })
})
.post((req,res,next)=>{
    Post.PostTag.create(req.body)
    .then(()=>{
        res.redirect('/admin/post-tags')
        next
    })
})

adminRouter.route('/customers')
.get(isLoggedIn,(req,res)=>{
    User.find({})
    .then((users)=>{
    res.render('admin/customers',{users:users})
    })
})
adminRouter.route('/customers/:userId')
.get(isLoggedIn,(req,res)=>{
    User.findById(req.params.userId)
    .then((user)=>{
        res.render('admin/customer_view',{user:user})
    })
});

adminRouter.route('/customers/edit/:userId')
.get(isLoggedIn,(req,res)=>{
    User.findById(req.params.userId)
    .then((user)=>{
        res.render('admin/customer_edit',{user:user})
    })
})
.post((req,res,next)=>{
    User.findByIdAndUpdate(req.params.userId,{
        $set: req.body
    },{new:true})
    .then((user)=>{
        res.redirect('/admin/customers')
        next
    })
});

adminRouter.route('/customers/delete/:userId')
.get(isLoggedIn,(req,res,next)=>{
    User.findByIdAndDelete(req.params.userId)
    .then((users)=>{
        res.redirect('/admin/customers')
        next
    })
})

adminRouter.route('/orders')
.get(isLoggedIn,(req,res)=>{
    Dashboard.Orders.find({})
    .populate({
        path:'items',
        populate:{
            path:'productId',
            model:'Products'
        }
    })
    .populate('userId')
    .exec()
    .then((orders)=>{
        res.render('admin/orders',{orders:orders})
    })
})

adminRouter.route('/orders/:orderId')
.get(isLoggedIn,(req,res)=>{
    Dashboard.Orders.findById(req.params.orderId)
    .populate({
        path:'items',
        populate:{
            path:'productId',
            model:'Products'
        }
    })
    .populate('userId')
    .then((order)=>{
        res.render('admin/order_view',{order:order,item:req.query.item})
    })
})

adminRouter.route('/categories')
.get(isLoggedIn,(req,res)=>{
    Categories.find({})
    .then((categories)=>{
        res.render('admin/category',{categories:categories})
    })
})

adminRouter.route('/categories/edit/:categoryId')
.get(isLoggedIn,(req,res)=>{
    Categories.findById(req.params.categoryId)
    .then((category)=>{
        res.render('admin/edit_category',{category:category})
    })
})
.post((req,res,next)=>{
    Categories.findByIdAndUpdate(req.params.categoryId,{
        $set: req.body
    },{new:true})
    .then((category)=>{
        res.redirect('/admin/categories')
        next
    })
});

adminRouter.route('/categories/delete/:categoryId')
.get(isLoggedIn,(req,res,next)=>{
    Categories.findByIdAndDelete(req.params.categoryId)
    .then((category)=>{
        res.redirect('/admin/categories');
        next
    })
});

adminRouter.route('/add-category')
.get(isLoggedIn,(req,res)=>{
    res.render('admin/add_category')
})
.post((req,res,next)=>{
    var category = (req.body.category).toString().split(' ').join('').toLowerCase();
    Categories.create({
        category: req.body.category, reference: category ,description: req.body.description
    })
    .then((category)=>{
        res.redirect('/admin/categories');
        next
    })
});

adminRouter.route('/coupons')
.get(isLoggedIn,(req,res)=>{
    Coupons.find({})
    .then((coupons)=>{
        res.render('admin/coupons',{coupons:coupons})
    })
})

adminRouter.route('/coupons/edit/:couponId')
.get(isLoggedIn,(req,res)=>{
    Coupons.findById(req.params.couponId)
    .then((coupon)=>{
        res.render('admin/edit_coupon',{coupon:coupon})
    })
})
.post((req,res)=>{
    Coupons.findByIdAndUpdate(req.params.couponId,{$set:req.body},{new:true})
    .then((coupon)=>{
        res.redirect('/admin/coupons');
        next
    })
})

adminRouter.route('/add-coupon')
.get(isLoggedIn,(req,res)=>{
    res.render('admin/add_coupon')
})
.post((req,res,next)=>{
    Coupons.create(req.body)
    .then((coupon)=>{
        res.redirect('/admin/coupons');
        next
    })
})

adminRouter.route('/menu')
.get(isLoggedIn,(req,res)=>{
    Menu.Menu.find({})
    .then((menus)=>{
        res.render('admin/menu',{menus:menus})
    })
})

adminRouter.route('/menu/:menuId')
.get(isLoggedIn,(req,res)=>{
    Menu.Menu.findById(req.params.menuId)
    .populate({
        path:'menuItems',
        populate:{
            path:'items',
            model:'menuItems'
        }
    })
    .then((menu)=>{
        res.render('admin/menu_view',{menu:menu})
    })
})
.post((req,res,next)=>{
    Menu.MenuItems.create({name:req.body.name,status:req.body.status})
    .then((menuItem)=>{
        Menu.Menu.findByIdAndUpdate(req.params.menuId,{$push:{menuItems:menuItem.id}})
        .then((menu)=>{
            res.redirect(req.get('referer'));
            next
        })
    })
});

adminRouter.route('/messages')
.get(isLoggedIn,(req,res)=>{
    Dashboard.Messages.find({})
    .then((messages)=>{
        User.find({})
        .then((users)=>{
            res.render('admin/admin-chats',{users:users,messages:messages})
        })
    })

})

adminRouter.route('/messages/:messageId')
.post((req,res,next)=>{
   Dashboard.Messages.create({senderId:req.user.id,recieverId:req.params.messageId,content:req.body.content})
   .then(()=>{
    res.redirect('/admin/messages')
    next
   })
})

adminRouter.route('/menu/:menuId/create')
.get(isLoggedIn,(req,res)=>{
    Pages.find({})
    .then((pages)=>{
        Categories.find({})
        .then((categories)=>{
            Menu.Menu.findById(req.params.menuId)
            .populate('menuItems')
            .exec()
            .then((menu)=>{
                res.render('admin/add_menu_item',{pages:pages,categories:categories,menu:menu})
            })
        })
    })
})

adminRouter.route('/add-menu')
.get(isLoggedIn,(req,res)=>{
    res.render('admin/add_menu')
})
.post((req,res,next)=>{
    Menu.Menu.create({name:req.body.name,status:req.body.status})
    .then((menus)=>{
        res.redirect('/admin/menu');
        next
    })
});

adminRouter.route('/products')
.get(isLoggedIn,(req,res)=>{
    Products.find({})
    .then((products)=>{
        res.render('admin/products',{products:products})
    })
})

adminRouter.route('/products/:productId')
.get(isLoggedIn,(req,res)=>{
    Products.findById(req.params.productId)
    .then((product)=>{
        res.render('admin/product_view',{product:product})
    })
})

adminRouter.route('/products/:productId/top')
.get(isLoggedIn,(req,res,next)=>{
    Products.findById(req.params.productId)
    .then((product)=>{
        Products.findByIdAndUpdate(req.params.productId,{$set:{topselling:!product.topselling}})
        .then(()=>{
            res.redirect('/admin/products')
            next
        })
    })
})


adminRouter.route('/products/delete/:productId')
.get(isLoggedIn,(req,res,next)=>{
    Products.findByIdAndDelete(req.params.productId)
    .then((products)=>{
        res.redirect('/admin/products')
        next
    })
})

adminRouter.route('/products/edit/:productId')
.get(isLoggedIn,(req,res)=>{
    Products.findById(req.params.productId)
    .then((product)=>{
        Categories.find({})
        .then((categories)=>{
            res.render('admin/edit_product',{categories:categories,product:product})
        })
    })
})
.post(upload.array('images'),(req,res,next)=>{
    Products.findByIdAndUpdate(req.params.productId,{$set:req.body})
    .then((product)=>{
        for(var i=0;i<=req.files.length-1;i++){
            product.images.push(req.files[i].filename)
        }
        product.save()
        .then(()=>{
            res.redirect('/admin/products')
            next
        })
    })
})

adminRouter.route('/add-product')
.get(isLoggedIn,(req,res)=>{
    Categories.find({})
    .then((categories)=>{
        res.render('admin/add_product',{categories:categories})
    })
})
.post(upload.array('images'),(req,res)=>{
    Products.create(req.body)
    .then((product)=>{
        for(var i=0;i<=req.files.length-1;i++){
            product.images.push(req.files[i].filename)
        }
        product.save()
        .then(()=>{
            res.redirect('/admin/products')
            // res.json({body:req.body,file:req.files})
        })
    })
})


adminRouter.route('/general-setting')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/general_setting',{setting:setting})
    })
})
.post((req,res,next)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{siteName:req.body.siteName,siteTitle:req.body.siteTitle,siteDescription:req.body.siteDescription}})
    .then((settings)=>{
        res.redirect('/admin/general-setting')
        next
    })
});

adminRouter.route('/general-setting-analytics')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/general_setting_analytics',{setting:setting})
    });
})
.post((req,res)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{analyticsId:req.body.analyticsId}})
    .then(()=>{
        res.redirect('/admin/general-setting-analytics')
        next
    })
});

adminRouter.route('/general-setting-contact')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/general_setting_contact',{setting:setting})
    });
})
.post((req,res)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{contactEmail:req.body.contactEmail,contactPhone:req.body.contactPhone,contactLocation:req.body.contactLocation}})
    .then(()=>{
        res.redirect('/admin/general-setting-contact')
        next
    })
});

adminRouter.route('/general-setting-favicon')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/general_setting_favicon',{setting:setting})
    });
})
.post(upload.single('favicon'),(req,res,next)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{favicon:req.file.filename}})
    .then(()=>{
        res.redirect('/admin/general-setting-favicon')
        next
    })
});

adminRouter.route('/general-setting-logo')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/general_setting_logo',{setting:setting})
    });
})
.post(upload.single('logo'),(req,res,next)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{logo:req.file.filename}})
    .then(()=>{
        res.redirect('/admin/general-setting-logo')
        next
    })
});

adminRouter.route('/payment-setting')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/payment_setting',{setting:setting})
    });  
})
.post((req,res,next)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{merchantId:req.body.merchantId,
        merchantKey:req.body.merchantKey,website:req.body.website,
        industryType:req.body.industryType,channelId:req.body.channelId,transactionUrl:req.body.transactionUrl,
        transactionStatusUrl:req.body.transactionStatusUrl,callbackUrl:req.body.callbackUrl,currency:req.body.currency}})
        .then(()=>{
            res.redirect('/admin/payment-setting')
            next
        })
})

adminRouter.route('/email-setting')
.get(isLoggedIn,(req,res)=>{
    Settings.findOne({name:'nupur'})
    .then((setting)=>{
        res.render('admin/email_setting',{setting:setting})
    });
})
.post((req,res,next)=>{
    Settings.findOneAndUpdate({name:'nupur'},{$set:{emailEmail:req.body.emailEmail,
        emailUsername:req.body.emailUsername,emailPassword:req.body.emailPassword}})
    .then(()=>{
        res.redirect('/admin/email-setting')
        next
    })
});

module.exports = adminRouter;