sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit : function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },
        changeDotAndCommaVisaVersa: function (str){
            if (str) {
                str = str.replace(/\./g, '_');
  
                // Replace commas with dots
                str = str.replace(/,/g, '.');

                // Replace the placeholder character with commas
                str = str.replace(/_/g, ',');

                return str;
            }
        },
        changeDotToComma: function (sValue) {
            if (sValue) {
                var splittedText = sValue.split(".");
                return splittedText.join();
            }
        },
        changeCommaToDot: function (sValue) {
            if (sValue && sValue.includes(",")) {
                var splittedText = sValue.replace(",", ".");
                return splittedText;
            }
            return sValue;
        }

    };

});