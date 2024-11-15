sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, UIComponent, mobileLibrary, MessageBox, MessageToast) {
    "use strict";



    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;



    return Controller.extend("com.eren.counting.controller.BaseController", {
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },



        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },



        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },



        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },



        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */



        _showMessageBox: function (message, messageType) {
            if (messageType === "S") {
                MessageBox.success(message);
                return;
            } else {
                MessageBox.error(message);
                return;
            }
        },

        getRead: function (sSet, oModel) {
            return new Promise(function (fnSuccess, fnReject) {
                const mParameters = {
                    success: fnSuccess,
                    error: fnReject
                };
                oModel.read(sSet, mParameters);
            });
        },




        _focusOnInput: function (id) {
            let oView = this.getView();
            oView.byId(id).focus();
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
        _getCounting: async function (oDocYear, oDocNumber, oLgnum, bDetail) {
            let oViewModel = this.getModel("viewModel"),
                fnSuccess = (oData) => {
                    oViewModel.setProperty("/DetailData", oData.to_items.results);
                    let oMessage = oData.to_return.Message,
                        messageType = oData.to_return.Type;
                    if (oMessage && messageType === "E") {
                        if (bDetail) {
                            this.getRouter().navTo("RouteMain", {});
                        }
                        this._showMessageBox(oMessage, messageType);
                    } else {
                        if (bDetail) {
                            let oObject = oViewModel.getProperty("/DetailData");
                            if (!oObject) {
                                return;
                            }
                            if (oObject.length === 1) {
                                oViewModel.setProperty("/Lgpla", oObject[0].LocParentLgpla);
                            }
                            oViewModel.setProperty("/LgplaList", oObject);
                        } else {
                            this.getRouter().navTo("detail");
                        }

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