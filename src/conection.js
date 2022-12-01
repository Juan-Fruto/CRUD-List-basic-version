// import {connect} from 'mongoose';

// function async (){
//     try{
//         const dataBase = await connect("mongoose://localhost/crud-mongo");
//         console.log('connection to ', dataBase.connection.name);
//     } catch(error){
//         console.log(error);
//     }
// }

import {connect} from"mongoose";

(async function(){
 try{
    const db = await connect(process.env.MONGODB_URI_LOCAL);
    console.log("DB connected to",db.connection.name);
  } catch (error){
    console.error(error)
 }
})();