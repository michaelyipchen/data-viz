import {
    select,
    json,
    geoPath,
    geoNaturalEarth1,
    csv,
    scaleOrdinal,
    schemeRdBu,
    timeFormat,
    timeParse,
    scaleTime,
    drag,
    hsl
} from 'd3';

import { feature } from 'topojson';


const projection = geoNaturalEarth1();
const pathGenerator = geoPath().projection(projection);
const colorScale = scaleOrdinal();

export const paintMap = (g, data) => {

    g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathGenerator({ type: 'Sphere' }));


    const { date, topoData, temperatureData } = data;
    console.log(date)
    const countries = feature(topoData, topoData.objects.countries);

    const temperatureData1 = temperatureData.filter(r => r.dt === date);
    const countryTemp = countryName => {
        const temp = temperatureData1.find(x => x.Country === countryName)
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

    colorScale
        .domain(countries.features.map(x => x.t1_fromTempDSCountry))
        .range(schemeRdBu[8])
        // console.log(countries.features[1].t1_fromTempDSCountry)


    const mapDataJoin = g.selectAll('path').data(countries.features);

    mapDataJoin.enter().append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator)
        .merge(mapDataJoin)
        .attr('fill', d => {
            //console.log(d.t1_fromTempDSCountry + '_' + d.properties.name + '_' + date)
            if (d.t1_fromTempDSCountry === null || d.t1_fromTempDSCountry === '') {
                return 'black'
            }
            return colorScale(d.t1_fromTempDSCountry)
        })
        .append('title')
        .text(d => d.properties.name + ' : ' + d.t1_fromTempDSCountry + ' °C')


    g.selectAll('path').data(countries.features).append("text")
        .attr("x", 70)
        .attr("y", 700)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .text(date);

}