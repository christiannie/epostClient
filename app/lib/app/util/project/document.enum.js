"use strict";

module.exports = {
    state : {
        created : "created",
        sent : "sent", // open
        deleted: "deleted",
        overdue  : "overdue ", // überfaellig
        reminded : "reminded", // in Mahnung
        paid : "paid"
    },
    type : {
        RECHNUNG : "RECHNUNG",
        ANGEBOT : "ANGEBOT",
        ZAHLUNGSERINNERUNG : "ZAHLUNGSERINNERUNG",
        properties : {
            RECHNUNG : {
                format : L('projectdetails_documents_type_rechnung')
            },
            ANGEBOT : {
                format : L('projectdetails_documents_type_angebot')
            },
            ZAHLUNGSERINNERUNG : {
                format : L('projectdetails_documents_type_zahlungserinnerung')
            }
        }
    },

    getTypeFormat : function(_type) {
        if (_type) {
            if(this.type.hasOwnProperty(_type)){
                return this.type.properties[_type].format;
            }
        }
        return "";
    }
};
