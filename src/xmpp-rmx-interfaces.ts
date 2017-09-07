export namespace rmxIntf {
  // ..................................................................................................................
  /**
   * IxmppRmxConnectParams
   */
  export interface IxmppRmxConnectParams {
    jid: string;
    login?: string;
    password: string;
    resource: string;
    transport: string;
    server: string;
    timeout?: number;
    wsURL: string;
    sasl: Array<string>;
  }

  // ..................................................................................................................
  /**
   * IxmppRmxMessage
   */
  export interface IxmppRmxMessageIn {
    from: string;
    cmd: string;
    to: string;
    data: string;
    dataFmt: String;
    dataJson: any;
    params: any;
    rawparams?: any;
    requestParams?: any;
    parse(rawMessage: string): boolean;
  }

  // ..................................................................................................................
  /**
   * IxmppRmxMessage
   */
  export interface IxmppRmxMessageParams {
    Param?: string;
    MSG: string;
    IID: string;
    Staff: string;
    PK: string;
    L: string;
    E: string;
    M: string;
    Fmt: string;
    D1: string;
    D2: string;
    CMAXNum: string;
    UserAgent: string;
    Ver: string;
  }

  // ..................................................................................................................
  /**
   * IxmppCall
   */
  export interface IxmppCall {
    Params: Object;
    Cmd: string;
    StartDte: Date;
    RequestParams?: any;
  }

  // ..................................................................................................................
  /**
   * IxmppQueueManager
   */
  export interface IxmppQueueManager {
    RPCCallID: Array<IxmppCall>;
    set(xmppCall: IxmppCall): number;
    get(index: number): IxmppCall;
    remove(n: number): void;
    clear(): void;
  }

  // ..................................................................................................................
  /**
   * IxmppRmxMessageOut
   */
  export interface IxmppRmxMessageOut {
    to: string;
    body: string;
    buildMediatorHelo(Mediator: any, My: string): void;
    buildMediatorCmd(Mediator: any, Cmd: string, My: string): void;
    }
}
