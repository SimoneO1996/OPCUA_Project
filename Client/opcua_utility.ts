
import * as modules from './package_export';

async function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

export async function get_endpoints(endpointUrl: string, client){
    let endpoints = []

    await client.connect(endpointUrl);


    endpoints = (await client.getEndpoints({endpointUrl: endpointUrl })).map(endpoint => ({

        name:  `endpoint: ${endpoint.endpointUrl} , security mode : ${modules.opcua.MessageSecurityMode[endpoint.securityMode]}, securityPolicy : ${endpoint.securityPolicyUri.split("#")[1]} `,
        value : {
            endpointUrl: endpoint.endpointUrl, 
            securityMode: endpoint.securityMode,
            securityPolicy: endpoint.securityPolicyUri
        }

        
        
    }))

    await client.disconnect();

    return endpoints
}
  

export async function connect(client,endpointUrl){
    
    await client.connect(endpointUrl);
    
    
    // step 2 : createSession
    const session = await client.createSession();

    return session
}

export async function navigate(session, node){
    var nodes = []
    let browseResult = await session.browse(node);
        browseResult.references.forEach(element => {
            var node = {
                name: element.browseName,
                value: {
                    name: element.browseName,
                    nodeClass: `${element.nodeClass}`,
                    NodeAddress: `${element.nodeId}`
                }
              }
              nodes.push(node)
        });
    return nodes
  }
export async function get_method_params(session,method_node){
    if(method_node.nodeClass == modules.opcua.NodeClass.Method ){
       var Arguments =  await session.getArgumentDefinition(method_node.NodeAddress)
       var inputs_parametes = []
          for(let i= 0 ;i< Arguments.inputArguments.length; i++){
            inputs_parametes.push({
                name : Arguments.inputArguments[i].name,
                type : Arguments.inputArguments[i].dataType.value
            })
          }
        return inputs_parametes
    }
    else {
        console.log("not a method")
        return undefined
    }
}
export async function call_method(session,method_to_call){
    
    var result = await session.call(method_to_call)
    var return_result = {
        status : result.statusCode.toString(),
        outputArguments : []
    }
    for(let i=0 ; i < result.outputArguments.length; i ++){
        return_result.outputArguments.push(result.outputArguments[i].value)
    }
    return return_result
}

export async function close_connection(session,client){

    // close session
    await session.close();

    // disconnecting
    await client.disconnect();
    console.log("done !");

}

export async function read_file(session,file_node,num_bytes){
    const clientFile = new modules.filetransfer.ClientFile(session, file_node);
    const mode = modules.filetransfer.OpenFileMode.Read;
    await clientFile.open(mode);

    const data: Buffer = await clientFile.read(num_bytes);

    await clientFile.close();

    return data.toString()

    

}

export async function write_file(session,file_node,file_to_write){
    const clientFile = new modules.filetransfer.ClientFile(session, file_node);
    const mode = modules.filetransfer.OpenFileMode.Write;
    await clientFile.open(mode);
    var DataToWrite = modules.fs.readFileSync(file_to_write);
    await clientFile.write(DataToWrite)
    await clientFile.close();
    return "file written"


}