"use strict";
exports.__esModule = true;
var rmxUtils;
(function (rmxUtils) {
    function dte2YYYYMMDD(val) {
        if (!val) {
            return 0;
        }
        var yyyy = val.getFullYear();
        var mm = val.getMonth() + 1;
        var dd = val.getDate();
        return yyyy * 10000 + mm * 100 + dd;
    }
    rmxUtils.dte2YYYYMMDD = dte2YYYYMMDD;
})(rmxUtils = exports.rmxUtils || (exports.rmxUtils = {}));
