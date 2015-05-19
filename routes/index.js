var express = require('express');
var router = express.Router();
var GoogleSpreadsheet = require("google-spreadsheet");
var _ = require('underscore');
var moment = require('moment');

var allTrackSlotsPage = 7;
var trackSlotPage = 6;
var engPage = 5;
var growthPage = 4;
var salesPage = 3;
var pdPage = 2;
var allTrackPage = 1;

//the google sheet we're using
var my_sheet = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

my_sheet.setAuth(process.env.EMAIL, process.env.GOOGLE_PASSWORD, function() {});	

/* GET pages. */
router.get('/mentors/eng', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, engPage, res, "eng");

		});
});

router.get('/mentors/pd', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, pdPage, res, "pd");

		});
});

router.get('/mentors/sales', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, salesPage, res, "sales");

		});
});

router.get('/mentors/growth', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, growthPage, res, "growth");

		});
});

router.get('/mentors/', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(allTrackSlotsPage, function(err, allSlots) {
			getAllSlots(err, allSlots, allTrackPage, res, "all");
		});
});

///////authentication routes////////////

//login page
router.get('/login', function(req, res, next) {
  res.send('Welcome! <a href="/auth/google"> Login with Google </a>')
});

//login fail route
router.get('/login_fail', function(req, res){
  res.send('login failed!');
});


function ensureAuthenticated(req, res, next) {  
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/auth/google');
}

//////////////////////////////////////////////////////////////

function getAllSlots(err, allSlots, responsePage, res){
		var trackTimeSlots = [];

		//grab all the date/time slots from the original spreadsheet
		for ( var i = 0; i < allSlots.length; i++){
			var time = new Date(allSlots[i]['datetime']);
			if (new Date() < time) {
				trackTimeSlots.push(moment(time).format('llll'));
			}
		}

		var options = {
			orderby: "datetime"
		}

		my_sheet.getRows(responsePage, options, function(err, allMentors){
			getMentorSlotObject(trackTimeSlots, allMentors, res);
		});
}

function getMentorSlotObject(trackTimeSlots, allMentors, res){

		//ordered list of mentors

		var pastMentors = [];
		var upcoming = [];

		for(var i = 0; i < allMentors.length; i++){
			var mentorTime = new Date(allMentors[i]['datetime']);

			//reformat date to be prettier
			allMentors[i]['datetime'] = moment(mentorTime).format('llll');
			
			var slotIndex = trackTimeSlots.indexOf(mentorTime.toString());

			//separate mentors by past and upcoming
			if (mentorTime > new Date()) {
				upcoming.push(allMentors[i]);
			}
			else {
				pastMentors.push(allMentors[i]);
			}

			//remove taken slots from list of slots
			if (slotIndex > -1){
			 	trackTimeSlots.splice(slotIndex, 1);
			}
		}

		res.render('index', { title: 'Mentos' , upcoming: upcoming, slots: trackTimeSlots.reverse(), past: pastMentors.reverse()});
}

module.exports = router;