"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-file-transfer
 */
const fs = require("fs");
const util_1 = require("util");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const open_mode_1 = require("../open_mode");
const debugLog = node_opcua_debug_1.make_debugLog("FileType");
const errorLog = node_opcua_debug_1.make_errorLog("FileType");
const doDebug = node_opcua_debug_1.checkDebugFlag("FileType");
/**
 *
 */
class FileTypeData {
    constructor(options, file) {
        this.filename = "";
        this.maxSize = 0;
        this.mimeType = "";
        this._openCount = 0;
        this._fileSize = 0;
        this.file = file;
        this.filename = options.filename;
        this.maxSize = options.maxSize;
        this.mimeType = options.mineType || "";
        // openCount indicates the number of currently valid file handles on the file.
        this._openCount = 0;
        file.openCount.bindVariable({
            get: () => new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.UInt16, value: this._openCount })
        }, true);
        file.openCount.minimumSamplingInterval = 0; // changed immediatly
        file.size.bindVariable({
            get: () => new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.UInt64, value: this._fileSize })
        }, true);
        file.size.minimumSamplingInterval = 0; // changed immediatly
        this.refresh();
    }
    set openCount(value) {
        this._openCount = value;
        this.file.openCount.touchValue();
    }
    get openCount() {
        return this._openCount;
    }
    set fileSize(value) {
        this._fileSize = value;
        this.file.size.touchValue();
    }
    get fileSize() {
        return this._fileSize;
    }
    /**
     * refresh position and size
     * this method should be call by the server if the file
     * is modified externally
     *
     */
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            // lauch an async request to update filesize
            yield (function extractFileSize(self) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const stat = yield util_1.promisify(fs.stat)(self.filename);
                        self._fileSize = stat.size;
                        debugLog("original file size ", self.filename, " size = ", self._fileSize);
                    }
                    catch (_a) {
                        self._fileSize = 0;
                        debugLog("Cannot access file ", self.filename);
                    }
                });
            })(this);
        });
    }
}
exports.FileTypeData = FileTypeData;
function getFileData(opcuaFile2) {
    return opcuaFile2.$fileData;
}
exports.getFileData = getFileData;
function _prepare(addressSpace, context) {
    const _context = addressSpace;
    _context.$$currentFileHandle = _context.$$currentFileHandle ? _context.$$currentFileHandle : 41;
    _context.$$files = _context.$$files || {};
    return _context;
}
function _addFile(addressSpace, context, openMode) {
    const _context = _prepare(addressSpace, context);
    _context.$$currentFileHandle++;
    const fileHandle = _context.$$currentFileHandle;
    const _fileData = {
        fd: -1,
        handle: fileHandle,
        openMode,
        position: [0, 0]
    };
    _context.$$files[fileHandle] = _fileData;
    return fileHandle;
}
function _getFileInfo(addressSpace, context, fileHandle) {
    const _context = _prepare(addressSpace, context);
    return _context.$$files[fileHandle];
}
function _close(addressSpace, context, fileData) {
    const _context = _prepare(addressSpace, context);
    delete _context.$$files[fileData.fd];
}
function toNodeJSMode(opcuaMode) {
    let flags;
    switch (opcuaMode) {
        case open_mode_1.OpenFileMode.Read:
            flags = "r";
            break;
        case open_mode_1.OpenFileMode.ReadWrite:
        case open_mode_1.OpenFileMode.Write:
            flags = "w+";
            break;
        case open_mode_1.OpenFileMode.ReadWriteAppend:
        case open_mode_1.OpenFileMode.WriteAppend:
            flags = "a+";
            break;
        case open_mode_1.OpenFileMode.WriteEraseExisting:
        case open_mode_1.OpenFileMode.ReadWriteEraseExisting:
            flags = "w+";
            break;
        default:
            flags = "?";
            break;
    }
    return flags;
}
/**
 * Open is used to open a file represented by an Object of FileType.
 * When a client opens a file it gets a file handle that is valid while the
 * session is open. Clients shall use the Close Method to release the handle
 * when they do not need access to the file anymore. Clients can open the
 * same file several times for read.
 * A request to open for writing shall return Bad_NotWritable when the file is
 * already opened.
 * A request to open for reading shall return Bad_NotReadable
 * when the file is already opened for writing.
 *
 * Method Result Codes (defined in Call Service)
 *  Result Code         Description
 *  BadNotReadable      File might be locked and thus not readable.
 *  BadNotWritable      The file is locked and thus not writable.
 *  BadInvalidState
 *  BadInvalidArgument  Mode setting is invalid.
 *  BadNotFound .
 *  BadUnexpectedError
 *
 * @private
 */
function _openFile(inputArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpace = this.addressSpace;
        const mode = inputArguments[0].value;
        /**
         * mode (Byte) Indicates whether the file should be opened only for read operations
         *      or for read and write operations and where the initial position is set.
         *      The mode is an 8-bit unsigned integer used as bit mask with the structure
         *      defined in the following table:
         *      Field        Bit  Description
         *      Read          0   The file is opened for reading. If this bit is not
         *                        set the Read Method cannot be executed.
         *      Write         1   The file is opened for writing. If this bit is not
         *                        set the Write Method cannot be executed.
         *      EraseExisting 2   This bit can only be set if the file is opened for writing
         *                        (Write bit is set). The existing content of the file is
         *                        erased and an empty file is provided.
         *      Append        3   When the Append bit is set the file is opened at end
         *                        of the file, otherwise at begin of the file.
         *                        The SetPosition Method can be used to change the position.
         *      Reserved     4:7  Reserved for future use. Shall always be zero.
         */
        // see https://nodejs.org/api/fs.html#fs_file_system_flags
        const flags = toNodeJSMode(mode);
        if (flags === "?") {
            errorLog("Invalid mode " + open_mode_1.OpenFileMode[mode] + " (" + mode + ")");
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidArgument };
        }
        /**
         *  fileHandle (UInt32) A handle for the file used in other method calls indicating not the
         *            file (this is done by the Object of the Method call) but the access
         *            request and thus the position in the file. The fileHandle is generated
         *            by the server and is unique for the Session. Clients cannot transfer the
         *            fileHandle to another Session but need to get a new fileHandle by calling
         *            the Open Method.
         */
        const fileHandle = _addFile(addressSpace, context, mode);
        const _fileInfo = _getFileInfo(addressSpace, context, fileHandle);
        const fileData = context.object.$fileData;
        const filename = fileData.filename;
        try {
            _fileInfo.fd = yield util_1.promisify(fs.open)(filename, flags);
            // update position
            _fileInfo.position = [0, 0];
            // tslint:disable-next-line:no-bitwise
            if ((mode & open_mode_1.OpenFileModeMask.AppendBit) === open_mode_1.OpenFileModeMask.AppendBit) {
                const p = (yield util_1.promisify(fs.stat)(filename)).size;
                _fileInfo.position[1] = p;
            }
            fileData.openCount += 1;
        }
        catch (err) {
            errorLog(err.message);
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadUnexpectedError };
        }
        debugLog("Opening file handle ", fileHandle, "filename: ", fileData.filename, "openCount: ", fileData.openCount);
        const callMethodResult = {
            outputArguments: [
                {
                    dataType: node_opcua_variant_1.DataType.UInt32,
                    value: fileHandle
                }
            ],
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
        return callMethodResult;
    });
}
/**
 * Close is used to close a file represented by a FileType.
 * When a client closes a file the handle becomes invalid.
 *
 * @param inputArguments
 * @param context
 * @private
 */
function _closeFile(inputArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpace = this.addressSpace;
        const fileHandle = inputArguments[0].value;
        const _fileInfo = _getFileInfo(addressSpace, context, fileHandle);
        if (!_fileInfo) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidArgument };
        }
        const data = context.object.$fileData;
        debugLog("Closing file handle ", fileHandle, "filename: ", data.filename, "openCount: ", data.openCount);
        yield util_1.promisify(fs.close)(_fileInfo.fd);
        _close(addressSpace, context, _fileInfo);
        data.openCount -= 1;
        return {
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
    });
}
/**
 * Read is used to read a part of the file starting from the current file position.
 * The file position is advanced by the number of bytes read.
 *
 * @param inputArguments
 * @param context
 * @private
 */
function _readFile(inputArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpace = this.addressSpace;
        //  fileHandle A handle indicating the access request and thus indirectly the
        //  position inside the file.
        const fileHandle = inputArguments[0].value;
        // Length Defines the length in bytes that should be returned in data, starting from the current
        // position of the file handle. If the end of file is reached all data until the end of the file is
        // returned. The Server is allowed to return less data than specified length.
        const length = inputArguments[1].value;
        // Only positive values are allowed.
        if (length < 0) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidArgument };
        }
        const _fileInfo = _getFileInfo(addressSpace, context, fileHandle);
        if (!_fileInfo) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidState };
        }
        // tslint:disable-next-line:no-bitwise
        if ((_fileInfo.openMode & open_mode_1.OpenFileModeMask.ReadBit) === 0x0) {
            // open mode did not specify Read Flag
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidState };
        }
        const data = Buffer.alloc(length);
        let ret;
        try {
            ret = yield util_1.promisify(fs.read)(_fileInfo.fd, data, 0, length, _fileInfo.position[1]);
            _fileInfo.position[1] += ret.bytesRead;
        }
        catch (err) {
            errorLog("Read error : ", err.message);
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadUnexpectedError };
        }
        //   Data Contains the returned data of the file. If the ByteString is empty it indicates that the end
        //     of the file is reached.
        return {
            outputArguments: [
                { dataType: node_opcua_variant_1.DataType.ByteString, value: data.slice(0, ret.bytesRead) }
            ],
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
    });
}
function _writeFile(inputArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpace = this.addressSpace;
        const fileHandle = inputArguments[0].value;
        const _fileInfo = _getFileInfo(addressSpace, context, fileHandle);
        if (!_fileInfo) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidArgument };
        }
        // tslint:disable-next-line:no-bitwise
        if ((_fileInfo.openMode & open_mode_1.OpenFileModeMask.WriteBit) === 0x00) {
            // File has not been open with write mode
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidState };
        }
        const data = inputArguments[1].value;
        let ret;
        try {
            ret = yield util_1.promisify(fs.write)(_fileInfo.fd, data, 0, data.length, _fileInfo.position[1]);
            _fileInfo.position[1] += ret.bytesWritten;
            const fileTypeData = context.object.$fileData;
            debugLog(fileTypeData.fileSize);
            fileTypeData.fileSize = Math.max(fileTypeData.fileSize, _fileInfo.position[1]);
            debugLog(fileTypeData.fileSize);
        }
        catch (err) {
            errorLog("Write error : ", err.message);
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadUnexpectedError };
        }
        return {
            outputArguments: [],
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
    });
}
function _setPositionFile(inputArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpace = this.addressSpace;
        const fileHandle = inputArguments[0].value;
        const position = inputArguments[1].value;
        const _fileInfo = _getFileInfo(addressSpace, context, fileHandle);
        if (!_fileInfo) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidArgument };
        }
        _fileInfo.position = position;
        return { statusCode: node_opcua_status_code_1.StatusCodes.Good };
    });
}
function _getPositionFile(inputArguments, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpace = this.addressSpace;
        const fileHandle = inputArguments[0].value;
        const _fileInfo = _getFileInfo(addressSpace, context, fileHandle);
        if (!_fileInfo) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadInvalidArgument };
        }
        return {
            outputArguments: [{
                    arrayType: node_opcua_variant_1.VariantArrayType.Scalar,
                    dataType: node_opcua_variant_1.DataType.UInt64,
                    value: _fileInfo.position
                }],
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
    });
}
exports.defaultMaxSize = 100000000;
/**
 * bind all methods of a UAFileType OPCUA node
 * @param file the OPCUA Node that has a typeDefinition of FileType
 * @param options the options
 */
function installFileType(file, options) {
    if (file.$fileData) {
        errorLog("File already installed ", file.nodeId.toString(), file.browseName.toString());
        return;
    }
    // to protect the server we setup a maximum limite in bytes on the file
    // if the client try to access or set the position above this limit
    // the server will return an error
    options.maxSize = (options.maxSize === undefined) ? exports.defaultMaxSize : options.maxSize;
    const $fileData = new FileTypeData(options, file);
    file.$fileData = $fileData;
    // ----- install mime type
    if (options.mineType) {
        if (file.mimeType) {
            file.mimeType.bindVariable({
                get: () => file.$fileOptions.mineType
            });
        }
    }
    file.open.bindMethod(util_1.callbackify(_openFile));
    file.close.bindMethod(util_1.callbackify(_closeFile));
    file.read.bindMethod(util_1.callbackify(_readFile));
    file.write.bindMethod(util_1.callbackify(_writeFile));
    file.setPosition.bindMethod(util_1.callbackify(_setPositionFile));
    file.getPosition.bindMethod(util_1.callbackify(_getPositionFile));
}
exports.installFileType = installFileType;
//# sourceMappingURL=file_type_helpers.js.map