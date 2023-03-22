const express = require('express');
const Users = require('./models/Users');
const Transactions = require('./models/Transactions');
const app = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { ensureAuth } = require('./config/auth');
const fetch = require('node-fetch');

var crypto = require('crypto');
var secret = process.env.SECRET_KEY;


app.get('/', (req, res)=>{
    res.json({
        status: 'success',
        msg: 'User Succeesfully Logged Out...',
    })
});

app.post('/register', (req, res) => {
    Users.create({
        ...req.body,
        password: bcrypt.hashSync(
            req.body.password, 
            bcrypt.genSaltSync(10)
        )
    });

    res.send({ 
        status: 2,
        msg: 'Regstration Successful',
    });
});


app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
        req.login(user, function(error){
            if(error) return res.json({
                status: 1,
                msg: err
            });
            
            res.json({ 
                status: 2,
                msg: 'User successfully authenticated',
                data: user,
            });
        });
    })(req, res, next);
});

app.post('/validate', async(req,res) => {

    const data = await Users.findOne(req.body);

    res.json({
        status: 2,
        data
    });
});

app.get('/transactions', ensureAuth, async(req, res) => {
    const data = await Transactions
                        .find({ $or: [ { from: req.user._id }, { to: req.user._id } ] })
                        .populate('from', 'fullname company tag _id role')
                        .populate('to', 'fullname company tag _id role')
                        .sort({ createdAt: -1 });
    res.json({
        status: 2,
        data,
        user: await Users.findOne({ _id: req.user._id }, '_id fullname tag email phone balance role')
    })
});

app.post('/fund-wallet', ensureAuth, async(req, res) => {

    Transactions.create({
        type: "funding",
        ...req.body,
        to: req?.user._id,
        status: 'processing',
    });

    res.json({ 
        status: 2,
        data: null
    });

});

app.post('/payout', ensureAuth, async(req, res) => {

    Transactions.create({
        type: "withdrawal",
        ...req.body,
        from: req?.user._id,
        status: 'success',
    });

    await Users.findOneAndUpdate(
        { _id: req?.user._id },
        { $inc: { balance: -Number(req.body.amount) } }
    )

    res.json({ 
        status: 2,
        data: null
    });

});

app.post('/pay', ensureAuth, async(req, res) => {

    const to = await Users.findOne({ tag: req.body.tag }, '_id');

    Transactions.create({
        type: "pay",
        ...req.body,
        from: req?.user._id,
        to: to._id
    });

    await Users.findOneAndUpdate(
        { _id: req?.user._id },
        { $inc: { balance: -Number(req.body.amount) } }
    );

    await Users.findOneAndUpdate(
        { _id: to._id },
        { $inc: { balance: Number(req.body.amount) } }
    );

    res.json({ 
        status: 2,
        data: null,
        user: await Users.findOne({ _id: req.user._id }, '_id fullname tag email phone balance role')
    });

});

app.post('/profile', ensureAuth, async(req, res) => {

    console.log(req.body)
    if(!req.body.password){ delete req.body.password }
    else{
        req.body.password = bcrypt.hashSync(
            req.body.password, 
            bcrypt.genSaltSync(10)
        );
    }

    await Users.findOneAndUpdate(
        { _id: req?.user._id },
        { ...req.body }
    );

    res.json({ 
        status: 2,
        data: null,
        user: await Users.findOne({ _id: req.user._id }, '_id fullname tag email phone balance role')
    });

});

app.get('/user', async(req, res) => {res.json({
        status: 2,
        user: await Users.findOne({ _id: req.user._id }, '_id fullname tag company email phone balance role')
    })
});

app.post('/validate-bank', async(req, res) => {
    const searchparams = new URLSearchParams(req.body);
    const resp = await fetch("https://api.paystack.co/bank/resolve?"+searchparams.toString(), { 
        headers: { 
            "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        }
    });
    
    const { status, data } = await resp.json();
    if(status){
        return res.json({
            status: 2,
            data
        })
    }

    return res.json({
        status: 1,
        data: null
    })
});

app.get('/banks', async(req, res) => {
    const resp = await fetch("https://api.paystack.co/bank", { 
        headers: { 
            "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        }
    });
    const { data: banks } = await resp.json();

    res.json({
        status: 2,
        banks
    })
});

app.get('/logout', (req, res)=>{
    req.logout((err) => {
        console.log(err);
    });

    res.json({
        status: 2,
        msg: 'User Succeesfully Logged Out...',
    })
});



app.post("/webhook", async function(req, res) {
    // const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    // if (hash == req.headers['x-paystack-signature']) {
    //     // Retrieve the request's body
    //     const event = req.body;
    //     // Do something with event  
    // }

    const { event, data } = req.body;

    if(event === "charge.success"){
        const transaction = await Transactions.findOneAndUpdate(
            { reference: data.reference },
            { payment_data: data, status: 'success' },
            { returnOriginal: false }
        );

        if(!transaction) return res.sendStatus(200);

        await Users.findOneAndUpdate(
            { _id: transaction.to },
            { $inc: { balance: Number(transaction.amount) } }
        )

    }

    res.sendStatus(200);
});

module.exports = app;
