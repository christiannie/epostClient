"use strict";
/**
 * author: chrnie
 * since: 2016-07-27
 * ------------------------------
 * E-POST Controller zur Anbindung der E-POST Schnittstelle
 */
var logger = require("app/util/logger.util")("ePost.controller"),
    contactEnum = require("app/util/project/contact.enum");
var securely = require('bencoding.securely');
    var ePostConfig = require("services/ePost/ePost.config");


module.exports = (function() {


    var statics = {};
    var stringCrypto = securely.createStringCrypto();
    /**
     * user: {
     *     username:'',
     *      subdomain:'',
     * password:''
     * }
     */
    var ePostController = function(user) {
        
        
        var authorizationKey = stringCrypto.AESDecrypt(Ti.App.Properties.getString('epostAppKey'), ePostConfig.authorization);
        
        if(!/^Basic/.test(authorizationKey)){
            throw new Error("Cant Decrypt API KEY");
        }
        
        var createUsername = user.username + "@";
        if(user.subdomain){
            createUsername += user.subdomain+"."
        }
        createUsername += ePostConfig.usernameServerSuffix;
        
        this.user = {
            identifier: "",
            accessToken: undefined,
            authorization:  authorizationKey,
            username : createUsername,
            password : user.password
        };
        this.document = {
            id: undefined,
            letterId: undefined
        };
        
    };

    ePostController.prototype.login = function(_onSuccess, _onError) {
        if (!statics.loginServices) {
            statics.loginServices = require("services/ePost/services/ePost.login.service");
        }
        var user = this.user;

        statics.loginServices.login( this.user,
            // Success
            function(_responseData) {
                if (_responseData && typeof _responseData.access_token === "string") {
                    user.accessToken = _responseData.access_token;
                    if (_.isFunction(_onSuccess)) {
                        _onSuccess();
                    }

                } else {
                    user.accessToken = undefined;
                    if (_.isFunction(_onError)) {
                        _onError();
                    }
                }
                return;
            },
            // Error
            function(_responseData) {
                logger("warn", "ePostLogin failed");
                user.accessToken = undefined;
                if (_.isFunction(_onError)) {
                    _onError(_responseData);
                }
            });
    };

    /**
     * UploadDocument zum hochladen eines E-Post-Briefs in die Entwürfe
     */
    ePostController.prototype.uploadDocument = function(_envelope, documents, _onSuccess, _onError) {
        logger("info", "execute uploadDocument...");
        if(!_.isArray(documents)){
            logger("error", "missing documents");
            if(_.isFunction(_onError)){
                _onError();
            }
            return;
        }
        if (!statics.letterService) {
            statics.letterService = require("services/ePost/services/ePost.send.service");
        }

        // Baue EPOST Parameter auf
        var envelopeConfig = {
            envelope: {
                subject: _envelope.subject ||  "",
                letterType: {
                    systemMessageType: "hybrid",
                    messageType: "EPB"
                },
                recipientsPrinted: mappingRecipient(_envelope.recipients)
            }
        };

        var letter = [{ // Zunaechst der "Header mit Empfaenger usw. als META-Daten"
            contentType: "application/vnd.epost-letter+json",
            data: JSON.stringify(envelopeConfig)
        }];
        var key;
        for (key in documents) {
            if (documents.hasOwnProperty(key)) {
                var doc = documents[key];
                var docMultipart = {
                    contentType: "application/pdf",
                    contentDisposition: 'form-data; filename="' + doc.filename + '"; name="' + doc.name + '"',
                    contentTransferEncoding: "base64",
                    data: JSON.stringify(doc.data)
                }
                letter.push(docMultipart)
            }
        }
        statics.letterService.createLetters( this.user, letter,
            function(_responseData){
                // SUCCESS Callback
                logger("info", "LetterService onSuccess");
                
                if(_responseData.letterId && _responseData.letterId.length > 0){
                this.document = _responseData;
                
                if(_.isFunction(_onSuccess)){
                _onSuccess(this.document);
                }
                } else {
                    logger("error", "Missing letterId on ResponseData");
                     if(_.isFunction(_onError)){
                _onError();
                }
                }
            }.bind(this),
            function(_responseData){
                // ERROR Callback
                logger("warn", "LetterService onError", _responseData);
                if(_responseData && (/invalid_token$/i.test(_responseData.errorCode) || /invalid_token$/i.test(_responseData.error))){
                    
                } else {
                    if(_.isFunction(_onError)){
                _onError(_responseData);
                }
                }
            }.bind(this)
            
            );
        logger("info", "uploadDocument executed...");
    };
    ePostController.prototype.postageInfo = function(_options, _onSuccess, _onError) {
 logger("info", "execute postageInfo...");
        if(!_.isObject(_options)){
            logger("error", "missing Options");
            if(_.isFunction(_onError)){
                _onError();
            }
            return;
        }

        
           if (!statics.letterService) {
            statics.letterService = require("services/ePost/services/ePost.send.service");
        }
        
        var postageInfoLink = getDocumentLink(this.document["_links"], "postage-info");
        
        if(!postageInfoLink){
            logger("error", "missing DocumentLink for postage-info");
            if(_.isFunction(_onError)){
                _onError();
            }
            return;
        }
        
        statics.letterService.postageInfo( this.user, postageInfoLink, _options,
            function(_responseData){
                // SUCCESS Callback
                logger("info", "postageInfo onSuccess");
                
                traverse(_responseData, camelCase);
                
                 if(_.isFunction(_onSuccess)){
                _onSuccess(_responseData);
                }
            },
            function(_responseData){
                // ERROR Callback
                logger("warn", "postageInfo onError", _responseData);
                if(_responseData && (/invalid_token$/i.test(_responseData.errorCode) || /invalid_token$/i.test(_responseData.error))){
                    // Session Invalid
                                   } else {
                    if(_.isFunction(_onError)){
                _onError(_responseData);
}
}
            }
            
            );
        logger("info", "postageInfo executed...");
        
    };

    ePostController.prototype.sendDocument = function(_options, _onSuccess, _onError) {
 logger("info", "execute sendDocument...");
        if(!_.isObject(_options)){
            logger("error", "missing Options");
            if(_.isFunction(_onError)){
                _onError();
            }
            return;
        }

        
           if (!statics.letterService) {
            statics.letterService = require("services/ePost/services/ePost.send.service");
        }
        
        var sendDocLink = getDocumentLink(this.document["_links"], "send");
        
        if(!sendDocLink){
            logger("error", "missing DocumentLink for Send");
            if(_.isFunction(_onError)){
                _onError();
            }
            return;
        }
        
        statics.letterService.sendLetter( this.user, sendDocLink, _options,
            function(_responseData){
                // SUCCESS Callback
                logger("info", "sendDoc onSuccess", _responseData);
                 if(_.isFunction(_onSuccess)){
                    _onSuccess(_responseData);
                    }
            },
            function(_responseData){
                // ERROR Callback
                logger("warn", "sendDoc onError", _responseData);
                if(_responseData && (/invalid_token$/i.test(_responseData.errorCode) || /invalid_token$/i.test(_responseData.error))){
                    // SessionTimeout
                   } else {
                    if(_.isFunction(_onError)){
                _onError();
            }
                }
            }
            
            );
        logger("info", "sendDocument executed...");
        
    };
    ePostController.prototype.removeDocument = function(_onSuccess, _onError) {
 logger("info", "execute removeDocument...");
       

        
           if (!statics.letterService) {
            statics.letterService = require("services/ePost/services/ePost.send.service");
        }
        
        
        
        statics.letterService.removeLetter( this.user, this.document.letterId,
            function(_responseData){
                // SUCCESS Callback
                logger("info", "removeLetter onSuccess", _responseData);
            },
            function(_responseData){
                // ERROR Callback
                logger("warn", "removeLetter onError", _responseData);
                if(_responseData && (/invalid_token$/i.test(_responseData.errorCode) || /invalid_token$/i.test(_responseData.error))){
                    // SessionTimeout
                } else {
                    if(_.isFunction(_onError)){
                _onError();
            }
                }
            }
            
            );
        logger("info", "removeDocument executed...");
        
    };
    ePostController.prototype.logout = function() {
        logger("info", "execute logout...");
        if (statics.loginServices) {
            statics.loginServices.logout( this.user);
        }
    };

    var mappingRecipient = function(_recipient) {
        if (_recipient) {
            if (_.isArray(_recipient)) {
                var list = [];
                _recipient.forEach(function(_oneRecipient) {
                    list.push(mappingRecipient(_oneRecipient));
                });
                return list;
            } else if (_.isObject(_recipient)) {
                // COMPANY bereits uebereinstimmend
                // _recipient.company = _recipient.company;


                // Hole erste Adresse des EMpfaengers
                var recipientAdress = _recipient.adress ||  {};

                var epostRecipient = {
                    company: _recipient.company,
                    salutation: contactEnum.getGenderFormat(_recipient.gender),
                    title: _recipient.title,
                    lastName: _recipient.name,
                    firstName: _recipient.surname,
                    streetName: recipientAdress.street,
                    houseNumber: "",
                    addressAddOn: recipientAdress.extension,
                    zipCode: recipientAdress.postcode,
                    city: recipientAdress.city
                }
                return epostRecipient;
            }
        }
    };
    
    /**
     * Sucht aus der LinkListe eines ePost-Calls die Links und ihre Headers raus
     */
    var getDocumentLink = function(linkList, linkName){
        if(linkName && linkList){
            if (linkList.hasOwnProperty(linkName)) {
                var neuerLink =  linkList[linkName];
                if(neuerLink && neuerLink.headers && neuerLink.headers instanceof Array){
                    var headerJSON = {};
                    var i, linkLength = neuerLink.headers.length;
                    for(i=0; i < linkLength; i+= 1){
                        var header = neuerLink.headers[i];
                        headerJSON[header.name]=header.value;
                    }
                    neuerLink.headers = headerJSON;
                } else {
                    neuerLink.headers = undefined;
                }
                return neuerLink;
            }
        }
        return;
    };




//called with every property and it's value
function camelCase(key,object) {
    var regex = /\W([a-zA-Z])/g;
    object[key.replace(regex, function(a, b){
        return b.toUpperCase();
    })] = object[key];
    // object[key] = undefined;
};

var traverse = function(o,func) {
    var i;
    for (i in o) {
        func.apply(this,[i,o]);  
        if (o[i] !== null && typeof(o[i])=="object") {
            //going on step down in the object tree!!
            traverse(o[i],func);
        }
    }
};

    return ePostController;
}());