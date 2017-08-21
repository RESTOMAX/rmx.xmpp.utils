export var rmxUtils;
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
})(rmxUtils || (rmxUtils = {}));
//# sourceMappingURL=xmpp-rmx-utils.js.map