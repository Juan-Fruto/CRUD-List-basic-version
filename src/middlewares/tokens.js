import { verify } from "jsonwebtoken";
import cookie from 'cookie';
import clearCookie from 'cookie-parser';
import User from '../models/Users';

export function verifyController(req, res, next){
    //const {tokenId} = cookies;
    try {
        console.log('cookie from crud:\n', cookie.parse(req.cookies.sesionToken).tokenId);
        const personalData = verify(cookie.parse(req.cookies.sesionToken).tokenId, process.env.SECRET);
        console.log(personalData.id);
        //funcion para comprobar el id en la bd, y hacer un logoutController para log out
        const userFromMongo = User.findById(personalData.id);
        if(userFromMongo){
            next();
        } else{
            res.redirect('/');
        }

    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
} 

export function logoutController(req, res, next){
    res.clearCookie('sesionToken');
    res.redirect('/');
}

export default {
    verifyController,
    logoutController
};
