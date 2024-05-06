sap.ui.define([
    "./BaseController",
    "../model/formatter",
    'sap/ui/Device',
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/Fragment',
    'sap/ui/model/Sorter',
    "sap/m/library",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/m/Text",
    "sap/m/TextArea"
], function (
    BaseController,
    formatter,
    Device,
    MessageBox,
    Filter,
    FilterOperator,
    Fragment,
    Sorter,
    mobileLibrary, Dialog, Button,
    Label,
    MessageToast,
    Text,
    TextArea
) {
    "use strict";

    return BaseController.extend("com.eren.counting.controller.Detail", {
        formatter: formatter,


        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            this.getRouter()
                .getRoute("detail")
                .attachMatched(this._onObjectMatched, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        onValueHelpLgpla: async function () {

            if (!this._valueHelpLgpla) {
                this._valueHelpLgpla = sap.ui.xmlfragment(
                    "com.eren.counting.view.fragment.Lgpla",
                    this
                );
                this.getView().addDependent(this._valueHelpLgpla);
            }

            //-------------------------------------------------------------//
            // open value help dialog filtered by the input value
            this._valueHelpLgpla.open();

        },
        onChangeBarcode: async function (oEvent) {
            const oModel = this.getModel(),
                oViewModel = this.getModel("viewModel");
            let oSource = oEvent.getSource().getValue(),
                oMatnr = oSource.split("|")[0],
                oCharg = (oSource.split("|")[1]) ? (oSource.split("|")[1]) : (oSource.split("|")[1] = ""),
                oLgpla = oViewModel.getData().Lgpla,
                fnSuccess = (oData) => {
                    this.getModel().refresh(true);
                    if (oData.to_returns.results.length > 0) {
                        sap.m.MessageBox.error(oData.to_returns.results[0].Message);
                    } else {
                        oViewModel.setProperty("/Owners", oData.to_items.results);
                        oViewModel.setProperty("/BarcodeForm", oData.to_items.results.at(-1));
                        let iIndex = parseInt(oData.to_items.results.at(-1).OwnerText.slice(0, 1));
                        this._setStockType(iIndex);

                    }
                    sap.ui.core.BusyIndicator.hide();
                    oViewModel.refresh(true);
                },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();

                    this._showMessage(err.responseText);
                },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };
            this._getBarcodeData(oMatnr, oCharg, oLgpla).then(fnSuccess).catch(fnError).finally(fnFinally);

        },
        onPressQuantity: async function (oEvent) {
            const oViewModel = this.getModel("viewModel");
            let oSwitchV = this.getView().byId("idSwitchInOut"),
                oLgnum = oViewModel.getProperty("/Lgnum"),
                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oDocYear = oViewModel.getProperty("/DocYearD"),
                oLgpla = oViewModel.getProperty("/Lgpla"),
                oMatnr = oViewModel.getProperty("/BarcodeForm/Matnr"),
                oCharg = oViewModel.getProperty("/BarcodeForm/Charg"),
                oMenge = oViewModel.getProperty("/Quantity"),
                oMeins = oViewModel.getProperty("/BarcodeForm/Meins"),
                oOwner = oViewModel.getProperty("/Owner");
            let oCat;
            oCat = oSwitchV.getState() === true ? oCat = oSwitchV.getCustomTextOn() : oCat = oSwitchV.getCustomTextOff();

            if (oMenge && oMatnr && oOwner) {

                sap.ui.core.BusyIndicator.show(0);
                let fnSuccess = (oData) => {
                    if (oData.Type === "E") {
                        this._showMessageBox(oData.Message, oData.Type, true);
                    } else {
                        //  this._showMessageBox(oData.Message, oData.Type, true);
                        this._clearForm("AAC"); //After Address Count
                        this._getCountingDetail();
                    }
                },
                    fnError = (err) => { },
                    fnFinally = () => {
                        oViewModel.setProperty("/busy", false);
                        sap.ui.core.BusyIndicator.hide();
                    };
                await this._addressCount(oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg, parseInt(oMenge), oMeins, oOwner, oCat)
                    .then(fnSuccess)
                    .catch(fnError)
                    .finally(fnFinally);
            }
        },
        onChangeOwner: async function (oEvent) {
            let iIndex = oEvent.getParameter("selectedItem").getProperty("text").slice(0, 1);
            this._setStockType(iIndex);

        },


        onPressDeleteItem: async function (oEvent) {
            let that = this;
            let DialogType = mobileLibrary.DialogType,
                ButtonType = mobileLibrary.ButtonType;

            let oObject = oEvent.getSource().getParent().getParent().getSelectedItem().getBindingContext("viewModel").getObject();

            if (!this.oApproveDialog) {
                this.oApproveDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Mesaj Kutusu",
                    content: new Text({
                        text: "Satır silinsin mi ?"
                    }),
                    beginButton: new Button({
                        type: ButtonType.Emphasized,
                        text: "Sil",
                        press: function () {
                            that._deleteItem(oObject);
                            this.oApproveDialog.close();
                        }.bind(this),
                    }),
                    endButton: new Button({
                        text: "Geri",
                        press: function () {
                            this.oApproveDialog.close();
                        }.bind(this),
                    }),
                });
            }

            this.oApproveDialog.open();
        },
        onSearchLgort: function (oEvent) {
            let sValue = oEvent.getParameter("value"),
                oFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter(
                            "LocParentLgpla",
                            sap.ui.model.FilterOperator.Contains,
                            sValue
                        )

                    ],
                    and: false,
                });

            oEvent.getSource().getBinding("items").filter(oFilter);
        },
        onCloseLgort: function (oEvent) {
            let oSelectedItem = oEvent.getParameter("selectedItem"),
                oViewModel = this.getModel("viewModel");

            if (oSelectedItem) {
                oViewModel.setProperty("/Lgpla", oSelectedItem.getTitle());
            }
            oEvent.getSource().getBinding("items").filter([]);
        },
        onSuggest: function (oEvent) {
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = [];
            if (sTerm) {
                aFilters.push(new Filter("Lgpla", FilterOperator.StartsWith, sTerm));
            }

            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },

        onSave: async function (oEvent) {
            const oViewModel = this.getModel("viewModel"),
                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oDocYear = oViewModel.getProperty("/DocYearD"),
                oLgnum = oViewModel.getProperty("/Lgnum"),
                oLgpla = oViewModel.getProperty("/Lgpla"),
                aFilters = [
                    new Filter("IvDocNumber", FilterOperator.EQ, oDocNumber),
                    new Filter("IvDocYear", FilterOperator.EQ, oDocYear),
                    new Filter("IvLgnum", FilterOperator.EQ, oLgnum),
                    new Filter("IvLgpla", FilterOperator.EQ, oLgpla),
                ];
            this._getMultiData("/CountingSaveSet", aFilters, this.getModel())
                .then((oData) => {
                    //     oViewModel.setProperty("/List", oData.results);
                })
                .catch(() => { })
                .finally(() => { });
        },
        onBack: function () {
            history.go(-1);
        },
        onPressRemoveSelections: function () {
            this.getView().byId("idTable").removeSelections();
        },
        onEmptyShelf: async function (oEvent) {

        },
        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        _onObjectMatched: async function () {
            let oViewModel = this.getModel("viewModel"),
                oObject = oViewModel.getProperty("/DetailData");
            if (oObject.length === 1) {
                oViewModel.setProperty("/Lgpla", oObject[0].LocParentLgpla);
                //  oViewModel.setProperty("/Lgpla", "B-01-01-02");
            }
            oViewModel.setProperty("/LgplaList", oObject);
            this.getView().byId("idSwitchInOut").setVisible(false);
            this._getCountingDetail();
        },
        _getCountingDetail: async function () {
            const oViewModel = this.getModel("viewModel"),

                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oDocYear = oViewModel.getProperty("/DocYearD"),
                oLgnum = oViewModel.getProperty("/Lgnum"),
                aFilters = [
                    new Filter("IvDocNumber", FilterOperator.EQ, oDocNumber),
                    new Filter("IvDocYear", FilterOperator.EQ, oDocYear),
                    new Filter("IvLgnum", FilterOperator.EQ, oLgnum)
                ];
            this._getMultiData("/CountingDetailSet", aFilters, this.getModel())
                .then((oData) => {
                    oViewModel.setProperty("/List", oData.results);
                })
                .catch(() => { })
                .finally(() => { });
        },
        _getMultiData: function (sSet, aFilters, oModel) {
            return new Promise(function (fnSuccess, fnReject) {
                const mParameters = {
                    filters: aFilters,
                    success: fnSuccess,
                    error: fnReject
                };
                oModel.read(sSet, mParameters);
            });
        },
        _getBarcodeData: async function (oMatnr, oCharg, oLgpla) {
            let oModel = this.getModel(),
                oDeepEntity = {};
            oDeepEntity.IvCharg = oCharg;
            oDeepEntity.IvMatnr = oMatnr;
            oDeepEntity.IvLgpla = oLgpla;
            oDeepEntity.to_items = [];
            oDeepEntity.to_returns = [];
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.create("/BarcodeQueryHeaderSet", oDeepEntity, oParams);
            });
        },
        _deleteItem: async function (oObject) {
            const oViewModel = this.getModel("viewModel");
            let oLgnum = oObject.Lgnum,
                oDocNumber = oObject.DocNumber,
                oDocYear = oObject.DocYear,
                oLgpla = oObject.Lgpla,
                oMatnr = oObject.Matnr,
                oCharg = oObject.Charg;
            sap.ui.core.BusyIndicator.show(0);
            let fnSuccess = (oData) => {
                if (oData.Type === "E") {
                    this._showMessageBox(oData.Message, oData.Type, true);
                } else {
                    this._showMessageBox(oData.Message, oData.Type, true);
                    this._getCountingDetail();
                }
            },
                fnError = (err) => { },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                    sap.ui.core.BusyIndicator.hide();
                };
            await this._deleteItemData(oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);
        },
        _deleteItemData: function (oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg) {
            let oModel = this.getModel();
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/CountingDeleteSet", {
                        IvLgnum: oLgnum,
                        IvDocNumber: oDocNumber,
                        IvDocYear: oDocYear,
                        IvLgpla: oLgpla,
                        IvMatnr: oMatnr,
                        IvCharg: oCharg
                    });
                oModel.read(sPath, oParams);
            });
        },
        _addressCount: function (oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg, oMenge, oMeins, oOwner, oCat) {
            let oModel = this.getModel();
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                },
                    sPath = oModel.createKey("/AddressCountSet", {
                        Lgnum: oLgnum,
                        DocNumber: oDocNumber,
                        DocYear: oDocYear,
                        Lgpla: oLgpla,
                        Matnr: oMatnr,
                        Charg: oCharg,
                        Menge: oMenge,
                        Owner: oOwner,
                        Meins: oMeins,
                        Cat: oCat
                    });
                oModel.read(sPath, oParams);
            });
        },
        _setStockType: async function (iIndex) {
            let oViewModel = this.getModel("viewModel"),
                sIn = "F" + iIndex,
                sOut = "B" + iIndex;
            oViewModel.setProperty("/Out", sOut);
            oViewModel.setProperty("/In", sIn);
            this.getView().byId("idSwitchInOut").setVisible(true);
        },
        _clearForm: async function (bCheck) {
            let oViewModel = this.getModel("viewModel");
            sap.ui.getCore().getMessageManager().removeAllMessages();
            if (bCheck === "AAC") {
                oViewModel.setProperty("/Barcode", "");
                oViewModel.setProperty("/BarcodeForm", "");
                oViewModel.setProperty("/Owner", "");
                oViewModel.setProperty("/Owners", []);
                oViewModel.setProperty("/Quantity", "");
                this.getView().byId("idSwitchInOut").setVisible(false);
            }
        },
    });
});