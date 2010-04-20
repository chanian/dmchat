// ------------------------------------
/**
 * DMDebugger
 * (c) 2010 Ian Chan <http://chanian.com>
 * MIT license
 *
 * A simple logging tool to help while
 * debugging, nothing too fancy here.
 *
 */
// ------------------------------------
// Simple debugging class
var DMDebugger = {		
	// Log a string and render
	log : function(str) {	
		var obj = $("#log-content");
		var date = dateFormat((new Date()), "h:MM:ss tt");
		str = "[" + date + "] : " + str;
		obj.prepend("<div class='log-entry'>"+str+"</div>");
	},
	// ------------------------------------
	// Create the logger in the DOM
	init : function () {
		// Let's keep my canvas clean
		var html = this.getView();
		
		$('body').append(html);	
		$("#log").draggable({ handle:'div.header'} );		
	},
	// ------------------------------------	
	// Draw the debugger panel
	getView : function() {
		var html = "<div class='log' id='log'>" +
						"<div class='header'>" +
							"Debugger" +
							"<div class='close' onclick='$(\"#log-content\").toggle()'>show/hide</div>" +
						"</div>" +
						"<div class='log-content' id='log-content'></div>" +
					"</div>";					
		return html;		
	}
}
