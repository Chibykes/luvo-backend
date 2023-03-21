const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const dotenv = require('dotenv').config();

const port = process.env.PORT || 8080;

require('./config/connectDB')();

app.set('trust proxy', true);

app.use(cors({
    origin: ["http://localhost:3000","https://luvo.vercel.app", "https://luvo-driver.vercel.app", "https://luvo.chibykes.dev"],
    methods: ["GET","HEAD","PUT","PATCH","POST","DELETE"],
    credentials: true,
    exposedHeaders: ['Set-Cookie', 'Date', 'ETag']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "keyword",
    resave: false,
    saveUninitialized: true,
    cookie: {
        domain: "luvo.herokuapp.com",
        secure: true,
        expires: 2592000000,
        sameSite: 'none',
        maxAge: 2592000000
    },
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI,
        mongooseConn: mongoose.connection 
    })
}));

// =============PASSPORT============ //
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', require('./api'));


app.listen(port , () => console.log('Server Running: '+port));