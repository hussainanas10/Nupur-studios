var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orders = new Schema({
    items:[{
        productId:{ type: Schema.Types.ObjectId , ref: 'Products' },
        qty: { type:Number },
        plan: { type:String },
        date:{type:Date},
        orderId:{type:String}
    }],
    userId: { type: Schema.Types.ObjectId , ref: 'User' },    
},{
    timestamps: true,
})

var saved = new Schema({
    productId: [{ type: Schema.Types.ObjectId , ref: 'Products' }],
    userId: { type: Schema.Types.ObjectId , ref: 'User' }    
})

var messages = new Schema({
    content:{
        type:String,
    },
    recieverId: { type: Schema.Types.ObjectId , ref: 'User' },    
    senderId: { type: Schema.Types.ObjectId , ref: 'User' }    
},{
    timestamps:true,
})
const Messages = mongoose.model('Messages',messages);  
const Saved = mongoose.model('Saved',saved);  
const Orders = mongoose.model('Orders',orders);  

module.exports ={
    Messages:Messages,
    Saved:Saved,
    Orders:Orders,
}