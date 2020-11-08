var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var posts = new Schema({
   popular:{
       type:Boolean,
       default:false
   },
   title:{
    type:String,
   },
   author:{
    type:String,
   },
   content:{
    type:String,
   },
   image:{
    type:String,
   },
   cover:{
    type:String,
   },
   category:{
    type:String,
   },
   tags:{
    type:String,
   },
   comments:[{
       user:{ type: Schema.Types.ObjectId , ref: 'User' },
       comment:{
        type:String
       },
       date:{type:Date}
   }]
},{
    timestamps:true,
})

var postCategory = new Schema({
    category:{
     type:String,
    },
    slug:{
     type:String,
    },
 },{
     timestamps:true,
 })

 var postTags = new Schema({
    tag:{
     type:String,
    },
    slug:{
     type:String,
    },
 },{
     timestamps:true,
})

var Posts =  mongoose.model('Posts',posts);
var PostCategory = mongoose.model('post-categories',postCategory);
var PostTag = mongoose.model('post-tags',postTags);
module.exports = {
    Posts:Posts,
    PostCategory:PostCategory,
    PostTag:PostTag
};