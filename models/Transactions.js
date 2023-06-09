
const mongoose = require('mongoose');
const Users = require('./Users');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({

    type: {type: String, lowercase: true},
    from: {
        type: String,
        ref: Users
    },
    to: {
        type: String,
        ref: Users
    },
    amount: {type: Number, default: 0},
    bank_name: {type: String},
    bank_code: {type: String},
    account_number: {type: String},
    account_name: {type: String},
    reference: {type: String},
    payment_data: {type: Object},
    status: { type: String, default: 'success' },

}, {timestamps: true});

module.exports = mongoose.model('transactions', TransactionSchema);
