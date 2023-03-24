require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const { Model } = require('mongoose');
const Promise = require('bluebird');
const { promisify } = require('util');
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;



const app = express()
const port = 3000


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(mongoose.connect('mongodb+srv://Admin-jossymono:ilerioluwa1998@cluster0.vxjwyl0.mongodb.net/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




//passport.use(new GoogleStrategy({
 //clientID: process.env.CLIENT_ID,
   // clientSecret: process.env.CLIENT_SECRET,
    //callbackURL: "http://localhost:3000/auth/google/secrets",
    //userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
 
 //},

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function(accessToken, refreshToken, profile, cb) {  
       // console.log(profile);

User.findOne({googleId: profile.id}).then((result) => {
    if (result) {
        cb(null, result);
    } else {
        new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails
        }).save().then((newUser) => {
            cb(null, newUser);
        });
    
    }
});
    }
));






  
app.get('/', function(_req, res){
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(_req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });



app.get('/login', function(_req, res){
    res.render('login');
});

app.get('/register', function(_req, res){
    res.render('register');
});

app.get('/secrets', function(_req, res){
    User.find({'secret': {$ne: null}}).exec()
    .then((foundUsers) => {
        if(foundUsers){
            res.render('secrets', {usersWithSecrets: foundUsers});
        }
    })
    .catch((err) => {
        console.log(err);
    });
});



app.get('/secrets', function(req, res){
    if(req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.get('/submit', function(req, res){
    if(req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});



app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});





app.post('/register', function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, _user){
        if(err){
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets');
            });
        }
    });
    
});

app.post('/login', function(req, res){
   
    const user = new User({
        username: req.body.username,
        password: req.body.password

        });

        req.login(user, function(err){
            if(err){
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect('/secrets');
                });
            }
        });
});

app.post('/submit', function(req, res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id).then((foundUser) => {
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save().then(() => {
                res.redirect('/secrets');
            });
        }}
        );
    });









app.listen(port, () => console.log(`secrets app listening on port ${port}!`))


