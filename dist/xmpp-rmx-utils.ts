export namespace rmxUtils {

  export function dte2YYYYMMDD( val: Date ): number {
     if (!val) {
        return 0;
        }
     const yyyy = val.getFullYear();
     const mm = val.getMonth() + 1;
     const dd = val.getDate();
     return yyyy * 10000 + mm * 100 + dd;
    }
}
