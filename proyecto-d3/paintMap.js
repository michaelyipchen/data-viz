import {
    select,
    json,
    geoPath,
    geoNaturalEarth1,
    csv,
    scaleOrdinal,
    timeFormat,
    timeParse,
    scaleTime,
    drag,
    hsl,
    scaleQuantile,
    randomNormal,
    range,
    schemeSpectral,
    scaleQuantize,
    schemeBlues,
    interpolateLab,
    interpolateRgb,
    quantize,
    interpolateHcl,
    scaleLinear,
    scale,
    legend,
    format

} from 'd3';

import { feature } from 'topojson';

const projection = geoNaturalEarth1();
const pathGenerator = geoPath().projection(projection);


export const paintMap = (g, data) => {
    // const colorScale = scaleQuantile();
    g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathGenerator({ type: 'Sphere' }));


    var { date, topoData, temperatureData, colorScale } = data;

    let countries = feature(topoData, topoData.objects.countries);

    let temperatureData1 = temperatureData.filter(r => r.dt === date);


    var formatDate = timeFormat("%Y-%m-01");


    let getPreviousYear = (date, nYear) => {
        let previousYear = (new Date(date))
        previousYear.setFullYear(previousYear.getFullYear() - nYear)
        let newDate = previousYear.getFullYear() + date.substring(4, 7)

        return newDate
    }

    let getPreviousYearTemp = (date, nYear, country) => {
        let previousYear = (new Date(date))
        previousYear.setFullYear(previousYear.getFullYear() - nYear)
        let newDate = previousYear.getFullYear() + date.substring(4, 10)

        // console.log(`current date: ${date}`)
        // console.log(`previous date: ${newDate}`)
        // console.log(temperatureData)

        let previousYearResult = temperatureData.find(r => r.dt === newDate && r.Country === country)

        // console.log(previousYearResult)

        if (typeof(previousYearResult) === 'undefined') {
            return "No Data"
        } else {
            return (+previousYearResult.AverageTemperature).toFixed(2)
        }

    }

    let calcTempDiff = (currentTemp, previousTemp) => {
        return (currentTemp - previousTemp).toFixed(2)
    }


    let countryTemp = countryName => {
        let temp = temperatureData1.find(x => x.Country === countryName)
            //console.log(typeof(temp))
        if (typeof(temp) !== 'undefined') {
            // return temp.Country
            return parseFloat(temp.AverageTemperature).toFixed(2)
        } else {
            return null
        }

    }

    let generateRowTemplate = (date, countryName, currentTemp, yearRange) => {

        let previousYear = getPreviousYear(date, yearRange);
        let previousYearTemp = getPreviousYearTemp(date, yearRange, countryName);
        let tempDiff = +calcTempDiff(currentTemp, previousYearTemp)


        let finalTD;
        let paddingRight = '80'

        let redRising = `<td style="padding:0 70px 0 15px;; color:#bf212f">&#x2191;  ${tempDiff}</td>`
        let greenEqual = `<td style="padding:0 70px 0 15px;; color:#006f3c">&#x3d;  ${tempDiff}</td>`
        let blueDecreasing = `<td style="padding:0 70px 0 15px;; color:#264b96">&#x2193;  ${tempDiff}</td>`

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
                finalTD = ''
        }


        let row =
            `<tr>
                <td style="padding:0 60px 0 20px;">${previousYear}</td>
                <td style="padding:0 70px 0 20px;">${previousYearTemp}</td>
                ${finalTD}
            </tr>`

        return row;
    }

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
    }

    countries.features.forEach((e, i) => {
        e['t1_fromTempDSCountry'] = countryTemp(e.properties.name)
        e['t2_topoDSCountry'] = e.properties.name
    });


    let mapDataJoin = g.selectAll('path').data(countries.features);
    var tooltip = select("div.tooltip");
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





}