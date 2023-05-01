const jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy

const jwt = require("jsonwebtoken"),
    passport = require("passport");

require("./passport"); // Your local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // This is the username you’re encoding in the JWT
        expiresIn: "7d", // This specifies that the token will expire in 7 days
        algorithm: "HS256", // This is the algorithm used to “sign” or encode the values of the JWT
    });
};

module.exports = (router) => {
    router.post("/login", (req, res, next) => {
        passport.authenticate(
            "local",
            { session: false },
            (error, user, info) => {
                console.log("Passport authenticated:", user); // added console.log
                if (error) {
                    return next(error);
                }
                if (!user) {
                    return res.status(400).json({
                        message: "something ain't right?",
                    });
                }
                req.login(user, { session: false }, (error) => {
                    if (error) {
                        return next(error);
                    }
                    let token = generateJWTToken(user.toJSON());
                    return res.json({ user, token });
                });
            }
        )(req, res, next);
    });
};