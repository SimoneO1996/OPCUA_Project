const opcua = require("node-opcua");
namespace Options {
  export const addFileOptions = {

    browseName: "AddFile",

    inputArguments:  [
      {
        name:"File Name",
        description: { text: "Name of the file to add" },
        dataType: opcua.DataType.String
      }
    ],

    outputArguments: [{
      name:"Operation Outcome",
      description:{ text: "Success or Failure of the add operation" },
      dataType: opcua.DataType.String ,
      valueRank: 1
    }]
  }

  export const executeScriptOptions = {

    browseName: "Execute Script",

    outputArguments: [{
      name:"out",
      description:{ text: "Operation Outcome" },
      dataType: opcua.DataType.String ,
      valueRank: 1
    }]
  }

  export const addFolderOptions = {

    browseName: "AddFolder",

    inputArguments:  [
      {
        name:"Folder Name",
        description: { text: "Name of the folder to add" },
        dataType: opcua.DataType.String
      }
    ],

    outputArguments: [{
      name:"Operation Outcome",
      description:{ text: "Success or Failure of the add operation" },
      dataType: opcua.DataType.String ,
      valueRank: 1
    }]
  }

  export const removeFileOptions = {

    browseName: "RemoveFile",

    inputArguments:  [
      {
        name:"File Name",
        description: { text: "Name of the file to remove" },
        dataType: opcua.DataType.String
      }
    ],

    outputArguments: [{
      name:"Operation Outcome",
      description:{ text: "Success or Failure of the remove operation" },
      dataType: opcua.DataType.String ,
      valueRank: 1
    }]
  }
}

export default Options;