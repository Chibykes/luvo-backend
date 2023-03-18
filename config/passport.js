const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Users = require('../models/Users');

module.exports = (passport) => {
    /**
     * This passport authentication is for User
     */
    passport.use(
        new LocalStrategy(
            { usernameField: 'email', passwordField:'password' }, 
            (username, password, done) => {
                
                Users.findOne({ $or: [{email: username}, {tag: username.indexOf('@') !== 0 ? '@'+username : username}] })
                .then(user => {
                    if(!user){
                        return done(null, 'Username Incorrect');
                    }

                    bcrypt.compare(password, user.password)
                        .then(async(isMatch) => {
                            if(isMatch){
                                return done(null, user)
                            }
                            
                            return done(null, 'Password Incorrect');
                        })
                        .catch(err => console.error(err));
                })
                .catch(err => console.error(err));

        })
    );


    passport.serializeUser((user, done)=>{
        return done(null, user._id);
    });

    passport.deserializeUser(async(id, done)=>{
        const user = await Users.findById({ _id: id });
        return done(null, user);
    });
}