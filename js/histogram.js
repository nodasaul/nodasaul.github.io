
Histogram = function (_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data.features;
    this.eventHandler = _eventHandler;
    this.dp = this.data;

    //define all "constants" here
    this.margin = {top: 20, right: 0, bottom: 130, left: 55},
        this.width = 550 - this.margin.left - this.margin.right,
        this.height = 350 - this.margin.top - this.margin.bottom;

    this.initVis();

}

/**
 * Method that sets up the SVG and the variables
 */
Histogram.prototype.initVis = function () {
    // constructs SVG layout
    this.svg = this.parentElement.select("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.y = d3.scale.linear()
        .range([this.height, 5]);

    this.x = d3.scale.ordinal()
        .rangeRoundBands([0, this.width], .2);

    that = this;

    this.brush = d3.svg.brush()
        .on("brush", this.brushed);


    //console.log(this.data);

    //this.color = d3.scale.category20();

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom");

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .ticks(6)
        .orient("left");

    //Add axes visual elements
    this.svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("transform", "translate(250,0)")
        .attr("y", 5)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .style("font-size", 12);
        //.text("GDP Per Capita")

    //Brush legend visual elemen
    this.brush_legend = this.svg.append("g");

    this.brush_legend
        .append("rect")
        .style("fill", "steelblue")
        .attr("x", 320)
        .attr("y", 0)
        .attr("width", 40)
        .attr("height", 15)


    this.brush_legend
        .append("text")
        .text("Brush")
        .style("fill", "white")
        .attr("x", 280)
        .attr("y", 10);

    this.svg.append("g")
        .attr("class", "brush");

    //call the update method
    this.updateVis();
}


Histogram.prototype.brushed = function (data) {

    e = d3.event.target.extent();


    $(that.eventHandler).trigger("selectionChangedHistogram", {"selection": e});
}

Histogram.prototype.onSelectionChange = function (data) {
    this.data = data.features;
    this.dp = this.data;
    this.updateVis();
}

Histogram.prototype.onSelectionChangeScatter = function (s) {

    e = s.selection;
    //console.log(e);

    this.data = this.dp;
    var fil_data = this.data.filter(function (d) {
        var xs = parseInt(d.properties.pcap);
        var ys = parseFloat(d.properties.p1000);

        return xs > e[0][0] && xs < e[1][0] && ys > e[0][1] && ys < e[1][1];
    })

    if (fil_data.length > 1) {
        this.data = fil_data;
    }

    this.updateVis();
}
/**
 * the drawing function - should use the D3 selection, enter, exit
 */
Histogram.prototype.updateVis = function () {
    var that = this;

    //sort data
    //this.data_sort = this.data;
    // sorting data

    this.data_fil = this.data.filter(function (d) {
        return parseFloat(d.properties.gdp) > 0 && parseFloat(d.properties.gdp) > 0 && parseFloat(d.properties.p1000) > 0;
    });
    this.data = this.data_fil.sort(function (a, b) {
        return d3.descending(parseFloat(a.properties.gdp), parseFloat(b.properties.gdp))
    });


    //updates scales


    this.x.domain(this.data.map(function (d) {
        return d.properties.name;
    }));
    //this.y.domain(d3.extent(this.displayData, function(d){ return d.count;}));
    this.y.domain(d3.extent(this.data.map(function (d) {
        return parseFloat(d.properties.gdp);
    })));

    //this.color.domain(this.displayData.map(function(d) { return d.name}));
    //console.log(d3.extent(this.data.map(function(d){return d.properties.gdp[2010];})));

    this.ymin = d3.extent(this.data.map(function (d) {
        return parseFloat(d.properties.gdp);
    }))[0]

    //console.log(d3.extent(this.data.map(function(d){ return parseInt(d.properties.gdp[2010]);})));

    //this.max = d3.extent(this.data.map(function(d){return d.properties.gdp[2010];}))[1];
    //console.log(this.displayData);
    //console.log(d3.extent(this.displayData, function(d){ return d.count;}));
    // updates axis


    this.svg.select(".y.axis")
        .call(this.yAxis);

    //Data join
    var bar = this.svg.selectAll(".bar")
        .data(this.data, function (d) {
            return d.properties.name;
        });

    // Append new bar groups
    var bar_enter = bar.enter().append("g")
        .on('mouseover', function (d) {
            $(that.eventHandler).trigger("geoCountrySelect", d.properties.name);
            console.log(d.properties.name);
        })
        .on('mouseout', function (d) {
            $(that.eventHandler).trigger("countryRank", "s");
        });

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect");
    bar_enter.append("text");

    // Add attributes (position) to all bars
    bar
        .attr("class", "bar")
        .transition()
        .attr("transform", function (d, i) {
            return "translate(" + (that.x(d.properties.name)) + ",0)";
        });

    //Remove the extra bars
    //bar.exit()
    //.remove();


    // Update all the inner rects
    bar.select("rect").transition()
        .attr("x", 0)
        .attr("y", function (d) {
            return that.y(d.properties.gdp) - 5;
        })
        .style("fill", "steelblue")
        .attr("width", this.x.rangeBand())
        .attr("height", function (d, i) {
            return that.y(that.ymin) - that.y(d.properties.gdp) + 5;
        });

    var text_pos = that.y(0) - 10;

    bar.select("text")
        .transition().duration(0)
        .text(function (d) {
            return d.properties.name;
        })
        .attr("text-anchor", "end")
        .attr("transform", function (d) {
            return "translate(" + (that.x.rangeBand() / 2) + "," + (that.y(that.ymin) + 4) + ")rotate(270)"
        })
        .style("font-size", function () {
            if (that.x.rangeBand() > 12) {
                return 12;
            } else {
                return that.x.rangeBand()
            }
        });

    this.brush.x(this.x);

    this.svg.select(".brush")
        .call(this.brush)
        .selectAll("rect")
        .attr("height", this.height + 5);

    bar.exit().transition().remove();


}





