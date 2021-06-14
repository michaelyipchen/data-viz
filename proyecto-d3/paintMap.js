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


    let previousYear = (new Date(date))
    previousYear.setFullYear(previousYear.getFullYear() - 1)
    previousYear.setMonth(previousYear.getMonth() + 1)

    console.log(date + '<------------')
    console.log(formatDate(previousYear))

    // console.log(temperatureData.find(x => x.Country === countryName && x.dt === previousYear))














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

    countries.features.forEach((e, i) => {
        e['t1_fromTempDSCountry'] = countryTemp(e.properties.name)
        e['t2_topoDSCountry'] = e.properties.name
            // console.log(e)
    });


    let mapDataJoin = g.selectAll('path').data(countries.features);
    var tooltip = select("div.tooltip");
    mapDataJoin.enter().append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator)
        .merge(mapDataJoin)
        .attr('fill', d => {
            //console.log(d.t1_fromTempDSCountry + '_' + d.properties.name + '_' + date)
            if (d.t1_fromTempDSCountry === null || d.t1_fromTempDSCountry === '' || d.t1_fromTempDSCountry === 'NaN') {
                return 'black'
            }
            //colorScale.domain().forEach(e => console.log(`${e} ${d.properties.name}`))
            //console.log(colorScale.domain()[0])
            //console.log(colorScale(d.t1_fromTempDSCountry) + " " + d.t1_fromTempDSCountry + " " + d.properties.name)
            // return colorScale(d.t1_fromTempDSCountry)
            return colorScale(d.t1_fromTempDSCountry)
        })
        .on("mouseover", function(d, i) {
            return tooltip.style("hidden", false).html('hello' + d.t1_fromTempDSCountry);
        })
        .on("mousemove", function(d) {
            tooltip.classed("hidden", false)
                .style("top", (event.pageY) + "px")
                .style("left", (event.pageX + 10) + "px")
                .html(`<h2>${d.properties.name} ${
                    d.t1_fromTempDSCountry === 'NaN' || d.t1_fromTempDSCountry === null ? 'No Data' : d.t1_fromTempDSCountry
                }</h2>dfdf </br>
                fdf`);
        })
        .on("mouseout", function(d, i) {
            tooltip.classed("hidden", true);
        });





}