// ==UserScript==
// @name         Precious Metals Translator
// @namespace    Violentmonkey Scripts
// @version      1.0
// @description  Translate Chinese precious metal names to English
// @author       Heap Hierarch
// @match        https://i.jzj9999.com/quoteh5/*
// @match        *://*/web/static/*/quoteh5*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Dictionary of precious metal translations
    const translations = {
        '黄金9999': 'Gold 9999',
        '黄金T+D': 'Gold T+D',
        '黄 金': 'Gold',
        '白 银': 'Silver',
        '铂 金': 'Platinum',
        '钯 金': 'Palladium',
        '铑金': 'Rhodium',
        '铱': 'Iridium',
        '钌': 'Ruthenium',
        '白银T+D': 'Silver T+D',
        '铂金9995': 'Platinum 9995',
        '美黄金': 'US Gold',
        '美铂金': 'US Platinum',
        '美钯金': 'US Palladium',
        '美白银': 'US Silver',
        '美铑金': 'US Rhodium',
        '伦敦金': 'London Gold',
        '伦敦银': 'London Silver',
        '伦敦铂': 'London Platinum',
        '伦敦钯': 'London Palladium',
        '美元': 'US Dollar',
        '商 品': 'Commodity',
        '回 购': 'Buy Back',
        '销 售': 'Sell',
        '高/低': 'High/Low',
        '闭盘': 'Market Closed',
        '开盘': 'Market Open'
    };

    function getUSDExchangeRates() {
        // Get the last row (USD is always last)
        const rows = document.querySelectorAll('.price-table-row');
        const lastRow = rows[rows.length - 1];

        if (lastRow) {
            const priceElements = lastRow.querySelectorAll('.symbole-price span');
            if (priceElements.length >= 2) {
                const buyBackRate = parseFloat(priceElements[0].textContent.trim());
                const sellRate = parseFloat(priceElements[1].textContent.trim());
                
                if (!isNaN(buyBackRate) && !isNaN(sellRate)) {
                    return { buyBack: buyBackRate, sell: sellRate };
                }
            }
        }
        return null;
    }

    function convertToUSD(cnyPrice, usdRate) {
        if (!cnyPrice || !usdRate) return null;
        // Convert CNY to USD and grams to troy ounces (1 troy oz = 31.1035 grams)
        return ((cnyPrice / usdRate) * 31.1035).toFixed(2);
    }

    function translatePage() {
        // Find all elements with precious metal names
        const elements = document.querySelectorAll('.symbol-name, .price-table-header .el-col, .quote-status span');

        elements.forEach(element => {
            const currentText = element.textContent.trim();
            
            // Extract original text (before colon if exists)
            const originalText = currentText.includes(':') 
                ? currentText.split(':')[0].trim() 
                : currentText;

            const translation = translations[originalText] || '';

            // Check if translation exists
            if (translation) {
                const newText = `${originalText}: (${translation})`;
                // Only update if changed
                if (element.textContent !== newText) {
                    element.textContent = newText;
                }
            }
        });

        // Get USD exchange rates
        const usdRates = getUSDExchangeRates();

        if (usdRates) {
            console.log('USD Exchange Rates:', usdRates);

            // Convert all CNY prices to USD
            const rows = document.querySelectorAll('.price-table-row');

            rows.forEach((row) => {
                const symbolName = row.querySelector('.symbol-name');
                const symbolText = symbolName ? symbolName.textContent : '';
                
                // Skip USD row and rows that already show USD prices
                if (symbolText.includes('US ') || symbolText.includes('London ')) {
                    return;
                }

                // Get all price elements in this row
                const priceElements = row.querySelectorAll('.symbole-price span');

                priceElements.forEach((priceElement, index) => {
                    const priceText = priceElement.textContent.trim();
                    
                    // Extract original price (before colon if exists)
                    const originalPrice = priceText.includes(':') 
                        ? priceText.split(':')[0].trim() 
                        : priceText;
                    
                    const price = parseFloat(originalPrice);

                    // Only convert if it's a valid number
                    if (!isNaN(price) && originalPrice !== '--') {
                        // Use buyBack rate for first column (buy back), sell rate for second column (sell)
                        const rate = index === 0 ? usdRates.buyBack : usdRates.sell;
                        const usdPrice = convertToUSD(price, rate);
                        if (usdPrice) {
                            const newText = `${originalPrice}: ($${usdPrice})`;
                            // Only update if changed to avoid circular mutations
                            if (priceElement.textContent !== newText) {
                                priceElement.textContent = newText;
                            }
                        }
                    }
                });
            });
        }
    }

    // Wait for page to load
    function init() {
        translatePage();

        // Watch for dynamic content changes
        const observer = new MutationObserver(function (mutations) {
            translatePage();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Run after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
