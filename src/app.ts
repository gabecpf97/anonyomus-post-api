import express, { Application, Request, Response, NextFunction } from "express";
import router from "./route";
const mongoose = require("mongoose");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJwt = require('passport-jwt');
const JWTStrategy = passportJwt.Strategy;
const ExtractJWT = passportJwt.ExtractJwt;
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app : Application = express();

const mongoDB = `mongodb+srv://admin:${process.env.DB_PASSWORD}@cluster0.yag2o.mongodb.net/anonDB?retryWrites=true&w=majority`
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

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