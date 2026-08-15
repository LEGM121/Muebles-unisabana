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

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.949, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Crear orden"], "isController": false}, {"data": [1.0, 500, 1500, "Seleccionar item - Neo"], "isController": false}, {"data": [0.995, 500, 1500, "Seleccionar item - Sofa"], "isController": false}, {"data": [0.99, 500, 1500, "Ingreso Usuario"], "isController": false}, {"data": [0.99, 500, 1500, "Consultar ordenes"], "isController": false}, {"data": [0.515, 500, 1500, "Consultar pagos"], "isController": false}, {"data": [1.0, 500, 1500, "Autorizar pago"], "isController": false}, {"data": [1.0, 500, 1500, "Seleccionar item - Mesa"], "isController": false}, {"data": [1.0, 500, 1500, "Vaciar carrito"], "isController": false}, {"data": [1.0, 500, 1500, "Seleccionar item - Escritorio"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1000, 0, 0.0, 227.74700000000024, 108, 1366, 158.0, 501.9, 629.9499999999999, 762.0, 1.7683434688886492, 69.0766541388742, 0.9126655501051281], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Crear orden", 100, 0, 0.0, 137.67000000000004, 117, 193, 129.5, 160.0, 167.95, 192.99, 0.17788435026851643, 0.13474392102468502, 0.09241647885044017], "isController": false}, {"data": ["Seleccionar item - Neo", 100, 0, 0.0, 142.52, 116, 399, 134.5, 163.0, 168.0, 397.00999999999897, 0.1778770727125898, 0.15366216652495793, 0.09102303330214555], "isController": false}, {"data": ["Seleccionar item - Sofa", 100, 0, 0.0, 142.18, 115, 521, 135.0, 160.0, 161.95, 517.4499999999982, 0.17789099551358908, 0.10895823475207331, 0.09241993126291932], "isController": false}, {"data": ["Ingreso Usuario", 100, 0, 0.0, 324.59999999999985, 269, 1325, 298.0, 358.9, 367.95, 1324.5099999999998, 0.17750071887791147, 0.09325721362921519, 0.07072294267791784], "isController": false}, {"data": ["Consultar ordenes", 100, 0, 0.0, 342.7100000000001, 273, 551, 335.5, 404.80000000000007, 452.9, 550.6499999999999, 0.17787169403222677, 18.415146808626066, 0.054542687427850796], "isController": false}, {"data": ["Consultar pagos", 100, 0, 0.0, 633.8500000000003, 480, 1366, 625.0, 754.0, 798.3499999999997, 1362.5999999999983, 0.17779579441827884, 49.904114241909845, 0.05486667093376574], "isController": false}, {"data": ["Autorizar pago", 100, 0, 0.0, 144.84, 118, 231, 152.0, 161.0, 174.84999999999997, 230.68999999999983, 0.17790365449687065, 0.25849192517550196, 0.21247672797819614], "isController": false}, {"data": ["Seleccionar item - Mesa", 100, 0, 0.0, 136.6300000000001, 108, 163, 126.0, 160.0, 161.0, 162.98, 0.17788688173190667, 0.13182911908192582, 0.09207035870889702], "isController": false}, {"data": ["Vaciar carrito", 100, 0, 0.0, 135.03000000000003, 112, 198, 126.0, 160.0, 164.84999999999997, 197.7899999999999, 0.17793562644906324, 0.08375485541840673, 0.06550950309696958], "isController": false}, {"data": ["Seleccionar item - Escritorio", 100, 0, 0.0, 137.44, 117, 200, 131.5, 160.0, 162.95, 199.67999999999984, 0.1778846666975, 0.17654184592252767, 0.09189549676072022], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1000, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
