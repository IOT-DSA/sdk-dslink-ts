/// DSA Broker Server
library;
dslink.server;
import "dart:io";
"src/crypto/pk.dart";
_jsonContentType: ContentType = new ContentType("application", "json", charset, "utf-8");
updateResponseBeforeWrite(request, HttpRequest, statusCode, number = HttpStatus.OK, contentType, ContentType, noContentType, boolean = false);
{
    var response = request.response;
    if (statusCode != null) {
        response.statusCode = statusCode;
    }
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    origin: string = request.headers.value("origin");
    if (request.headers.value("x-proxy-origin") != null) {
        origin = request.headers.value("x-proxy-origin");
    }
    if (origin == null) {
        origin = "*";
    }
    response.headers.set("Access-Control-Allow-Origin", origin);
    if (!noContentType) {
        if (contentType == null) {
            contentType = this._jsonContentType;
        }
        response.headers.contentType = contentType;
    }
}
//# sourceMappingURL=server.js.map