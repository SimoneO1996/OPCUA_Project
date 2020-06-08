import * as modules from './package_export';
import * as utility from './opcua_utility'

const endpointUrl = "opc.tcp://192.168.1.53:4334/UA/Prova";



async function get_method_inputs(params){
  var question
  var Arguments = []
  for (let x = 0 ; x < params.length ; x++){
     question = {
      type: 'input',
      name: 'param',
      message: `Please enter the param (name: ${params[x].name} , type: ${modules.opcua.DataType[params[x].type]})`
    }
    await modules.inquirer.prompt(question).then(async answers => {
      Arguments.push({
          dataType: params[x].type,
          value: answers.param
        })
    })
  }
  return Arguments

}

async function exec_standard_method(session,method,file_node){
  var result
  switch(method.name.name){
    case "Read":
      var question_read = {
        type: 'input',
        name: 'num_bytes',
        message: `Please enter the number of bytes you want to read`,
        validate: function(num_bytes){
          if(parseInt(num_bytes) != NaN){
            return true
          }
          else {
            return "You must insert a number"
          }
        }
      }
      await modules.inquirer.prompt(question_read).then(async answers => {
        result = await utility.read_file(session,file_node,parseInt(answers.num_bytes))
      })
      break
    case "Write":
     var question_write = {
        type: 'input',
        name: 'file',
        message: `Please enter the number of bytes you want to read`,
        validate: function(file){
          if (modules.fs.existsSync(file)) {
            return true
          }
          else {
            return "please enter a valid file path"
          }
        }
      }
      await modules.inquirer.prompt(question_write).then(async answers => {
        result = await utility.write_file(session,file_node,answers.file)
      })
      
      break
  }
  return result
}

var options = {
  connectionStrategy: {
      maxRetry: 1
  },
  endpoint_must_exist: false,
};

const client = modules.opcua.OPCUAClient.create(options);


async function main() {
  try {
    var session
    var navigate: boolean = true
    var object_navigated
    var navigate_question

    var initial_question = [{
      type: 'input',
      name: 'Endpoint',
      message: 'Please enter the OPCUA Server EndPoint',
    }]

    await modules.inquirer.prompt(initial_question).then(async answers => {
    session = await utility.connect(answers.Endpoint,client)
    });

    var nodes = await utility.navigate(session,"ObjectsFolder")


    do {

      nodes.push({
        name: "Stop",
        value: "Stop"
      })
     
      navigate_question = {
        type: 'list',
        name: 'Nodes',
        message: 'Select the nodes you want to navigate, if you choose a method it will be executed',
        choices: nodes
      }
  
      await modules.inquirer.prompt(navigate_question).then(async answers => {
        if(answers.Nodes == 'Stop' ){
          navigate = false
        }
        else if(answers.Nodes == 'ObjectsFolder'){
          nodes = await utility.navigate(session,answers.Nodes)
        }
        else {
          if(answers.Nodes.nodeClass == modules.opcua.NodeClass.Method){
            if(answers.Nodes.name.name == "Read" || answers.Nodes.name.name == "Write"){
                console.log(await exec_standard_method(session,answers.Nodes,object_navigated))
            }
            else{
              var params = await utility.get_method_params(session,answers.Nodes)
              var inputs = await get_method_inputs(params)
              var method_to_call = {
                objectId: object_navigated,
                methodId: answers.Nodes.NodeAddress,
                inputArguments: inputs
              }
              var result = await utility.call_method(session,method_to_call)
              console.log(`status = ${result.status}; result = ${result.outputArguments}`)
            }
            nodes.pop()
            
            
          }
          else{
            object_navigated = answers.Nodes.NodeAddress
            nodes = await utility.navigate(session,answers.Nodes.NodeAddress)
            nodes.push({
            name: "Return to ObjectsFolder",
            value: "ObjectsFolder"
          })
          }
          
        }
        
        });

    }
    while(navigate)
    

    
    //var prova = await utility.navigate(session,"ns=1;s=prova.ts")

    //console.log(prova)

    var method_to_call = {
      objectId: "ns=1;i=1001",
      methodId: "ns=1;i=1002",
      inputArguments: [{dataType: modules.opcua.DataType.String , value: "cazzo.sh" }]
    }

    //var prova1 = await utility.call_method(session,method_to_call)

    //var prova2 = await utility.read_file(session,"ns=1;s=prova.ts",6)
    //console.log(prova2)

   // var prova3 = await utility.write_file(session,"ns=1;s=prova.ts","./log.txt")
    //console.log(prova3)


    utility.close_connection(session,client)

  }
  
  catch (err) {
    console.log("An error has occured : ",err);
  }
}
main();