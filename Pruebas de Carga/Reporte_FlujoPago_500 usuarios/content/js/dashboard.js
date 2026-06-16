/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 58.54738706820195, "KoPercent": 41.45261293179805};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.22320637732506643, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Crear orden"], "isController": false}, {"data": [0.9696969696969697, 500, 1500, "Seleccionar item - Neo"], "isController": false}, {"data": [0.2440944881889764, 500, 1500, "Seleccionar item - Sofa"], "isController": false}, {"data": [0.0, 500, 1500, "Ingreso Usuario"], "isController": false}, {"data": [0.015625, 500, 1500, "Consultar ordenes"], "isController": false}, {"data": [0.015625, 500, 1500, "Consultar pagos"], "isController": false}, {"data": [1.0, 500, 1500, "Autorizar pago"], "isController": false}, {"data": [0.19333333333333333, 500, 1500, "Seleccionar item - Mesa"], "isController": false}, {"data": [1.0, 500, 1500, "Vaciar carrito"], "isController": false}, {"data": [1.0, 500, 1500, "Seleccionar item - Escritorio"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1129, 468, 41.45261293179805, 7331.939769707704, 68, 22239, 2788.0, 21471.0, 21740.5, 22086.5, 21.649919459998465, 453.0183511651933, 8.376437315429163], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Crear orden", 32, 0, 0.0, 212.87500000000003, 118, 246, 216.0, 236.7, 245.35, 246.0, 1.2127183840527533, 0.9188651135028613, 0.6300450979649069], "isController": false}, {"data": ["Seleccionar item - Neo", 33, 1, 3.0303030303030303, 222.42424242424238, 68, 337, 223.0, 274.8, 323.69999999999993, 337.0, 1.2608895002292526, 1.2373075233073514, 0.6256686535228488], "isController": false}, {"data": ["Seleccionar item - Sofa", 254, 104, 40.94488188976378, 3919.2322834645674, 73, 7680, 1402.0, 7593.5, 7634.0, 7671.4, 9.813011899242776, 14.87888270746407, 4.8573080860763405], "isController": false}, {"data": ["Ingreso Usuario", 500, 246, 49.2, 11764.878000000004, 1352, 22239, 3513.5, 21780.100000000002, 21956.65, 22116.97, 22.39942657467969, 27.536245072126153, 5.140668398888988], "isController": false}, {"data": ["Consultar ordenes", 32, 0, 0.0, 10717.937499999998, 776, 12013, 11048.0, 11825.3, 11905.1, 12013.0, 0.8384425928837185, 168.77671819322174, 0.257100560708484], "isController": false}, {"data": ["Consultar pagos", 32, 0, 0.0, 7693.1875, 1320, 9465, 7668.5, 9235.6, 9420.8, 9465.0, 0.684535906047447, 335.1522098008963, 0.2112435022568293], "isController": false}, {"data": ["Autorizar pago", 32, 0, 0.0, 273.65625000000006, 182, 352, 266.5, 333.6, 347.45, 352.0, 1.2052730696798493, 1.7511181732580037, 1.4395009416195856], "isController": false}, {"data": ["Seleccionar item - Mesa", 150, 117, 78.0, 5162.319999999997, 70, 6971, 6281.5, 6813.2, 6896.4, 6956.72, 5.766125932190359, 14.03379700593911, 2.9645245108403167], "isController": false}, {"data": ["Vaciar carrito", 32, 0, 0.0, 201.31250000000003, 100, 267, 202.0, 246.5, 259.2, 267.0, 1.204728559596416, 0.5670694977787817, 0.4435377607107898], "isController": false}, {"data": ["Seleccionar item - Escritorio", 32, 0, 0.0, 218.15625000000003, 104, 297, 215.0, 266.4, 282.04999999999995, 297.0, 1.2180267965895248, 1.2203314127207674, 0.6292345462850183], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["500/Internal Server Error", 242, 51.70940170940171, 21.434898139946856], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: compumuebles-sabana-api.cyk.com.co:443 failed to respond", 181, 38.675213675213676, 16.031886625332152], "isController": false}, {"data": ["Non HTTP response code: javax.net.ssl.SSLHandshakeException/Non HTTP response message: Remote host terminated the handshake", 45, 9.615384615384615, 3.9858281665190436], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1129, 468, "500/Internal Server Error", 242, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: compumuebles-sabana-api.cyk.com.co:443 failed to respond", 181, "Non HTTP response code: javax.net.ssl.SSLHandshakeException/Non HTTP response message: Remote host terminated the handshake", 45, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["Seleccionar item - Neo", 33, 1, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: compumuebles-sabana-api.cyk.com.co:443 failed to respond", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Seleccionar item - Sofa", 254, 104, "500/Internal Server Error", 92, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: compumuebles-sabana-api.cyk.com.co:443 failed to respond", 12, "", "", "", "", "", ""], "isController": false}, {"data": ["Ingreso Usuario", 500, 246, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: compumuebles-sabana-api.cyk.com.co:443 failed to respond", 167, "Non HTTP response code: javax.net.ssl.SSLHandshakeException/Non HTTP response message: Remote host terminated the handshake", 45, "500/Internal Server Error", 34, "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Seleccionar item - Mesa", 150, 117, "500/Internal Server Error", 116, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: compumuebles-sabana-api.cyk.com.co:443 failed to respond", 1, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
