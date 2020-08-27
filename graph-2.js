// Variables
const width = 500;
const height = 500;
const radius = Math.min(width, height) / 2;
// const sizeIndicator = "size";

d3.json("data.json", function(error, data){
    if (error) throw error;
    
    const g = d3.select('svg')  
                    .attr('width', width)  
                    .attr('height', height)
                    .append('g') 
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const partition = d3.partition()
                        .size([2 * Math.PI, radius]);

    // Get the data from our JSON file
    d3.json("data.json", function(error, data) {
        if (error) throw error;

        const root = d3.hierarchy(data)
                        .sum(function (d) { return d.value; })
                        .sort(function(a, b) { return b.value - a.value; });
            
         // Calculate the size of each arc; save the initial angles for tweening.
        partition(root);
        
        const arc = d3.arc()
            .startAngle(function (d) { return d.x0 })
            .endAngle(function (d) { return d.x1 })
            .innerRadius(function (d) { return d.y0 })
            .outerRadius(function (d) { return d.y1 });
 
        // Add a <g> element for each node; create the slice variable since we'll refer to this selection many times

        const slice = g.selectAll('g')
                .data(root.children[1])
                .enter()
                .append('g')
                .attr("class", "node");
 
         // Append <path> elements and draw lines based on the arc calculations. Last, color the lines and the slices.
        slice.append('path')
            .attr("d", arc)
            .style('stroke', '#000')
            .style("fill", "#fff");
 
 
         // Populate the <text> elements with our data-driven titles.
        //  slice.append("text")
        //      .attr("transform", function(d) {
        //          return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"; })
        //      .attr("dx", "-20")
        //      .attr("dy", ".5em")
        //      .text(function(d) { return d.parent ? d.data.name : "" });
 
 
         // Redraw the Sunburst Based on User Input
        //  d3.selectAll(".sizeSelect").on("click", function(d,i) {
 
        //      // Determine how to size the slices.
        //      if (this.value === "upperlimit") {
        //        root.sum(function (d) { return d.value; });
        //      } else {
        //        root.count();
        //      }
 
        //      partition(root);
 
        //      slice.selectAll("path").transition().duration(750).attrTween("d", arcTweenPath);
        //      slice.selectAll("text").transition().duration(750).attrTween("transform", arcTweenText);
        //  });
     });


/**
 * When switching data: interpolate the arcs in data space.
 * @param {Node} a
 * @param {Number} i
 * @return {Number}
 */
function arcTweenPath(a, i) {

    var oi = d3.interpolate({ x0: a.x0s, x1: a.x1s }, a);

    function tween(t) {
        var b = oi(t);
        a.x0s = b.x0;
        a.x1s = b.x1;
        return arc(b);
    }

    return tween;
}


/**
 * When switching data: interpolate the text centroids and rotation.
 * @param {Node} a
 * @param {Number} i
 * @return {Number}
 */
function arcTweenText(a, i) {

    var oi = d3.interpolate({ x0: a.x0s, x1: a.x1s }, a);
    function tween(t) {
        var b = oi(t);
        return "translate(" + arc.centroid(b) + ")rotate(" + computeTextRotation(b) + ")";
    }
    return tween;
}

/**
 * Calculate the correct distance to rotate each label based on its location in the sunburst.
 * @param {Node} d
 * @return {Number}
 */
function computeTextRotation(d) {
    var angle = (d.x0 + d.x1) / Math.PI * 50;

    // Avoid upside-down labels
    return (angle < 120 || angle > 270) ? angle : angle + 180;  // labels as rims
    // return (angle < 180) ? angle - 90 : angle + 90;  // labels as spokes
}



});
 