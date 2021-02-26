var async = require("async");
var path = require("path");
var fs = require("fs");
var exec = require('child_process');

var arguments = process.argv.splice(2)
if(arguments.length != 3){
    console.log("参数不正确，第一个参数js文件路径, 第二个为并发数量，第三个参数为并发执行时长(s)")
    return;
}
console.log("参数" + arguments)
// var taskJs = path.join(__dirname, arguments[0]);
var task = arguments[0]
var number = arguments[1];
var seconds = arguments[2];
// console.log("任务文件地址:" + taskJs);
// if(!fs.existsSync(taskJs)){
//     console.log("指定js路径不存在: " + taskJs)
//     return;
// }

var batchExecute = function(number, func, callback){
    async.timesLimit(9999999, number, func, callback)
}

var wrapped = async.timeout(batchExecute, seconds * 1000,)

wrapped(number, function(index, callback) {
    // var command = "node " +taskJs;
    var command = "sudo -S docker exec -it jd bash jd " + task + " now << EOF \n" +
        "qwer1234\n" +
        "EOF";
    console.log("execute [" + (index + 1) + "/" + number + "] " +command);
    try {
        exec.execSync(command)
    } catch (e) {
        console.log("execute error: ", e)
    }
    callback()
}, function () {
console.log("到达超时时间退出: " + seconds)
});
