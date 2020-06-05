const opcua = require("node-opcua");
const filetransfer = require("node-opcua-file-transfer");
const blessed = require('blessed');


const AttributeIds = opcua.AttributeIds;
const OPCUAClient = opcua.OPCUAClient;
const ClientFile = filetransfer.ClientFile;
const OpenFileMode = filetransfer.OpenFileMode;
const endpointUrl = "opc.tcp://192.168.1.188:4334/UA/Prova";



async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function read(item){
  var node = {
    name: `BrowseName: ${item.browseName.name},\
    NodeAddress: ns=${item.browseName.namespaceIndex};${(item.nodeId.identifierType == 1 ? "i":"s")}=${item.nodeId.value},\
    NodeClass: ${(item.nodeClass == 1) ? "Object" : (item.nodeClass == 4) ? "method" :  item.nodeClass}`,
    browseName: item.browseName,
    nodeClass: `${(item.nodeClass == 1) ? "Object" : (item.nodeClass == 4) ? "method" :  item.nodeClass}`,
    NodeAddress: `ns=${item.nodeId.namespace};${(item.nodeId.identifierType == 1 ? "i":"s")}=${item.nodeId.value}`

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

function create_text_input(blessed,i, parent){

  var inputtext = blessed.textarea({
    parent: parent,
  name: i,
  top: i +2,
  input: true,
  keys: true,
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

return inputtext

}

function create_button(blessed,content,margin_top,margin_left, parent,button_function){

  var button = blessed.button({
    parent: parent,
      mouse: true,
      keys: true,
      shrink: true,
      padding: {
        left: 1,
        right: 1
      },
      top: margin_top,
      left:margin_left,
      name: content,
      content: content,
      
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

button.on("press", button_function)


return button

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
   
    var screen = blessed.screen({
      smartCSR: true
    });
    var navigated_object;

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
      navigated_object = node
      navigate(session,node).then( (browseResult) => {
        box.setText(get_text_node(browseResult))
        screen.render()

      })
      
    })


    button_method.on('press',function() {
      var method = input_method.getText()
      var form = blessed.form({
        parent: screen,
        keys: true,
        left: "center",
        top: "center",
        width: "50%",
        height: "50%",
        content: "Method info, press ok to call the method",
        border: {
          type: 'line'
        },
      });
      session.getArgumentDefinition(method,function(err,Arguments){
        if (err){
          box.setText(err)
          screen.render()
        }
        else{
          var inputarg_info
          var inputs = []
          var inputs_method = []
          for(let i= 0 ;i< Arguments.inputArguments.length; i++){
            inputarg_info = `name= ${Arguments.inputArguments[i].name} type=${(Arguments.inputArguments[i].dataType.value == 12) ? "String" :Arguments.inputArguments[i].dataType.toString() }`
            form.insertBottom(inputarg_info)
            inputs.push(create_text_input(blessed,i,form))
          }

          create_button(blessed,"OK",Arguments.inputArguments.length +2,0,form,()=>{
            for(let x = 0 ; x<Arguments.inputArguments.length; x++){
              var input_method =  {dataType: Arguments.inputArguments[x].dataType.toString() , value: inputs[x].getText() }
              inputs_method.push(input_method)
              console.log(inputs_method)
            }

            let methodToCalls = [{
              objectId: navigated_object,
              methodId: method,
              inputArguments: inputs
            }];
            
            session.call(methodToCalls,(err,result)=>{
              if(err){
                console.log(err)
              }
              else{
              }
            })


            form.destroy()
            screen.render()
          } )
          create_button(blessed,"Exit",Arguments.inputArguments.length +2,5,form,()=>{
            form.destroy()
            screen.render()
          } )


          screen.render()
          form.focus()
        }
      })
      

    } )


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


    screen.key(['a'],  function() {
      input_navigation.focus()
      screen.render()
    });
    screen.key(['b'],  function() {
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