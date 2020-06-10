## Script Transfer OPCUA
OPCUA Client-Server system for script loading and execution on a Raspberry Pi server, using the [OPCUA stack written in NodeJS](https://github.com/node-opcua)
#### Server
The OPCUA server defines an address space with the **Scripts** folder in which  the files to be executed will be put after loading from client.
The **Scripts** folder will be able to add/remove script files and execute them on the Raspberry device.
First of all, the server is written in Typescript and it runs with the command `ts-node`, so make sure you have both installed

    npm install typescript
    npm install ts-node
   Then, navigate on the Server folder and install all the required Node packages
   

    npm install
   Finally, start the server, by executing the following command in the Server folder
   

    npm start
#### Client
Through The OPCUA Client you can:
1. Navigate across all the objects defined in the server Address Space
2. Execute all methods defined in the objects: in particular we diveved the methods into standard methods that belongos to FileObjects(Read and Write) and custom methods that we have implemented such as AddFile, ExecuteScripts ecc. For each methods, you can provide dynamically the inputs arguments and get the relative response from the server. For the Read and Write Method the file-transfer functionalities are used to open the file executes the action and than close the file. In the write method you have to indicate a path to a file in order to copy its content into the FileObject in the OPCUA Server.

The GUI is implemented by using the inquirer module implemented in nodejs [a link](https://www.npmjs.com/package/inquirer)

To run the Client you have just to install the dependecies and start the nodejs project:
```
npm install
npm start
```
