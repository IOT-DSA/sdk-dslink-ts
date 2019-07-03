import {PrivateKey} from "../pk";
import {assert} from "chai";

const clientPrivate = "M6S41GAL0gH0I97Hhy7A2-icf8dHnxXPmYIRwem03HE";
const clientPublic = "BEACGownMzthVjNFT7Ry-RPX395kPSoUqhQ_H_vz0dZzs5RYoVJKA16XZhdYd__ksJP0DOlwQXAvoDjSMWAhkg4";
const clientDsId = "test-s-R9RKdvC2VNkfRwpNDMMpmT_YWVbhPLfbIc-7g4cpc";
const serverTempPrivate = "rL23cF6HxmEoIaR0V2aORlQVq2LLn20FCi4_lNdeRkk";
const serverTempPublic = "BCVrEhPXmozrKAextseekQauwrRz3lz2sj56td9j09Oajar0RoVR5Uo95AVuuws1vVEbDzhOUu7freU0BXD759U";
const sharedSecret = "116128c016cf380933c4b40ffeee8ef5999167f5c3d49298ba2ebfd0502e74e3";
const hashedAuth = "V2P1nwhoENIi7SqkNBuRFcoc8daWd_iWYYDh_0Z01rs";

describe('pk', function () {
  it('algorithm', function () {
    let prikey = PrivateKey.loadFromString(clientPrivate);
    let pubkey = prikey.publicKey;

    assert.equal(pubkey.qBase64, clientPublic, 'API public key');

    /// Initialize connection , Client -> Server

    let dsId = pubkey.getDsId('test-');
    assert.equal(dsId, clientDsId, 'API dsId');

    /// Initialize connection , Server -> Client
    let tPrikey = PrivateKey.loadFromString(serverTempPrivate);
    let tPubkey = tPrikey.publicKey;

    assert.equal(tPubkey.qBase64, serverTempPublic, 'API temp key');


    /// Start Connection (http or ws), Client -> Server
    /// Decode
    let clientEcdh = prikey.getSecret(tPubkey.qBase64);
    let serverEcdh = tPrikey.getSecret(pubkey.qBase64);

    assert.equal(clientEcdh.sharedSecret.toString('hex'), sharedSecret, 'API client ECDH');
    assert.equal(serverEcdh.sharedSecret.toString('hex'), sharedSecret, 'API server ECDH');

    /// Make Auth
    let auth = serverEcdh.hashSalt('0000');
    assert.equal(auth, hashedAuth, 'API auth');
  });
});