export namespace rmxIntf {
  // ..................................................................................................................
  /**
   * IxmppRmxConnectParams
   */
  export interface IxmppRmxConnectParams {
    jid: string;
    login: string;
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
    parse(rawMessage: string): boolean;
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
