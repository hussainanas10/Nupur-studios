require('./models/db')
var createError = require('http-errors');
var express = require('express');
var path = require('path');
const Categories = require('./models/categories')
const Settings = require('./models/settings')

var logger = require('morgan');
const session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
// var toastr = require('express-toastr');
const bodyParser = require('body-parser');
// const exphbs = require("express-handlebars");
const mongoose = require('mongoose');
const passport = require('passport');
// var FileStore = require('session-file-store')(session);
var MongoStore = require('connect-mongo')(session);
const passportLocalMongoose = require('passport-local-mongoose');
var authenticate = require('./authenticate');
require('./models/db');

// const url = 'mongodb://localhost:27017/nupur';

// const connect = mongoose.connect(url,{ useNewUrlParser: true,useUnifiedTopology: true });
// connect.then((db)=>{
//   console.log('connected correctly to serve to nupur');
// },(err)=>{console.log(err)});

var app = express();

// view engine setup

// app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser('12345-67890-09876-54321'));

app.use(session({
  name: 'session-id',
  secret: '12345-67890-09876-54321',
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { maxAge: 180 * 60 * 1000 }
}));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());


app.use((req,res,next)=>{
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
})

// app.use(toastr());



app.use(function(req,res,next){
  Categories.find({})
  .then((categories)=>{
    Settings.findOne({name:'nupur'})
    .then((settings)=>{
      res.locals.categories = categories;
      res.locals.settings= settings;
    })
  })


  // res.locals.toasts = req.toastr.render();
  if(req.session.loggedin){
    res.locals.isAuth = true,
    res.locals.username = req.user.username;
    res.locals.user = req.user;
    next();
  }else{
    res.locals.isAuth = false,
    next();
  }

})


const indexRouter = require('./routes/index');
const signupRouter = require('./routes/signup');
const homeRoute = require('./routes/home');
const cartRoute = require('./routes/cart');
const adminRoute = require('./routes/admin');

app.use('/', indexRouter);
app.use('/signup', signupRouter);
app.use('/home',homeRoute);
app.use('/cart',cartRoute);

app.use('/admin',adminRoute);

function auth (req, res, next) {
// console.log(req.user);
  if (!req.user) {
    var err = new Error('You are not authenticated!');
    err.status = 403;
    next(err);
  }
  else {
      next();
  }
}

app.use(auth);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
