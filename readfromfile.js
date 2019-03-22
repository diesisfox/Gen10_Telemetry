const fs = require('fs')
var EventEmitter = require('events');

var eventEmitter = new EventEmitter();

module.exports = eventEmitter;

//graphing library for next time, recommended 'D3'

fs.readFile('C:/Users/Tian/Documents/Bluesky Telem/Telem Test Data/race_data.txt', 'utf-8', (err, file) => {
  if (err) throw err;
  var blocks = [];
  var i;
  var ischanged = false;
  var ide = 0;
  var dlc = 0;
  var id = 0;
  var time;
  var data2;
  var count = 0;
  for (i = 0; i < file.length; i ++){
    let frm = {};
    if (file.slice(i, i + 3) == "tim"){
      time = file.slice(i + 11, i + 35);
    }
    if (file.slice(i, i + 3) == "ide"){
      ide = parseInt(file.slice(i + 5, i + 6));
    }
    if (file.slice(i, i + 3) == "dlc"){
      dlc = parseInt(file.slice(i + 5, i + 6));
    }
    if (file.slice(i, i + 3) == "id:"){
      id = parseInt(file.slice(i + 3, i + 13));
      ischanged = true;
    }
    var data = Buffer.alloc(dlc)
    if (file.slice(i, i + 3) == "Buf"){
      var j;
      for (j = 0; j < dlc; j ++){
        //console.log (file.slice (i + 7 + 3 * j, i + 9 + 3 * j));
        data [j] = parseInt(file.slice (i + 7 + 3 * j, i + 9 + 3 * j), 16);
      }
      data2 = data;
    }
    if (ischanged){
      count ++;
      frm.timestamp = time;
      frm.ide = ide;
      frm.dlc = dlc;
      frm.data = data2;
      frm.id = id;
      //blocks.push(frm);

      printval2 (frm, count);
      ischanged = false;
    }
  }
  //emitframes (blocks);
});

function emitframes (blocks){
  var values = blocks;
  //console.log(values.pop());
  //console.log (values);
  prevtime = parseInt((values[0].timestamp).slice(20,23));
  var prevdelay = 0;
  for (var i = 0; i < values.length; i ++){
    delay = parseInt ((values[i].timestamp).slice(20, 23)) - prevtime;
    prevtime = parseInt ((values[i].timestamp).slice(20, 23));
    setTimeout(printval, i , values, i);
    prevdelay = delay;
  }
}

function printval(values, i){
  console.log(values[i], " ", i, " ", values.length);
  console.log(values[values.length-1]);
  eventEmitter.emit('frame', values[i]);
  //this.emit
}
function printval2(frm, count){
  console.log(count);
  eventEmitter.emit('frame', frm);
  //this.emit
}
