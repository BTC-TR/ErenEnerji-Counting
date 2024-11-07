sap.ui.define(["sap/ui/core/Core"], function (Core) {
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
        },



        changeNumber: function (iNumber) {
			return iNumber.replaceAll(".", "").replace(",", ".");
		},

        formatQuantity: function(quantity,menge) {
            if (!quantity) return "";

            const unit = menge;

            // Eğer "ADT" veya "PC" ise, yalnızca tam sayı göster
            if (unit === "ADT" || unit === "PC") {
                return parseInt(quantity, 10).toLocaleString('tr-TR');
            }
            // Diğer durumlarda iki ondalık basamak göster
            return parseFloat(quantity).toLocaleString('tr-TR', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            });
        },


    };

});