(function (d3, topojson) {
    'use strict';

    const projection = d3.geoNaturalEarth1();
    const pathGenerator = d3.geoPath().projection(projection);


    const paintMap = (g, data) => {
        // const colorScale = scaleQuantile();
        g.append('path')
            .attr('class', 'sphere')
            .attr('d', pathGenerator({ type: 'Sphere' }));


        var { date, topoData, temperatureData, colorScale } = data;

        let countries = topojson.feature(topoData, topoData.objects.countries);

        let temperatureData1 = temperatureData.filter(r => r.dt === date);


        d3.timeFormat("%Y-%m-01");


        let getPreviousYear = (date, nYear) => {
            let previousYear = (new Date(date));
            previousYear.setFullYear(previousYear.getFullYear() - nYear);
            let newDate = previousYear.getFullYear() + date.substring(4, 7);

            return newDate
        };

        let getPreviousYearTemp = (date, nYear, country) => {
            let previousYear = (new Date(date));
            previousYear.setFullYear(previousYear.getFullYear() - nYear);
            let newDate = previousYear.getFullYear() + date.substring(4, 10);

            // console.log(`current date: ${date}`)
            // console.log(`previous date: ${newDate}`)
            // console.log(temperatureData)

            let previousYearResult = temperatureData.find(r => r.dt === newDate && r.Country === country);

            // console.log(previousYearResult)

            if (typeof(previousYearResult) === 'undefined') {
                return "No Data"
            } else {
                return (+previousYearResult.AverageTemperature).toFixed(2)
            }

        };

        let calcTempDiff = (currentTemp, previousTemp) => {
            return (currentTemp - previousTemp).toFixed(2)
        };


        let countryTemp = countryName => {
            let temp = temperatureData1.find(x => x.Country === countryName);
                //console.log(typeof(temp))
            if (typeof(temp) !== 'undefined') {
                // return temp.Country
                return parseFloat(temp.AverageTemperature).toFixed(2)
            } else {
                return null
            }

        };

        let generateRowTemplate = (date, countryName, currentTemp, yearRange) => {

            let previousYear = getPreviousYear(date, yearRange);
            let previousYearTemp = getPreviousYearTemp(date, yearRange, countryName);
            let tempDiff = +calcTempDiff(currentTemp, previousYearTemp);


            let finalTD;

            let redRising = `<td style="padding:0 70px 0 15px;; color:#bf212f">&#x2191;  ${tempDiff}</td>`;
            let greenEqual = `<td style="padding:0 70px 0 15px;; color:#006f3c">&#x3d;  ${tempDiff}</td>`;
            let blueDecreasing = `<td style="padding:0 70px 0 15px;; color:#264b96">&#x2193;  ${tempDiff}</td>`;

            switch (Math.sign(tempDiff)) {
                case 1:
                    finalTD = redRising;
                    break;
                case 0:
                    finalTD = greenEqual;
                    break;
                case -1:
                    finalTD = blueDecreasing;
                    break;
                default:
                    finalTD = '';
            }


            let row =
                `<tr>
                <td style="padding:0 60px 0 20px;">${previousYear}</td>
                <td style="padding:0 70px 0 20px;">${previousYearTemp}</td>
                ${finalTD}
            </tr>`;

            return row;
        };

        let generateHTMLTemplate = (date, countryName, currentTemp, yearRange) => {

            let HTMLString = `
        <h2>${countryName} ${currentTemp === 'NaN' || currentTemp === null ? 'No Data' : currentTemp+'\u00B0C'}</h2>
        <h3>${date.substring(0,7)}    </h3>
        
        <table style="">
            <tr>
                <th>Last 25 Years</th>
                <th>Temperature(\u00B0C)</th>
                <th>Difference(\u00B0C)</th>
            </tr>
            ${generateRowTemplate(date, countryName, currentTemp, (1 * yearRange))}
            ${generateRowTemplate(date, countryName, currentTemp, (2 * yearRange))}
            ${generateRowTemplate(date, countryName, currentTemp, (3 * yearRange))}
            ${generateRowTemplate(date, countryName, currentTemp, (4 * yearRange))}
            ${generateRowTemplate(date, countryName, currentTemp, (5 * yearRange))}
        </table>`;

            return HTMLString;
        };

        countries.features.forEach((e, i) => {
            e['t1_fromTempDSCountry'] = countryTemp(e.properties.name);
            e['t2_topoDSCountry'] = e.properties.name;
        });


        let mapDataJoin = g.selectAll('path').data(countries.features);
        var tooltip = d3.select("div.tooltip");
        mapDataJoin.enter().append('path')
            .attr('class', 'country')
            .attr('d', pathGenerator)
            .merge(mapDataJoin)
            .attr('fill', d => {
                if (d.t1_fromTempDSCountry === null || d.t1_fromTempDSCountry === '' || d.t1_fromTempDSCountry === 'NaN') {
                    return 'black'
                }
                return colorScale(d.t1_fromTempDSCountry)
            })
            .on("mouseover", function(d, i) {
                return tooltip.style("hidden", false).html('<h2>No Data</h2>');
            })
            .on("mousemove", function(d) {
                tooltip.classed("hidden", false)
                    .style("top", (event.pageY) + "px")
                    .style("left", (event.pageX + 10) + "px")
                    .html(generateHTMLTemplate(date, d.properties.name, d.t1_fromTempDSCountry, 5));
            })
            .on("mouseout", function(d, i) {
                tooltip.classed("hidden", true);
            });





    };

    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDate = d3.timeFormat("%Y-%m-01");
    var sliderDate = d3.timeFormat("%Y-%m");

    var timer;

    const svg = d3.select('svg');
    const g = svg.append('g');


    // Properties
    const colorPalette = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"];
    const lowestTemp = -30;
    const highestTemp = 40;

    // Color Scales
    var indexToColor = d3.scale.quantile()
        .domain([0, colorPalette.length - 1]) // 11 colores
        .range(colorPalette);
    var range = [...Array(colorPalette.length).keys()].map(indexToColor); //cantidad de colores a mapear, 11
    var quant = d3.scale.quantile()
        .domain([lowestTemp, highestTemp]) //dominio entrante
        .range(range);



    // Legend
    let generateLegend = () => {
        g.append("g")
            .attr("class", "quantize")
            .attr("transform", "translate(0, 150)");
        let quantizeSelection = g.select(".quantize");

        let Yposition = 120;
        let tempRate = ((Math.abs(lowestTemp) + highestTemp) / colorPalette.length);

        let currentTempRange = lowestTemp;
        let nextTempRange = currentTempRange + tempRate;

        colorPalette.forEach(color => {

            quantizeSelection.append("circle").attr("cx", 50).attr("cy", Yposition).attr("r", 7).style("fill", color);
            quantizeSelection.append("text").attr("x", 70).attr("y", Yposition).text(`${currentTempRange.toFixed(0)} \u00B0 to ${nextTempRange.toFixed(0)} \u00B0C`).style("font-size", "15px").attr("alignment-baseline", "middle");

            Yposition = Yposition + 15;
            currentTempRange = nextTempRange;
            nextTempRange = currentTempRange + tempRate;

        });

        quantizeSelection.append("circle").attr("cx", 50).attr("cy", Yposition).attr("r", 7).style("fill", 'black');
        quantizeSelection.append("text").attr("x", 70).attr("y", Yposition).text('No Data').style("font-size", "15px").attr("alignment-baseline", "middle");
    };

    generateLegend();

    Promise.all([
        d3.json('countries-110m.json'),
        d3.csv('GlobalLandTemperaturesByCountry.csv')
    ]).then(([topoData, temperatureData]) => {


        // example


        console.log('lel');
        console.log(temperatureData);

        const firstTemperatureDataDate = temperatureData[0].dt;
        const lastTemperatureDataDate = temperatureData[temperatureData.length - 1].dt;

        var startDate = new Date(firstTemperatureDataDate),
            endDate = new Date(lastTemperatureDataDate);

        paintMap(g, { date: formatDate(startDate), topoData, temperatureData, colorScale: quant });





        var margin = {
                top: 50,
                right: 50,
                bottom: 0,
                left: 50
            },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;


        var svg2 = d3.select("#vis")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        var moving = false;
        var currentValue = 0;
        var targetValue = width;

        var playButton = d3.select("#play-button");

        var x = d3.scaleTime()
            .domain([startDate, endDate])
            .range([0, targetValue])
            .clamp(true);

        var slider = svg2.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + margin.left + "," + height / 5 + ")");

        slider.append("line")
            .attr("class", "track")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1])
            .select(function() {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function() {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-overlay")
            .call(d3.drag()
                .on("start.interrupt", function() {
                    slider.interrupt();
                })
                .on("start drag", function() {
                    currentValue = event.x;
                    // console.log(currentValue)
                    update(x.invert(currentValue));
                })
            );

        slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
            .selectAll("text")
            .data(x.ticks(10))
            .enter()
            .append("text")
            .attr("x", x)
            .attr("y", 1)
            .attr("text-anchor", "middle")
            .text(function(d) {
                return formatDateIntoYear(d);
            });

        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", 9);

        var label = slider.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .text(sliderDate(startDate))
            .attr("transform", "translate(0," + (-25) + ")");



        playButton
            .on("click", function() {
                var button = d3.select(this);
                if (button.text() == "Pause") {
                    moving = false;
                    clearInterval(timer);
                    // timer = 0;
                    button.text("Play");
                } else {
                    moving = true;
                    button.text("Pause");
                    timer = setInterval(step, 100);

                }
                console.log("Slider moving: " + moving);

            });


        function step() {
            update(x.invert(currentValue));
            currentValue = currentValue + (targetValue / 1000); //151
            // console.log(currentValue)
            if (currentValue > targetValue) {
                moving = false;
                currentValue = 0;
                clearInterval(timer);
                // timer = 0;
                playButton.text("Play");
                console.log("Slider moving: " + moving);
            }
        }


        function update(h) {
            // update position and text of label according to slider scale
            handle.attr("cx", x(h));
            label
                .attr("x", x(h))
                .text(sliderDate(h));


            console.log(formatDate(h));
            paintMap(g, { date: formatDate(h), topoData, temperatureData, colorScale: quant });

        }


    });

}(d3, topojson));
