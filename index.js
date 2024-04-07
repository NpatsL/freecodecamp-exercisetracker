const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

const UserSchema = new mongoose.Schema({
    username: String,
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    description: String,
    duration: Number,
    date: Date,
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
    User.find({})
        .then((users) => {
            res.json(users);
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/api/users", (req, res) => {
    const username = req.body.username;
    const newUser = new User({ username: username });
    newUser.save().then((user) => {
        res.json({ username: user.username, _id: user._id });
    });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.json({ error: "User not found" });
    } else {
        const newExercise = new Exercise({
            user_id: user._id,
            description,
            duration,
            date: date ? new Date(date) : new Date(),
        });

        await newExercise
            .save()
            .then((exercise) => {
                res.json({
                    _id: user._id,
                    username: user.username,
                    date: exercise.date.toDateString(),
                    duration: exercise.duration,
                    description: exercise.description,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.get("/api/users/:_id/logs", async (req, res) => {
    const userId = req.params._id;
    const user = await User.findById(userId);
    if (!user) {
        return res.json({ error: "User not found" });
    } else {
        const { from, to, limit } = req.query;
        const exercises = await Exercise.find({
            user_id: userId,
            date: {
                $gte: from ? new Date(from) : new Date(0),
                $lte: to ? new Date(to) : new Date(),
            },
        }).limit(limit ? +limit : 0);

        console.log(from ? new Date(from) : new Date(0));
        console.log(to ? new Date(to) : new Date());

        res.json({
            _id: user._id,
            username: user.username,
            count: exercises.length,
            log: exercises.map((exercise) => ({
                description: exercise.description,
                duration: exercise.duration,
                date: exercise.date.toDateString(),
            })),
        });
    }
});
