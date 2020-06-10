const opcua = require("node-opcua");
const file_transfer = require("node-opcua-file-transfer");
const fs = require('fs');
import  Options  from "../constants/options"
import { executeScript, initScriptsFolder } from "./file_service"

export function build_my_address_space(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    const addFile = (inputArguments, context, callback) => {
        let callMethodResult
        let filename = inputArguments[0].value
        let err = null
        try {
            if(addressSpace.findNode("ns=" + namespace.index + ";s=" + filename) != null) {
                throw new Error("File already exists")
            }
            const scriptFile = addressSpace.findObjectType("FileType")
                .instantiate({
                    nodeId: "s=" + filename,
                    browseName: filename,
                    organizedBy: context.object // object in which the method addFile is called
            });
            file_transfer.installFileType(scriptFile, {
                // This puts all the added files in the scripts folder, which will be useful
                // when initializing Scripts folder node, to load any already existent script
                filename: "./scripts/"+inputArguments[0].value
            });
            namespace.addMethod(scriptFile, Options.executeScriptOptions)
                .bindMethod(executeScript);
            
            callMethodResult = {
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "File added correctly"
                }]
            }
        }
        catch(err){
            console.log(err)
            callMethodResult = {
                statusCode: opcua.StatusCodes.Bad,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : err.message
                }]
            };
            
        }
        finally{
            callback(err,callMethodResult);
        }
    }

    const removeFile = (inputArguments, context, callback) => {

        let nodeId = "ns=" + namespace.index + ";s="+inputArguments[0].value
        let callMethodResult;
        try {
            addressSpace.deleteNode(addressSpace.findNode(nodeId).nodeId);
            const path = "./scripts/"+inputArguments[0].value
            fs.unlinkSync(path)
            callMethodResult = {
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "File removed correctly"
                }]
            };
        } catch(err) {
            console.log(err)
            callMethodResult = {
                statusCode: opcua.StatusCodes.Bad,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "Couldn't remove file, check if it exists"
                }]
            };
        }
        finally{
            callback(null,callMethodResult);
        }
    }

    const device = namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: "RaspberryPi4"
    });

    const folder = namespace.addFolder(addressSpace.rootFolder.objects, {
        browseName: "Scripts"
    });

    try {
        initScriptsFolder(addressSpace)
    } catch(err) {
        console.log(err)
    }

    namespace.addMethod(folder, Options.addFileOptions)
        .bindMethod(addFile)

    namespace.addMethod(folder, Options.removeFileOptions)
        .bindMethod(removeFile)

}


