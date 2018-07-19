/*
    Opens a write stream to a directory called 'log'.
    Eventually, it would be nice to give the user a choice for where the file gets stored
 */

const fs = require('fs');
const dateformat = require('dateformat');
const EventEmitter = require('events');

const emtr = new EventEmitter();

function createLogStream(logFile){
    fs.stat(`./logs`,(err,stat)=>{
        if(stat && stat.isDirectory()){
            logFile = fs.createWriteStream(`./logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
        }else{
            fs.mkdir('./logs',(e)=>{
                if(e) console.log(e);
                logFile = fs.createWriteStream(`./logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
            })
        }
        emtr.emit('LogFile:created');
    });
}

module.exports.create = createLogStream;