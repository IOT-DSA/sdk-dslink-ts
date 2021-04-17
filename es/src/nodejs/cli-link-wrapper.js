import yargs from 'yargs';
import { HttpClientLink } from './client-link';
import { logger } from '../utils/logger';
export class DSLink extends HttpClientLink {
    constructor(name, options, args) {
        let parser = yargs
            .options({
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
            }
        })
            .help();
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
        logger.setLevel(argv.log);
        super(brokerUrl, name, options);
    }
}
//# sourceMappingURL=cli-link-wrapper.js.map