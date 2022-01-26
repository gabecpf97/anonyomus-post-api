import express, { Application, Request, Response, NextFunction } from "express";
import router from "./route";
import { connect, connection } from "mongoose";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local"; 
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { compare } from "bcrypt";
import User, { UserType } from "./models/User";
const cors = require('cors');
require('dotenv').config();

// passport setup for local using email and password
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    (email: string, password: string, done: Function) => {
        User.findOne({ email }, (err: any, theUser: UserType) => {
            if (err)
                return done(err);
            if (!theUser)
                return done(null, false, {message: 'Email does not exists'});
            compare(password, theUser.password, (err: any, result: boolean) => {
                if (err)
                    return done(err);
                if (!result)
                    return done(null, false, { message: 'Password incorrect' });
                done(null, theUser, 'Logged in');
            });
        });
    }
));

const app : Application = express();

const mongoDB = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.yag2o.mongodb.net/anonDB?retryWrites=true&w=majority`
connect(mongoDB);
const db = connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', router);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500);
    if (err.message)
        return res.send({err: err.message});
    res.send({err});
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});