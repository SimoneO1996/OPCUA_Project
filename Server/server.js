var opcua = require("node-opcua");
var file_transfer = require("node-opcua-file-transfer");
var CallMethodResult = require("node-opcua/lib/services/call_service").CallMethodResult;
var variantArrayType = require("node-opcua/lib/datamodel/variant").VariantArrayType;
var date_ob = new Date();
var server = new opcua.OPCUAServer({
    port: 4334,
    resourcePath: "/UA/Prova",
    buildInfo: {
        productName: "RaspUAServer1",
        buildNumber: "1",
        buildDate: new Date()
    }
});
server.initialize(function () {
    console.log("OPC UA Server initialized.");
    function build_my_address_space(server) {
        var addressSpace = server.engine.addressSpace;
        var namespace = addressSpace.getOwnNamespace();
        //declare a new object
        var device = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "MyDevice"
        });
        var fileType = addressSpace.findObjectType("FileType");
        var myFile = fileType.instantiate({
            nodeId: "s=MyFile",
            browseName: "MyFile",
            organizedBy: addressSpace.rootFolder.objects
        });
        file_transfer.installFileType(myFile, {
            filename: "prova.txt"
        });
        var method = namespace.addMethod(myFile, {
            browseName: "Bark",
            inputArguments: [
                {
                    name: "nbBarks",
                    description: { text: "specifies the number of time I should bark" },
                    dataType: opcua.DataType.UInt32
                }, {
                    name: "volume",
                    description: { text: "specifies the sound volume [0 = quiet ,100 = loud]" },
                    dataType: opcua.DataType.UInt32
                }
            ],
            outputArguments: [{
                    name: "Barks",
                    description: { text: "the generated barks" },
                    dataType: opcua.DataType.String,
                    valueRank: 1
                }]
        });
        // optionally, we can adjust userAccessLevel attribute 
        method.outputArguments.userAccessLevel = opcua.makeAccessLevelFlag("CurrentRead");
        method.inputArguments.userAccessLevel = opcua.makeAccessLevelFlag("CurrentRead");
        method.bindMethod(function (inputArguments, context, callback) {
            var nbBarks = inputArguments[0].value;
            var volume = inputArguments[1].value;
            console.log("Hello World ! I will bark ", nbBarks, " times");
            console.log("the requested volume is ", volume, "");
            var sound_volume = Array(volume).join("!");
            var barks = [];
            for (var i = 0; i < nbBarks; i++) {
                barks.push("Whaff" + sound_volume);
            }
            var callMethodResult = {
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                        dataType: opcua.DataType.String,
                        arrayType: opcua.VariantArrayType.Array,
                        value: barks
                    }]
            };
            callback(null, callMethodResult);
        });
        //add some variables
        namespace.addVariable({
            propertyOf: device,
            browseName: "prova1",
            dataType: "String",
            value: {
                get: function () {
                    return new opcua.Variant({
                        dataType: opcua.DataType.String,
                        value: "prova"
                    });
                }
            }
        });
        namespace.addVariable({
            propertyOf: device,
            browseName: "seconds",
            dataType: "String",
            value: {
                get: function () {
                    return new opcua.Variant({
                        dataType: opcua.DataType.Int32,
                        value: date_ob.getSeconds()
                    });
                }
            }
        });
    }
    build_my_address_space(server);
    console.log("Address space initialized.");
    server.start(function () {
        console.log("Server is now listening port " + server.endpoints[0].port + "... (press CTRL+C to stop)");
        var endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log("The primary server endpoint url is ", endpointUrl);
    });
});
process.on('SIGINT', function () {
    process.exit(0);
});
