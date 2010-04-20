// ------------------------------------
/** 
 * Twitter
 * (c) 2010 Ian Chan <http://chanian.com>
 * MIT license
 *
 * A Twitter Javascript API service.
 * We encapsulate all the method calls
 * and connection setups (including auth)
 * into this single class.
 *
 */
// ------------------------------------
var twitter = function(u, pw) {
	var that = {};
	
	// private variables
	var username = u;
	var password = pw;
	
	// API variables
	var service = "https://";
	var apiURL 	=  "api.twitter.com/";
	var version = 1;
		
	// Remember how many DM's we have sent
	var send_count = 0;
	
	// ------------------------------------		
	// Define some public interface functions		
	that.getUsername = function() {
		return username;
	};
	// ------------------------------------			
	/**
	 * Prepare and send out a DM.
	 *
	 *@dm - The DM object to send
	 *@callback - String function callback name
	 *@scope - The scope in which to excute the callback function
	 */
	that.sendDM = function(dm, callback, scope) {
		// Request xml, since JSON will trigger a download box
		var send_url = "direct_messages/new.xml";
		send_url = authenticateURL(send_url);
		
		// This is going to be tricky!
		if(!DMChat.offline) {
			send_count++;
			
			// Create an iframe to proxy the POST for us
			// POSTs don't like AJAX X-Domain too much
			
			// Remove previous iteration's iframe, we cannot after send
			// TODO: Synch probs here, could miss one
			var old = $("#p_iframe" + (send_count - 1));	
			if(old.length) {				
				old.remove();
			}
			
			// Create an iframe element: need unique id since .remove()
			// is being difficult, just make a new one per send
            var  iframe = document.createElement("iframe");			
			iframe.setAttribute("id", "p_iframe" + send_count);
			iframe.setAttribute("name", "p_iframe" + send_count);
			iframe.src = "./inc/proxy_post.html";			
			
			// Insert it into the DOM
			$('body').append(iframe);

			// Credit: pier-luigi from StackOverflow for the .load workaround
			// iframes don't place nice with JQueries .ready()
			$( iframe ).load(function(id) {
				// We need the index as it was then, not now
				return (function() {
					var doc = window.frames['p_iframe' + id].document;
				
					doc.getElementById("postForm").action = send_url;
					doc.getElementById("postUser").value = dm.user;
					doc.getElementById("postText").value = dm.text;
									
					// Send it away and don't look back... literally
					doc.getElementById("postForm").submit();
				
					// Play nice, and don't try to hijack twitters iframe
					$( iframe ).unbind("load");
				});				
		    }(send_count));
		}
		
		// Assume it goes through, since we can't beat crossdomain-POST security
		// This is a bit of a 'hack' but simulates realtime response.
		// Fortunately, we can just ignore the xml we get back
		var response = {};
		response.is_owner = true;			
		response.user = username;
		response.text = dm.text;
		response.created_at = new Date();
		
		// call/apply probably would have worked here.
		scope[callback](response);
	};
	// ----------------------------------------	
	// Pull in a bunch of DMs as raw JSON
	that.getRecv = function(since, limit, callback) {
		var send_url = "direct_messages.json";		
		send_url += "?count=" + limit;
		send_url += "&since_id=" + since;
		send_url += "&callback=?";
		send_url = authenticateURL(send_url);
		
		// Spoof data if no internet connection
		if(!DMChat.offline) {
			$.getJSON(send_url, callback);
		} else {
			var arr = [ { 'sender_screen_name':'hyfen', 'text':'hello', 'created_at':'13' },
						{ 'sender_screen_name':'hyfen', 'text':'world', 'created_at':'11' }];
			callback(arr);
		}
	}
	// ----------------------------------------	
	// Pull in a bunch of recent sent DMs as raw JSON
	that.getSent = function(since, limit, callback) {
		var send_url = "direct_messages/sent.json";
		send_url += "?count=" + limit;
		send_url += "&callback=?";	
		send_url = authenticateURL(send_url);
		
		// Spoof data if no internet connection
		if(!DMChat.offline) {
			$.getJSON(send_url, callback);
		} else {			
			var arr = [ { 'receiver_screen_name':'hyfen', 'text':'send1', 'created_at':'10' },
						{ 'receiver_screen_name':'aplusk', 'text':'send2', 'created_at':'8' }];
			callback(arr);
		}
	}
	
	// ----------------------------------------		
	// private functions	
	/**
	* Construct the REST API URL based on what we are trying to do
	* and attach the appropriate authentication and versioning.
 	*
	*@param restRequest - the resource being requested, exlcuding http://
	*/
	var authenticateURL = function(restRequest) {
		var url = service;
		url		+= username + ":" + password +"@";
		url		+= apiURL + version + "/";
		url 	+= restRequest;
		return url;
	}	
	return that;	
}
