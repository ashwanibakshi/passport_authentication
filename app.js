var express     = require('express');
var session     = require('express-session');
var mongoose    = require('mongoose');
var bodyParser  = require('body-parser');
var userModel   = require('./models/user');
var passport    = require('passport');
var LocalStrategy = require('passport-local').Strategy;

//connect to db
mongoose.connect('mongodb://localhost:27017/passauthdemo',{useNewUrlParser:true})
.then(()=>console.log('connected to db'))
.catch((err)=>console.log(err))

//inti app
var app = express();

//set the template engine
app.set('view engine','ejs');

//fetch the data from request
app.use(bodyParser.urlencoded({extended:false}));

//session
app.use(session({
secret:'mySECERETKeY12345'
}));

//passport
app.use(passport.initialize());
app.use(passport.session());

//locals variable
app.use((req,res,next)=>{
    res.locals.auth= req.session.passport;
    next();
});


passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
  function(username, password, done) {
    userModel.findOne({email: username }, function(err, user) {
      if (err) { 
          return done(err); 
        }
        else if(!user){
            return done(null, false);
        }
        else{
            userModel.compare(password,user.password,(err,result)=>{
                if(err){
                    return done(err); 
                }else{
                    //if password match
                    if(result){
                        return done(null, user);
                    }else{
                        return done(null, false);
                    }
                }
            });
        }
    });
  }
));

//session seriaize deserialize
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    userModel.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //check session
  var checkAuth = (req,res,next)=>{
      if(req.session.passport){
          next();
      }else{
          res.redirect('/login');
      }
  }


//default page load
app.get('/',(req,res)=>{
        res.redirect('/register');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register',(req,res)=>{
    var user = new userModel({
        email:req.body.email,
        password:req.body.password
    });
    userModel.register(user,(err,data)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect('/login');
        }
    });
});

app.get('/login',(req,res)=>{
      res.render('login');
});

app.post('/login',passport.authenticate('local',{failureRedirect:'/login'}),(req,res)=>{
    res.redirect('/profile');
});

app.get('/profile',checkAuth,(req,res)=>{
    res.render('profile',{data:req.user});
});

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/login');
});

//assign port
var port = process.env.PORT || 3000;
app.listen(port,()=>console.log('server run at '+port));