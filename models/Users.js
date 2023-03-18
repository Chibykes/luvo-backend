
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({

    fullname: {type: String, lowercase: true},
    email: {type: String},
    tag: {type: String, lowercase: true},
    company: {type: String, lowercase: true},
    balance: {type: Number, default: 0},
    role: {type: String, lowercase: true, default: 'customer'},
    password: {type: String},

}, {timestamps: true});

module.exports = mongoose.model('users', UserSchema);
