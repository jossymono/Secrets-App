require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');
const { Model } = require('mongoose');

const app = express()
const port = 3000


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});
 

const User = new mongoose.model("User", userSchema);
  
app.get('/', function(req, res){
    res.render('home');
});

app.get('/login', function(req, res){
    res.render('login');
});

app.get('/register', function(req, res){
    res.render('register');
});

app.post('/register', function(req, res){




    
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    async function saveUser(){
        try{
            const savedUser = await newUser.save();
            res.render('secrets');
        } catch(err){
            console.log(err);
        }
    }
    saveUser();
});

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username})
    .exec()
    .then(function(foundUser){
        if(foundUser){
            if(foundUser.password === password){
                res.render('secrets');
            }
            else{
                res.send('Incorrect details');
            }
        }
        });
    });








app.listen(port, () => console.log(`secrets app listening on port ${port}!`))
