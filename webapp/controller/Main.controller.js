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

            oRouter.getRoute("RouteMain").attachMatched(this._onRouteMatched, this);

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        onNavBack: function () {
            history.go(-1);
        },
        onNextPage: async function () {

            let oViewModel = this.getModel("viewModel"),
                oDocYear = this.getView().byId("initialPageCountingYearInput").getValue(),
                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oLgnum = oViewModel.getProperty("/Lgnum");
            if (oDocNumber && oDocYear) {
                sap.ui.core.BusyIndicator.show(0);
                let fnSuccess = (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    let oMessage = oData.Message,
                        messageType = oData.Type;
                    if (oMessage && messageType === "E") { // if (message && messageType === "E")
                        this._showMessageBox(oMessage, messageType, true);
                    } else {
                        this._getCounting(oDocYear, oDocNumber, oLgnum);
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

        },

        _countingCheck: function (oDocYear, oDocNumber, oLgnum) {
            let oModel = this.getModel();

            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/CountingCheckSet", {
                        IvDocNumber: oDocNumber,
                        IvDocYear: oDocYear,
                        IvLgnum: oLgnum
                    });
                oModel.read(sPath, oParams);
            });
        },
        _getCounting: async function (oDocYear, oDocNumber, oLgnum) {
            let oViewModel = this.getModel("viewModel"),
                fnSuccess = (oData) => {
                    oViewModel.setProperty("/DetailData", oData.to_items.results);
                    let oMessage = oData.to_return.Message,
                        messageType = oData.to_return.Type;
                    if (oMessage && messageType === "E") {
                        this._showMessageBox(oMessage, messageType, true);
                    } else {
                        this.getRouter().navTo("detail");
                    }
                },
                fnError = (err) => { },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };
            await this._getCountingData(oDocYear, oDocNumber, oLgnum)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);
        },
        _getCountingData: async function (oDocYear, oDocNumber, oLgnum) {
            let oModel = this.getModel();
            let oEntry = {
                IvDocNumber: oDocNumber,
                IvDocYear: oDocYear,
                IvLgnum: oLgnum
            }
            oEntry.to_items = [];
            oEntry.to_return = {};
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.create("/CountingGetHeaderSet", oEntry, oParams);
            });
        }



    });
});