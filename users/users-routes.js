const express = require("express");
const UsersRoutes = express.Router();
const { check, validationResult } = require("express-validator");
const passport = require("passport");
require("../passport");
const Models = require("../models.js");
const Users = Models.User;
UsersRoutes.post(
    "/",
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
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((userFromDB) => {
                            let user = { Username: userFromDB.Username, Email: userFromDB.Email, Birthday: userFromDB.Birthday, FavoriteMovies: userFromDB.FavoriteMovies };
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
UsersRoutes.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
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
UsersRoutes.get("/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
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
UsersRoutes.put("/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $set: {
                Username: req.body.Username,
                Password: hashedPassword,
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
UsersRoutes.post("/:Username/movies/:MovieId", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        let updatedUser = await Users.findOneAndUpdate({ Username: req.params.Username }, { $push: { FavoriteMovies: req.params.MovieId } }, { new: true });
        res.json(updatedUser);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error: " + e);
    }
});

//Deleted a user by username
UsersRoutes.delete("/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
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
UsersRoutes.delete("/:Username/movies/:MovieId", passport.authenticate("jwt", { session: false }), (req, res) => {
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

module.exports = UsersRoutes;
