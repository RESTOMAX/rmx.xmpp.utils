///   ..................................................................................................................
///   ..................................................................................................................
///   ..................................................................................................................
/**
 * QueueManager
 */
var QueueManager = (function () {
    function QueueManager() {
        this.RPCCallID = [];
    }
    QueueManager.prototype.set = function (xmppCall) {
        this.RPCCallID.push(xmppCall);
        return this.RPCCallID.length - 1;
    };
    ;
    QueueManager.prototype.get = function (index) {
        if (!this.RPCCallID[index])
            return null;
        return this.RPCCallID[index];
    };
    ;
    QueueManager.prototype.cancel = function (index) {
        if (!this.RPCCallID[index])
            return;
        this.RPCCallID.splice(index, 1);
    };
    QueueManager.prototype.clear = function () {
        this.RPCCallID.splice(0);
    };
    ;
    return QueueManager;
}());
export { QueueManager };
//# sourceMappingURL=xmpp-rmx-queue.js.map