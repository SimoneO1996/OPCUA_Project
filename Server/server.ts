let opcua = require("node-opcua");
let file_transfer = require("node-opcua-file-transfer");
const { exec } = require("child_process");

exec("prova.ps1", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
let date_ob = new Date();
let server = new opcua.OPCUAServer({
    port: 4334,
    resourcePath: "/UA/Prova",
    buildInfo: {
        productName: "RaspUAServer1",
        buildNumber: "1",
        buildDate: new Date()
    }
});

server.initialize(() =>{
    console.log("OPC UA Server initialized.");

    function build_my_address_space(server) {
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();

        //declare a new object
        let device = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "MyDevice"
        });

        const fileType = addressSpace.findObjectType("FileType")!;

        const myFile = fileType.instantiate({
            nodeId: "s=MyFile",
            browseName: "MyFile",
            organizedBy: addressSpace.rootFolder.objects
        });

        file_transfer.installFileType(myFile, { 
            filename: "prova.ps1"
        });

        const method = namespace.addMethod(myFile,{

            browseName: "Bark",
        
            inputArguments:  [
                {
                    name:"nbBarks",
                    description: { text: "specifies the number of time I should bark" },
                    dataType: opcua.DataType.UInt32        
                },{
                    name:"volume",
                    description: { text: "specifies the sound volume [0 = quiet ,100 = loud]" },
                    dataType: opcua.DataType.UInt32
                }
             ],
        
            outputArguments: [{
                 name:"Barks",
                 description:{ text: "the generated barks" },
                 dataType: opcua.DataType.String ,
                 valueRank: 1
            }]
        });
        
        // optionally, we can adjust userAccessLevel attribute 
        method.outputArguments.userAccessLevel = opcua.makeAccessLevelFlag("CurrentRead");
        method.inputArguments.userAccessLevel = opcua.makeAccessLevelFlag("CurrentRead");


        method.bindMethod((inputArguments,context,callback) => {

            const nbBarks = inputArguments[0].value;
            const volume =  inputArguments[1].value;
        
            console.log("Hello World ! I will bark ",nbBarks," times");
            console.log("the requested volume is ",volume,"");
            const sound_volume = Array(volume).join("!");
        
            const barks = [];
            for(let i=0; i < nbBarks; i++){
                barks.push("Whaff" + sound_volume);
            }
        
            const callMethodResult = {
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                        dataType: opcua.DataType.String,
                        arrayType: opcua.VariantArrayType.Array,
                        value :barks
                }]
            };
            callback(null,callMethodResult);
        });

        //add some variables
        namespace.addVariable({
            propertyOf: device,
            browseName: "prova1",
            dataType: "String",
            value: {
                get: function() { 
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
                get: function() {
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

    server.start(() => {
        console.log(`Server is now listening port ${server.endpoints[0].port}... (press CTRL+C to stop)`);
        let endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log("The primary server endpoint url is ", endpointUrl);
    });

});

process.on('SIGINT', function () {
    process.exit(0);
});

