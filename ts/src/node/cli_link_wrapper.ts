import yargs from "yargs";
import {HttpClientLink} from "./client_link";
import {LocalNode} from "../responder/node_state";
import {PrivateKey} from "../crypto/pk";
import {logger} from "../utils/logger";

interface DSLinkOption {
  rootNode?: LocalNode;
  privateKey?: PrivateKey;
  isRequester?: boolean;
  saveNodes?: boolean | string | ((data: any) => void);
  token?: string;
  linkData?: {[key: string]: any};
  format?: string[] | string;
}

export class DSLink extends HttpClientLink {
  constructor(name: string, options: DSLinkOption, args?: string[]) {

    let parser = yargs.options({
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
    });
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
