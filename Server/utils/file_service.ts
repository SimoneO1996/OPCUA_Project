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

    let script_name = context.object.$fileData.filename

    exec(`ts-node ${script_name}`, (error, stdout, stderr) => {

        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
    });

    const callMethodResult = {
        statusCode: opcua.StatusCodes.Good,
        outputArguments: [{
            dataType: opcua.DataType.String,
            value : "OK"
        }]
    };
    callback(null,callMethodResult);
}