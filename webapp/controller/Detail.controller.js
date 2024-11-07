sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/library",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
], function (
    BaseController,
    formatter,
    MessageBox,
    Filter,
    FilterOperator,
    mobileLibrary,
    Dialog,
    Button,
    Text
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

            const oViewModel = this.getModel("viewModel");
            this.getView().byId("idSwitchInOut").setVisible(false);

            let oSource = oEvent.getSource().getValue(),
                oMatnr = oSource.split("|")[0],
                oCharg = oSource.split("|")[1] ? oSource.split("|")[1] : "",
                oLgpla = oViewModel.getData().Lgpla,
                fnSuccess = (oData) => {
                    this.getModel().refresh(true);
                    //error
                    if (oData.to_returns.results.length > 0) {
                        sap.m.MessageBox.error(oData.to_returns.results[0].Message);
                        oViewModel.setProperty("/Owners", []);
                        oViewModel.setProperty("/BarcodeForm", {});
                        oViewModel.setProperty("/Barcode", "");

                    } else {
                        //success
                        oViewModel.setProperty("/Owners", oData.to_items.results);
                        oViewModel.setProperty("/BarcodeForm", oData.to_items.results.at(-1));

                        oViewModel.setProperty("/BarcodeForm/Charg", oData.IvCharg);

                        //this._focusOnInput("idQuan");
                        this.getView().byId("idOwners").open();
                        //if the owner list only one then set the first row to stock type 
                        if (oData.to_items.results.length === 1) {
                            oViewModel.setProperty("/Owner", oData.to_items.results.at(-1).Owner);
                            let iIndex = parseInt(oData.to_items.results.at(-1).OwnerText.slice(0, 1));
                            this._setStockType(iIndex);
                        }

                    }
                    sap.ui.core.BusyIndicator.hide();
                    oViewModel.refresh(true);
                },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();

                    this._showMessageBox(err.responseText, "E");
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
                //oMenge = this.getView().byId("idQuan").getValue(),                
                oMeins = oViewModel.getProperty("/BarcodeForm/Meins"),
                oOwner = oViewModel.getProperty("/Owner");
            let oCat;
            oCat = oSwitchV.getState() === true ? oCat = oSwitchV.getCustomTextOn() : oCat = oSwitchV.getCustomTextOff();

            if (oMenge && oMatnr && oOwner) {

                sap.ui.core.BusyIndicator.show(0);
                let fnSuccess = (oData) => {
                    if (oData.Type === "E") {
                        this._showMessageBox(oData.Message, oData.Type);
                    } else {
                        //  this._showMessageBox(oData.Message, oData.Type, true);
                        this._clearForm("AAC"); //After Address Count
                        this._getCountingDetail();
                        this._focusOnInput("idBarcode");
                    }
                },
                    fnError = (err) => { },
                    fnFinally = () => {
                        oViewModel.setProperty("/busy", false);
                        sap.ui.core.BusyIndicator.hide();
                    };
                await this._addressCount(oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg, this.formatter.changeNumber(oMenge), oMeins, oOwner, oCat)
                    .then(fnSuccess)
                    .catch(fnError)
                    .finally(fnFinally);
            }
        },
        onChangeOwner: async function (oEvent) {
            let iIndex = oEvent.getParameter("selectedItem").getProperty("text").slice(0, 1);
            this._setStockType(iIndex);
            this._focusOnInput("idQuan");
        },


        onPressDeleteItem: async function (oEvent) {
            let that = this;
            let DialogType = mobileLibrary.DialogType,
                ButtonType = mobileLibrary.ButtonType;



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
                            let oObject = that.byId("idTable").getSelectedContexts()[0].getObject();
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
                oViewModel.setProperty("/LgplaValueState", "Success");
                oViewModel.setProperty("/Lgpla", oSelectedItem.getTitle());
                this._lgplaFilter();
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
                oLgpla = oViewModel.getProperty("/Lgpla");
            this.getView().byId("idSwitchInOut").setVisible(false);

            let fnSuccess = (oData) => {
                debugger;
                this._getCountingCheck();
                this._getCountingDetail();
                this.getModel().refresh(true);
                this._showMessageBox(oData.to_return_structure.Message, oData.to_return_structure.Type);

            },
                fnError = (err) => {
                    sap.ui.core.BusyIndicator.hide();
                    this._showMessageBox(err.responseText, "E");
                },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                };


            let that = this;
            sap.m.MessageBox.warning("Sayım kaydedilecektir, emin misiniz ?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        that._save(oDocNumber, oDocYear, oLgnum, oLgpla).then(fnSuccess).catch(fnError).finally(fnFinally);
                    }
                }
            });




        },
        _getCountingCheck: async function () {
            let oViewModel = this.getModel("viewModel"),
                oDocYear = oViewModel.getProperty("/DocYearD"),
                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oLgnum = oViewModel.getProperty("/Lgnum");
            if (oDocNumber && oDocYear) {
                sap.ui.core.BusyIndicator.show(0);
                let fnSuccess = (oData) => {
                    sap.ui.core.BusyIndicator.hide();
                    let oMessage = oData.Message,
                        messageType = oData.Type;
                    if (oMessage && messageType === "E") { // if (message && messageType === "E")
                        this._showMessageBox(oMessage, messageType);
                        // anasayfaya yönlendir.
                        this.getRouter().navTo("RouteMain", {});
                    } else {
                        this._getCounting(String(oDocYear), oDocNumber, oLgnum, true);
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
        onBack: function () {
            history.go(-1);
        },
        onPressRemoveSelections: function () {
            this.getView().byId("idTable").removeSelections();
        },
        onEmptyShelf: async function () {
            let that = this;
            MessageBox.warning(this.getResourceBundle().getText("errorShelf"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        that._setAsEmptyShelf();
                    }
                }
            });
        },

        onClear: function () {
            this._clearForm("AAC");
        },

        onLgplaInputChange: function (oEvent) {

            let oViewModel = this.getView().getModel("viewModel"),
                oInputValue = oEvent.getSource().getValue(),
                oList = oViewModel.getProperty("/LgplaList"),
                oBool = true;

            for (let i in oList) {
                if (oList[i].LocParentLgpla === oInputValue) {
                    oBool = false;
                }
            }

            //Eğer eşleşmediyse
            if (oBool) {
                oViewModel.setProperty("/Lgpla", "");
                oViewModel.setProperty("/LgplaValueState", "Error");
            }
            else {
                oViewModel.setProperty("/LgplaValueState", "Success");
            }

            this._lgplaFilter();
        },
        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */
        _lgplaFilter:function(){
                    //Lgpla değiştiğinde, 
            var oView = this.getView();
            var oTable = oView.byId("idTable"); // The ID of your table
            var oBinding = oTable.getBinding("items");
            var oFilter = [];
            // Get the value of Lgpla from the ViewModel
            var sLgplaValue = this.getView().getModel("viewModel").getProperty("/Lgpla");

            if (sLgplaValue) {
                  // Create a new filter for Lgpla
            oFilter = new Filter("Lgpla", FilterOperator.EQ, sLgplaValue);
            }

            // Apply the filter to the table's binding
            oBinding.filter([oFilter]);
        },


        _onObjectMatched: async function () {
            let oViewModel = this.getModel("viewModel"),
                oObject = oViewModel.getProperty("/DetailData");
            if (!oObject) {
                return;
            }
            oViewModel.setProperty("/Lgpla","");
            if (oObject.length === 1) {
                oViewModel.setProperty("/Lgpla", oObject[0].LocParentLgpla);
                //  oViewModel.setProperty("/Lgpla", "B-01-01-02");
            }
            oViewModel.setProperty("/LgplaList", oObject);
            this.getView().byId("idSwitchInOut").setVisible(false);
            this._getCountingDetail();
        },


        _setAsEmptyShelf: function () {

            let oViewModel = this.getModel("viewModel"),
                oDocNumber = oViewModel.getProperty("/DocNumber"),
                oDocYear = oViewModel.getProperty("/DocYearD"),
                oLgpla = oViewModel.getProperty("/Lgpla"),
                oLgnum = oViewModel.getProperty("/Lgnum"),
                oModel = this.getView().getModel(),
                that = this;

            if (oLgpla) {
                let sPath = this.getModel().createKey("/EmptyShelfSet", {
                    IvDocNumber: oDocNumber,
                    IvDocYear: oDocYear,
                    IvLgnum: oLgnum,
                    IvLgpla: oLgpla
                });

                this.getRead(sPath, oModel)
                    .then(function (oData) {

                        let oMessage = oData.Message,
                            oType = oData.Type;
                        that._showMessageBox(oMessage, oType);
                        that._clearForm("");

                    })
                    .catch((err) => {
                        debugger;
                    })
                    .finally(() => { });

            }

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
        _save: async function (oDocNumber, oDocYear, oLgnum, oLgpla) {

            let oModel = this.getModel(),
                oDeepEntity = {};

            oDeepEntity.IvDocNumber = oDocNumber;
            oDeepEntity.IvDocYear = oDocYear;
            oDeepEntity.IvLgnum = oLgnum;
            oDeepEntity.IvLgpla = oLgpla;
            oDeepEntity.to_return_structure = {};
            oDeepEntity.to_returns = [];
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    success: fnResolve,
                    error: fnReject,
                };
                oModel.create("/CountingSaveSet", oDeepEntity, oParams);
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
                oCharg = oObject.Charg,
                oOwner = oObject.Owner;
            sap.ui.core.BusyIndicator.show(0);
            let fnSuccess = (oData) => {
                if (oData.Type === "E") {
                    this._showMessageBox(oData.Message, oData.Type);
                } else {
                    this._showMessageBox(oData.Message, oData.Type);
                    this._getCountingDetail();
                }
            },
                fnError = (err) => { },
                fnFinally = () => {
                    oViewModel.setProperty("/busy", false);
                    sap.ui.core.BusyIndicator.hide();
                };
            await this._deleteItemData(oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg, oOwner)
                .then(fnSuccess)
                .catch(fnError)
                .finally(fnFinally);
        },
        _deleteItemData: function (oLgnum, oDocNumber, oDocYear, oLgpla, oMatnr, oCharg, oOwner) {
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
                        IvCharg: oCharg,
                        IvOwner: oOwner
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

            if (iIndex === "") {
                this.getView().byId("idSwitchInOut").setVisible(false);
                return;
            }

            let oViewModel = this.getModel("viewModel"),
                sIn = "F" + iIndex,
                sOut = "B" + iIndex;
            oViewModel.setProperty("/Out", sOut);
            oViewModel.setProperty("/In", sIn);
            this.getView().byId("idSwitchInOut").setState(true);
            this.getView().byId("idSwitchInOut").setVisible(true);
        },
        _clearForm: async function (sCheck) {
            let oViewModel = this.getModel("viewModel");
            sap.ui.getCore().getMessageManager().removeAllMessages();
            if (sCheck === "AAC") {
                oViewModel.setProperty("/Barcode", "");
                oViewModel.setProperty("/BarcodeForm", "");
                oViewModel.setProperty("/Owner", "");
                oViewModel.setProperty("/Owners", []);
                oViewModel.setProperty("/Quantity", "");
                this.getView().byId("idQuan").setValue("");
                this.getView().byId("idSwitchInOut").setVisible(false);
            }
        },

        onQuantityLiveChange: function(oEvent) {
            let sValue = oEvent.getParameter("value");

            let oViewModel = this.getView().getModel("viewModel"),
                sMeins = oViewModel.getProperty("/BarcodeForm/Meins"),
                sFilteredValue;
        
            if(sMeins === 'ADT' || sMeins === 'PC'){
                  // Sadece sayıları kabul et (0-9)
             sFilteredValue = sValue.replace(/[^0-9]/g, "");
            }
            else{
            // Sayı ve yalnızca bir virgül dışında karakterleri temizle, ve sadece 1 tane virgül.
            sFilteredValue = sValue.replace(/[^0-9,]/g, "");
            sFilteredValue = sFilteredValue.replace(/(,.*),/g, "$1");
            }
                    
            // Eğer girdi filtrelendi ise, değeri Input alanına geri yaz
            if (sValue !== sFilteredValue) {
                oEvent.getSource().setValue(sFilteredValue);
            }
        }
    });
});