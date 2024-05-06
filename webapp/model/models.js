sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device) {
        "use strict";

        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
        },
        createJsonModel: function () {
            var oModel = new JSONModel({
                "busy": true,
                "initialScreenInputValues": {
                    // "countingDocument": "100016",
                    "countingDocument": undefined,
                    // "documentYear": "2023",
                    "countingYear": "",
                },
                "detailScreenInputValues": {
                    "warehouseNoInputEnabled": true,
                    "warehouseNoInputforceSelection": false,
                    "amountInputEnabled": true,
                    "valueStats": [
                        {"valueState": "None"},
                        {"valueState": "None"},
                        {"valueState": "None"},
                        {"valueState": "None"}
                    ]
                },
                "detailScreenXMLTagValues": {
                    "historyDetailTableDeleteAndResetButtonEnable": false
                },
                "wareHouseInfo": {
                    "warehouseNo": ""
                },
                "fetchCountingDetailSet": []
            });
            return oModel;
        }
    };
});