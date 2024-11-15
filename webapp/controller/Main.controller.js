sap.ui.define([
    "./BaseController",
    "../model/formatter",
], function (BaseController, formatter) {
    "use strict";

    return BaseController.extend("com.eren.counting.controller.Main", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oRouter = this.getRouter();

            oRouter.getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onNavBack: function () {
            history.go(-1);
        },
        onNextPage: async function () {

            let oViewModel = this.getModel("viewModel"),
               // oDocYear = this.getView().byId("initialPageCountingYearInput").getValue(),
                oDocYear = "",
                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oLgnum = oViewModel.getProperty("/Lgnum");
            if (oDocNumber) {
                sap.ui.core.BusyIndicator.show(0);
                let fnSuccess = (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    let oMessage = oData.Message,
                        messageType = oData.Type;
                    if (oMessage && messageType === "E") { // if (message && messageType === "E")
                        this._showMessageBox(oMessage, messageType);
                    } else {
                        this._getCounting(String(oDocYear), oDocNumber, oLgnum);
                    }

                },
                    fnError = (err) => { },
                    fnFinally = () => {
                        oViewModel.setProperty("/busy", false);
                        sap.ui.core.BusyIndicator.hide();
                    };
                await this._countingCheck(oDocYear, oDocNumber, oLgnum)
                    .then(fnSuccess)
                    .catch(fnError)
                    .finally(fnFinally);
            }
        },
        onChangeDate: async function () {
            let oViewModel = this.getModel("viewModel"),
                oDocYear = this.getView().byId("initialPageCountingYearInput").getValue(),
                oDocNumber = oViewModel.getProperty("/DocNumber");
            oViewModel.setProperty("/DocYearD", oDocYear);
            if (oDocNumber && oDocYear) {
                this.onNextPage();

            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onRouteMatched: function (oEvent) {
            jQuery.sap.delayedCall(200, this, function () {
                this._focusOnInput('initialPageCountingDocumentInput');
            });
            debugger;
            this.getModel("viewModel").setProperty("/DocNumber", "");

        }


    });
});