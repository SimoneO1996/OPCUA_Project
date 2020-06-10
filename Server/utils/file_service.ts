import Options from "../constants/options";

const { spawn } = require("child_process");
const path = require('path');
const fs = require('fs');
const file_transfer = require("node-opcua-file-transfer");
const opcua = require("node-opcua");

/**
 * @description:
 *      Scans the scripts directory and loads all existing files in the address space
 */
export function initScriptsFolder(addressSpace) {
    const directoryPath = path.join(__dirname, '../scripts');
    // Creates the directory if it doesn't exists
    if (!fs.existsSync(directoryPath)){
        fs.mkdirSync(directoryPath);
    }

    fs.readdir(directoryPath, function (err, files) {

        if (err)
            throw new Error("Unable to scan directory: " + err)
        // Goes through all files in the scripts directory and loads them in the address space
        files.forEach(function (file) {
            const scriptFile = addressSpace.findObjectType("FileType")
                .instantiate({
                    nodeId: "s=" + file,
                    browseName: file,
                    organizedBy: addressSpace.rootFolder.objects.scripts
                });
            file_transfer.installFileType(scriptFile, {
                filename: directoryPath + '/' + file
            });
            addressSpace.getOwnNamespace().addMethod(scriptFile, Options.executeScriptOptions)
                .bindMethod(executeScript);
        });
    });
}

export function executeScript(inputArguments,context,callback) {

    const scriptOpts = {
        shell: true,
        detached: true
    }

    const scriptName = context.object.$fileData.filename
    const scriptExtension = scriptName.substring(scriptName.length - 2)

    const commands = {
        "ts": "ts-node",
        "py": "python3 -B",
        "js": "node",
        "sh": "sh",
    };

    try {
        spawn(commands[scriptExtension], [scriptName], scriptOpts);
    } catch {
        console.error("Extension not recognized")
        callback(null,{
            statusCode: opcua.StatusCodes.Bad,
            outputArguments: [{
                dataType: opcua.DataType.String,
                value : "Extension not recognized"
            }]
        });
    }

    callback(null,{
        statusCode: opcua.StatusCodes.Good,
        outputArguments: [{
            dataType: opcua.DataType.String,
            value : "OK"
        }]
    });
}