"use strict";
exports.__esModule = true;
var xmpp_rmx_utils_1 = require("./xmpp-rmx-utils");
var rmxMsg;
(function (rmxMsg) {
    ///   ..................................................................................................................
    ///   ..................................................................................................................
    ///   ..................................................................................................................
    /**
     * XmppRmxMessage
     */
    var XmppRmxMessageIn = (function () {
        /// ..................................................................................................................
        /**
         * constructor
         * @param rawMessage
         */
        function XmppRmxMessageIn(rawMessage) {
            this.params = {};
            this.rawparams = {};
            this.parse(rawMessage);
        }
        /// ..................................................................................................................
        /**
         * parse rawMessage <x><x><x>....<?xxx>yyyyy
         * @param rawMessage
         * @returns {boolean}
         */
        XmppRmxMessageIn.prototype.parse = function (rawMessage) {
            this.from = null;
            this.cmd = null;
            this.to = null;
            this.params = {};
            this.rawparams = {};
            this.dataFmt = null;
            this.data = null;
            this.isValid = false;
            if (!rawMessage || 0 === rawMessage.length) {
                this.data = 'Empty Msg';
                return false;
            }
            var MsgDataFmt = null;
            var MsgData = null;
            var match = XmppRmxMessageIn.reXMLData.exec(rawMessage);
            if (match) {
                MsgDataFmt = rawMessage.substr(match.index + 2, match[0].length - 3);
                MsgData = rawMessage.substr(match.index + match[0].length);
                rawMessage = rawMessage.substr(0, match.index);
            }
            // To use RegEx group[2] (<)(data)(>)
            if (match = XmppRmxMessageIn.reSplit.exec(rawMessage)) {
                this.to = match[2];
            }
            else {
                this.data = 'Missing Msg <To>';
                return false;
            }
            // Cmd
            if (match = XmppRmxMessageIn.reSplit.exec(rawMessage)) {
                this.cmd = match[2];
            }
            else {
                this.data = 'Missing Msg <cmd>';
                return false;
            }
            // From
            if (match = XmppRmxMessageIn.reSplit.exec(rawMessage)) {
                this.from = match[2];
            }
            else {
                this.data = 'Missing Msg <From>';
                return false;
            }
            // Misc Params key:value
            var cnt = 0;
            while (match = XmppRmxMessageIn.reSplit.exec(rawMessage)) {
                var s = match[2].indexOf(':');
                if (s >= 1) {
                    var key = match[2].substr(0, s);
                    this.params[key] = match[2].substr(s + 1);
                }
                else {
                    var key = (cnt++).toString();
                    this.rawparams[key] = match[2];
                }
            }
            if (this.cmd === 'ERROR' || this.cmd === 'PEERERROR') {
                //console.log(this.params)
                this.data = MsgData || 'Error : ' + this.params['M'] + ' Code : ' + this.params['E'];
                this.dataFmt = MsgDataFmt || 'TXT';
                return false;
            }
            if (!MsgData) {
                this.data = rawMessage + ' Received:' + Date.now().toString();
                this.dataFmt = 'TXT';
                this.isValid = false;
                return false;
            }
            this.data = MsgData || 'Error';
            this.dataFmt = MsgDataFmt || 'TXT';
            this.isValid = true;
            return this.isValid;
        };
        ;
        return XmppRmxMessageIn;
    }());
    XmppRmxMessageIn.reSplit = /(<)([^?>]*)(>)/g;
    XmppRmxMessageIn.reXMLData = /<\?TXT>|<\?JSON>|<\?XML>/i;
    rmxMsg.XmppRmxMessageIn = XmppRmxMessageIn;
    ///   ..................................................................................................................
    ///   ..................................................................................................................
    ///   ..................................................................................................................
    /**
     * XmppRmxMessageOut
     */
    var XmppRmxMessageOut = (function () {
        function XmppRmxMessageOut() {
        }
        XmppRmxMessageOut.prototype.addParam = function (key, val) {
            if (!val || val.length <= 0)
                return;
            this.body += '<' + key + ':' + val + '>';
        };
        XmppRmxMessageOut.prototype.addDateParam = function (key, val) {
            if (!val || val.getFullYear() <= 0)
                return;
            var d = xmpp_rmx_utils_1.rmxUtils.dte2YYYYMMDD(val);
            if (!d || d <= 0)
                return;
            this.body += '<' + key + ':' + d.toString() + '>';
        };
        XmppRmxMessageOut.prototype.addPeriodeParam = function (key1, val1, key2, val2) {
            if (!val1 || val1.getFullYear() <= 0)
                return;
            var d1 = xmpp_rmx_utils_1.rmxUtils.dte2YYYYMMDD(val1);
            var d2 = xmpp_rmx_utils_1.rmxUtils.dte2YYYYMMDD(val2);
            if (!d1 || d1 <= 0)
                return;
            if (!d2 || d2 <= d1) {
                this.body += '<' + key1 + ':' + d1.toString() + '>';
            }
            this.body += '<' + key1 + ':' + d1.toString() + '><' + key2 + ':' + d2.toString() + '>';
        };
        XmppRmxMessageOut.prototype.buildCmd = function (desti, cmd, My) {
            // send cmd to desti
            this.to = desti;
            this.body = '<' + this.to + '>';
            this.body += '<' + cmd + '>';
            this.body += '<' + My + '>';
        };
        XmppRmxMessageOut.prototype.buildMediatorHelo = function (Mediator, My) {
            // send helo to ALL mediator
            this.to = (Mediator && Mediator.bare ? Mediator.bare : 'mediator@vpn.restomax.com');
            this.body = '<' + (Mediator && Mediator.bare ? Mediator.bare : 'mediator') + '>';
            this.body += '<MEDIATOR_HELO>';
            this.body += '<' + My + '>';
        };
        XmppRmxMessageOut.prototype.buildLoginCreator = function (Mediator, My, Sender) {
            // send helo to ALL mediator
            this.to = (Mediator && Mediator.full ? Mediator.full : 'mediator@vpn.restomax.com');
            this.body = '<' + (Mediator && Mediator.full ? Mediator.full : 'mediator') + '>';
            this.body += '<CJL>';
            this.body += '<' + Sender + '>';
            this.body += '<p:' + My + '>';
        };
        XmppRmxMessageOut.prototype.buildMediatorCmd = function (Mediator, Cmd, My) {
            // send cmd to MY mediator
            this.to = (Mediator && Mediator.full ? Mediator.full : 'mediator@vpn.restomax.com');
            this.body = '<' + (Mediator && Mediator.full ? Mediator.full : 'mediator') + '>';
            this.body += '<' + (Cmd ? Cmd : 'ASK_VIEW') + '>';
            this.body += '<' + My + '>';
        };
        return XmppRmxMessageOut;
    }());
    rmxMsg.XmppRmxMessageOut = XmppRmxMessageOut;
})(rmxMsg = exports.rmxMsg || (exports.rmxMsg = {}));
//# sourceMappingURL=xmpp-rmx-message.js.map