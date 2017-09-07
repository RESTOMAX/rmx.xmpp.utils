import { Subject } from 'rxjs/Subject';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import * as stanzaio from 'stanza.io';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/share';
import { rmxMsg } from './xmpp-rmx-message';
import { QueueManager } from './xmpp-rmx-queue';
import { rmxIntf } from './xmpp-rmx-interfaces';

/// we inherit from the ordinary Subject
export class XmppWebsocket extends Subject<rmxMsg.XmppRmxMessageIn> {

  public static readonly statusDesc = {
    '-10': 'LoginCreatorError'
    , '-9': 'Error'
    , '-1': 'AuthError'
    , '0': 'Disconnected'
    , '1': 'Connected'
    , '2': 'Session Started'
    , '3': 'Wait Mediator'
    , '4': 'Mediator OK'
    , '5': 'Jabber Login as created'
  };

  public xmppStatus = 0;
  private xmppClient: any = null;
  private xmppMediator: any = null;
  private jabberLoginCreating: boolean = false;
  private reconnectInterval = 10000;  /// pause between connections
  private reconnectAttempts = 5;     /// number of connection attempts
  private reconnectionObservable: Observable<number> = null;
  private connectionObserver: Observer<number>;
  public connectionStatus: Observable<number>;
  private connectionStatusSubs: any;
  private xmppParam: rmxIntf.IxmppRmxConnectParams;
  private defaultXmppParam: rmxIntf.IxmppRmxConnectParams;
  private currentXmppParam: rmxIntf.IxmppRmxConnectParams;
  private queueManager: rmxIntf.IxmppQueueManager;
  private hasBeenLogged: boolean = false;

  /// ..................................................................................................................
  constructor() {
    super();
    //console.log('XmppWebsocket Create');
    /// connection status
    this.connectionStatus = new Observable<number>((observer) => {
      this.connectionObserver = observer;
    }).share().distinctUntilChanged();
    this.queueManager = new QueueManager();
  }
  /// ..................................................................................................................
  /**
   * create and connect
   */
  public init(xmppParam: rmxIntf.IxmppRmxConnectParams, defaultXmppParam: rmxIntf.IxmppRmxConnectParams): void {
    // already started
    this.defaultXmppParam = defaultXmppParam;
    this.xmppParam = xmppParam;
    this.currentXmppParam = xmppParam;
    

    /// create stanza.io xmppClient and map event to myself
    /// we follow the connection status and run the reconnect while losing the connection
    this.CreateStanzioClient(this.currentXmppParam);

    this.connectionStatusSubs = this.connectionStatus.subscribe(() => {
      if ((!this.reconnectionObservable) && (this.xmppStatus === 0) && (!this.jabberLoginCreating) && (this.hasBeenLogged)) {
        this.reconnect();
      } 
      else if ((!this.reconnectionObservable) && (this.xmppStatus === 0) && (!this.jabberLoginCreating) && (!this.hasBeenLogged)) {
        this.CreateStanzioClient(this.xmppParam);
      } 
      else if ((!this.reconnectionObservable) && (this.xmppStatus === 0) && (this.jabberLoginCreating)) {
        //console.log('Start To create a new JabberLogin');
        this.CreateStanzioClient(this.defaultXmppParam);
      } 
      else if ((!this.reconnectionObservable) && (this.xmppStatus === -1) && (!this.jabberLoginCreating)) {
        // AuthError, we create new login
        this.jabberLoginCreating = true;
        this.xmppClient.disconnect();
      } 
      else if ((!this.reconnectionObservable) && (this.xmppStatus === 4) && (this.jabberLoginCreating)) {
        //console.log('Send request to create Jabber Login');
        this.sendLoginCreator();
      } 
      else if ((!this.reconnectionObservable) && (this.xmppStatus === 4) && (!this.jabberLoginCreating)) {
        console.info('Conneced and XMPP session is opened');
        this.hasBeenLogged = true;
      } 
      else if ((!this.reconnectionObservable) && (this.xmppStatus === 5)) {
        console.info('JabberLogin Created');
        this.jabberLoginCreating = false;
        this.xmppClient.disconnect();
      }
      if ((!this.reconnectionObservable) && (this.xmppStatus === -9) && (!this.jabberLoginCreating)) {
        this.hasBeenLogged = false;
        this.reconnect();
      }
    });
  }

  private CreateStanzioClient(params: rmxIntf.IxmppRmxConnectParams) {
    if (this.xmppClient) {
      this.xmppClient = null;
      delete this.xmppClient;
      this.currentXmppParam = params;
    }

    this.xmppClient = stanzaio.createClient(this.currentXmppParam);
    this.xmppClient.on('connected', (e, err) => {
      console.info('XmppWebsocket:connected: ' + this.currentXmppParam.jid);
      this.SetXmppStatus(1);
    });
    this.xmppClient.on('auth:failed', () => {
      console.warn('XmppWebsocket:auth:failed: ' + this.currentXmppParam.jid);
      this.SetXmppStatus(-1);
    });
    this.xmppClient.on('auth:success', () => {
      //console.log('XmppWebsocket:auth:success: ' + this.currentXmppParam.jid);
      this.SetXmppStatus(1);
    });
    this.xmppClient.on('session:started', () => {
      console.info('XmppWebsocket:session:started: ' + this.currentXmppParam.jid);
      this.xmppClient.getRoster();
      this.xmppClient.sendPresence();
      this.SetXmppStatus(2);
      this.helo2Mediator();
    });
    this.xmppClient.on('disconnected', (e, err) => {
      //console.log('XmppWebsocket:disconnected: ' + this.currentXmppParam.jid);
      if (e) console.warn(e);
      if (err) console.error(err);
      this.SetXmppStatus(0);
    });
    this.xmppClient.on('raw:incoming', function (xml) {
      //console.log('raw:incoming');
      //console.log(xml);
    });
    this.xmppClient.on('raw:outgoing', function (xml) {
      //console.log('raw:outgoing');
      //console.log(xml);
    });
    this.xmppClient.on('message', (message) => {
      //console.log(message);
      const s: string = message.body;
      //console.log(s);
      let msg = new rmxMsg.XmppRmxMessageIn(s);
      //console.log('XmppWebsocket:message: ' + JSON.stringify(msg));
      if (msg.cmd === 'MEDIATOR_OK' || (msg.cmd === 'PEERERROR' && msg.params['E'] === '2001')) {
        this.xmppMediator = message.from;
        this.SetXmppStatus(4);
        return;
      }
      else if (msg.cmd === 'ANSWER' && this.jabberLoginCreating) {
        this.xmppMediator = message.from;
        this.SetXmppStatus(5);
        return;
      }
      else if (msg.cmd === 'ANSWER') {
        // remove from waiting queue
        msg.requestParams = this.queueManager.get(parseInt(msg.dataJson.Q));
      }
      this.next(msg);
    });

    /// we connect
    console.info('XmppWebsocket Created => Connect');
    this.connect();
  }

  /// ..................................................................................................................
  private SetXmppStatus(Value: number): void {
    if (this.xmppStatus !== Value) {
      //console.log('XMPP Status ', this.xmppStatus, '=>', Value, XmppWebsocket.statusDesc[Value]);
      this.xmppStatus = Value;
      this.connectionObserver.next(Value);
    } else {
      //console.log('XMPP Stay in Status ', Value);
    }
  };
  private getMyFullName(): string {
    return this.currentXmppParam.jid + '/' + this.currentXmppParam.resource;
  }
  private connect(): void {
    //console.log('XmppWebsocket:connect');
    try {
      this.xmppClient.connect();
    } catch (err) {
      /// in case of an error with a loss of connection, we restore it
      console.error('XmppWebsocket:error:' + err);
      this.SetXmppStatus(-9);
    }
  };
  private reconnect(): void {
    //console.log('XmppWebsocket:reconnect subscribe', this.xmppStatus);
    this.reconnectionObservable = Observable.interval(this.reconnectInterval)
      .takeWhile((v, index) => {
        //console.log('reconnectionObservable.takeWhile Idx:', index, ' xmppStatus:', this.xmppStatus);
        return (index < this.reconnectAttempts) && (this.xmppStatus <= 0);
      });
    this.reconnectionObservable.subscribe(
      () => {
        //console.log('reconnectionObservable.Tick');
        this.connect();
      },
      (error) => {
        console.error('reconnectionObservable.Error', error);
      },
      () => {
        //console.warn('reconnectionObservable:completed', this.xmppStatus);
        /// release reconnectionObservable. so can start again after next disconnect !
        this.reconnectionObservable = null;
        if (this.xmppStatus <= 0) {
          /// if the ALL reconnection attempts are failed, then we call complete of our Subject and status
          //console.error('XmppWebsocket:NO WAY TO Connect');
          this.SetXmppStatus(-9);
          //this.connectionObserver.complete();
          //this.complete();
        }
      }
    );
  };

  /// ..................................................................................................................
  /**
   * get queue element infos
   */
  public getQueueInf(index:number): any {
    return this.queueManager.get(index);
  }
  /// ..................................................................................................................
  /**
   * send Helo to desti
   */
  public helo(desti: string): void {
    //console.log('XmppWebsocket:helo', this.xmppStatus);
    try {
      const my = this.getMyFullName();
      const msg = new rmxMsg.XmppRmxMessageOut();
      msg.buildCmd(desti || my, 'HELO', my);
      this.xmppClient.sendMessage(msg);
    } catch (err) {
      /// in case of an error with a loss of connection, we restore it
      console.error('XmppWebsocket:helo:error:' + err);
    }
  };

  /**
   * send cmd to desti
   * @param desti
   * @param cmd
   * @param data
   */
  public sendMsg(cmd: string, params: Object, dates: Object, requestParams?: any): Promise<Number> {
    //console.log('XmppWebsocket:sendMsg', this.xmppStatus);
    let queueIndex = 0;

    return new Promise((resolve, reject) => {
      try {
        const my = this.getMyFullName();
        const msg = new rmxMsg.XmppRmxMessageOut();
        msg.buildCmd(this.xmppMediator.full || my, cmd, my);
        // list and add request params
        for (let key in params) {
          msg.addParam(key, params[key]);
        }
        // list and add request dates
        for (let key in dates) {
          msg.addDateParam(key, dates[key]);
        }
        // add L and queue number to request
        queueIndex = this.queueManager.set({Cmd: cmd, Params: params, StartDte: new Date(), RequestParams: requestParams});
        msg.addParam('L', '1');
        msg.addParam('Q', queueIndex.toString());
        // send request
        this.xmppClient.sendMessage(msg);
        resolve(queueIndex);
      } catch (err) {
        /// in case of an error with a loss of connection, we restore it
        console.error('XmppWebsocket:sendMsg:error:' + err);
        this.SetXmppStatus(-9);
        reject('XmppWebsocket:sendMsg:error:' + err);
      }
    });
  };

  /**
   * ask wanted view via xmpp message to mediator
   */
  public helo2Mediator(): void {
    //console.log('XmppWebsocket:helo2Mediator', this.xmppStatus);
    try {
      const msg = new rmxMsg.XmppRmxMessageOut();
      msg.buildMediatorHelo(this.xmppMediator, this.getMyFullName());
      this.xmppClient.sendMessage(msg);
    } catch (err) {
      /// in case of an error with a loss of connection, we restore it
      console.error('XmppWebsocket:helo2Mediator:error:' + err);
      this.SetXmppStatus(-9);
    }
  };


  /**
   * ask wanted view via xmpp message to mediator
   * @param cmd
   * @param data
   */
  public sendMsg2Mediator(cmd: string, data: string): void {
    //console.log('XmppWebsocket:sendMsg2Mediator', this.xmppStatus);
    try {
      const msg = new rmxMsg.XmppRmxMessageOut();
      msg.buildMediatorCmd(this.xmppMediator, cmd, this.getMyFullName());
      msg.body += data;
      this.xmppClient.sendMessage(msg);
    } catch (err) {
      /// in case of an error with a loss of connection, we restore it
      console.error('XmppWebsocket:sendMsg2Mediator:error:' + err);
      this.SetXmppStatus(-9);
    }
  };


  public sendLoginCreator(): void {
    //console.log('XmppWebsocket:sendLoginCreator', this.xmppStatus);
    try {
      const msg = new rmxMsg.XmppRmxMessageOut();
      msg.buildLoginCreator(this.xmppMediator, this.xmppParam.jid, this.getMyFullName());
      this.xmppClient.sendMessage(msg);
    } catch (err) {
      /// in case of an error with a loss of connection, we restore it
      console.error('XmppWebsocket:sendLoginCreator:error:' + err);
      this.SetXmppStatus(-10);
    }
  };
}
