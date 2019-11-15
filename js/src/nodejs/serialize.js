"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pk_1 = require("../crypto/pk");
const fs_1 = __importDefault(require("fs"));
const codec_1 = require("../utils/codec");
const logger_1 = require("../utils/logger");
let logger = logger_1.logger.tag('link');
function getKeyFromFile(path) {
    let key;
    if (!fs_1.default.existsSync(path)) {
        key = pk_1.PrivateKey.generate();
        fs_1.default.writeFileSync(path, key.saveToString());
    }
    else {
        key = pk_1.PrivateKey.loadFromString(fs_1.default.readFileSync(path, { encoding: 'utf8' }));
    }
    return key;
}
exports.getKeyFromFile = getKeyFromFile;
class NodeSerializer {
    constructor(path) {
        // default implementation of save nodes
        this.saveNodesToFile = (data) => {
            let str = codec_1.DsJson.encode(data, true);
            if (this.lastSavedStr === str) {
                // skip duplicated saving
                return;
            }
            fs_1.default.writeFile(this.path, str, (err) => {
                if (err) {
                    logger.error(`failed to save ${this.path}`);
                    this.lastSavedStr = null;
                }
            });
        };
        // default implementation of load nodes
        this.loadNodesFromFile = () => {
            try {
                let str = fs_1.default.readFileSync(this.path, 'utf8');
                let data = codec_1.DsJson.decode(str);
                if (data && data instanceof Object) {
                    this.lastSavedStr = str;
                    return data;
                }
            }
            catch (err) { }
            logger.info(`can't find a valid ${this.path}, skip loading nodes`);
            return null;
        };
        this.path = path;
    }
}
exports.NodeSerializer = NodeSerializer;
//# sourceMappingURL=serialize.js.map