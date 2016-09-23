// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args|| {};
if(_.isFunction(args.sendCallback)){
    $.EPostSendButton.applyProperties({
        visible : true
    });
}


if(_.isObject(args.portoResponse)){
    
    $.porto.set(args.portoResponse);
    $.portoCollection.reset(args.portoResponse.options);

}

//Alloy.Collections.ePostPorto.create(args.portoResponse);

var doSendDocumentEPost = function(){
    _.isFunction(args.sendCallback) && args.sendCallback();
    //$.EPostPorto.close();
};
var doCancelDocumentEPost = function(){
    _.isFunction(args.abbrechenCallback) && args.abbrechenCallback();
    // $.EPostPorto.close();
};

$.EPostPorto.open();
