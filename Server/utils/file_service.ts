import Options from "../constants/options";

const { exec, execSync } = require("child_process");
const cons = require('console')
const path = require('path');
const fs = require('fs');
const file_transfer = require("node-opcua-file-transfer");
const opcua = require("node-opcua");

/**
 * @description:
 *      Scans the scripts directory and loads all existing files in the address space
 */
export function initFolder(addressSpace, folderName) {
    const directoryPath = path.join(__dirname, '..', folderName);
    // Creates the directory if it doesn't exists
    if (!fs.existsSync(directoryPath)){
        fs.mkdirSync(directoryPath);
    }

    fs.readdir(directoryPath, function (err, files) {

        if (err)
            throw new Error("Unable to scan directory: " + err)
        // Goes through all files in the scripts directory and loads them in the address space
        files.forEach(function (filename) {
            const scriptFile = addressSpace.findObjectType("FileType")
                .instantiate({
                    nodeId: "s=" + filename,
                    browseName: filename,
                    organizedBy: addressSpace.rootFolder.objects + '.' + folderName
                });
            file_transfer.installFileType(scriptFile, {
                filename: path.join(directoryPath, filename)
            });
            addressSpace.getOwnNamespace().addMethod(scriptFile, Options.executeScriptOptions)
                .bindMethod(executeScript);
        });
    });
}

export function executeScript(inputArguments, context, callback) {

    const scriptName = context.object.$fileData.filename
    const scriptExtension = scriptName.substring(scriptName.length - 2)
    const directoryPath = path.join(__dirname, '..', 'logs');

    const ext_to_cmd = {
        "ts": "ts-node",
        "py": "python3 -B",
        "js": "node",
        "sh": "sh",
    };

    const command = ext_to_cmd[scriptExtension] + " " + scriptName

    const output = fs.createWriteStream(path.join(directoryPath, scriptName.replace(scriptExtension, "txt")));
    const errorOutput = fs.createWriteStream(directoryPath, "err_" + scriptName.replace(scriptExtension, "txt"));
    const logger = new cons.Console({ stdout: output, stderr: errorOutput });

    try {
        if(!(scriptExtension in ext_to_cmd)) {
            throw new Error("Extension not recognized")
        }
        else if (context.object.name == "scripts") {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    logger.error(stderr);
                    return;
                }
                logger.log(stdout);
            });
            callback(null,{
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "OK"
                }]
            });
        } else if (context.object.name == "firmware") {
            execSync(command, (err, stdout, stderr) => {
                if (err) {
                    logger.error(stderr);
                    return;
                }
                logger.log(stdout);
            });
            callback(null,{
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "OK"
                }]
            });
        }
    } catch(err) {
        console.error(err.message)
        callback(err,{
            statusCode: opcua.StatusCodes.Bad,
            outputArguments: [{
                dataType: opcua.DataType.String,
                value : err.message
            }]
        });
    }
}