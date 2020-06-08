const opcua = require("node-opcua");
import { build_my_address_space } from "./utils/address_space_builder"
import "./utils/file_service"

const server = new opcua.OPCUAServer({
    port: 4334,
    resourcePath: "/UA/FileTransfer",
    buildInfo: {
        productName: "RaspUAServer1",
        buildNumber: "1",
        buildDate: new Date()
    }
});

server.initialize(() =>{
    console.log("OPC UA Server initialized.");

    build_my_address_space(server);

    console.log("Address space initialized.");

    server.start(() => {
        console.log(server.endpoints[0].port)
        console.log(`Server is now listening port ${server.endpoints[0].port}... (press CTRL+C to stop)`);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log("The primary server endpoint url is ", endpointUrl);
    });

});

process.on('SIGINT', function () {
    process.exit(0);
});

