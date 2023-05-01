const express = require("express");
const app = express();
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://localhost:27017/myFlixappDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" });
const { check, validationResult } = require("express-validator");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require("cors");
let allowedOrigins = ["http://localhost:8015", "http://testsite.com"];
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                let mesage = "the Cors policy for this application doesn't allow access from origin" + origin;
                return callback(new Error(message), false);
            }
            return callback(null, true);
        },
    })
);

let auth = require("./auth.js")(app);
const passport = require("passport");
require("./passport");

app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static("public"));

//READ check
app.get("/", (req, res) => {
    res.send("my Movie Api!");
});
//Add a user
app.post(
    "/users",
    [
        check("Username", "Username is required").isLength({ min: 5 }),
        check("Username", "Username contains non alphanumeric chearacters - not allowedOrigins.").isAlphanumeric(),
        check("Password", "Password is required").not().isEmpty(),
        check("Email", "Email does not appear to be valid").isEmail(),
    ],
    (req, res) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + "already exists");
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send("Error: " + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send("Error: " + error);
            });
    }
);

//Get all users
app.get("/users", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

// get a user by username
app.get("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//Update a user's info, by username
app.put("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $set: {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
            },
        },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((e) => {
            res.status(500).send("error: " + e);
            console.error(e);
        });
});

//Add a movie to a user's list of favorites
app.post("/users/:Username/movies/:MovieId", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        let updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, { $push: { FavoriteMovies: req.params.MovieId } }, { new: true });
        res.json(updatedUser);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error: " + e);
    }
});

//Deleted a user by username
app.delete("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + " was not found");
            } else {
                res.status(200).send(req.params.Username + " was deleted.");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//Delete a mvoie from user list
app.delete("/users/:Username/movies/:MovieId", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $pull: { FavoriteMovies: req.params.MovieId },
        },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((e) => {
            res.status(500).send("error: " + e);
            console.error(e);
        });
});

//get all movies check
app.get("/movies", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//Get a movie by title check
app.get("/movies/:Title", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
//Get a Movie by Genre check
app.get("/movies/genre/:genreName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.genreName })
        .then((movie) => {
            res.json(movie.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//Get a Movie by director check
app.get("/movies/directors/:directorName", passport.authenticate("jwt", { session: false }), (req, res) => {
    Movies.findOne({ "Director.Name": req.params.directorName })
        .then((movie) => {
            res.json(movie.Director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});

//check
app.get("/documentation", (req, res) => {
    console.log("Documentation Request");
    res.sendFile("public/Documentation.html", { root: __dirname });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Error? why? :(");
});
const port = process.env.PORT || 5000;
app.listen(port, "O.O.O.O", () => {
    Console.log("Listening on port " + port);
});
