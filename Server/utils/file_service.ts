import Options from "../constants/options";

const { exec, execSync } = require("child_process");
const cons = require('console')
const path = require('path');
const fs = require('fs');
const file_transfer = require("node-opcua-file-transfer");
const opcua = require("node-opcua");
let PID_Current;

/**
 * @description:
 *      Scans the scripts directory and loads all existing files in the address space
 */
export function initFolder(addressSpace) {
    const directoryPath = path.join(__dirname, '..', 'scripts');
    let folderObject;
    // Creates the directory if it doesn't exists
    if (!fs.existsSync(directoryPath)){
        fs.mkdirSync(directoryPath);
    }
    folderObject = addressSpace.rootFolder.objects.scripts

    fs.readdir(directoryPath, function (err, files) {

        if (err)
            throw new Error("Unable to scan directory: " + err)
        // Goes through all files in the scripts directory and loads them in the address space
        files.forEach(function (filename) {
            const scriptFile = addressSpace.findObjectType("FileType")
                .instantiate({
                    nodeId: "s=" + filename,
                    browseName: filename,
                    organizedBy: folderObject
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

    const scriptPath = context.object.$fileData.filename
    const scriptExtension = scriptPath.substring(scriptPath.length - 2)
    const logsPath = path.join(__dirname, '..', 'logs');
    const scriptName = path.basename(scriptPath)

    const ext_to_cmd = {
        "ts": "ts-node",
        "py": "python3 -B",
        "js": "node",
        "sh": "sh",
    };

    const command = ext_to_cmd[scriptExtension] + " " + scriptPath

    const logFileName = scriptName.substr(0, scriptName.lastIndexOf(".")) + ".txt";
    const errFileName = "err_" + scriptName.substr(0, scriptName.lastIndexOf(".")) + ".txt";

    if (!fs.existsSync(logsPath)){
        fs.mkdirSync(logsPath);
    }

    if (!fs.existsSync(path.join(logsPath, logFileName))){
        fs.open(path.join(logsPath, logFileName), 'w', (err, file) => {
            if (err) throw new Error("Could not create " + file)
        })
    }

    if (!fs.existsSync(path.join(logsPath, errFileName))){
        fs.open(path.join(logsPath, errFileName), 'w', (err, file) => {
            if (err) throw new Error("Could not create " + file)
        })
}

    const output = fs.createWriteStream(path.join(logsPath, logFileName));
    const errorOutput = fs.createWriteStream(path.join(logsPath, errFileName))
    const logger = new cons.Console({ stdout: output, stderr: errorOutput });

    try {

        if(!(scriptExtension in ext_to_cmd)) {
            throw new Error("Extension not recognized")
        } else if (inputArguments[0].value == 0) {
            if (PID_Current !== undefined) {
                try {
                    process.kill(PID_Current)
                } catch {
                    console.log("Process is not running")
                }
                
            }
            const res = exec(command, (err, stdout, stderr) => {
                if (err) {
                    logger.error(stderr);
                    return;
                }
                logger.log(stdout);
            });
            PID_Current = res.pid
            console.log(res.pid)
            callback(null,{
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : "Script Executing"
                }]
            });
        } else {
            const res = execSync(command);
            callback(null,{
                statusCode: opcua.StatusCodes.Good,
                outputArguments: [{
                    dataType: opcua.DataType.String,
                    value : res.toString()
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