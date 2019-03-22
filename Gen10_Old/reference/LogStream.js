/*
    Opens a write stream to a directory called 'log'.
    Eventually, it would be nice to give the user a choice for where the file gets stored
 */

const fs = require('fs');
const dateformat = require('dateformat');

function create(path, logStream){
    fs.stat(`${path}/logs`,(err,stat)=>{
        if(stat && stat.isDirectory()){
            logStream = fs.createWriteStream(`./logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
        }else{
            fs.mkdir('./logs',(e)=>{
                if(e)
                    console.log(e);
                logStream = fs.createWriteStream(`./logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
            })
        }
    });
}

module.exports.create = create;