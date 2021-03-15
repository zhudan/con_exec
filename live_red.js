const async = require("async");
const moment = require("moment");
const fs = require("fs");
const got = require('got');

const custom = got.extend({
    responseType: 'json',
    headers: {
        'user-agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E217 MicroMessenger/6.8.0(0x16080000) NetType/WIFI Language/en Branch/Br_trunk MiniProgramEnv/Mac`,
        'referer': `https://servicewechat.com/wx4830b51270836408/12/page-frame.html`,
        'content-type': `application/json`,
    }
});

async function getLiveList(page, currentCount) {
    const timesMinSec = new Date().getTime();
    const reqBody = {
        "tabId": 1,
        "page": page,
        "currentCount": currentCount,
        "timestamp": timesMinSec,
        "appId": "mini-live"
    }
    const url = `https://api.m.jd.com/api?appid=mini-live&functionId=liveListWithTabToM&t=${timesMinSec}&body=${JSON.stringify(reqBody)}`;
    const body = await custom.get({'url': url,
        hooks: {
            beforeRequest: [
                options => {
                    // console.log(options)
                }
            ]
        }
    }).json();
    return body;
}

async function getLiveDetail(liveId) {
    const reqBody = {"liveId":`${liveId}`,"sku":""};
    const url = `https://api.m.jd.com/api?appid=mini-live&functionId=liveDetailToM&body=${JSON.stringify(reqBody)}&t=1615784364454`;

    const body = await custom.get({'url': url + JSON.stringify(reqBody),
        hooks: {
            beforeRequest: [
                options => {
                    // console.log(options)
                }
            ]
        }
    }).json();
    return body;
}

// getLiveList(1, 0).then(result =>{
//     console.log(JSON.stringify(result))
// });
const page = 1;
var currentCount = 0;
var liveList = [];
async.doUntil(function(callback){
    getLiveList(page, currentCount).then(function(result){
        if(!result || !result.data){
            return callback();
        }
        if(result.data && result.data.currentCount){
            currentCount = result.data.currentCount;
        }
        if(result.data.list && result.data.list.length>0){
            liveList.push.apply(liveList, result.data.list)
        }
        return callback();
    })
}, function(callback){
    console.log(currentCount, page, liveList.length)
    callback(currentCount >= 0);
}, function (err) {
    console.log(currentCount, page, liveList.length)
    console.log(err)
})

// getLiveDetail(3686984).then(result =>{
//     console.log(JSON.stringify(result))
// });
