const opcua = require("node-opcua");
const file_transfer = require("node-opcua-file-transfer");
import  Options  from "../constants/options"
import { executeScript } from "../file_service"

let date_ob = new Date();

export function build_my_address_space(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    const addFile = (inputArguments, context, callback) => {
        let callMethodResult

        const parentFolder = context.object

        try {   
            const fileType = addressSpace.findObjectType("FileType");
            const scriptFile = fileType.instantiate({
                nodeId: "s="+inputArguments[0].value,
                browseName: inputArguments[0].value,
                organizedBy: parentFolder
            });
            file_transfer.installFileType(scriptFile, { 
                filename: inputArguments[0].value
            });
            const executeScriptNode = namespace.addMethod(scriptFile, Options.executeScriptOptions);
    
            executeScriptNode.bindMethod(executeScript);
            
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
            callback(null,callMethodResult);
        }
    }

    const addFolder = (inputArguments, context, callback) => {
        let callMethodResult

        try {   

            const folder = namespace.addFolder(addressSpace.rootFolder.objects.scripts, {
                browseName: inputArguments[0].value,
                nodeId: "s="+inputArguments[0].value,
            });

            const addFileNode = namespace.addMethod(folder, Options.addFileOptions);
    
            addFileNode.bindMethod(addFile);

            const removeFileNode = namespace.addMethod(folder, Options.removeFileOptions);

            removeFileNode.bindMethod(removeFile);
            
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
            callback(null,callMethodResult);
        }
        
    }

    const removeFile = (inputArguments, context, callback) => {
            
        // implement delete method
        let nodeId = "ns=1;s="+inputArguments[0].value
        let fileToDel = addressSpace.findNode(nodeId)
        let callMethodResult;
        try {
            console.log("Entered IF: " + fileToDel);
            addressSpace.deleteNode(fileToDel.nodeId);
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
                    value : "Impossible to eliminate the file check if it exists on the address space"
                }]
            };
        }
        finally{
            callback(null,callMethodResult);
        }
    }

    //declare a new object
    const device = namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: "MyDevice"
    });

    const folder = namespace.addFolder(addressSpace.rootFolder.objects, {
        browseName: "Scripts"
    });

    const addFileNode = namespace.addMethod(folder, Options.addFileOptions);

    addFileNode.bindMethod(addFile);

    const addFolderNode = namespace.addMethod(folder, Options.addFolderOptions);

    addFolderNode.bindMethod(addFolder);

    const removeFileNode = namespace.addMethod(folder, Options.removeFileOptions);

    removeFileNode.bindMethod(removeFile);

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

