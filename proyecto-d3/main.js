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
    hsl,
    scaleSequential,
    interpolateViridis,
    colorLegend,
    scale,


} from 'd3';
import { feature } from 'topojson';
import { paintMap } from './paintMap';


var formatDateIntoYear = timeFormat("%Y");
var formatDate = timeFormat("%Y-%m-01");
var sliderDate = timeFormat("%Y-%m");

var timer;

const svg = select('svg');
const g = svg.append('g');


// Properties
const colorPalette = ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]
const lowestTemp = -30;
const highestTemp = 40;

// Color Scales
var indexToColor = scale.quantile()
    .domain([0, colorPalette.length - 1]) // 11 colores
    .range(colorPalette);
var range = [...Array(colorPalette.length).keys()].map(indexToColor); //cantidad de colores a mapear, 11
var quant = scale.quantile()
    .domain([lowestTemp, highestTemp]) //dominio entrante
    .range(range);



// Legend
let generateLegend = () => {
    g.append("g")
        .attr("class", "quantize")
        .attr("transform", "translate(0, 150)")
    let quantizeSelection = g.select(".quantize");

    let Yposition = 120;
    let tempRate = ((Math.abs(lowestTemp) + highestTemp) / colorPalette.length)

    let currentTempRange = lowestTemp;
    let nextTempRange = currentTempRange + tempRate

    colorPalette.forEach(color => {

        quantizeSelection.append("circle").attr("cx", 50).attr("cy", Yposition).attr("r", 7).style("fill", color)
        quantizeSelection.append("text").attr("x", 70).attr("y", Yposition).text(`${currentTempRange.toFixed(0)} \u00B0 to ${nextTempRange.toFixed(0)} \u00B0C`).style("font-size", "15px").attr("alignment-baseline", "middle")

        Yposition = Yposition + 15;
        currentTempRange = nextTempRange
        nextTempRange = currentTempRange + tempRate

    })

    quantizeSelection.append("circle").attr("cx", 50).attr("cy", Yposition).attr("r", 7).style("fill", 'black')
    quantizeSelection.append("text").attr("x", 70).attr("y", Yposition).text('No Data').style("font-size", "15px").attr("alignment-baseline", "middle")
}

generateLegend()

Promise.all([
    json('countries-110m.json'),
    csv('GlobalLandTemperaturesByCountry.csv')
]).then(([topoData, temperatureData]) => {


    // example


    console.log('lel')
    console.log(temperatureData)

    const firstTemperatureDataDate = temperatureData[0].dt
    const lastTemperatureDataDate = temperatureData[temperatureData.length - 1].dt

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


    var svg2 = select("#vis")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    var playButton = select("#play-button");

    var x = scaleTime()
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
        .call(drag()
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
        .attr("transform", "translate(0," + (-25) + ")")



    playButton
        .on("click", function() {
            var button = select(this);
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

        })


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


        console.log(formatDate(h))
        paintMap(g, { date: formatDate(h), topoData, temperatureData, colorScale: quant });

    }


});