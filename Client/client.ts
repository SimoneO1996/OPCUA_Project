const opcua = require("node-opcua");
const filetransfer = require("node-opcua-file-transfer");

const AttributeIds = opcua.AttributeIds;
const OPCUAClient = opcua.OPCUAClient;
const ClientFile = filetransfer.ClientFile;
const OpenFileMode = filetransfer.OpenFileMode;
const endpointUrl = "opc.tcp://DESKTOP-K17M86F:4334/UA/Prova";

async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var options = {
  connectionStrategy: {
      maxRetry: 1
  },
  endpoint_must_exist: false,
};

const client = OPCUAClient.create(options);

async function main() {
  try {
    // step 1 : connect to

    await client.connect(endpointUrl);
    console.log("connected !");


    // step 2 : createSession
    const session = await client.createSession();
    console.log("session created !");

    // step 3 : browse
    const browseResult = await session.browse("RootFolder");

    console.log("references of Root :");
    for (const reference of browseResult.references) {
      console.log("   -> ", reference.browseName.toString());
      console.log(reference);
      if (reference.browseName.toString() == "Objects") {
        for (const r of reference) {
          console.log("references of Object :");
          console.log("   -> ", reference.browseName.toString());
        }
      }
    }


    let methodToCalls = [{
      objectId: "ns=1;s=MyFile",
      methodId: "ns=1;s=MyFile-Bark",
  }];

  var x = await session.call(methodToCalls)
  console.log(x)

    // let's create a client file object from the session and nodeId
    //const clientFile = new ClientFile(session, fileNodeId);

    // let's open the file
    //const mode = OpenFileMode.ReadWriteAppend;
    //await clientFile.open(mode);

    // ... do some reading or writing
    //const size = await clientFile.size();
    //console.log("the current file size is : ", size, " bytes");
    //const pos = await clientFile.setPosition([0,0]);
    //console.log(pos);
    //const data: Buffer = await clientFile.read(6);
    //console.log("What can I say except ", data.toString());
    // don't forget to close the file when done
    //await clientFile.close();

    // step 4 : read a variable with readVariableValue
    

    // close session
    await session.close();

    // disconnecting
    await client.disconnect();
    console.log("done !");
  }
  catch (err) {
    console.log("An error has occured : ",err);
  }
}
main();