import { Router} from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import Stdn from '../models/Stdn';
import Users from '../models/Users';
import Group from '../models/Group';
import {serialize} from 'cookie';
import { verify } from "jsonwebtoken";
import {verifyController} from '../middlewares/tokens';
import {logoutController} from '../middlewares/tokens';
import cookie from 'cookie';
import 'cookie-parser';
//import { Cookie } from 'express-session';
//import isAuth from '../helpers/validateAuth';

const router =  Router();

//rutas de la interface de login

router.get('/', function (req, res) {
    if(req.cookies.status){
        if(req.cookies.status == 'success-account'){
            res.clearCookie('status');
            res.render('login', {
                noNavBar: true,
                login: true,
                success: "The account has been successfully created"
            });
        }
    } else {
        res.render('login', {noNavBar: true, login: true});
    }
});

router.post('/login', async function (req, res){
    const {username, password} = req.body;
    const errors = [];
    try {
        const usernameFromMongo = await Users.findOne({username});
        if(username.length == 0){
            errors.push({text: 'Insert your username'});
        }
        if(password.length == 0){
            errors.push({text: 'Insert your password'});
        } else {
            if(usernameFromMongo){
                const matchPassword = await usernameFromMongo.matchPassword(password, usernameFromMongo.password);
                if(!matchPassword){
                    errors.push({text: 'Password incorrect'});
                }
            }    
        }
        if(!usernameFromMongo && username.length > 0){
            errors.push({text: ('The username does not exist')});
        }
        if (errors.length > 0){
            res.render('login', {errors: errors, username,noNavBar: true, login: true});
        } else {
            const token = jwt.sign({id: usernameFromMongo._id}, process.env.SECRET, {expiresIn: 60*60*24});
            const serialized = serialize('tokenId', token, {
                httpOnly: true,
                secure: false, //true when it is on production: process.env.NODE_ENV == ‘production’,
                sameSite: 'strict',
                maxAge: 60*60*24,
                path: '/'
            });
            //res.setHeader('Set-Cookie', serialized);
            res.cookie('sesionToken', serialized);
            res.redirect('/students/CRUD');
        }
    } catch (error) {
        console.log(error);
    }
});

//rutas de la interface de registro

router.get('/register', function (req, res) {
    res.render('register', {noNavBar: true, register: true});
});

router.post('/register', async function (req, res) {
    const {names, lastName, email, username, password, confirmPassword} = req.body;

    async function saveU(){
        const user = new Users({names, lastName, email, username, password});
        user.password = await user.encryptPassword(password);
        const userSaved = await user.save();
        console.log('user saved as', userSaved);

        const token = jwt.sign({id: userSaved._id}, process.env.SECRET, {expiresIn: 60*60*24});
        console.log(token);
        
        // res.send({succes: "The account has been successfully created"});
        res.cookie('status', 'success-account');
        res.redirect('/');
    }

    async function usernameFromMongo(){
        try {
            //change the query to findOne
            const queryUsernames = await Users.find({username}, 'username').lean();
            const userDB = queryUsernames[0].username;
            return userDB;
        } catch (error) {
            //pass
        }
        
    }

    try{
        const errors = [];
        const existingUsername = await usernameFromMongo();
        if (password != confirmPassword){
            errors.push({text: 'Passwords don´t match'});
        }
        if (password.length < 4 || password.length > 12){
            errors.push({text:'Password must be 4 to 12 characters'});
        }
        if (names.length == 0 || lastName.length == 0 || username.length == 0){
            errors.push({text: "the fields names, lastName, username and password are required"});
        }
        if (username == existingUsername){
            errors.push({text: 'Username already exists '});
        }
        if (errors.length > 0){
            res.render('register', {
                errors: errors,
                noNavBar: true,
                register: true,
                names: names,
                lastName: lastName,
                email: email,
                username: username
            });
        } else {
            saveU();
        }
    } catch (error){
        console.log('error: ', error);
    }
});

//rutas de la interface de CRUD
router.get('/students/CRUD', verifyController, async function (req, res) {
    //hay que agragar un $match al inicio pasandole el id proveniente de home
    const query = await Stdn.find().lean();
    for (let i = 0; i < query.length; i++) {
        if (query[i].grade == null){
            query[i].grade = "--";
        }
      }
    if(req.cookies.status){
        if(req.cookies.status == 'success-student'){
            res.clearCookie('status')
            res.render('crud', {document: query, success: "the student has successfully added to the list"});
        }
    } else{
        res.render('crud', {document: query});
    }
});

router.post('/students/add', verifyController,async function (req, res) {
    const errors = [];
    if (req.body.name == 0) {
        errors.push({text: 'Please insert a name'});
    }
    /*if (req.body.grade.length == 0){
        errors.push({text: 'Please insert a grade'});
    }*/
    if (req.body.subeject_grade < 0 || req.body.subeject_grade > 10) {
        errors.push({text: 'Grade must be between 0 and 10'});
    }
    if (errors.length > 0){
        try {
            const query = await Group.aggregate([{$unwind: '$students'}, {$project: {name: '$students.name', subeject_grade: '$students.subeject_grade',  status: '$students.status'}}, {$sort: {name: 1}}]);
            for (let i = 0; i < query.length; i++) {
                if (query[i].grade == null){
                    query[i].grade = "--";
                }
            }
            res.render('crud', {document: query, errors});
        } catch (error) {
            console.log(error.message);
        }
    } else {
        try{
            if(req.body.status == 'on'){
                req.body.status = true;
            } else{
                req.body.status = false;
            }
            const stdn = Stdn(req.body);
            console.log('request body', req.body);
            const stdnSaved = await stdn.save();
            console.log(stdnSaved);
            res.cookie('status', 'success-student');
            res.redirect('/students/CRUD');
        } catch (error){
            console.log(error);
        }
    }
});

router.get('/students/:id/delete', verifyController, async function(req, res){
    console.log(req.params.id);
    await Stdn.findByIdAndDelete(req.params.id);
    res.redirect('/students/CRUD');
});

//rutas de la interface de edit

router.get('/students/:id/edit', verifyController, async function(req, res){
    try {
        let object = await Stdn.findById(req.params.id).lean();
        console.log(req.params.id);
        console.log(typeof object.status, object.status);

        res.render('edit', {object});
    } catch (error) {
        console.log(error.message);
    }
});

router.post('/students/:id/edit', verifyController, async function(req, res){
    const errors = [];
    console.log(typeof req.body.status);
    console.log(req.body.status);
    if (req.body.name.length == 0) {
        errors.push({text: 'Please insert a name'});
    }
    if (req.body.grade < 0 || req.body.grade > 10) {
        errors.push({text: 'Grade must be between 0 and 10'});
    }
    if(req.body.status == 'on' || req.body.status == 'true' || req.body.status == 'True' || req.body.status == true){
        req.body.status = true;
    } else{
        req.body.status = false;
    }
    if (errors.length > 0){
        try {
            let object = await Stdn.findById(req.params.id).lean();
            res.render('edit', {object, errors});
        } catch (error) {
            console.log(error.message);
        }
    } else {
        console.log(req.params.id);
        await Stdn.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/students/CRUD');
    }
});

//ruta de la interface about

router.get('/about', function (req, res) {
    res.render('about');
});

//rutas de la interface home

router.get('/home', verifyController, async function (req, res) {
    const userId = verify(cookie.parse(req.cookies.sesionToken).tokenId, process.env.SECRET).id;
    const query = await Users.findOne({_id: userId}, 'groups');
    console.log('-----groups:', query.groups);
    const arrayOfGroups = [];
    query.groups.forEach(async function (groupId){
        const atributtesOfGroup = await Group.findById(groupId);
        const {grade, group, career} = atributtesOfGroup;
        arrayOfGroups.push(grade + '°' + group + '\n' + career);
    });
    res.render('home', {groups: arrayOfGroups, userId: userId});
});

router.get('/home/group/:id', verifyController, function (req, res){
    const userId = req.params.id;
    res.render('group', {userId: userId});
});

router.post('/home/group/:id/add', verifyController, async function (req, res){
    //actualizar en la coleccion original e insertar a la coleccion del usuario que guarde los grupos en home, hacer
    //validators para dicha funcion, verficar que no se repitan las clases
    async function saveG() {
        const {grade, group, career} = req.body;
        let groupId = await Group.findOne({grade: grade, group: group, career: career}, '_id');
        groupId = groupId._id.valueOf();
        console.log('group id', groupId);
        console.log('user id', req.params.id);
        const groupSaved = await Users.findByIdAndUpdate(req.params.id, {$push: {groups: groupId}});
        groupSaved.save();
        res.redirect('/home');
    }
    try {
        const errors = [];
        if (!req.body.grade) {
            errors.push({text: "Insert the grade"});
        }
        if (!req.body.group) {
            errors.push({text: "Insert the grade"});
        }
        if (!req.body.career) {
            errors.push({text: "Insert the career"});
        }
        if (errors.length > 0) {
            res.render('group', {errors, grade, group, career});
        } else {
            saveG();
        }
    } catch (error) {

    }
    const {grade, group, career} = req.body;

});

router.get('/recover', function (req, res) {
    res.send('<body style="background-color: rgb(102, 153, 51)"><h1 style="text-align: center; margin: 20% 0%; color: white; font-size: 50px;">Coming Soon</h1></body>');
});

router.get('/profile', verifyController, async function (req, res){
    console.log(cookie.parse(req.cookies.sesionToken));

    const userId = verify(
        cookie.parse(req.cookies.sesionToken).tokenId,
        process.env.SECRET
    ).id;
    const userData = await Users.findById(userId);
    const {names, lastName, email, username, password} = userData;
    
    res.render('profile', {
        names,
        lastName,
        email,
        username,
        password
    });
});

router.get('/logout', logoutController);

export default router;
