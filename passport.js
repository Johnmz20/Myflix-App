const passport = require('passport'),
    localStrategy = require('passport-local').Strategy,
    Models = require('./models.js'),
    passportJWT = require('passport-jwt');

    let Users = Models.Users,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

passport.use(new localStrategy({
    usernameField: 'Username',
    passwordField: 'Password'
}, (username, password, callback) => {
    vonsole.log(username + ' ' + password);
    Users.findOne({ Username: username}, (error, user) => {
        if (error) {
            console.log(error);
            return callback(error);
        }

        if(!user) {
            console.log('incorrect username');
            return callback(null, false, {message: 'Incorrect username or password.'});
        }

        console.log('finished');
        return callback(null,user);
    });
}));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret' 
}, (jwtPayLoad, callback) => {
    return Users.findById(jwtPayLoad._id)
    .then((user) => {
        return callback(error)
    });
}));