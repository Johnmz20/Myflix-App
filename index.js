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
const UsersRoutes = require("./users/users-routes.js");
const MoviesRoutes = require("./movies/movies-routes.js");

//mongoose.connect('mongodb://localhost:27017/myFlixappDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), { flags: "a" });
const { check, validationResult } = require("express-validator");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require("cors");
let allowedOrigins = ["http://localhost:8015", "http://testsite.com","http://localhost:3000"];
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

app.use('/users', UsersRoutes);
app.use('/movies', MoviesRoutes);

//check
app.get("/documentation", (req, res) => {
    console.log("Documentation Request");
    res.sendFile("public/Documentation.html", { root: __dirname });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Error? why? :(");
});
const port = process.env.PORT || 5001;
app.listen(port,  () => {
  console.log("Listening on port " + port);
});