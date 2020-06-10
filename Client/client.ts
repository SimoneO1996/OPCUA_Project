import * as modules from './package_export';
import * as utility from './opcua_utility'




async function get_method_inputs(params){
  var question
  var Arguments = []
  for (let x = 0 ; x < params.length ; x++){
     question = {
      type: 'input',
      name: 'param',
      message: `Please enter the param (name: ${params[x].name} , type: ${modules.opcua.DataType[params[x].type]})`,
      suffix: "(type cancel to undo operation)"
    }
    await modules.inquirer.prompt(question).then(async answers => {
      if(answers.param == "cancel"){
        Arguments = undefined
        return
      }
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
        suffix: "(type cancel to undo operation)",
        validate: function(num_bytes){
          if(!isNaN(parseInt(num_bytes)) || num_bytes == "cancel"){
            return true
          }
          else {
            return "You must insert a number"
          }
        }
      }
      await modules.inquirer.prompt(question_read).then(async answers => {
        if(answers.num_bytes != "cancel"){
          console.log(parseInt(answers.num_bytes))
          result = await utility.read_file(session,file_node,parseInt(answers.num_bytes))
        }
        else {
          result = "operation undo"
        }
      })
      break
    case "Write":
     var question_write = {
        type: 'input',
        name: 'file',
        message: `Please enter the relative path of the file`,
        suffix: "(type cancel to undo operation)",
        validate: function(file){
          if (modules.fs.existsSync(file) || file == "cancel") {
            return true
          }
          else {
            return "please enter a valid file path"
          }
        }
      }
      await modules.inquirer.prompt(question_write).then(async answers => {
        if(answers.num_bytes != "cancel"){
          result = await utility.write_file(session,file_node,answers.file)
        }
        else{
          result = "operation undo"
        }
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




async function main() {
    var client
    var session
    var navigate: boolean = true
    var object_navigated
    var navigate_question
    var nodes = []

    var initial_question = [{
      type: 'input',
      name: 'Endpoint',
      message: 'Please enter the OPCUA Server EndPoint',
    }]
    
    while(session == undefined){
      try{
        client = modules.opcua.OPCUAClient.create(options);
        await modules.inquirer.prompt(initial_question).then(async answers => {
          session = await utility.connect(answers.Endpoint,client)
          });
      }
      catch (err){
        console.log(err.message)
      }
    }
   
    try{
      nodes = await utility.navigate(session,"ObjectsFolder")
    }
    catch(err){
      console.log(err.message)
      nodes.push({
        name: "Retry browse ObjectsFolder",
        value: {
          nodeClass: "ObjectsFolder"
        } 
        })
    }
    
    do{
      try{
        nodes.push({
          name: "Stop",
          value: {
            nodeClass: "Stop"
          }
        })
      
      
        navigate_question = {
          type: 'list',
          name: 'Nodes',
          message: 'Select the nodes you want to navigate, if you choose a method it will be executed',
          choices: nodes
        }
    
        await modules.inquirer.prompt(navigate_question).then(async answers => {

          switch(answers.Nodes.nodeClass){
            case "Stop":
              navigate = false
              break
            case "ObjectsFolder":
              nodes = await utility.navigate(session,'ObjectsFolder')
              break
            case modules.opcua.NodeClass.Method.toString():
              if(answers.Nodes.name.name == "Read" || answers.Nodes.name.name == "Write"){
                console.log(await exec_standard_method(session,answers.Nodes,object_navigated))
              }
              else{
                var params = await utility.get_method_params(session,answers.Nodes)
                var inputs = await get_method_inputs(params)
                if(inputs != undefined){
                  var method_to_call = {
                    objectId: object_navigated,
                    methodId: answers.Nodes.NodeAddress,
                    inputArguments: inputs
                  }
                  var result = await utility.call_method(session,method_to_call)
                  console.log(`status = ${result.status}; result = ${result.outputArguments}`)
                }
                else{
                  console.log("operation undo")
                }
                
                  
              }
              nodes = await utility.navigate(session,object_navigated)
              nodes.push({
                name: "Return to ObjectsFolder",
                value: {nodeClass: "ObjectsFolder"}
              })
              break;
            case modules.opcua.NodeClass.Object.toString():
              
              object_navigated = answers.Nodes.NodeAddress
              nodes = await utility.navigate(session,answers.Nodes.NodeAddress)
              nodes.push({
                name: "Return to ObjectsFolder",
                value: {nodeClass: "ObjectsFolder"}
              })
              break
            case modules.opcua.NodeClass.Variable.toString():
              var value = await session.readVariableValue(answers.Nodes.NodeAddress)
              console.log(value.statusCode.toString())
              console.log(value.value.toString())
              nodes.pop()
              break
            default:
              console.log(`Nodes class: ${modules.opcua.NodeClass[answers.Nodes.nodeClass]} not implemented in the client `)
              nodes.pop()
          }
          
          });
        }
      catch(err){
        console.log(err.message)
        nodes.pop()
      }
    
    }
    while(navigate)
    
    try{
      utility.close_connection(session,client)
    }
    catch(err){
      console.log(err.message)
      process.exit(-1)
    }

    process.exit(0)
    
}
main();