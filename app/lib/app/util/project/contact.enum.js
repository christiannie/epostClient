"use strict";

module.exports = {
    gender : {
        male : "male",
        female: "female"
    },
    
   
    
    getGenderFormat : function(_gender) {
        if (_gender) {
            if(/^male$/i.test(_gender)){
                return 'Herr' ;
             } else if(/^female$/i.test(_gender)){
                return "Frau";
             }
        }
        return "";
    }
};
