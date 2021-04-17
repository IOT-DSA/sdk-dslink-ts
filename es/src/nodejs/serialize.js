import { PrivateKey } from '../crypto/pk';
import fs from 'fs';
import { DsJson } from '../utils/codec';
import { logger as mainLogger } from '../utils/logger';
let logger = mainLogger.tag('link');
export function getKeyFromFile(path) {
    let key;
    if (!fs.existsSync(path)) {
        key = PrivateKey.generate();
        fs.writeFileSync(path, key.saveToString());
    }
    else {
        key = PrivateKey.loadFromString(fs.readFileSync(path, { encoding: 'utf8' }));
    }
    return key;
}
export class NodeSerializer {
    constructor(path) {
        // default implementation of save nodes
        this.saveNodesToFile = (data) => {
            let str = DsJson.encode(data, true);
            if (this.lastSavedStr === str) {
                // skip duplicated saving
                return;
            }
            fs.writeFile(this.path, str, (err) => {
                if (err) {
                    logger.error(`failed to save ${this.path}`);
                    this.lastSavedStr = null;
                }
            });
        };
        // default implementation of load nodes
        this.loadNodesFromFile = () => {
            try {
                let str = fs.readFileSync(this.path, 'utf8');
                let data = DsJson.decode(str);
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
//# sourceMappingURL=serialize.js.map