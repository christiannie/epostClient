"use strict";
/**
 * author: chrnie
 * since: 2016-07-27
 * ------------------------------
 * E-Post Services - Login und Logout
 */
var logger = require("app/util/logger.util")("ePost.login.service");
var HttpClient = require("app/controller/util/httpClient.util");
var apiUtils = require("app/controller/util/apiutils.util");
var ePostConfig = require("services/ePost/ePost.config");
module.exports = (function() {

var LOGIN_TIMEOUT = 20;


    var onSuccessLoginRequest = function(_onSuccess, _onError, _response) {
            logger("info","onSuccessLoginRequest");
            if (_response && _response.responseData) {
                try {
                    _response.responseData = apiUtils.jsonParser.parse(_response.responseData);
                    if (_response.responseData && parseInt(_response.httpStatus) === 200) {
                        logger("info", "Login Success");
                        if (_.isFunction(_onSuccess)) {
                            _onSuccess(_response.responseData);
                        }
                    }
                } catch (e) {
                    logger("error", e);
                }

            } else {
                if (_.isFunction(_onError)) {
                    _onError();
                }
            }
            return;
        },
        onErrorLoginRequest = function(_onError, _response) {
            logger("warn", "onErrorLoginRequest ", _response);

            if (_.isFunction(_onError)) {
                _onError();
            }

        };


    /** 
     * Logout Callbacks
     */
    var onSuccessLogoutRequest = function(_onSuccess, _onError, _response) {
           logger("info", "Logout Success", _response);
        
            if (_response && parseInt(_response.httpStatus) === 204) {
                if (_.isFunction(_onSuccess)) {
                    _onSuccess.call(_response.responseData);
                }
            }
        },
        onErrorLogoutRequest = function(_onError, _response) {
            if (_.isFunction(_onError)) {
                _onError.call();
            }
        };


    /**
     * Login zur E-Post-Schnittstelle
     * @param {Object} server
     * @param {Object} user
     * @param {Object} _onSuccess
     * @param {Object} _onError
     */
    var loginService = function(user, _onSuccess, _onError) {
        logger("info", "execute loginService");
        if (!_.isObject(user)) {
            throw new Exception("Missing ePost User");
        }

        var sendData = {
            username: user.username,
            password: user.password,
            grant_type: "password",
            scope: "send_hybrid create_letter delete_letter"
        };
        var httpClient = new HttpClient(logger);

        httpClient.doPost({
            url: ePostConfig.loginURL,
            data: getAsUriParameters(sendData),
             headers : {
                        'Authorization': user.authorization,
                        'Content-Type' : 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
            timeout : LOGIN_TIMEOUT,
            onSuccess: onSuccessLoginRequest.bind(this, _onSuccess, _onError),
            onError: onErrorLoginRequest.bind(this, _onError)
        });
    },

    /**
     * Logout, hier genuegt lediglich die Server-URL und der accessToken im Post
     */
    logoutService = function(user, _onSuccess, _onError) {
logger("info", "execute logoutService");

       
        if (!_.isObject(user) || user.accessToken === undefined) {
            // Kein Logout noetig
            return;
        }

        var sendData = {
            access_token: user.accessToken
        };
        var httpClient = new HttpClient(logger);

        httpClient.doPost({
            url: ePostConfig.logOutURL,
            data: getAsUriParameters(sendData),
            headers: {
                'Content-Type': "application/x-www-form-urlencoded;charset=UTF-8"
            },
            onSuccess: onSuccessLogoutRequest.bind(this, _onSuccess, _onError)
        });
    };


    return {
        login: loginService,
        logout: logoutService
    };




    function getAsUriParameters(data) {
        var url = '';
        var prop;
        for (prop in data) {
            url += encodeURIComponent(prop) + '=' +
                encodeURIComponent(data[prop]) + '&';
        }
        return url.substring(0, url.length - 1)
    }

}());