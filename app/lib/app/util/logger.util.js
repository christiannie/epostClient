"use strict";
/**
 * Pattern wie das Prefix aussehen soll
 */
var logPattern = "[{clock}] : [{classname}] =>";

var logger = function(classname){
	if (classname) {
		this.classname = classname;
	} else {
		this.classname = "NOT SET";
	}
};
/**
 * Helper, welcher das Prefix vor den eigentlichen Logtext setzt und ausgibt
 */
logger.prototype.logging = function() {
	if (arguments && arguments.length > 0) {
		var logfunction = console[arguments[0]],
		    prefix = logPattern.replace("{clock}", new Date().toTimeString().split(" ", 1)[0]).replace("{classname}", this.classname),
		    index,
		    argLength;

		if (logfunction) {
			var printStrings = [];

			printStrings.push(prefix);
			delete arguments[0];
			argLength = arguments.length;
			for ( index = 0; index < argLength; index += 1) {
				if (arguments[index]) {
					printStrings.push(arguments[index]);
				}
			}

			logfunction.apply(console, printStrings);
		} else {
			console.error(prefix, "No Logfunction with the name >>", arguments[0], "<< found");
		}
	}
};

/**
 * Logger Construktor
 * @param {Object} classname
 */
module.exports = function(classname) {
	var mylogger = new logger(classname);
	return mylogger.logging.bind(mylogger);
};

