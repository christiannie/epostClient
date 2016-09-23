"use strict";

var 
    TIMEOUT = Alloy.Globals.pbGlobals.properties.defaulttimeout,
    logger = require("app/util/logger.util")("httpClient.util"),
    https = require('appcelerator.https'),

/**
 * Interpretiert den vom httpClient erzeugen Response und gibt diesen in einer Standardformatierung zurück
 * @param {Object} response
 * @param {Object} httpClient
 */
    buildResponseObject = function(response, httpClient) {
	var returnThis = {
		callbackType : ( function() {
				if (response.type) {
					return response.type;
				} else if (response.error) {
					return response.error;
				} else {
					return "SUCCESS";
				}
			}()),
		responseData : this.responseText,
		httpStatus : (function() {
			if (this.status) {
				return this.status.toString();
			} else if (response.code && response.code !== 0) {
				return response.code.toString();
			} else {
				return 0;
			}
		}).call(this),
		requestedUrl : httpClient.location,
	};

	switch(response.readyState) {
	case httpClient.UNSENT:
		returnThis.state = "NOT_SENT";
		break;
	case httpClient.OPENED:
		returnThis.state = "READY";
		break;
	case httpClient.LOADING:
		returnThis.state = "WAITING_FOR_RESPONSE";
		break;
	case httpClient.HEADERS_RECEIVED:
		returnThis.state = "ANSWERED";
		break;
	case httpClient.DONE:
		returnThis.state = "DONE";
		break;
	default:
		if (response.type === "error") {
			returnThis.state = "ERROR";
		} else if (response.type === "load") {
			returnThis.state = "SUCCESS";
		} else if (this.logger) {
			this.logger('error', "httpClient.api :: unknown response type: " + response.type);
		}
		break;
	}

	return returnThis;
};


 var securityManager = https.createX509CertificatePinningSecurityManager([
    {
        url: "https://login.epost-gka.de",
        serverCertificate: "certificates/login.epost-gka.de.cer"
    },
    {
        url: "https://mailbox.api.epost-gka.de",
        serverCertificate: "certificates/mailbox.api.epost-gka.de.cer"
    }
]);

/**
 * Schickt einen HTTP request mit der entsprechenden Methode(method) und einer entprechenden configuration(config) an eine URL(config.url)
 * @param {String} method
 * @param {Object} config
 */
var sendRequest = function(method, config) {
		if (!(config && config.url)) {
			throw new Error("config or config.url must not be null!");
		}

	try {
		//#################################DEBUG

		// Replace MOCK/PILOT URL
		var regexSelectPbBaseURLs = /(http(s)?:\/\/)([\da-z\.\-]+)(postbank\.de)+([\:\d])*\//i;
		if(regexSelectPbBaseURLs.test(config.url)){
            var regexSelectAllBaseURLs = /(http(s)?:\/\/)([a-z]*:?.*@{1})?([\da-z\.\:\-]+)(\.[a-z\.]{2,6})?\//i;
            //logger('warn',Alloy.Globals.pbGlobals.properties.baseUrl.key, "Data active, replace URL - ", config.url);
            config.url = config.url.replace(regexSelectPbBaseURLs, regexSelectAllBaseURLs.exec(Alloy.Globals.pbGlobals.properties.baseUrl.url)[0]);
            //logger('warn',Alloy.Globals.pbGlobals.properties.baseUrl.key, "Data active - changed to: ", config.url);
		}
		//#################################DEBUG


		var renderUrl = Alloy.Globals.pbGlobals.properties.debug ? config.url + " - " : "",
		    parentThis = this,
		    httpClient = Ti.Network.createHTTPClient({
		    // Set this property before calling the `open` method. 
            securityManager: securityManager,
            
			validatesSecureCertificate : false,//Alloy.Globals.pbGlobals.properties.productive,
			onload : function(_response) {
				var returnThis = buildResponseObject.call(this, _response, httpClient);
				if (parentThis.logger) {
					parentThis.logger('info', renderUrl, 'Success! Status: ', returnThis.httpStatus);
				}
				if (config.onSuccess) {
					config.onSuccess(returnThis);
				}
				if (parentThis.onSuccess) {
					parentThis.onSuccess(returnThis);
				}
			},
			onerror : function(_response) {
				logger('error',_response);
				var returnThis = buildResponseObject.call(this, _response, httpClient);
				if (parentThis.logger) {
					parentThis.logger('info', renderUrl, 'Error! Status: ', returnThis.httpStatus);
					// parentThis.logger('info', renderUrl, 'Internet Access: ', returnThis.isOnline.toString());
				}
				if (config.onError) {
					config.onError(returnThis);
				}
				if (parentThis.onError) {
					parentThis.onError(returnThis);
				}
			},
			onreadystatechange : function(_response) {
				var returnThis = buildResponseObject.call(this, _response, httpClient);
				if (parentThis.logger) {
					parentThis.logger('debug', renderUrl + 'New state is: ', returnThis.state);
				}
				if (config.onStatusChange) {
					config.onStatusChange(returnThis);
				}
				if (parentThis.onStatusChange) {
					parentThis.onStatusChange(returnThis);
				}
			},
			timeout : (config.timeout || TIMEOUT) * 1000,
            username: "pb",
            password: "hoquaiS1",
		});

		httpClient.open(method, config.url);

		if(Ti.Network.online || ( ((Titanium.Platform.model == 'google_sdk' ||
            Titanium.Platform.model == 'Simulator')  && Ti.App.deployType === "development"))){
                
                if (this.logger) {
                this.logger('info', renderUrl, 'request is ready to fire');
            }
                
						
            if(config.headers && config.headers instanceof Object){
                var key;
                for(key in config.headers){
                    if (config.headers.hasOwnProperty(key)) {
                        httpClient.setRequestHeader(key, config.headers[key]);
                        if (this.logger) {
                            this.logger('info', renderUrl, 'header "'+ key+'" set');
                        }
                    }
                }
            }
                if(config.contentType){
                    httpClient.setRequestHeader('Content-Type', config.contentType); //  || 'application/x-www-form-urlencoded'
                }
                if (config.accept) {
                    httpClient.setRequestHeader('Accept', config.accept);
                }
                
    
                if (config.token) {
                    httpClient.setRequestHeader('X-AUTH', config.token);
                    if (this.logger) {
                        this.logger('info', renderUrl, 'token has been set to X-Auth');
                    }
                }


			if (method === "POST") {
				if (config.data && config.data instanceof Object) {
					var arr = ['info', renderUrl, 'will send following fields from config.data:'],
					    i;
					for (i in config.data) {
						if (config.data.hasOwnProperty(i)) {
							arr.push(config.data[i]);
						}
					}
					if (this.logger) {
						this.logger.apply(this.logger, arr);
					}

                    Ti.API.info(" config.contentType::: " +  (config.contentType || (config.headers && config.headers["Content-Type"])));

					httpClient.send(config.data);
				} else if (config.data) {
					if (this.logger) {
						this.logger('info', renderUrl, 'method:', method, 'config.data was not an object. Will be sent as a String');
					}
					
                    Ti.API.info(" config.contentTyp>>> " +  config.contentType);

					httpClient.send(config.data);
				} else {
					if (this.logger) {
						this.logger('warn', renderUrl, 'method:', method, 'config.data was null. Will be sent without any data');
					}
					httpClient.send();
				}
			} else {
				httpClient.send();
			}
			if (this.logger) {
				this.logger('info', renderUrl, 'request is fired');
			}
		}else{
			if(this.logger){
				this.logger('warn', 'Internet Access missing');
			}
			var errorObject = {
			    code : -1009,
			    error : "The Internet connection appears to be offline.",
			    success : 0,
			    type : "error"
			};
			var returnThis = buildResponseObject.call(this, errorObject, httpClient);
			if (config.onError) {
				config.onError(returnThis);
			}
			if (this.onError) {
				this.onError(returnThis);
			}
		}
	} catch(_e) {
		if (this.logger) {
			this.logger('error', 'httpClient.api - had problem sending the request');
			this.logger('error', 'httpClient.api - Line: ' + _e.line + ' - ' + _e.message);
		}
	}

};

/**
 * Liefert einen HTTP Client, welcher Standardmethoden wie "doGet", "doPost", "doDelete" implementiert und mithilfe entsprechender Callbacks die Möglichkeit zu differenzierten HTTP Requests liefert
 * @param {Object} logger
 * @param {Function} onSuccess - optional
 * @param {Function} onError - optional
 * @param {Function} onStatusChange - optional
 */
var httpClient = function(logger, onSuccess, onError, onStatusChange) {
	this.onSuccess = onSuccess;
	this.onError = onError;
	this.onStatusChange = onStatusChange;
	this.logger = (logger) ? logger : console.warn("httpClient.api :: no logger defined");
};

/*
* config {
* 	url
* 	token
* 	data
* }
*/
/**
 * Startet einen GET Request an die URL(config.url) und wenn vorhanden mit dem Token(config.token)
 * @param {Object} config
 */
httpClient.prototype.doGet = function(_config) {
	sendRequest.call(this, 'GET', _config);
};

/**
 * Startet einen POST Request an die URL(config.url) mit den Daten(config.data) und wenn vorhanden mit dem Token(config.token)
 * @param {Object} config
 */
httpClient.prototype.doPost = function(_config) {
	sendRequest.call(this, 'POST', _config);
};

/**
 * Startet einen DELETE Request an die URL(config.url) und wenn vorhanden mit dem Token(config.token)
 * @param {Object} config
 */
httpClient.prototype.doDelete = function(_config) {
	sendRequest.call(this, 'DELETE', _config);
};

module.exports = httpClient;

