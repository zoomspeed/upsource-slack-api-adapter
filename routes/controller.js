const _ = require('lodash');
const config = require('../config.json');
let userInfo = require('../public/data/userInfo.json');
const {
    send
    ,init
    ,getUserList
    ,setCommentDM
    ,showlog
    ,setReviewer
    ,changeReviewState
    ,removeReviewer
} = require('../public/javascripts/util/util.js');

module.exports = async function(review) {

    const reviewers = _.chain(review).get('data.base.userIds', []).map('userName').value().join(', ');
	const reviewState  = {
		1: '_Author(?)_',
		2: '_Reviewer_',
		3: '_Watcher_'
    };
    console.log(review);
    //console.log(reviewers);
    // reviewer 삭제
    if (review.dataType === "RemovedParticipantFromReviewFeedEventBean") {
        //userList = await getUserList(review, 'remove reviewer');
        showlog(review);
        getUserList(review).then(()=>{removeReviewer(review, userInfo);});
    // reviewer 지정
    } else if (review.dataType === "NewParticipantInReviewFeedEventBean") {
        showlog(review);
        getUserList(review).then(()=>{setReviewer(review, userInfo);});
    // commnet 추가
    } else if (review.dataType === "DiscussionFeedEventBean") {
        showlog(review);
        getUserList(review).then(()=>{setCommentDM(review, userInfo);});
        //setCommentDM(review, reviewers);
    } else if (review.dataType === "ParticipantStateChangedFeedEventBean" || review.dataType === "ReviewStateChangedFeedEventBean"){
        showlog(review);
        getUserList(review).then(()=>{changeReviewState(review, userInfo);});
        //changeReviewState(review);
    } else if (review.dataType === "ReviewRemovedFeedEventBean"){
        showlog(review);
        //getUserList(review).then(()=>{removeReviewFeed(review, userInfo);});
    }
};
