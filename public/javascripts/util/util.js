const Slack = require('slack-node'); 
const schedule = require('node-schedule');
//const testjson = require('../../data/testjson.json');
//const testjson = require('../../data/testjson2.json');
let userInfo = require('../../data/userInfo.json');
const config = require('../../../config.json');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
apiToken = config.apiToken;

const slack = new Slack(apiToken);
const send = async(message, channel) => {
  //console.log(message)
  slack.api('chat.postMessage', {
      username: 'Upsource',  // 슬랙에 표시될 봇이름
      text: message,
      channel: channel,  // 메시지가 전송될 채널
      as_user : true,
      icon_emoji: ':slack:'   // 슬랙봇 프로필 이미지
    }, function(err, response){
      console.log(err)
    });
}


const init = function(resdata) {
  //console.log('resdata\n',resdata)
  slack.api("users.list", function(err, response) {
    //console.log(response);
    response.members.forEach(function(element, index){
      userInfo.id[element.profile.email] = element.id;
    });
    let pushArr = [];
    let userIds = resdata.data.base.userIds;
    userIds.forEach(function(element, index){
      let userEmail = element.userEmail;
      if(userInfo.id[userEmail]){
        pushArr.push(userInfo.id[userEmail]);
      }
    })
  
    for(var i=0; i<pushArr.length; i++){
      send(`슬랙에 메시지를 전송합니다3. uid : ${pushArr[i]}`, pushArr[i]);
      console.log(`슬랙에 메시지를 전송합니다3. uid : ${pushArr[i]}`, pushArr[i]);
    }
  });
}

const showlog = function(resdata){
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@resdata@@@@@@@@@@@@@@@\n\n',resdata)
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@userIds@@@@@@@@@@@@@@@\n\n',resdata.data.base.userIds)
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@actor@@@@@@@@@@@@@@@\n',resdata.data.base.actor)
}

const getUserList = async function(){
  let result = await new Promise((resolve, reject) => {
    slack.api("users.list", async function(err, response) {
      response.members.forEach(function(element, index){
        userInfo.id[element.profile.email] = element.id;
      });
      resolve(userInfo);
    });
  });
}



const setReviewer = function(resdata, userlist) {

  let pushArr = [];
  let participantEmail = resdata.data.participant.userEmail;
  let participantNm = resdata.data.participant.userName;
  //http://codereview.inpark.kr/comm-event/review/FRONT-COMMEVENT-3
  let url = `${config.upsourceUrl}/${resdata.projectId}/review/${resdata.data.base.reviewId}`;
  let actor = resdata.data.base.actor.userName;

  if(userlist.id[participantEmail]){
    pushArr.push(userlist.id[participantEmail]);
  }

  let role = (resdata.data.role===3?'watcher': 'reviewer');
  let sendMessage = `${actor} 님이 ${participantNm}님을 ${role}로 지정했습니다.\n url : ${url}`
  
  pushArr.forEach((element, index)=>{
    send(sendMessage, pushArr[index]);
    console.log(sendMessage);
  });
}

const removeReviewer = function(resdata, userlist) {

  let pushArr = [];
  let participantEmail = resdata.data.participant.userEmail;
  let participantNm = resdata.data.participant.userName;
  //http://codereview.inpark.kr/comm-event/review/FRONT-COMMEVENT-3
  let url = `${config.upsourceUrl}/${resdata.projectId}/review/${resdata.data.base.reviewId}`;
  let actor = resdata.data.base.actor.userName;
  let role = (resdata.data.formerRole===3?'watcher': 'reviewer');
  let sendMessage = `${actor} 님이 ${participantNm}님을 ${role}에서 해제했습니다.\n url : ${url}`

  if(userlist.id[participantEmail]){
    pushArr.push(userlist.id[participantEmail]);
  }
  pushArr.forEach((element, index)=>{
    send(sendMessage, pushArr[index]);
    console.log(sendMessage);
  });
}


const getPushlistByEmail = function(userIds, selector){
  let pushArr = [];
  userIds.forEach(function(element, index){
      let userEmail = (selector===undefined? element.userEmail : selector);
    if(userInfo.id[userEmail]){
      pushArr.push(userInfo.id[userEmail]);
    }
  })
  return pushArr;
}
//http://codereview.inpark.kr/comm-event/review/FRONT-COMMEVENT-2?commentId=87806eec-ec05-4848-8020-bc4a665fdb66&filePath=/README.md
const setCommentDM = function(resdata, userlist) {

  let pushArr = [];
  let userIds = resdata.data.base.userIds;
  pushArr = getPushlistByEmail(userIds);

  let commentId = resdata.data.commentId;
  let sendMessage = 
  `New comment by ${resdata.data.base.actor.userName} (${resdata.data.base.actor.userEmail})\n`+
  `url : ${config.upsourceUrl}/${resdata.projectId}/review/${resdata.data.base.reviewId}?`+
        `commentId=${commentId}\n`+
  `message : ${resdata.data.commentText}`;

  for(var i=0; i<pushArr.length; i++){
    send(sendMessage, pushArr[i]);
    console.log(`New comment by ${resdata.data.base.actor.userName} (${resdata.data.base.actor.userEmail}) \n url : ${config.upsourceUrl}`);
  }
}

const changeReviewState = function(resdata, userlist){

  let userIds = resdata.data.base.userIds;
  let pushArr = getPushlistByEmail(userIds);

  let commentId = resdata.data.commentId;
  console.log(commentId)
  let reviewState = '';
  let reviewCode = resdata.data.newState;

  console.log("@@@@@@@ reviewCode   :  ",reviewCode)
  if(reviewCode===0){
    reviewState = 'Resume';
  }else if(reviewCode===2){
    reviewState = 'Accept';
  }else if(reviewCode===3){
    reviewState = 'Concern';
  }else if(reviewCode===1){//old 0
    reviewState = 'Close';
  }else {
    reviewState = 'Remove';

  }
  let sendMessage = 
  `Review가 ${resdata.data.base.actor.userName} (${resdata.data.base.actor.userEmail})에 의해 ${reviewState}되었습니다. \n`+
  `url : ${config.upsourceUrl}/${resdata.projectId}/review/${resdata.data.base.reviewId}`;

  pushArr.forEach((element, index)=>{
    send(sendMessage, pushArr[index]);
    console.log(sendMessage);
  });
}


module.exports = {
  init, send, getUserList, setCommentDM, showlog, setReviewer, removeReviewer, changeReviewState
}

