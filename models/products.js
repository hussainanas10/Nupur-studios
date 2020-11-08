var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Products = new Schema({
    rating:{
        type:Number,
        default:0,
    },
    images:[{
        type:String
    }],
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    basicDeliveryTime: {
        type: String,
    },   
    standardDeliveryTime: {
        type: String,
    },   
    premiumDeliveryTime: {
        type: String,
    },   
    basicRevisions: {
        type: String,
    },   
    standardRevisions: {
        type: String,
    },   
    premiumRevisions: {
        type: String,
    },   
    basicConcepts: {
        type: String,
    },   
    standardConcepts: {
        type: String,
    },   
    premiumConcepts: {
        type: String,
    },   
    basicSource: {
        type: String,
    },   
    standardSource: {
        type: String,
    },  
    premiumSource: {
        type: String,
    },   
    basicLogo: {
        type: String,
    },   
    standardLogo: {
        type: String,
    },  
    premiumLogo: {
        type: String,
    },
    basicResolutions: {
        type: String,
    },
    standardResolutions: {
        type: String,
    },
    premiumResolutions: {
        type: String,
    },
    basicMockup: {
        type: String,
    },
    standardMockup: {
        type: String,
    },
    premiumMockup: {
        type: String,
    },
    basicDesigns: {
        type: String,
    },
    standardDesigns: {
        type: String,
    },
    premiumDesigns: {
        type: String,
    },
    basicPrice: {
        type: Number,
    },
    standardPrice: {
        type: Number,
    },
    premiumPrice: {
        type: Number,
    },
    // basicCurrency: {
    //     type: String,
    // },
    // standardCurrency: {
    //     type: String,
    // },
    // premiumCurrency: {
    //     type: String,
    // },
    category: {
        type: String,
        required: true,
    },
    favorites: {
        type: Number,
        default: 0,
    },
    orders: {
        type: Number,
        default: 0,
    },
    topselling: {
        type: Boolean,
        default: false,
    },
    },
    {
        timestamps:true,
    })

module.exports = mongoose.model('Products', Products);
