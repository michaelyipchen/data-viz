import { select, json, geoPath, geoNaturalEarth1, csv } from 'd3';
import { feature } from 'topojson';

const svg = select('svg');

const projection = geoNaturalEarth1();
const pathGenerator = geoPath().projection(projection);

const g = svg.append('g');

g.append('path')
    .attr('class', 'sphere')
    .attr('d', pathGenerator({ type: 'Sphere' }));


Promise.all([
    json('countries-110m.json'),
    csv('GlobalLandTemperaturesByCountry.csv')
]).then(([topoData, temperatureData]) => {

    /* 
        This is for getting the missing countries and modify the geoJson dataset.
    */

    const countries = feature(topoData, topoData.objects.countries);

    const date = '2011-03-01';
    const temperatureData1 = temperatureData.filter(r => r.dt === date);
    const countryTemp = countryName => {
        const temp = temperatureData1.find(x => x.Country === countryName)
            //console.log(typeof(temp))
        if (typeof(temp) !== 'undefined') {
            return temp.Country
                // return temp.AverageTemperature
        } else {
            return 'lel'
        }

    }

    countries.features.forEach((e, i) => {
        e['t1_fromTempDSCountry'] = countryTemp(e.properties.name)
        e['t2_topoDSCountry'] = e.properties.name
            // console.log(e)
    });

    const missingCountries = countries.features.filter(x => x.t1_fromTempDSCountry === 'lel');
    console.log(missingCountries.length)
    missingCountries.forEach(e => console.log(e))



    g.selectAll('path').data(countries.features)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator);


    // console.log(countryTemp('1Russia'))
    // console.log(temperatureData1.find(x => x.Country === 'Costa Rica').AverageTemperature)

});