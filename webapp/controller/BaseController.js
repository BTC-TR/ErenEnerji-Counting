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
        onShareEmailPress: function () {
            var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },
        _showMessageBox: function (message, messageType) {
            if (messageType === "S") {
                MessageBox.success(message);
                return;
            } else {
                MessageBox.error(message);
                return;
            }

        },
        _showMessageBoxWithRoute: function (message, messageType, ifSShow, routeName) {
            let that = this;
            if (messageType === "S" && !ifSShow)
                return
            if (messageType === "S") {
                MessageBox.success(message);
            } else {
                MessageBox.error(message, {
                    onClose: function (sAction) {
                        that.getRouter().navTo(routeName)
                    }
                });
            }

        },
        _uppercaseInput: function (oEvent) {
            var _oInput = oEvent.getSource();
            var val = _oInput.getValue();
            val = val.toUpperCase();
            val = val.trim();
            _oInput.setValue(val);
            this._detailPageValidateInputs(oEvent);
        },
        _focusOnInput: function (id) {
            let oView = this.getView();
            oView.byId(id).focus();
        },
        _validateInput: function (oInput) {
            var sValueState = "None";
            var bValidationError = false;
            var oBinding = oInput.getBinding("value");
            var selectedKey = false;
            if (oBinding === undefined) oBinding = oInput.getBinding("selectedKey");

            try {
                try {
                    selectedKey = oInput.getForceSelection() ? false : true;
                } catch (error) {
                    selectedKey = false
                }
                if (selectedKey) {
                    oBinding.getType().validateValue(oInput.getSelectedKey());
                } else {
                    oBinding.getType().validateValue(oInput.getValue());
                }


            } catch (oException) {
                // console.log(oException)
                // oInput.setValueStateText(oException.message)
                sValueState = "Error";
                bValidationError = true;
            }

            oInput.setValueState(sValueState);

            return bValidationError;
        },
    });

});