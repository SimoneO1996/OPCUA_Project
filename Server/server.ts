import * as path from "path";

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
    },
    serverCertificateManager: new opcua.OPCUACertificateManager({
        automaticallyAcceptUnknownCertificate: true,
        rootFolder: path.join(__dirname, "certs")
    })
});

server.initialize(() =>{
    console.log("OPC UA Server initialized.");

    build_my_address_space(server);

    console.log("Address space initialized.");

    server.start(() => {
        console.log(`Server is now listening port ${server.endpoints[0].port}... (press CTRL+C to stop)`);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log("The primary server endpoint url is ", endpointUrl);
    });

});

process.on('SIGINT', function () {
    console.log("Server Shutting Down...")
    process.exit(0);
});

