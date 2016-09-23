"use strict";


//privates
var logger = require("app/util/logger.util")("Properties"),
    
//globals
    pbProperties = {
    defaulttimeout : 60,
    apptimeout : 30,
    baseUrl : {
        key : "",
        url : ""
    },
},
    pbGlobalVars = {},

    setBaseUrl = function(key) {
    if (key && typeof key === "string") {
        var field = urlsBankApi[key];
        if (field) {
            pbProperties.baseUrl.url = urlBase64ToClear(field);
            pbProperties.baseUrl.key = key;
            logger("info", "Setting new URL to", key);
        } else {
            logger("warn", "Can not set Base URL, key did not match any keys or URL was not set yet");
        }
    } else {
        throw new Error("Can not set Base URL without valid key");
    }
};

//defaultUrl

module.exports = {
    properties : pbProperties,
    vars : pbGlobalVars,
    staticFunctions : {
        setBaseUrl : setBaseUrl,
    },
    mainWindow : {}
};
