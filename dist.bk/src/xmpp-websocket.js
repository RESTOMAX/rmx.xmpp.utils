"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Subject_1 = require("rxjs/Subject");
var Observable_1 = require("rxjs/Observable");
var stanzaio = require("stanza.io");
require("rxjs/add/observable/interval");
require("rxjs/add/operator/takeWhile");
require("rxjs/add/operator/distinctUntilChanged");
require("rxjs/add/operator/share");
var xmpp_rmx_message_1 = require("./xmpp-rmx-message");
/// we inherit from the ordinary Subject
var XmppWebsocket = (function (_super) {
    __extends(XmppWebsocket, _super);
    /// ..................................................................................................................
    function XmppWebsocket() {
        var _this = _super.call(this) || this;
        _this.xmppStatus = 0;
        _this.xmppClient = null;
        _this.xmppMediator = null;
        _this.jabberLoginCreating = false;
        _this.reconnectInterval = 10000; /// pause between connections
        _this.reconnectAttempts = 5; /// number of connection attempts
        _this.reconnectionObservable = null;
        _this.hasBeenLogged = false;
        console.log('XmppWebsocket Create');
        /// connection status
        _this.connectionStatus = new Observable_1.Observable(function (observer) {
            _this.connectionObserver = observer;
        }).share().distinctUntilChanged();
        return _this;
    }
    /// ..................................................................................................................
    /**
     * create and connect
     */
    XmppWebsocket.prototype.init = function (xmppParam, defaultXmppParam) {
        var _this = this;
        // already started
        this.defaultXmppParam = defaultXmppParam;
        this.xmppParam = xmppParam;
        this.currentXmppParam = xmppParam;
        /// create stanza.io xmppClient and map event to myself
        /// we follow the connection status and run the reconnect while losing the connection
        this.CreateStanzioClient(this.currentXmppParam);
        this.connectionStatusSubs = this.connectionStatus.subscribe(function () {
            if ((!_this.reconnectionObservable) && (_this.xmppStatus === 0) && (!_this.jabberLoginCreating) && (_this.hasBeenLogged)) {
                _this.reconnect();
            }
            else if ((!_this.reconnectionObservable) && (_this.xmppStatus === 0) && (!_this.jabberLoginCreating) && (!_this.hasBeenLogged)) {
                _this.CreateStanzioClient(_this.xmppParam);
            }
            else if ((!_this.reconnectionObservable) && (_this.xmppStatus === 0) && (_this.jabberLoginCreating)) {
                console.log('Start To create a new JabberLogin');
                _this.CreateStanzioClient(_this.defaultXmppParam);
            }
            else if ((!_this.reconnectionObservable) && (_this.xmppStatus === -1) && (!_this.jabberLoginCreating)) {
                // AuthError, we create new login
                _this.jabberLoginCreating = true;
                _this.xmppClient.disconnect();
            }
            else if ((!_this.reconnectionObservable) && (_this.xmppStatus === 4) && (_this.jabberLoginCreating)) {
                console.log('Send request to create Jabber Login');
                _this.sendLoginCreator();
            }
            else if ((!_this.reconnectionObservable) && (_this.xmppStatus === 4) && (!_this.jabberLoginCreating)) {
                console.info('Conneced and XMPP session is opened');
                _this.hasBeenLogged = true;
            }
            else if ((!_this.reconnectionObservable) && (_this.xmppStatus === 5)) {
                console.info('JabberLogin Created');
                _this.jabberLoginCreating = false;
                _this.xmppClient.disconnect();
            }
        });
    };
    XmppWebsocket.prototype.CreateStanzioClient = function (params) {
        var _this = this;
        if (this.xmppClient) {
            this.xmppClient = null;
            delete this.xmppClient;
            this.currentXmppParam = params;
        }
        this.xmppClient = stanzaio.createClient(this.currentXmppParam);
        this.xmppClient.on('connected', function (e, err) {
            console.info('XmppWebsocket:connected: ' + _this.currentXmppParam.jid);
            _this.SetXmppStatus(1);
        });
        this.xmppClient.on('auth:failed', function () {
            console.warn('XmppWebsocket:auth:failed: ' + _this.currentXmppParam.jid);
            _this.SetXmppStatus(-1);
        });
        this.xmppClient.on('auth:success', function () {
            console.log('XmppWebsocket:auth:success: ' + _this.currentXmppParam.jid);
            _this.SetXmppStatus(1);
        });
        this.xmppClient.on('session:started', function () {
            console.info('XmppWebsocket:session:started: ' + _this.currentXmppParam.jid);
            _this.xmppClient.getRoster();
            _this.xmppClient.sendPresence();
            _this.SetXmppStatus(2);
            _this.helo2Mediator();
        });
        this.xmppClient.on('disconnected', function (e, err) {
            console.log('XmppWebsocket:disconnected: ' + _this.currentXmppParam.jid);
            if (e)
                console.warn(e);
            if (err)
                console.error(err);
            _this.SetXmppStatus(0);
        });
        this.xmppClient.on('raw:incoming', function (xml) {
            //console.log('raw:incoming');
            //console.log(xml);
        });
        this.xmppClient.on('raw:outgoing', function (xml) {
            //console.log('raw:outgoing');
            //console.log(xml);
        });
        this.xmppClient.on('message', function (message) {
            //console.log(message);
            var s = message.body;
            //console.log(s);
            var msg = new xmpp_rmx_message_1.rmxMsg.XmppRmxMessageIn(s);
            console.log('XmppWebsocket:message: ' + JSON.stringify(msg));
            if (msg.cmd === 'MEDIATOR_OK' || (msg.cmd === 'PEERERROR' && msg.params['E'] === '2001')) {
                _this.xmppMediator = message.from;
                _this.SetXmppStatus(4);
                return;
            }
            else if (msg.cmd === 'ANSWER' && _this.jabberLoginCreating) {
                _this.xmppMediator = message.from;
                _this.SetXmppStatus(5);
                return;
            }
            else if (msg.cmd === 'ANSWER') {
                ///--- TODO ---///
            }
            _this.next(msg);
        });
        /// we connect
        console.info('XmppWebsocket Created => Connect');
        this.connect();
    };
    /// ..................................................................................................................
    XmppWebsocket.prototype.SetXmppStatus = function (Value) {
        if (this.xmppStatus !== Value) {
            console.log('XMPP Status ', this.xmppStatus, '=>', Value, XmppWebsocket.statusDesc[Value]);
            this.xmppStatus = Value;
            this.connectionObserver.next(Value);
        }
        else {
            console.log('XMPP Stay in Status ', Value);
        }
    };
    ;
    XmppWebsocket.prototype.getMyFullName = function () {
        return this.currentXmppParam.jid + '/' + this.currentXmppParam.resource;
    };
    XmppWebsocket.prototype.connect = function () {
        console.log('XmppWebsocket:connect');
        try {
            this.xmppClient.connect();
        }
        catch (err) {
            /// in case of an error with a loss of connection, we restore it
            console.error('XmppWebsocket:error:' + err);
            this.SetXmppStatus(-9);
        }
    };
    ;
    XmppWebsocket.prototype.reconnect = function () {
        var _this = this;
        console.log('XmppWebsocket:reconnect subscribe', this.xmppStatus);
        this.reconnectionObservable = Observable_1.Observable.interval(this.reconnectInterval)
            .takeWhile(function (v, index) {
            console.log('reconnectionObservable.takeWhile Idx:', index, ' xmppStatus:', _this.xmppStatus);
            return (index < _this.reconnectAttempts) && (_this.xmppStatus <= 0);
        });
        this.reconnectionObservable.subscribe(function () {
            console.log('reconnectionObservable.Tick');
            _this.connect();
        }, function (error) {
            console.error('reconnectionObservable.Error', error);
        }, function () {
            console.warn('reconnectionObservable:completed', _this.xmppStatus);
            /// release reconnectionObservable. so can start again after next disconnect !
            _this.reconnectionObservable = null;
            if (_this.xmppStatus <= 0) {
                /// if the ALL reconnection attempts are failed, then we call complete of our Subject and status
                console.error('XmppWebsocket:NO WAY TO Connect');
                _this.SetXmppStatus(-9);
                _this.connectionObserver.complete();
                _this.complete();
            }
        });
    };
    ;
    /// ..................................................................................................................
    /**
     * send Helo to desti
     */
    XmppWebsocket.prototype.helo = function (desti) {
        console.log('XmppWebsocket:helo', this.xmppStatus);
        try {
            var my = this.getMyFullName();
            var msg = new xmpp_rmx_message_1.rmxMsg.XmppRmxMessageOut();
            msg.buildCmd(desti || my, 'HELO', my);
            this.xmppClient.sendMessage(msg);
        }
        catch (err) {
            /// in case of an error with a loss of connection, we restore it
            console.error('XmppWebsocket:helo:error:' + err);
        }
    };
    ;
    /**
     * send cmd to desti
     * @param desti
     * @param cmd
     * @param data
     */
    XmppWebsocket.prototype.sendMsg = function (desti, cmd, data) {
        //console.log('XmppWebsocket:sendMsg', this.xmppStatus);
        try {
            var my = this.getMyFullName();
            var msg = new xmpp_rmx_message_1.rmxMsg.XmppRmxMessageOut();
            msg.buildCmd(this.xmppMediator.full || my, cmd, my);
            msg.body += '<L:1>';
            msg.body += data;
            this.xmppClient.sendMessage(msg);
        }
        catch (err) {
            /// in case of an error with a loss of connection, we restore it
            console.error('XmppWebsocket:sendMsg:error:' + err);
            this.SetXmppStatus(-9);
        }
    };
    ;
    /**
     * ask wanted view via xmpp message to mediator
     */
    XmppWebsocket.prototype.helo2Mediator = function () {
        console.log('XmppWebsocket:helo2Mediator', this.xmppStatus);
        try {
            var msg = new xmpp_rmx_message_1.rmxMsg.XmppRmxMessageOut();
            msg.buildMediatorHelo(this.xmppMediator, this.getMyFullName());
            this.xmppClient.sendMessage(msg);
        }
        catch (err) {
            /// in case of an error with a loss of connection, we restore it
            console.error('XmppWebsocket:helo2Mediator:error:' + err);
            this.SetXmppStatus(-9);
        }
    };
    ;
    /**
     * ask wanted view via xmpp message to mediator
     * @param cmd
     * @param data
     */
    XmppWebsocket.prototype.sendMsg2Mediator = function (cmd, data) {
        console.log('XmppWebsocket:sendMsg2Mediator', this.xmppStatus);
        try {
            var msg = new xmpp_rmx_message_1.rmxMsg.XmppRmxMessageOut();
            msg.buildMediatorCmd(this.xmppMediator, cmd, this.getMyFullName());
            msg.body += data;
            this.xmppClient.sendMessage(msg);
        }
        catch (err) {
            /// in case of an error with a loss of connection, we restore it
            console.error('XmppWebsocket:sendMsg2Mediator:error:' + err);
            this.SetXmppStatus(-9);
        }
    };
    ;
    XmppWebsocket.prototype.sendLoginCreator = function () {
        console.log('XmppWebsocket:sendLoginCreator', this.xmppStatus);
        try {
            var msg = new xmpp_rmx_message_1.rmxMsg.XmppRmxMessageOut();
            msg.buildLoginCreator(this.xmppMediator, this.xmppParam.jid, this.getMyFullName());
            this.xmppClient.sendMessage(msg);
        }
        catch (err) {
            /// in case of an error with a loss of connection, we restore it
            console.error('XmppWebsocket:sendLoginCreator:error:' + err);
            this.SetXmppStatus(-10);
        }
    };
    ;
    return XmppWebsocket;
}(Subject_1.Subject));
XmppWebsocket.statusDesc = {
    '-10': 'LoginCreatorError',
    '-9': 'Error',
    '-1': 'AuthError',
    '0': 'Disconnected',
    '1': 'Connected',
    '2': 'Session Started',
    '3': 'Wait Mediator',
    '4': 'Mediator OK',
    '5': 'Jabber Login as created'
};
exports.XmppWebsocket = XmppWebsocket;
//# sourceMappingURL=xmpp-websocket.js.map