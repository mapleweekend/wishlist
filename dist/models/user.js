const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {type: String, required: true},
    link: {type: String, required: false},
    purchased_by: {type: String, required: false, default:""},
    price: {type: Number, required: false, default:0},
});

const userSchema = new mongoose.Schema(
    {
        name:{type:String, required:true},
        email:{type:String, required:true },
        friends:{type:Array, required:true, default:[]},
        notifications:{type:Array, required:true, default:[]},
        items:[itemSchema]
    },
    { collection: 'users', timestamps:true}
)

const User = mongoose.model('userSchema', userSchema)

module.exports = User
