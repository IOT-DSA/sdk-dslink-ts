"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// DSLink SDK IO Utilities
library;
dslink.io;
require("dart:async");
require("dart:convert");
require("dart:io");
require("dart:typed_data");
require("dart:math");
require("package:dslink/utils.dart");
require("package:path/path.dart");
as;
pathlib;
require("package:crypto/crypto.dart");
const _tcpNoDelay = ;
const boolean, fromEnvironment;
("dsa.io.tcpNoDelay",
    defaultValue);
true;
;
/// Read raw text from stdin.
readStdinText();
Stream < string > {
    return: , const: Utf8Decoder().bind(stdin)
};
/// Read each line from stdin.
readStdinLines();
Stream < string > {
    var: stream = readStdinText(),
    return: , const: LineSplitter().bind(stream)
};
/// Helpers for working with HTTP
class HttpHelper {
    createRequest(method, url, {}, { [key]: string }) { }
}
/// Main HTTP Client
HttpHelper.client = new HttpClient();
exports.HttpHelper = HttpHelper;
headers;
async;
{
    var request = await client.openUrl(method, Uri.parse(url));
    if (headers != null) {
        headers.forEach(request.headers.set);
    }
    return request;
}
Promise < int[] > readBytesFromResponse(response, HttpClientResponse);
async;
{
    return await response.fold([], (a, b) => {
        a.addAll(b);
        return a;
    });
}
Promise < string > fetchUrl(url, string, {}, { [key]: string, string }, headers);
async;
{
    var request = await createRequest("GET", url, headers, headers);
    var response = await request.close();
    return ;
    const Utf8Decoder;
    ().convert(await readBytesFromResponse(response));
}
Promise < dynamic > fetchJSON(url, string, {}, { [key]: string, string }, headers);
async;
{
    return ;
    const JsonDecoder;
    ().convert(await fetchUrl(url, headers, headers));
}
_webSocketGUID: string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
enableStandardWebSocket: boolean =
;
const boolean, fromEnvironment;
("calzone.build", defaultValue);
false;
 ||
;
const boolean, fromEnvironment;
("websocket.standard", defaultValue);
true;
;
Promise < WebSocket > connectToWebSocket(let, url, string, {
    let, protocols: Iterable < string > ,
    let, headers: { [key]: string, dynamic },
    let, httpClient: HttpClient,
    boolean, useStandardWebSocket
});
async;
{
    uri: Uri = Uri.parse(url);
    if (useStandardWebSocket == null) {
        useStandardWebSocket = enableStandardWebSocket;
    }
    if (useStandardWebSocket == true && uri.scheme != "wss") {
        return await awaitWithTimeout(WebSocket.connect(url, protocols, protocols, headers, headers), 60000, onSuccessAfterTimeout, (socket) => {
            socket.close();
        });
    }
    if (uri.scheme != "ws" && uri.scheme != "wss") {
        throw new WebSocketException("Unsupported URL scheme '${uri.scheme}'");
    }
    random: Random = new Random();
    // Generate 16 random bytes.
    nonceData: Uint8Array = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        nonceData[i] = random.nextInt(256);
    }
    nonce: string = BASE64.encode(nonceData);
    port: number = uri.port;
    if (port == 0) {
        port = uri.scheme == "wss" ? 443 : 80;
    }
    uri = new Uri(scheme, uri.scheme == "wss" ? "https" : "http", userInfo, uri.userInfo, host, uri.host, port, port, path, uri.path, query, uri.query);
    _client: HttpClient = httpClient == null ? (new HttpClient()
        ..badCertificateCallback = (a, b, c) => true) : httpClient;
    return this._client.openUrl("GET", uri).then((request) => async, {
        if(uri) { }, : .userInfo != null && !uri.userInfo.isEmpty
    });
    {
        // If the URL contains user information use that for basic
        // authorization.
        let auth = BASE64.encode(UTF8.encode(uri.userInfo));
        request.headers.set(HttpHeaders.AUTHORIZATION, "Basic $auth");
    }
    if (headers != null) {
        headers.forEach((field, value) => request.headers.add(field, value));
    }
    // Setup the initial handshake.
    request.headers
        ..set(HttpHeaders.CONNECTION, "Upgrade")
        ..set(HttpHeaders.UPGRADE, "websocket")
        ..set("Sec-WebSocket-Key", nonce)
        ..set("Cache-Control", "no-cache")
        ..set("Sec-WebSocket-Version", "13");
    if (protocols != null) {
        request.headers.add("Sec-WebSocket-Protocol", protocols.toList());
    }
    return request.close();
}
then((response) => {
    return response;
}).then((response) => {
    error(message, string);
    {
        // Flush data.
        response.detachSocket().then((socket) => {
            socket.destroy();
        });
        throw new WebSocketException(message);
    }
    if (response.statusCode != HttpStatus.SWITCHING_PROTOCOLS ||
        response.headers[HttpHeaders.CONNECTION] == null ||
        !response.headers[HttpHeaders.CONNECTION].any((value) => value.toLowerCase() == "upgrade") ||
        response.headers.value(HttpHeaders.UPGRADE).toLowerCase() != "websocket") {
        error("Connection to '$uri' was not upgraded to websocket");
    }
    let accept = response.headers.value("Sec-WebSocket-Accept");
    if (accept == null) {
        error("Response did not contain a 'Sec-WebSocket-Accept' header");
    }
    let expectedAccept = sha1.convert("$nonce$_webSocketGUID".codeUnits).bytes;
    let receivedAccept = BASE64.decode(accept);
    if (expectedAccept.length != receivedAccept.length) {
        error("Response header 'Sec-WebSocket-Accept' is the wrong length");
    }
    for (let i = 0; i < expectedAccept.length; i++) {
        if (expectedAccept[i] != receivedAccept[i]) {
            error("Bad response 'Sec-WebSocket-Accept' header");
        }
    }
    var protocol = response.headers.value('Sec-WebSocket-Protocol');
    return response.detachSocket().then((socket) => {
        socket.setOption(SocketOption.TCP_NODELAY, this._tcpNoDelay);
        return new WebSocket.fromUpgradedSocket(socket, protocol, protocol, serverSide, false);
    });
}).timeout(new Duration(minutes, 1), onTimeout, () => {
    _client.close(force, true);
    throw new WebSocketException('timeout');
});
Promise < WebSocket > upgradeToWebSocket(request, HttpRequest, [
    protocolSelector(protocols, string[]),
    boolean, useStandardWebSocket
]);
{
    if (useStandardWebSocket == null) {
        useStandardWebSocket = enableStandardWebSocket;
    }
    if (useStandardWebSocket) {
        return WebSocketTransformer.upgrade(request, protocolSelector, protocolSelector);
    }
    var response = request.response;
    if (!WebSocketTransformer.isUpgradeRequest(request)) {
        // Send error response.
        response
            ..statusCode = HttpStatus.BAD_REQUEST
            ..close();
        return new Future.error(new WebSocketException("Invalid WebSocket upgrade request"));
    }
    upgrade(protocol, string);
    Promise < WebSocket > {
        // Send the upgrade response.
        response,
        : 
            ..statusCode = HttpStatus.SWITCHING_PROTOCOLS
            ..headers.add(HttpHeaders.CONNECTION, "Upgrade")
            ..headers.add(HttpHeaders.UPGRADE, "websocket"),
        let, key: string = request.headers.value("Sec-WebSocket-Key"),
        let, accept: string = BASE64.encode(sha1.convert("$key$_webSocketGUID".codeUnits).bytes),
        response, : .headers.add("Sec-WebSocket-Accept", accept),
        if(protocol) { }
    } != null;
    {
        response.headers.add("Sec-WebSocket-Protocol", protocol);
    }
    response.headers.contentLength = 0;
    return response.detachSocket()
        .then((socket) => {
        socket.setOption(SocketOption.TCP_NODELAY, this._tcpNoDelay);
        return new WebSocket.fromUpgradedSocket(socket, protocol, protocol, serverSide, true);
    });
}
var protocols = request.headers['Sec-WebSocket-Protocol'];
if (protocols != null && protocolSelector != null) {
    // The suggested protocols can be spread over multiple lines, each
    // consisting of multiple protocols. To unify all of them, first join
    // the lists with ', ' and then tokenize.
    protocols = HttpHelper.tokenizeFieldValue(protocols.join(', '));
    return new Future(() => protocolSelector(protocols)).then((protocol) => {
        if (protocols.indexOf(protocol) < 0) {
            throw new WebSocketException("Selected protocol is not in the list of available protocols");
        }
        return protocol;
    }).catchError((error) => {
        response
            ..statusCode = HttpStatus.INTERNAL_SERVER_ERROR
            ..close();
        throw error;
    }).then((result) => {
        if (typeof result === 'string') {
            return upgrade(result);
        }
        return null;
    }).then((socket) => {
        return socket;
    });
}
else {
    return upgrade(null);
}
tokenizeFieldValue(headerValue, string);
string[];
{
    tokens: string[] = new string[]();
    start: number = 0;
    index: number = 0;
    while (index < headerValue.length) {
        if (headerValue[index] == ",") {
            tokens.add(headerValue.substring(start, index));
            start = index + 1;
        }
        else if (headerValue[index] == " " || headerValue[index] == "\t") {
            start++;
        }
        index++;
    }
    tokens.add(headerValue.substring(start, index));
    return tokens;
}
/// Generates a random socket port.
Promise < int > getRandomSocketPort();
async;
{
    var server = await ServerSocket.bind(InternetAddress.LOOPBACK_IP_V4.address, 0);
    var port = server.port;
    await server.close();
    return port;
}
final;
_separator = pathlib.separator;
Promise < File > this._safeWriteBase(targetFile, File, dynamic, content, Promise < File > writeFunction(file, File, dynamic, content), { boolean, verifyJson: false });
async;
{
    tempDirectory = await Directory.current.createTemp();
    targetFileName = pathlib.basename(targetFile.path);
    var tempFile = new File("${tempDirectory.path}$_separator${targetFileName}");
    tempFile = await writeFunction(tempFile, content);
    var canOverwriteOriginalFile = true;
    if (verifyJson) {
        final;
        readContent = await tempFile.readAsString();
        try {
            JSON.decode(readContent);
        }
        finally { }
        on;
        FormatException;
        try { }
        catch (e) { }
        s;
        {
            canOverwriteOriginalFile = false;
            console.error("Couldn't parse JSON after trying to write ${targetFile.path}", e, s);
        }
    }
    if (canOverwriteOriginalFile) {
        tempFile = await tempFile.rename(targetFile.absolute.path);
        tempDirectory.delete();
        return tempFile;
    }
    else {
        console.error(`${targetFile.path} wasn't saved, the original will be preserved`);
        return targetFile;
    }
}
Promise < File > safeWriteAsString(targetFile, File, content, string, { boolean, verifyJson: false });
async;
{
    return this._safeWriteBase(targetFile, content, (File), f, content);
    f.writeAsString(content, flush, true),
        verifyJson;
    verifyJson;
    ;
}
Promise < File > safeWriteAsBytes(targetFile, File, content, number[], { boolean, verifyJson: false });
async;
{
    return this._safeWriteBase(targetFile, content, (File), f, content);
    f.writeAsBytes(content, flush, true),
        verifyJson;
    verifyJson;
    ;
}
//# sourceMappingURL=io.js.map