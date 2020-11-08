var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reviews = new Schema({
    comment: {
        type: String,
    },
    rating:{
        type: Number,
    },
    productId: { type: Schema.Types.ObjectId , ref: 'Products' },
    userId: { type: Schema.Types.ObjectId , ref: 'User' }   
})

module.exports = mongoose.model('Reviews',reviews);