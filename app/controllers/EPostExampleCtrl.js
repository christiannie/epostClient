// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

var ePostController = require("services/ePost/ePost.controller");

var myEPostLogin = undefined;
var myEPostDocument = undefined;
var recipients = [{
    company : "IntelliNet Beratung & Technologie GmbH",
    gender : "male",
    title : "Dr.",
    surname : "Peter",
    name : "Mustermann",
    adress : {
        street : "Agustinusstraße 9b",
        extension : "3. OG",
        postcode : "50226",
        city : "Frechen Königsdorf"
    }
}];
var docOptions = {
                color : "colored",
                //coverLetter: "included",
                registered : "addresseeOnlyWithReturnReceipt"
        };

    Ti.API.info("db path:", Ti.Filesystem.getApplicationDataDirectory());

var getEPostLoginData = function() {
    Ti.API.info("Benutzername: ", $.inputUsername.value, " Subdomain: ", $.inputSubDomain.value);
    
    return {
        username: $.inputUsername.value,
        subdomain:  $.inputSubDomain.value,
        password: $.inputPassword.value
        
    };
};

var doLoginEPost = function() {
    Ti.API.info("doLoginEPost clicked");
    var loginData = getEPostLoginData();

    myEPostDocument = new ePostController(loginData);
    myEPostDocument.login(function() {
      
      
        /*
         * Einfache BackBone Speicherung, unverschluesselt
         
        var myNewModel = $.EPostUserCollection.create(loginData);
        try{
    myNewModel.save();
  alert("Login saved successfull");
    myEPostLogin = loginData;
    
    $.EPostPDF.applyProperties({
            visible : true
        });
    } catch(e){
        alert(e);
    }
    */
   alert("Login successful")
   myEPostLogin = loginData;
    
    $.EPostPDF.applyProperties({
            visible : true
        });
   
     myEPostDocument.logout();
       /* 
        $.EPostLogoutButton.applyProperties({
            visible : true
        });
        $.EPostButton.applyProperties({
            visible : false
        });
        */
    }, function() {
        alert("Login failed");
        myEPostDocument = undefined;
          $.EPostPDF.applyProperties({
            visible : false
        });
    });

},
    doLogoutEPost = function() {
    Ti.API.info("doLogoutEPost clicked");

    if (myEPostDocument) {
        myEPostDocument.logout();
        myEPostDocument = undefined;
    }
    $.EPostLogoutButton.applyProperties({
        visible : false
    });
    $.EPostButton.applyProperties({
        visible : true
    });
};

/**
 * Fuehre DokumentenVersand aus
 */
var doEPostPDFSend = function() {
    if(myEPostLogin){
        
        
        $.EPostPDFSend.enabled=false;
        setTimeout(function(){
        $.EPostPDFSend.enabled=true;    
        }, 5000);
        
        
    $.errorMessages.text="";
    
    var myEPost = new ePostController(myEPostLogin);
    myEPost.login(function() {
        // SUccess Callback
        var documents = [{
            base64 : true,
            filename : "R-16-001.pdf",
            name : "Rechnung 16-001",
            data : $.inputPDFStream.value
        }];

        myEPost.uploadDocument({
            recipients : recipients,
            subject : "E-Post Test - PDF"

        }, documents, function(_responseData) {
            // Success Upload Callback

            myEPost.postageInfo(docOptions,
            // onSuccess
            function(_response) {
                console.info("Porto: ", _response);

                var portoController = Alloy.createController("EPostPorto", {
                    portoResponse : _response,
                    
                    myServiceCtrl : myEPost,
                    
                    sendCallback : function() {
                        // SEND
                        myEPost.sendDocument(docOptions
                            , function() {

                            alert("Document sent successfull");

                        portoController.getView().close();
                        }, function(_errorResponse) {
                            alert("Document sent with Error");
                            $.errorMessages.text=JSON.stringify(_errorResponse);
                        portoController.getView().close();
                        });
                        return; 
                    },
                    abbrechenCallback : function(){
                        portoController.getView().close();
                        // Loesche die Vorlage
                        
                        myEPost.removeDocument(
                // onSuccess
                function(_response) {
                    alert("Document removed");
                                        myEPost.logout();
                        portoController.getView().close();
                },
                // onError
                function(_errorResponse) {
                    alert("Remove Document failed");
                    $.errorMessages.text=JSON.stringify(_errorResponse);
                    myEPost.logout();
                        portoController.getView().close();
                });
                    }
                });

               
            },
            // onError
            function(_errorResponse) {
                alert("Porto failed");
                
                console.error(_errorResponse);
                
                $.errorMessages.text=JSON.stringify(_errorResponse);
                myEPost.logout();
            });

        }, function(_errorResponse) {
            // OnError Upload Callback
            alert("Upload failed");
            $.errorMessages.text=JSON.stringify(_errorResponse);
        });

    }, function(_errorResponse) {
        alert("Login failed");
        $.errorMessages.text=JSON.stringify(_errorResponse);
    });
    } else {
        alert("Missing Login");
    }
};
