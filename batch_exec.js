var async = require("async");
var moment = require("moment");
var fs = require("fs");

var cl = console.log;

console.log = function(args){
    cl(args);
    var now = moment();
    if(now.get("hour") == 0 || now.get("hour") == 23){
        //一般来说0点前后运行应该都是每天第一次跑, 因为脚本可能会提前跑所以不能退出
        return;
    }
    // if(args.indexOf("1000京豆领光了") >= 0){//东东超市没豆了，退出
    //     cl('东东超市没豆子了,退出 ####################################')
    //     return process.exit(0);
    // }
    if(args.indexOf("兑换京豆已达上限") >= 0){//东东超市没豆了，退出
        cl('宠汪汪已兑换成功,退出 ####################################')
        return process.exit(0);
    }
}

var arguments = process.argv.splice(2)
console.log("说明: 第一个参数配置文件地址，第二个运行js文件, 第三个为并发数量(默认5)，第四个参数为执行时长(s, 默认10s)，第五个可以指定为now表示立即执行")
if(arguments.length < 2 ){
    console.log("参数不正确，第一个参数配置文件地址，第二个运行js路径必填")
    return;
}
console.log("原参数:" + arguments)

var configFile = arguments[0]
var taskFile = arguments[1]
var batchNumber = isNaN(arguments[2]) ? 5 : arguments[2];
var exeSeconds = arguments[3] || 10;
var now = arguments[2] == 'now' ? 'now': arguments[4];

console.log(`转换后参数: 配置文件: ${configFile}, js文件: ${taskFile}, 并发数量: ${batchNumber}, 执行时常: ${exeSeconds}s, 是否立即执行: ${now == 'now'}`)

console.log("配置文件地址:" + configFile);
if(!fs.existsSync(configFile)){
    console.log("配置文件路径不存在: " + configFile)
    return;
}
console.log("任务文件地址:" + taskFile);
if(!fs.existsSync(taskFile)){
    console.log("指定js路径不存在: " + taskFile)
    return;
}

var parseConfigAndSetENV = function(){
    var config = fs.readFileSync(configFile).toString();
    var jdCookie = (/Cookie1=\"(.+)\"/ig.exec(config)[1]);
    if(!jdCookie){
        console.log("没有配置Cookie1: " + configFile)
        return;
    }
    var tgToken = (/TG_BOT_TOKEN=\"(.+)\"/ig.exec(config)[1]);
    if(!tgToken){
        console.log("没有配置TG_BOT_TOKEN: " + configFile)
        return;
    }
    var tgUserId = (/TG_USER_ID=\"(.+)\"/ig.exec(config)[1]);
    if(!tgUserId){
        console.log("没有配置TG_USER_ID: " + configFile)
        return;
    }
    process.env.JD_COOKIE=jdCookie;
    process.env.MARKET_COIN_TO_BEANS="1000"
    process.env.JD_JOY_REWARD_NAME="500"
    process.env.TG_BOT_TOKEN=tgToken
    process.env.TG_USER_ID=tgUserId
    console.log(`导入变量: JD_COOKIE = ${process.env.JD_COOKIE}`)
    console.log(`导入变量: MARKET_COIN_TO_BEANS = ${process.env.MARKET_COIN_TO_BEANS}`)
    console.log(`导入变量: JD_JOY_REWARD_NAME = ${process.env.JD_JOY_REWARD_NAME}`)
    console.log(`导入变量: TG_BOT_TOKEN = ${process.env.TG_BOT_TOKEN}`)
    console.log(`导入变量: TG_USER_ID = ${process.env.TG_USER_ID}`)
}

var executeJs = function (index, callback) {
    console.log("execute [" + (index + 1) + "/" + batchNumber + "] " + taskFile);
    delete require.cache[require.resolve(taskFile)];
    require(taskFile);
    setTimeout(callback, 50)
}

var batchExecute = function(number, func, callback){
    async.timesLimit(9999999, number, func, callback)
}


var begin  = function(){
    var wrapped = async.timeout(batchExecute, exeSeconds * 1000,)
    wrapped(batchNumber, executeJs, function () {
        if(taskFile.indexOf("jd_joy_reward") >= 0 && moment().get('hour') >= 16){//每天三个档，最后一个档执（16点）行完成之后还是无法兑500豆，那么降级兑20豆
            process.env.MARKET_COIN_TO_BEANS="20"
            console.log(`超时退出前兜底兑换${process.env.MARKET_COIN_TO_BEANS}豆~`);
            delete require.cache[require.resolve(taskFile)];
            require(taskFile);
            var seconds = 20;
            console.log(`超时兜底脚本调用完成,${seconds}秒退出运行！`);
            return setTimeout(function(){process.exit(0)}, seconds * 1000)
        }
        console.log(`到达超时时间退出: ${exeSeconds}秒`)
        process.exit(0)
    });
}

parseConfigAndSetENV();

if(now){
    console.log("立即开始执行: " + now)
    begin();
} else {
    /**
     * 任务23:59:59秒跑
     * @type {batchNumber}
     */
    var now = moment();
    if(now.get('minute') == 0 || now.get('minute') == 30){
        console.log("整点或者半点立即执行: " + now)
        begin();
    } else {
        var minute = now.get('minute') > 30 ? 59 : 29;
        var schedulerTime = moment().set('minute', minute).set('second', 55).set('millisecond', 200);
        sleepMilliseconds = schedulerTime.toDate().getTime() - new Date().getTime();
        console.log("任务开始于: " +  schedulerTime.format("YYYY-MM-DD HH:mm:ss.SSS")+ ",开始睡眠: " + (sleepMilliseconds/1000) + "s")
        setTimeout(begin, sleepMilliseconds)
    }
}
