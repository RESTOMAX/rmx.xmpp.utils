import { rmxIntf } from './xmpp-rmx-interfaces';

///   ..................................................................................................................
///   ..................................................................................................................
///   ..................................................................................................................
/**
 * QueueManager
 */
export class QueueManager implements rmxIntf.IxmppQueueManager {
    RPCCallID: Array<rmxIntf.IxmppCall>;

    set(xmppCall: rmxIntf.IxmppCall): number {
        this.RPCCallID.push(xmppCall);
        return this.RPCCallID.length-1;
    };

    get(index: number): rmxIntf.IxmppCall {
        if(!this.RPCCallID[index]) return null;
        let result: rmxIntf.IxmppCall = JSON.parse(JSON.stringify(this.RPCCallID[index]));
        this.RPCCallID.splice(index,1);
        return result;
    };

    cancel(index: number): void {
        if(!this.RPCCallID[index]) return;
        this.RPCCallID.splice(index,1);
    }

    clear(): void {
        this.RPCCallID.splice(0);
    };
}