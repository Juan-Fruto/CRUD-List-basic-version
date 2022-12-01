import express from 'express';
import indexRoutes from './routes/index.routes';
import * as dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import path from 'path';
import morgan from'morgan';
import session from "express-session";
import MongoStore from "connect-mongo";
import {createGroups} from './libs/setup.js';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import './config/sesion.js';

const app = express();
dotenv.config();
createGroups();

// settings

app.set('hostname', '');
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', engine({
    layoutDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    defaultLayout: 'main',
    extname: ".hbs",
    helpers: {
      graterThan5: function (value){
        value = value + 1;
        return (value > 0 && value % 6 == 0 ?  true :  false);
      }
    }
}));

app.set('view engine', '.hbs')


// middlewares

app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(
    session({
      secret: "secret",
      resave: true,
      saveUninitialized: true,
      store: MongoStore.create({ mongoUrl: "mongodb://localhost/crud-mongo" })
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.static(path.join(__dirname, "public")));

  app.use(cookieParser());

  // app.use(function(req, res, next) {
  //   res.status(404).render('error404', {noNavBar: true});
  // });
  

// routes

app.use(indexRoutes);

//public route

export default app;

