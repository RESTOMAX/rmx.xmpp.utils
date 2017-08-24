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
    params: any;
    rawparams?: any;
    parse(rawMessage: string): boolean;
  }

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
   * IxmppRmxMessageOut
   */
  export interface IxmppRmxMessageOut {
    to: string;
    body: string;
    buildMediatorHelo(Mediator: any, My: string): void;
    buildMediatorCmd(Mediator: any, Cmd: string, My: string): void;
    }
}
