// ------------------------------------
/**
 * DMChat v0.2
 *
 * (c) 2010 Ian Chan <http://chanian.com>
 * MIT license
 *
 * The main controller of this chat application.
 * We will use this to proxy data exchanges and centralize
 * control between chat windows and twitter api.
 *
 */
// ------------------------------------
var DMChat = {
	// Let developer work offline (maybe on a flight with no wifi?)
	offline:false,
	
	// Twitter API client
	twitterAPI:"",

	// Recent pooled data
	chatData:[],
	
	// List chat people
	chatPanel:[],
	
	// Recent sent messages (pre-populate chat history)
	sentData:[],

	// How many DM's do we generally fetch?
	maxFetch:100,
	maxSentFetch:200,
	
	// The main window manager
	WM: {},
	
	// How often shall we hit twitter?
	initialPollRate: 10000,
	pollRate: 30000,
	
	// What was the last tid we saw? 	
	latest_tid: 0,
	
	// ------------------------------------		
	// Recieve a dm push message, and push it out
	sendDM : function(dm, callback, scope) {
		DMDebugger.log("Sending DM to @: " + dm.user);
		twitterAPI.sendDM(dm, callback, scope);
	},
	
	// ------------------------------------		
	// See if there is anything new, if so, update our cache		
	pollData : function() {
		DMDebugger.log("Polling API - latest tid: " + this.latest_tid);
		twitterAPI.getRecv(this.latest_tid, 10, this.pollCallback);	
	},
	
	// ------------------------------------		
	// Sign in a Twitter user
	login : function () {
		DMDebugger.log("Sending login");		
		var username = $("#t_username").val();
		var password = $("#t_pw").val();
		
		// Sign me in please		
		twitterAPI = twitter(username, password);
		
		// TODO: Fix possible synch probs, do it in serial possibly?
		// Load up some recent sent DMs
		twitterAPI.getSent(0, this.maxSentFetch, this.sentCallback);
		
		// Load up some received DMs
		twitterAPI.getRecv(0, this.maxFetch, this.recvCallback);
		
		// Now switch the login screen to the chat menu
		$("#login").fadeOut("fast", function() {
			$("#create").fadeIn();
			
			// Setup the main timeout for polling
			DMDebugger.log("Start polling timeout");			
			setTimeout("DMChat.pollData()", DMChat.initialPollRate);					
		});
	},
	// ------------------------------------			
	// Load recent DM conversation by username
	// We do this on-demand rather than upfront to save CPU 
	buildConversation : function(name) {
		// Combine sent and received into one array to render
		var arr = [];
		var i;
		var len = this.chatData.length;
		// Get all the ones from this user
		for(i = 0; i < len; i++) {
			var dm = this.chatData[i];
			if(dm.user === name) {
				// Convert it into something simpler
				var obj = {
					user:name,
					created_at:dm.created_at,
					text:dm.text
				};
				arr.push(obj);
			}
		}
		// Get all the ones I sent to this user
		len = this.sentData.length;
		for(i = 0; i < len; i++) {
			var dm = this.sentData[i];
			if(dm.recipient.screen_name === name) {
				// Convert it into something simpler
				var obj = {
					is_owner:true,
					user:twitterAPI.getUsername(),
					created_at:dm.created_at,
					text:dm.text
				}
				arr.push(obj);
			}
		}
		// sort the consolidated list by timestamp (merge)
		arr.sort(function(a, b) {
			return (new Date(b.created_at)).getTime() - (new Date(a.created_at)).getTime(); 
		});	
		return arr;
	},
	
	// ------------------------------------		
	// Add new person to recent chats list	
	addUser : function(user, count, insert) {
		// Does this guy already exist?
		var len = this.chatPanel.length;
		for(var i = 0; i < len; i++) {
			if(user == this.chatPanel[i]) {
				return;
			}
		}
		// Create the user
		DMDebugger.log("Create new chatter: @" + user);		
		
		var uid = "panel_" + user;
		var cntId = "panelCount_" + user;
		var html = "<div class='friend' id='" + uid + "' " +
						"onclick='DMChat.WM.create(\"" + user + "\")'>" +
				  		"<div class='name'>" + user + "</div>" +
				  		"<div class='count' id='" + cntId + "'>" + count + "</div>" +
				  "</div>";
				
		// Remember me for later
		this.chatPanel.push(user);
				
		// Do we want the HTML back? or rendered right away
		if(insert) {	
			$("#recent").prepend(html);
			$("#" + uid).hide();
			$("#" + uid).fadeIn(); // sparkle!
		} else {
			return html;
		}
	},
	// ------------------------------------		
	// Show the outstanding counter
	showOutstanding : function(user, count) {
		var obj = $("#panelCount_" + user);
		// If in panel
		if(obj.length > 0) { 
			obj.html(count);
			obj.fadeIn();
		} else {
			// Didn't exist yet! Great, make a new user and show
			this.addUser(user, count, true);
			$("#panelCount_" + user).show();
		}
	},
	
	// ------------------------------------		
	// Bootstrap this application
	init : function () {		
		DMDebugger.init();
		DMDebugger.log("init");		
		
		// Get the WindowsManager
		this.WM = windowmanager();
		
		DMDebugger.log("done");	
	},	
	
	// ------------------------------------	
	// Callbacks	
	// ------------------------------------	
	// Callback from AJAX poll DM's	
	pollCallback : function(data) {
		DMDebugger.log("Callback pollDM");
		
		// Dide we get anything new?				
		if(data.length > 0 && data[0].id > DMChat.latest_tid) {
			DMDebugger.log("New DM found: " + data[0].id);
			DMChat.latest_tid = data[0].id;
			
			// Send the new DM's off if possible, and also save them
			for(var i = 0; i <  data.length; i++) {				
				var dm = data[i];
				var obj = {
					user: dm.sender_screen_name,
					created_at: dm.created_at,
					text: dm.text
				};
				// Try to update the window
				DMChat.WM.takeDM(obj);
				
				// Also, if blurred, update the user panel with the update				
				if(DMChat.WM.getFocus().user !== obj.user) {
					DMChat.showOutstanding(obj.user, 1);
				}
				
				// This will help populate "minimized" windows
				DMChat.chatData.push(obj);
			}
		} else {
			DMDebugger.log("No new DMs");
		}
		setTimeout("DMChat.pollData()", DMChat.pollRate);				
	},
	
	// ------------------------------------			
	// Callback from AJAX get sent DM's
	sentCallback : function(data) {
		DMDebugger.log("Callback sentDM");		
		DMChat.sentData = data;
	},
	
	// ------------------------------------		
	// Callback from AJAX get received DM's
	recvCallback : function(data) {
		DMDebugger.log("Callback recvDM");
		
		// No longer loading....
		$("#loading").hide();		
		
		// Stash the latest tid if its new
		if(data[0].id > DMChat.latest_tid) {
			DMChat.latest_tid = data[0].id;			
		}
		
		// Simplify and store each DM received
		var arr = {};
		for(var i = 0; i < data.length; i++) {
			var dm = data[i];
			arr[dm.sender_screen_name] = !arr[dm.sender_screen_name] ? 1 : arr[dm.sender_screen_name] + 1;

			// Cache these results
			var obj = {
				user:dm.sender_screen_name,
				created_at:dm.created_at,
				text:dm.text
			};
			DMChat.chatData.push(obj);
		}
		
		// Render each chat user		
		DMDebugger.log("Building chat lists");		
		var count = 0;
		var html = "";
		for(name in arr) {
			count++;
			// Nothing is outstanding right now ("" hardcoded)
			html += DMChat.addUser(name, "", false);
			
			// Only show top-n
			if(count > 5) { break; }			
		}
		$("#recent").prepend(html);
	}
};

// ------------------------------------	
// Single onload, where we are ready...
$(document).ready(function(){ 
	DMChat.init();
});
