"use strict";

module.exports = {
    jsonParser : {
        logger : require("app/util/logger.util")("jsonParser.util"),
        /**
         * Ermöglicht das sichere Parsen eines Strings in ein JSON Objekt
         * @param {String} jsonString
         */
        parse : function(jsonString) {
            //logger('log',jsonString);

            if (jsonString) {
                if ( typeof jsonString === "string") {
                    //TODO regex test ob JSON gueltig
                    if (/^[\],:{}\s]*$/.test(jsonString.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                        return JSON.parse(jsonString);
                    } else {
                        throw new Error('Could not parse json String due to invalid JSON');
                    }
                } else if ( jsonString instanceof Object) {
                    this.logger("warn", "jsonString already was an object");
                    return jsonString;
                } else {
                    throw new TypeError("jsonString was typeof", typeof jsonString, "so it could not be parsed");
                }
            } else {
                throw new TypeError('jsonString was null');
            }
        }
    },
    linkExtractor : {
        /**
         * Gibt zu einer Feldbezeichnung(name) aus einem Linkarray(links) der Schnittstelle die entsprechende URL zurück
         * @param {Array} links
         * @param {String} name
         */
        getLink : function(links, name) {
            var i,
                linklength = links.length;
            for ( i = 0; i < linklength; i += 1) {
                if (links[i].rel === name) {
                    return links[i].href;
                }
            }
            return null;
        },

        /**
         * Erstellt aus einem linkarray der Schnittstelle ein passendes Objekt mit der Bezeichnung des Links als Feldnamen und der dazugehörigen URL als Wert
         * @param {Array} links
         */
        getObject : function(links) {

            var returnObject = {};
            if (links) {
                var i,
                    linklength = links.length;
                for ( i = 0; i < linklength; i += 1) {
                    returnObject[links[i].rel] = links[i].href;
                }
            }
            return returnObject;
        }
    },
    /**
     *
     * @param {Object} _multipartData Array  []
     * Array mit JSON: {
     *      contentType:___
     *      contentTransferEncoding:___
     *      contentDisposition:___
     *      data:___
     * }
     */
    getMultipartMessage : function(_multipartData) {
        if (_multipartData && _multipartData instanceof Array) {
            try {
                var multipart = "";

                var config = {};
                var key;
                var boundary = Math.random().toString().substr(2);
                config.contentType = "multipart/mixed; charset=utf-8; boundary=" + boundary;

                for (key in _multipartData) {
                    if (_multipartData.hasOwnProperty(key)) {
                        var data = _multipartData[key];

                        multipart += "--" + boundary + "\r\nContent-Type:" + data.contentType;
                        if (data.contentDisposition) {
                            multipart += "\r\nContent-Disposition: " + data.contentDisposition;
                        }
                        if (data.contentTransferEncoding) {
                            multipart += "\r\nContent-Transfer-Encoding: " + data.contentTransferEncoding;
                        }

                        multipart += "\r\n\r\n" + data.data + "\r\n\r\n";
                    }
                }
                multipart += "--" + boundary + "--\r\n";
                config.data = multipart;
                return config;
            } catch(e) {
            }
        }
        return;
    }
};
