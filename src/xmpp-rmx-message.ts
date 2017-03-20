import { rmxUtils } from './xmpp-rmx-utils';
import { rmxIntf } from './xmpp-rmx-interfaces';

export namespace rmxMsg {
  
  ///   ..................................................................................................................
  ///   ..................................................................................................................
  ///   ..................................................................................................................
  /**
   * XmppRmxMessage
   */
  export class XmppRmxMessage implements rmxIntf.IxmppRmxMessage {
    
    private static reSplit   = /(<)([^?>]*)(>)/g;
    private static reXMLData = /<\?TXT>|<\?JSON>|<\?XML>/i;
    
    public from: string;
    public cmd: string;
    public to: string;
    public isValid: boolean;
    public dataFmt: string;
    public data: string;
    public params    = {};
    public rawparams = {};
    
    /// ..................................................................................................................
    /**
     * constructor
     * @param rawMessage
     */
    constructor(rawMessage: string) {
      this.parse(rawMessage);
    }
    
    /// ..................................................................................................................
    /**
     * parse rawMessage <x><x><x>....<?xxx>yyyyy
     * @param rawMessage
     * @returns {boolean}
     */
    public parse(rawMessage: string): boolean {
      
      this.from      = null;
      this.cmd       = null;
      this.to        = null;
      this.params    = {};
      this.rawparams = {};
      
      this.dataFmt   = null;
      this.data      = null;
      
      this.isValid   = false;
      
      if (!rawMessage || 0 === rawMessage.length) {
        this.data = 'Empty Msg';
        return false;
      }
      
      let MsgDataFmt = null;
      let MsgData    = null;
      let match = XmppRmxMessage.reXMLData.exec(rawMessage);
      if (match) {
        MsgDataFmt   = rawMessage.substr(match.index + 2, match[0].length - 3);
        MsgData      = rawMessage.substr(match.index + match[0].length);
        rawMessage   = rawMessage.substr(0, match.index);
      }
      
      // To use RegEx group[2] (<)(data)(>)
      if (match = XmppRmxMessage.reSplit.exec(rawMessage)) {
        this.to = match[2].toLowerCase();
      } else {
        this.data = 'Missing Msg <To>';
        return false;
      }
      
      // Cmd
      if (match = XmppRmxMessage.reSplit.exec(rawMessage)) {
        this.cmd = match[2].toUpperCase();
      } else {
        this.data = 'Missing Msg <cmd>';
        return false;
      }
      
      // From
      if (match = XmppRmxMessage.reSplit.exec(rawMessage)) {
        this.from = match[2].toLowerCase();
      } else {
        this.data = 'Missing Msg <From>';
        return false;
      }
      
      // Misc Params key:value
      let cnt = 0;
      while (match = XmppRmxMessage.reSplit.exec(rawMessage)) {
        const s = match[2].indexOf(':');
        if (s >= 1) {
          const key        = match[2].substr(0, s);
          this.params[key] = match[2].substr(s + 1);
        } else {
          const key           = (cnt++).toString();
          this.rawparams[key] = match[2];
        }
      }
      
      if (this.cmd === 'ERROR') {
        //console.log(this.params)
        this.data    = MsgData || 'Error : ' + this.params['M'] + ' Code : ' + this.params['E'];
        this.dataFmt = MsgDataFmt || 'TXT';
        return false;
      }
      
      if (!MsgData) {
        this.data    = rawMessage + ' Received:' + Date.now().toString();
        this.dataFmt = 'TXT';
        this.isValid = false;
        return false;
      }
    
      this.data    = MsgData || 'Error';
      this.dataFmt = MsgDataFmt || 'TXT';
      this.isValid = true;
      return this.isValid;
    };
  }
  
  ///   ..................................................................................................................
  ///   ..................................................................................................................
  ///   ..................................................................................................................
  /**
   * XmppRmxMessageOut
   */
  export class XmppRmxMessageOut implements rmxIntf.IxmppRmxMessageOut {
    
    public to: string;
    public body: string;
    
    public static addParam(key: string, val: string): string {
      if (!val || val.length <= 0) {
        return '';
      }
      return '<' + key + ':' + val + '>';
    }
    
    public static addDateParam(key: string, val:  Date ): string {
      if (!val || val.getFullYear() <= 0) {
        return '';
      }
      const d = rmxUtils.dte2YYYYMMDD(val);
      if (!d || d <= 0) {
        return '';
      }
      return '<' + key + ':' + d.toString() + '>';
    }
    
    public static addPeriodeParam(key1: string, val1:  Date, key2: string, val2:  Date): string {
      if (!val1 || val1.getFullYear() <= 0) {
        return '';
      }
      const d1 = rmxUtils.dte2YYYYMMDD(val1);
      const d2 = rmxUtils.dte2YYYYMMDD(val2);
      if (!d1 || d1 <= 0) {
        return '';
      }
      if (!d2 || d2 <= d1) {
        return '<' + key1 + ':' + d1.toString() + '>';
      }
      return '<' + key1 + ':' + d1.toString() + '><' + key2 + ':' + d2.toString() + '>';
    }
    
    public buildCmd(desti: string, cmd: string, My: string): void {
      
      // send cmd to desti
      this.to = desti;
      
      this.body = '<' + this.to + '>';
      this.body += '<' + cmd + '>';
      this.body += '<' + My + '>';
    }
    
    public buildMediatorHelo(Mediator: any, My: string): void {
      
      // send helo to ALL mediator
      this.to = (Mediator ? Mediator.bare : 'mediator@vpn.restomax.com');
      
      this.body = '<';
      this.body += (Mediator ? Mediator.bare : 'mediator') + '>';
      this.body += '<MEDIATOR_HELO>';
      this.body += '<' + My + '>';
    }
    
    public buildMediatorCmd(Mediator: any, Cmd: string, My: string): void {
      
      // send cmd to MY mediator
      this.to = (Mediator ? Mediator.full : 'mediator@vpn.restomax.com');
      
      this.body = '<';
      this.body += (Mediator ? Mediator.bare : 'mediator') + '>';
      this.body += '<' + (Cmd ? Cmd : 'ASK_VIEW') + '>';
      this.body += '<' + My + '>';
    }
  }
}

