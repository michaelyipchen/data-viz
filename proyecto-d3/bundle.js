(function (d3, topojson) {
    'use strict';

    const projection$1 = d3.geoNaturalEarth1();
    const pathGenerator = d3.geoPath().projection(projection$1);
    const colorScale = d3.scaleOrdinal();

    const paintMap = (g, data) => {

        g.append('path')
            .attr('class', 'sphere')
            .attr('d', pathGenerator({ type: 'Sphere' }));


        const { date, topoData, temperatureData } = data;
        console.log(date);
        const countries = topojson.feature(topoData, topoData.objects.countries);

        const temperatureData1 = temperatureData.filter(r => r.dt === date);
        const countryTemp = countryName => {
            const temp = temperatureData1.find(x => x.Country === countryName);
                //console.log(typeof(temp))
            if (typeof(temp) !== 'undefined') {
                // return temp.Country
                return parseFloat(temp.AverageTemperature).toFixed(2)
            } else {
                return null
            }

        };

        countries.features.forEach((e, i) => {
            e['t1_fromTempDSCountry'] = countryTemp(e.properties.name);
            e['t2_topoDSCountry'] = e.properties.name;
                // console.log(e)
        });

        colorScale
            .domain(countries.features.map(x => x.t1_fromTempDSCountry))
            .range(d3.schemeRdBu[8]);
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
            .text(d => d.properties.name + ' : ' + d.t1_fromTempDSCountry + ' °C');


        g.selectAll('path').data(countries.features).append("text")
            .attr("x", 70)
            .attr("y", 700)
            .attr("text-anchor", "middle")
            .style("font-size", "15px")
            .text(date);

    };

    const svg = d3.select('svg');

    const projection = d3.geoNaturalEarth1();
    d3.geoPath().projection(projection);

    const g = svg.append('g');


    // g.append('path')
    //     .attr('class', 'sphere')
    //     .attr('d', pathGenerator({ type: 'Sphere' }));




    // const colorScale = scaleOrdinal();

    // const render = () => {
    //     paintMap(g, {
    //         date,
    //         topoData,
    //         temperatureData
    //     })
    // }

    var timer;

    Promise.all([
        d3.json('countries-110m.json'),
        d3.csv('GlobalLandTemperaturesByCountry.csv')
    ]).then(([topoData, temperatureData]) => {

        paintMap(g, { date: '2000-01-01', topoData, temperatureData });

        var formatDateIntoYear = d3.timeFormat("%Y");
        var formatDate = d3.timeFormat("%Y-%m-01");
        d3.timeParse("%m/%d/%y");

        var startDate = new Date("1930-11-01"),
            endDate = new Date("2011-04-01");

        var margin = {
                top: 50,
                right: 50,
                bottom: 0,
                left: 50
            },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var svg = d3.select("#vis")
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

        var slider = svg.append("g")
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
                    console.log(currentValue);
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
            .attr("y", 10)
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
            .text(formatDate(startDate))
            .attr("transform", "translate(0," + (-25) + ")");
            ////////// plot //////////

        svg.append("g")
            .attr("class", "plot")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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
            currentValue = currentValue + (targetValue / 151);
            console.log(currentValue);
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
                .text(formatDate(h));


            console.log(formatDate(h));
            paintMap(g, { date: formatDate(h), topoData, temperatureData });
            // // filter data set and redraw plot
            // var newData = dataset.filter(function(d) {
            //         return d.date < h;
            //     })
            //     //drawPlot(newData);
        }


    });

}(d3, topojson));
