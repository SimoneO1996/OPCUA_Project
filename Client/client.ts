const opcua = require("node-opcua");
const filetransfer = require("node-opcua-file-transfer");
var treeify = require('treeify');
const readline = require('readline');

const AttributeIds = opcua.AttributeIds;
const OPCUAClient = opcua.OPCUAClient;
const ClientFile = filetransfer.ClientFile;
const OpenFileMode = filetransfer.OpenFileMode;
const endpointUrl = "opc.tcp://onestasimone-N551VW:4334/UA/Prova";



async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function read(item){
  var node = {
    name: `BrowseName: ${item.browseName.name},\
    NodeAddress: ns=${item.browseName.namespaceIndex};${(item.nodeId.identifierType == 1 ? "i":"s")}=${item.nodeId.value},\
    NodeClass: ${(item.nodeClass == 1) ? "Object" : (item.nodeClass == 4) ? "method" :  item.nodeClass}`,
    value: {
      browseName: item.browseName,
      nodeClass: `${(item.nodeClass == 1) ? "Object" : (item.nodeClass == 4) ? "method" :  item.nodeClass}`,
      NodeAddress: `ns=${item.browseName.namespaceIndex};${(item.nodeId.identifierType == 1 ? "i":"s")}=${item.nodeId.value}`

    }
  }
  return node
}

async function navigate(session,node){
  let nodes = []
  let browseResult = await session.browse(node);

      for(let i = 0; i <browseResult.references.length; i ++ ){
        nodes.push(read(browseResult.references[i]))
      }


      return nodes
}

function get_text_node(nodes) : String {
  var nodes_string = ""
  for (let i = 0; i<nodes.length; i++){
    nodes_string += nodes[i].name + "\n"
  }
  return nodes_string
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
    //console.log("connected !");



    // step 2 : createSession
    const session = await client.createSession();
    //console.log("session created !");

    var nodes =  await navigate(session,"ObjectsFolder")
    //console.log(get_text_node(nodes))
    var blessed = require('blessed');
    var screen = blessed.screen({
      smartCSR: true
    });

    screen.title = 'OPCUA client';

    var form_navigation = blessed.form({
      parent: screen,
      keys: true,
      left: 0,
      top: 0,
      width: "20%",
      height: "50%",
      content: 'Enter the node you want to navigate',
      border: {
        type: 'line'
      },
    });

    var form_exec_method = blessed.form({
      parent: screen,
      keys: true,
      left: 0,
      top: "50%",
      width: "20%",
      height: "50%",
      content: 'Enter the method you want to execute',
      border: {
        type: 'line'
      },
    });

    var button_navigate = blessed.button({
      parent: form_navigation,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1
      },
      left: "center",
      top: "50%",
      name: 'Navigate',
      content: 'Navigate',
      border: {
        type: 'line'
      },
      style: {
        bg: 'blue',
        focus: {
          bg: 'red'
        },
        hover: {
          bg: 'red'
        }
      }
    });

  var button_method = blessed.button({
    parent: form_exec_method,
    mouse: true,
    keys: true,
    shrink: true,
    padding: {
      left: 1,
      right: 1
    },
    left: "center",
    top: "50%",
    name: 'Exec',
    content: 'Exec',
    border: {
      type: 'line'
    },
    style: {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    }
  });

    var input_navigation = blessed.textarea({
      parent: form_navigation,
    name: 'input',
    input: true,
    keys: true,
    top: "center",
    left: "center",
    height: 1,
    width: '50%',
    style: {
        fg: 'white',
        bg: 'black',
        focus: {
            bg: 'red',
            fg: 'white'
        }
    }
  });

  var input_method = 
  blessed.textarea({
    parent: form_exec_method,
  name: 'input',
  input: true,
  keys: true,
  top: "center",
  left: "center",
  height: 1,
  width: '50%',
  style: {
      fg: 'white',
      bg: 'black',
      focus: {
          bg: 'red',
          fg: 'white'
      }
  }
});


  var box = blessed.box({
  parent: screen,
  top: 0,
  left: "22%",
  width: '50%',
  padding: "10%",
  height: '50%',
  content: get_text_node(nodes),
  tags: true,
  border: {
    type: 'line'
  },
  })

    
    
    button_navigate.on('press', function() {
      var node = input_navigation.getText()
      navigate(session,node).then( (browseResult) => {
        box.setText(get_text_node(browseResult))
        screen.render()

      })
      
    });


     screen.key(['escape', 'q', 'C-c'],  function() {
      // close session
      session.close((err) => {
        console.log(err)
      });

      // disconnecting
      client.disconnect((err) => {
        console.log(err)
      });
      console.log("done !");

      process.exit(0)
    });


    screen.key(['n'],  function() {
      input_navigation.focus()
      screen.render()
    });
    screen.key(['e'],  function() {
      input_method.focus()
      screen.render()
    });
  

    screen.render();

/*  
      
      

      console.log(x)


      // step 3 : browse
      let AddressSpace_json
      let browseResult = await session.browse("RootFolder");
      console.log(browseResult)
      for (const c of browseResult.references){
        let new_browse = read(c)
        browseResult = await session.browse(new_browse)
      }
      
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
        objectId: "ns=1;i=1001",
        methodId: "ns=1;i=1005",
        inputArguments: [{dataType: opcua.DataType.String, value: "prova.ts" }]
      }];

      var x = await session.call(methodToCalls)
      console.log(x[0])
    

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
      */
  }
  
  catch (err) {
    console.log("An error has occured : ",err);
  }
}
main();