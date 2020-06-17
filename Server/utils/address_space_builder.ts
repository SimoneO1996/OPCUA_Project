import * as path from "path";

const opcua = require("node-opcua");
const file_transfer = require("node-opcua-file-transfer");
const fs = require('fs');
import  Options  from "../constants/options"
import { executeScript, initFolder } from "./file_service"

export function build_my_address_space(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    const addFile = (inputArguments, context, callback) => {
        const filename = inputArguments[0].value
        const directoryPath = path.join(__dirname, '../scripts');
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
                filename: path.join(directoryPath, filename)
            });
            namespace.addMethod(scriptFile, Options.executeScriptOptions)
                .bindMethod(executeScript);

            callback(null, {
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "File added correctly"
                }]
            })
        }
        catch(err){
            console.log(err)
            callback(null, {
                statusCode: opcua.StatusCodes.Bad,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : err.message
                }]
            });
        }
    }

    const removeFile = (inputArguments, context, callback) => {

        const filename = inputArguments[0].value
        let nodeId = "ns=" + namespace.index + ";s=" + filename
        const directoryPath = path.join(__dirname, '../scripts');
        try {
            addressSpace.deleteNode(addressSpace.findNode(nodeId).nodeId);
            const filePath = path.join(directoryPath, filename)
            fs.unlinkSync(filePath)
            callback(null, {
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "File removed correctly"
                }]
            });
        } catch(err) {
            console.error(err)
            callback(null, {
                statusCode: opcua.StatusCodes.Bad,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "Couldn't remove file, check if it exists"
                }]
            });
        }
    }

    const scriptFolder = namespace.addFolder(addressSpace.rootFolder.objects, {
        browseName: "Scripts"
    });

    try {
        initFolder(addressSpace)
    } catch(err) {
        console.log(err)
    }

    namespace.addMethod(scriptFolder, Options.addFileOptions)
        .bindMethod(addFile)

    namespace.addMethod(scriptFolder, Options.removeFileOptions)
        .bindMethod(removeFile)
}