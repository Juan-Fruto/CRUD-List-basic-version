import passport from 'passport';
import { Strategy as LocalStrategy } from "passport-local";
import Users from '../models/Users';


passport.use(
    new LocalStrategy({
        usernameField:'username', 
        passwordField:'password'
    },
    async function(username, password, done){

        const userObject = await Users.findOne({username: username});

        if (!userObject){
            return done(null, false, {message: 'user do not exists'});

        } else {

            const match = await userObject.matchPassword(password);

            if (match){
                return done(null, userObject);
            } else{
                return done(null, false, {message: 'Incorrect password'});
            }
        }    
}));

passport.serializeUser(function (user, done){
    done(null, user.id);
});

passport.deserializeUser(function (id, done){
    Users.findById(id, function (err, user){
        done(err, user);
    });
});