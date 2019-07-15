"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const client_link_1 = require("./client_link");
const logger_1 = require("../utils/logger");
class DSLink extends client_link_1.HttpClientLink {
    constructor(name, options, args) {
        let parser = yargs_1.default.options({
            broker: {
                alias: 'b',
                default: 'http://127.0.0.1:8080/conn',
                describe: 'Broker URL',
                type: 'string'
            },
            name: {
                alias: 'n',
                describe: 'Link Name',
                type: 'string'
            },
            token: {
                describe: 'Token',
                type: 'string'
            },
            log: {
                alias: 'l',
                default: 'info',
                describe: 'Log Level [error, warn, info, debug, trace]',
                type: 'string'
            },
        }).help();
        let argv = args ? parser.parse(args) : parser.parse();
        let brokerUrl = argv.broker;
        if (typeof argv.name === 'string') {
            name = argv.name;
        }
        if (!name.endsWith('-')) {
            name = `${name}-`;
        }
        if (typeof argv.token === 'string') {
            options.token = argv.token;
        }
        logger_1.logger.setLevel(argv.log);
        super(brokerUrl, name, options);
    }
}
exports.DSLink = DSLink;
//# sourceMappingURL=cli_link_wrapper.js.map