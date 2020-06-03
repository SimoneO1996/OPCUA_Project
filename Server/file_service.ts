const { exec } = require("child_process");
let opcua = require("node-opcua");

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