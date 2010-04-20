// ------------------------------------
/**
 * WindowManager
 * (c) 2010 Ian Chan <http://chanian.com>
 * MIT license
 *
 * A controller of all windows on the screen.
 * Use this as a bridge between application kernal 
 * and individual windows.
 *
 */
// ------------------------------------
var windowmanager = function() {
	var that = {};
	
	// List of open chat windows
	// currently using .length for next id
	that.windows = [];
	
	// Private variables
	var highestDepth = 100;
	
	// The currently focused window
	var focus = {};
	
	// The opacity when blurred
	var blurAlpha = 0.7;
	
	// ------------------------------------		
	// Set the top focus window and fade out the old on
	that.setFocus = function(obj) {
		// aka: general blur 
		if(!obj) {
			focus = "";
			return;
		}		
		// Don't refocus
		if(obj !== focus) {
			// Fade out the old focus
			if(focus && $(focus.view).is(":visible")) {
				$(focus.view).fadeTo('medium', blurAlpha);
			}
			focus = obj;
			
			// Fade in, and bring to front
			if(focus) {
				DMDebugger.log("Focus to: @" + focus.user);
				$(focus.view).fadeTo('medium', 1);
				focus.view.style.zIndex = this.getHighestDepth();
				
				// Also, hide the outstanding DMcount panel
				$("#panelCount_" + focus.user).fadeOut();
			}
		}
	}
	// ------------------------------------		
	// Get the top focus window
	that.getFocus = function() {
		return focus;
	}
	
	// ------------------------------------	
	// Return and increment the next highest depth
	that.getHighestDepth = function() {
		highestDepth++;
		return highestDepth;
	}

	// ------------------------------------	
	// Receive a new incoming DM, and update the UI appropriately
	that.takeDM = function(dm) {		
		// Check all open windows
		for(var i = 0; i < this.windows.length; i++) {
			var w = this.windows[i];
			
			// This window exists, push it even if closeds
			if(w.user === dm.user) {
				DMDebugger.log("Update live new DM");				
				w.renderDM(dm);
				return;
			}
		}
		// If we are here, no window was open yet.
		// The dm will appear on demand once opened
	}
	
	// ------------------------------------	
	// Spawn a new chat window	
	that.create = function(name) {
		// If they didnt supply a name, they are manually making one
		if(!name || name.length <= 0) {			
			name = (document.getElementById("username").value);
		}
		
		// See if its already open but hidden / blurred
		for(var i = 0; i < this.windows.length; i++) {
			var w = this.windows[i];			
			// Found it
			if(w.user === name) {
				DMDebugger.log("Re-open Chat: @" + name);				
				w.isOpen = true;
				this.setFocus(w);
				return;
			}
		}
		// Otherwise, create the new window		
		var canvas = document.getElementById("canvas");
		document.getElementById("username").value = "";	
		
		DMDebugger.log("Create New Chat: @" + name);		
		var w = chatwindow(name, canvas, this.windows.length);
		this.setFocus(w);
		this.windows.push(w);
		
		// Also add user to the chat panel if needed
		DMChat.addUser(name, 0, true);
		
		// Position it somewhere "nice"
		var xpos = (Math.random()*600) + 160;
		var ypos = (Math.random()*100) + 15;
		$( w.view ).offset( { top:ypos, left:xpos } );
	}
	// ------------------------------------			
	// Close window	
	that.close = function(id) {
		DMDebugger.log("Close Chat: @" + this.windows[id].user);
		this.windows[id].close();
		
		// Set focus to the next non-hidden window
		for(var i = 0; i < this.windows.length; i++) {
			var w = this.windows[i];			
			if( w.id !== id && w.isOpen ) {
				this.setFocus(w);
				return;
			}
		}
		this.setFocus(false);
	}
	
	return that;	
};