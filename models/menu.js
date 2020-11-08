var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var menuItems = new Schema({
    name:{
        type:String,
    },
    status:{
        type:String,
    },
    reference:{
        type:String,
    },
    items:[{
        name:{ type:String },
        type:{ type:String },
        category:{ type:String },
        page:{ type:String },
        url:{ type:String },
        parent:{ type:String },
        status:{ type:String },
    }],

})
const MenuItems = mongoose.model('menuItems',menuItems);

var menu = new Schema({
    name:{
        type:String,
    },
    status:{
        type:String,
    },
    reference:{
        type:String,
    },
    menuItems:[{type: Schema.Types.ObjectId , ref:'menuItems'}],

},{
    timestamps:true,
})
const Menu = mongoose.model('Menu',menu);

module.exports ={
    MenuItems:MenuItems,
    Menu:Menu,
}; 