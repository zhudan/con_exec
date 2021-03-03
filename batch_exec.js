var async = require("async");
var moment = require("moment");
var path = require("path");
var fs = require("fs");
var exec = require('child_process');

var arguments = process.argv.splice(2)
if(arguments.length < 3 ){
    console.log("参数不正确，第一个参数js, 第二个为并发数量，第三个参数为并发执行时长(s)")
    return;
}
console.log("参数:" + arguments)
var task = arguments[0]
var number = arguments[1];
var seconds = arguments[2];
var now = arguments[3];

var batchExecute = function(number, func, callback){
    async.timesLimit(9999999, number, func, callback)
}

var wrapped = async.timeout(batchExecute, seconds * 1000,)

var begin  = function(){
    wrapped(number, function(index, callback) {
        // var command = "sudo -S docker exec -i jd bash jd " + task + " now << EOF \n" +
        //     "qwer1234\n" +
        //     "EOF";
        var command = "bash jd " + task + " now"
        console.log("execute [" + (index + 1) + "/" + number + "] " +command);
        // try {
        exec.exec(command, function(error, stdout, stderr){
            if (error) {
                console.error(`执行的错误: ${error}`);
            }
            console.log(stdout)
            console.error(`stderr: ${stderr}`);
            // callback();
        })
        setTimeout(callback, 500)
    }, function () {
        console.log("到达超时时间退出: " + seconds)
        process.exit(0)
    });
}
if(now){
    console.log("立即开始执行: " + now)
    begin();
} else {
    /**
     * 任务23:59:59秒跑
     * @type {number}
     */
    var now = moment();
    if(now.get('minute') == 0 || now.get('minute') == 30){
        console.log("整点或者半点立即执行: " + now)
        begin();
    } else {
        var minute = now.get('minute') > 30 ? 59 : 29;
        var schedulerTime = moment().set('minute', minute).set('second', 59).set('millisecond', 0);
        sleepMilliseconds = schedulerTime.toDate().getTime() - new Date().getTime();
        console.log("任务开始于: " +  schedulerTime.format("YYYY-MM-DD HH:mm:ss")+ ",开始睡眠: " + parseInt(sleepMilliseconds/1000) + "s")
        setTimeout(begin, sleepMilliseconds)
    }
}
