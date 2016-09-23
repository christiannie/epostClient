"use strict";
/**
 * author: chrnie
 * since: 2016-07-27
 * ------------------------------
 * E-Post Services - Login und Logout
 */
var logger = require("app/util/logger.util")("ePost.send.service");
var HttpClient = require("app/controller/util/httpClient.util");
var apiUtils = require("app/controller/util/apiutils.util");
var ePostConfig = require("services/ePost/ePost.config");
module.exports = ( function() {

        var successHandler = function(_onSuccess, _onError, _response, httpStatusCode, title) {
            logger("info", "successRequest", title);
            var onError;
            if (_onError && _onError instanceof Function) {
                    onError = _onError;
            } else{
                onError =  function(){};
            }
            if (_response) {
                try {
                    // 200 >> OK
                    // 201 >> Created
                    // 202 >> Accepted
                    if (parseInt(_response.httpStatus) === httpStatusCode) {
                         logger("info", "successRequest HttpStatusCode", httpStatusCode, title);
                         _response.responseData = apiUtils.jsonParser.parse(_response.responseData || {});
                        if (_.isFunction(_onSuccess)) {
                                logger("info", "_onSuccess execute", title);
                                _onSuccess(_response.responseData);
                            }
                            return;
                    } else {
                         // WRONG HTTPSTatus
                            logger("error", "received wrong HTTPStatus", _response.httpStatus, "expected", httpStatusCode);
                            onError();
                    }
                } catch (e) {
                    logger("error", e);
                    onError();
                }
            } else {
                // MISSING REsponse
                logger("error", "Missing Response");
                onError();
            }
            return;
        },

            onSuccessLettersUpload = function(onSuccess, onError, _response) {
            return successHandler(onSuccess, onError, _response, 201, "DocumentUpload");
        },

            onSuccessPostageInfo = function(onSuccess, onError, _response) {
            return successHandler(onSuccess, onError, _response, 200, "PostageInfo");
        },
            onSuccessSendLetter = function(onSuccess, onError, _response) {
            return successHandler(onSuccess, onError, _response, 204, "SendDocument");
        },
            onSuccessRemoveLetter = function(onSuccess, onError, _response) {
            return successHandler(onSuccess, onError, _response, 204, "RemoveDocument");
        },

            onErrorRequest = function(onError, _response) {
            logger("warn", "errorRequest", _response);
            // Verarbeite den ErrorResponse
            var responseData;
            try {
                if (_response && _response.responseData) {
                    responseData = apiUtils.jsonParser.parse(_response.responseData);
                }
            } catch(e) {
                logger("error", e);
            }
            if (onError && onError instanceof Function) {
                onError(responseData);
            }
        };

        /**
         * Login zur E-Post-Schnittstelle
         * @param {Object} server
         * @param {Object} user
         * @param {Object} onSuccess
         * @param {Object} onError
         */
        var lettersUpload = function(user, letterData, onSuccess, onError) {
            logger("info", "execute lettersUpload");
            if (!_.isObject(user)) {
                throw new Exception("Missing user");
            }
            if (!_.isArray(letterData)) {
                throw new Exception("Missing letterData");
            }
            var clientConfig = apiUtils.getMultipartMessage(letterData);

            var httpClient = new HttpClient(logger);

            var httpConfig = _.extend({
                headers : {
                    'x-epost-access-token' : user.accessToken,
                    'Authorization' : user.authorization,
                },
                url : ePostConfig.lettersURL,
                onSuccess : onSuccessLettersUpload.bind(this, onSuccess, onError),
                onError : onErrorRequest.bind(this, onError)
            }, clientConfig);
            // Poste Letters Upload
            httpClient.doPost(httpConfig);
        };

        var setOptionsAndGetPostageInfo = function(user, postageInfoLink, portoOptions, onSuccess, onError) {
            logger("info", "execute setOptionAndGetPostageInfo");
            if (!_.isObject(user)) {
                throw new Exception("Missing user");
            }
            if (!_.isObject(postageInfoLink)) {
                throw new Exception("Missing postageInfoLink");
            }
            if (!_.isObject(portoOptions)) {
                throw new Exception("Missing portoOptions");
            }
            logger("info", "postageInfoLink:", postageInfoLink, "PortoOptionen:", portoOptions);

            var httpClient = new HttpClient(logger);

            httpClient.doPost({
                headers : _.extend(postageInfoLink.headers, {
                    'x-epost-access-token' : user.accessToken,
                    'Authorization' : user.authorization,
                    'Content-Type' : 'application/vnd.epost-dispatch-options+json'
                }),
                url : postageInfoLink.href,
                onSuccess : onSuccessPostageInfo.bind(this, onSuccess, onError),
                onError : onErrorRequest.bind(this, onError),
                data : JSON.stringify({
                    "options" : portoOptions
                })

            });
        };

        var sendLetter = function(user, sendLink, sendOptions, onSuccess, onError) {
            logger("info", "execute sendLetter");
            if (!_.isObject(user)) {
                throw new Exception("Missing user");
            }
            if (!_.isObject(sendLink)) {
                throw new Exception("Missing sendLink");
            }
            if (!_.isObject(sendOptions)) {
                throw new Exception("Missing sendOptions");
            }
            logger("info", "sendLink:", sendLink, "sendOptions:", sendOptions);

            var httpClient = new HttpClient(logger);

            httpClient.doPost({
                headers : _.extend(sendLink.headers, {
                    'x-epost-access-token' : user.accessToken,
                    'Authorization' : user.authorization,
                    'Content-Type' : 'application/vnd.epost-dispatch-options+json'
                }),
                url : sendLink.href,
                onSuccess : onSuccessSendLetter.bind(this, onSuccess, onError),
                onError : onErrorRequest.bind(this, onError),
                data : JSON.stringify({
                    "options" : sendOptions
                })

            });
        };
        var removeLetter = function(user, letterId, onSuccess, onError) {
             logger("info", "execute sendLetter");
            if (!_.isObject(user)) {
                throw new Exception("Missing user");
            }
            if (!letterId) {
                throw new Exception("Missing letterId");
            }
            logger("info", "letterId:", letterId);

            var httpClient = new HttpClient(logger);

            httpClient.doDelete({
                headers :  {
                    'x-epost-access-token' : user.accessToken,
                    'Authorization' : user.authorization,
                },
                url : ePostConfig.lettersURL+"/"+letterId,
                onSuccess : onSuccessRemoveLetter.bind(this, onSuccess, onError),
                onError : onErrorRequest.bind(this, onError)
            });
        };

        return {
            createLetters : lettersUpload,
            postageInfo : setOptionsAndGetPostageInfo,
            sendLetter : sendLetter,
            removeLetter : removeLetter
        };

        function getAsUriParameters(data) {
            var url = '';
            var prop;
            for (prop in data) {
                url += encodeURIComponent(prop) + '=' + encodeURIComponent(data[prop]) + '&';
            }
            return url.substring(0, url.length - 1)
        }

    }()); 