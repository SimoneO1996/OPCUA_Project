const { exec } = require("child_process");
const path = require('path');
const fs = require('fs');
const file_transfer = require("node-opcua-file-transfer");
const opcua = require("node-opcua");

/**
 * @description:
 *      Scans the scripts directory and loads all existing files in the address space
 */
export function initScriptsFolder(addressSpace) {
    //
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
                filename: "directoryPath" + file
            });
        });
    });
}

export function executeScript(inputArguments,context,callback) {

    let scriptName = context.object.$fileData.filename
    let scriptExtension = scriptName.substring(scriptName.length - 2)
    console.log(scriptExtension)
    let execCB = (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
    };

    switch(scriptExtension) {
        case "ts":
            exec(`ts-node ${scriptName}`, execCB);
            break
        case "py":
            exec(`python3 ${scriptName}`, execCB);
            break
    }

    const callMethodResult = {
        statusCode: opcua.StatusCodes.Good,
        outputArguments: [{
            dataType: opcua.DataType.String,
            value : "OK"
        }]
    };
    callback(null,callMethodResult);
}