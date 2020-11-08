const mongoose = require('mongoose');

mongoose.connect('mongodb://103.86.177.201:32768/nupur', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) throw err;
    console.log("Connection setup successfully");
});
require('./cart')
require('./categories')
require('./coupons')
require('./dashboard')
require('./menu')
require('./page')
require('./posts')
require('./products')
require('./reviews')
require('./settings')
require('./user')
