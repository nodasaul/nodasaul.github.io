Choropleth = function (_parentElement, _data, _eventHandler) {

    this.parentElement = _parentElement;
    this.data = _data.features;
    this.eventHandler = _eventHandler;
    this.dp = this.data;
    //define all constants
    this.margin = {top: 50, right: 0, bottom: 0, left: 0},
        this.width = 878 - this.margin.left - this.margin.right,
        this.height = 500 - this.margin.top - this.margin.bottom;

    this.initVis();
}

Choropleth.prototype.initVis = function () {
    // constructs SVG layout

    this.svg = this.parentElement.select("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    //Define map projection
    this.projection = d3.geo.equirectangular()
        .translate([this.width / 2 + 20, this.height / 2 + 40])
        .scale([this.width / 6.5]);

    //Color
    //this.color = d3.scale.quantize()
    //.range(["rgb(237,248,233)", "rgb(186,228,179)",
    //"rgb(116,196,118)", "rgb(49,163,84)","rgb(0,109,44)"]);

    this.color = d3.scale.linear()
        .domain([40, 60, 70, 75, 80])
        .range(["Red", "orange", "lightgreen", "green", "DeepSkyBlue"]);

    //Define path generator
    this.path = d3.geo.path()
        .projection(this.projection);

    this.x = d3.scale.ordinal()
        .rangeRoundBands([0, 540], .2);

    that = this;
    //call the update method
    this.updateVis();

}

Choropleth.prototype.onSelectionChange = function (data) {
    this.data = data.features;
    this.updateVis();
}

Choropleth.prototype.onSelectionChangeHistogram = function (s) {

    that = this;
    e = s.selection;
    this.data = this.dp;

    this.data_fil = this.data.filter(function (d) {
        return parseFloat(d.properties.gdp) > 0 && parseFloat(d.properties.gdp) > 0 && parseFloat(d.properties.p1000) > 0;
    });
    this.data_sort = this.data_fil.sort(function (a, b) {
        return d3.descending(parseFloat(a.properties.gdp), parseFloat(b.properties.gdp))
    });


    //updates scales


    this.x.domain(this.data_sort.map(function (d) {
        return d.properties.name;
    }));

    this.fil_data = that.data.filter(function (d) {
        var xs = that.x(d.properties.name);

        //console.log(that.x);

        return xs >= e[0] && xs <= e[1];
    })

    this.updateSelection();
}

Choropleth.prototype.onSelectionChangeScatter = function (s) {

    e = s.selection;
    //console.log(e);

    that = this;
    this.data = this.dp;
    this.fil_data = that.data.filter(function (d) {
        var xs = parseInt(d.properties.pcap);
        var ys = parseFloat(d.properties.p1000);

        return xs > e[0][0] && xs < e[1][0] && ys > e[0][1] && ys < e[1][1];
    })


    this.updateSelection();


}

Choropleth.prototype.updateVis = function () {
    var that = this;

    //this.color.domain(d3.extent(this.data.map(function(d){return d.properties.LE[2012]})));


    /*var legend_LE = this.svg.append("text")
        .text("Life Expectancy")
        .attr("x", 50)
        .attr("y", 32);*/

    var legend = this.svg.selectAll(".legend")
        .data([50, 55, 60, 65, 70, 75, 80])


    legend
        .enter()
        .append("g")


    legend.append("rect");
    legend.append("text");

    legend
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(" + (170 + i * 70) + "," + 25 + ")";
        })

    legend.select("rect")
        .style("fill", function (d) {
            return that.color(d);
        })
        .attr("width", 40)
        .attr("height", 8);

    legend.select("text")
        .text(function (d) {
            return d;
        })
        .attr("x", 15)
        .attr("y", -2)


    this.path1 = this.svg.selectAll(".geo")
        .data(this.data)

    this.path1.enter()
        .append("path")
        .attr("class", "geo")
        .on('mouseover', function (d) {
            $(that.eventHandler).trigger("geoCountrySelect", d.properties.name);
            console.log(d.properties.name);

        })
        .on('mouseout', function (d) {
            $(that.eventHandler).trigger("countryRank", "s");
        })


    this.path1
        .attr("d", this.path);


    this.path1.transition()
    //.attr("stroke", "blue")
    //.attr("stroke-width", 1)
        .style("fill", function (d) {
            //Get data value
            var value = d.properties.LE;


            if (value > 0) {
                //If value exists…
                return that.color(value);
            } else {
                //If value is undefined…
                return "#ccc";
            }
        });

    this.text = this.svg.selectAll(".subunit-label")
        .data(this.data)

    this.text
        .enter().append("text")
        .attr("class", "subunit-label")

    this.text.transition()
        .attr("transform", function (d) {
            return "translate(" + that.path.centroid(d) + ")";
        })
        .attr("dy", ".35em")
        .text(function (d) {
            return d.properties.name;
        });


}

Choropleth.prototype.updateSelection = function () {

    that = this;
    if (that.fil_data.length > 0) {

        this.path1.classed("geo-unselect", function (p) {
            var check = that.fil_data.filter(function (f) {
                return f.properties.name == p.properties.name;
            })

            if (check.length == 1) {
                return false;
            }
            else {
                return true;
            }
        });

        //console.log(this.text);

        this.text.classed("geo-text-select", function (p) {
            //console.log("check");
            var check2 = that.fil_data.filter(function (f) {
                return f.properties.name == p.properties.name;
            })

            if (check2.length == 1) {
                return true;
            }
            else {
                return false;
            }
        });


    }
    else {
        this.path1.classed("geo-unselect", false);
        this.text.classed("geo-text-select", false);
    }
}
