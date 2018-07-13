const fs = require('fs');
const dateformat = require('dateformat');

let logFile;

class logStream {
    createLogStream(){
        fs.stat(`./logs`,(err,stat)=>{
            if(stat && stat.isDirectory()){
                logFile = fs.createWriteStream(`./logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
            }else{
                fs.mkdir('./logs',(e)=>{
                    if(e) log(e);
                    logFile = fs.createWriteStream(`./logs/${dateformat(new Date(),'yyyy-mm-dd-HH.MM.ss')}.log`);
                })
            }
        });
    }
}

module.exports = logStream;