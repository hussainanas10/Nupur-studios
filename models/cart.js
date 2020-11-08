var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cart = new Schema({

    items:[{
        productId:{ type: Schema.Types.ObjectId , ref: 'Products' },
        qty: { type:Number },
        plan: { type:String }
    }],
    total:{
        type:Number,
        default:0,
    },
    discount:{
        type:Number,
        default:0,
    },
    userId: { type: Schema.Types.ObjectId , ref: 'User' },    
},{
    timestamps:true,
})

module.exports = mongoose.model('Cart',cart);