const drawDiagram = (valuefield) => {
    d3.select("#svg-component").remove();
    const tooltip = d3.select(".tooltip").style("opacity", 0);
    const format = d3.format(",d");
    const width = 600;
    const radius = width / 6;
    const valueField = valuefield;
    const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const partition = data => {
        const root = d3.hierarchy(data)
                .sum(d => d[valueField])
                .sort((a, b) => b.value - a.value);
        return d3.partition()
                .size([2 * Math.PI, root.height + 1])
                (root);
    }
    const data = {
     "name": "",
     "children": [
        {
          "name": "Dedicated Conservation",
          "classname": "dedicated",
          "children": [
            {"name": "Global protected areas", "lower": 149, "upper": 192, "classname": "dedicated",},
            {"name": "Coastal ecosystems", "lower": 27, "upper": 37, "classname": "dedicated",},
          ],
        },
        {
          "name": "Mainstreaming Biodiversity",
          "classname": "mainstreaming",
          "children": [
            {"name": "Sustainable croplands", "lower": 315, "upper": 420, "classname": "mainstreaming"},
            {"name": "Sustainable rangelands", "lower": 81, "upper": 81, "classname": "mainstreaming"},
            {"name": "Biodiversity in urban environments", "lower": 73, "upper": 73, "classname": "mainstreaming"},
            {"name": "Invasive species management", "lower": 36, "upper": 84, "classname": "mainstreaming"},
            {"name": "Sustainable fisheries", "lower": 23, "upper": 47, "classname": "mainstreaming"},
            {"name": "Sustainable forestry", "lower": 19, "upper": 32, "classname": "mainstreaming"},
          ],
        }
     ]
    };

    const root = partition(data);
    const color = d3.scaleOrdinal([`#387c85`, `#f29ebe`]);


    root.each(d => d.current = d);

    const svg = d3.select('#partitionSVG').append('svg')
            .attr("id", "svg-component")
            .style("width", "100%")
            .style("height", "700px")
            .style("font", "10px sans-serif");

    const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${width / 2})`);

            console.log(root.descendants().filter(d => !d.parent)[0]);

    const path = g.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                while (d.depth > 1)
                    d = d.parent;
                return color(d.data.name);
            })
            .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 1 : 0) : 0)
            .attr("d", d => arc(d.current))
            // .classed('hidden', function(d) {
            //   if (!d.children) {
            //     return true;
            //   }
            // })
            // .style("display", function(d) {
            //     if (d.depth > 1) {
            //       return "none";//nodes whose depth is more than 1 make its vanish
            //     } else {
            //       return "";
            //     }
            //   });

    // path.filter(d => !d.children).style('display', 'none')
    path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", clicked);


    path.on("mouseover", function(d) {
              tooltip.transition()
                  .duration(200)
                  .style("opacity", 1);
              tooltip.html(
              `<p>${d.data.name}</p>`
                  )
                  .style("left", (d3.event.pageX - 10) + "px")
                  .style("top", (d3.event.pageY) + "px")
                  if (tooltip.classed('dedicated') && d.data.classname !== 'dedicated') {
                    tooltip.classed('dedicated', false);
                    tooltip.classed('mainstreaming', true);
                  } else if (tooltip.classed('mainstreaming') && d.data.classname !== 'mainstreaming') {
                    tooltip.classed('mainstreaming', false);
                    tooltip.classed('dedicated', true);
                  } else {
                    tooltip.classed(d.data.classname, true);
                  }
              })

          .on("mouseout", function(d) {
              tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
          });



    const label = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
            .attr("class", function(d){
              return d.data.classname;
              })
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +labelVisible(d.current))
            .attr("transform", d => labelTransform(d.current))
            .text(d => d.value)
            // .classed('hidden', function(d) {
            //   if (!d.children) {
            //     return true;
            //   }
            // })
            // .style("display", function(d) {
            //     console.log(d);
            //     if (d.depth > 1) {
            //       return "none";//nodes whose depth is more than 1 make its vanish
            //     } else {
            //       return "";
            //     }
            //   });

    const parent = g.append("circle")
            .datum(root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", clicked);

    function clicked(p) {
        parent.datum(p.parent || root);

        root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            })

        const t = g.transition().duration(750);

        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path.transition(t)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .filter(function (d) {
                    return +this.getAttribute("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
                .attrTween("d", d => () => arc(d.current));

        label.filter(function (d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
    }

    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

  }

  const onValueFieldChange = (value) => {
     drawDiagram(value);
  }
  drawDiagram('lower');
