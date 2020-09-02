d3.json("data-graph3.json").then((data) => {
  drawDiagram("upper", data);
});

function drawDiagram(valueField, data) {
  d3.select("#svg-component").remove();
  const tooltip = d3.select(".tooltip").style("opacity", 0);
  const width = 600;
  const height = 600;
  const radius = width / 6;
  const arcOuterRadius = radius * 2.5;
  const ANIMATION_TIMEOUT = 4000;

  const pie = (val) =>
    d3
      .pie()
      .sort(null)
      .padAngle(0.005)
      .value((d) => {
        return d[val];
      });

  const arcs = pie(valueField)(data.children[0].children);

  const arc = d3.arc().innerRadius(0.8).outerRadius(arcOuterRadius);

  const color = d3.scaleOrdinal(["#387c85", "#f29ebe"]);

  const svg = d3
    .select("#partitionSVG")
    .append("svg")
    .attr("id", "svg-component")
    .style("width", "100%")
    .style("height", "700px");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${width / 2})`);

  const path = g
    .append("g")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", (d) => {
      return color();
    });
  // .attr("d", arc);

  path
    .transition()
    .delay(function (d, i) {
      return i * 400;
    })
    .duration(500)
    .attrTween("d", function (d) {
      var i = d3.interpolate(d.startAngle, d.endAngle);
      return function (t) {
        d.endAngle = i(t);
        return arc(d);
      };
    });

  path.style("cursor", "pointer").on("click", clicked);

  // const timer = d3.timer(clicked, 10000);
  const donutTimeout = setTimeout(clicked, ANIMATION_TIMEOUT);

  let donutLabel, donutPath;

  path.on("mouseover", tooltipMouseOver).on("mouseout", tooltipMouseOut);

  const label = g
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(arcs)
    .join("text");

  label
    .attr("fill", (d) => color(1))
    .attr("transform", (d) => {
      return `translate(${arcLabel().centroid(d)})`;
    })
    .transition()
    .delay(function (d, i) {
      return i * 450;
    })
    .duration(500)
    .text((d) => d.value);

  d3.selectAll("input[name='valuefield']").on("click", function () {
    const arcs = pie(this.value)(data.children[0].children);
    const path = g
      .selectAll("path")
      .data(arcs)
      .join("path")
      .transition()
      .duration(500)
      .attr("d", arc);

    const label = g
      .selectAll("text")
      .data(arcs)
      .join("text")
      .transition()
      .duration(500)
      .attr("transform", (d) => {
        return `translate(${arcLabel().centroid(d)})`;
      })
      .text((d) => d.value);
  });

  function arcLabel() {
    return d3
      .arc()
      .innerRadius(arcOuterRadius * 0.5)
      .outerRadius(arcOuterRadius);
  }

  function arcLabel2() {
    return d3
      .arc()
      .innerRadius(radius * 2.5)
      .outerRadius(arcOuterRadius + 1);
  }

  function clicked(p) {
    const donutArcs = pie("upper")(data.children[1].children);
    const donutArc = d3
      .arc()
      .innerRadius(arcOuterRadius * 0.75)
      .outerRadius(arcOuterRadius);

    donutPath = g.append("g").selectAll("path").data(donutArcs).join("path");

    donutPath
      .transition()
      .attr("fill", "#f29ebe")
      .attr("fill-opacity", 1)
      .delay(function (d, i) {
        return i * 400;
      })
      .duration(500)
      .attrTween("d", function (d) {
        var i = d3.interpolate(d.startAngle, d.endAngle);
        return function (t) {
          d.endAngle = i(t);
          return donutArc(d);
        };
      });

    donutLabel = g
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(donutArcs)
      .join("text");

    donutLabel
      .attr("transform", (d) => {
        return `translate(${donutArc.centroid(d)})`;
      })
      .attr("fill-opacity", 1)
      .transition()
      .delay(function (d, i) {
        return i * 450;
      })
      .duration(500)
      .attr("dy", "0.35em")
      .attr("fill", (d) => color())
      .text((d) => d.value);

    donutPath.on("mouseover", tooltipMouseOver).on("mouseout", tooltipMouseOut);

    const newArc = d3
      .arc()
      .innerRadius(0.8)
      .outerRadius(arcOuterRadius * 0.75);

    path.transition().duration(750).attr("d", newArc);
    label
      .transition()
      .duration(750)
      .attr("dy", "0.35em")
      .attr("transform", (d) => {
        return `translate(${newArc.centroid(d)})`;
      })
      .style("font-size", "15px");

    const substractTimeout = setTimeout(substract, ANIMATION_TIMEOUT);
  }

  function substract() {
    const donutArcs = pie("upper")(data.children[1].children);

    donutPath.transition().duration(750).attr("fill-opacity", 0);

    donutLabel.transition().duration(750).attr("fill-opacity", 0);

    label.each((d, i) => console.log(d.value - donutLabel.data()[i].value));

    // label.text((d) => console.log(d));

    console.log(label.data());
    console.log(label.each((i) => console.log(i)));

    donutPath.on("mouseover", null).on("mouseout", null);
  }

  function tooltipMouseOver(d) {
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip
      .html(`<p>${d.data.name}</p>`)
      .style("left", () => {
        let left;
        if (d.data.lower) {
          left = arcLabel().centroid(d)[0];
        } else {
          left = arcLabel2().centroid(d)[0];
        }

        return left + 300 + "px";
      })
      .style("top", () => {
        let top;
        if (d.data.lower) {
          top = arcLabel().centroid(d)[1];
        } else {
          top = arcLabel2().centroid(d)[1];
        }
        return top + 300 + "px";
      });
    if (tooltip.classed("dedicated") && d.data.classname !== "dedicated") {
      tooltip.classed("dedicated", false);
      tooltip.classed("mainstreaming", true);
    } else if (
      tooltip.classed("mainstreaming") &&
      d.data.classname !== "mainstreaming"
    ) {
      tooltip.classed("mainstreaming", false);
      tooltip.classed("dedicated", true);
    } else {
      tooltip.classed(d.data.classname, true);
    }
  }

  function tooltipMouseOut(d) {
    tooltip.transition().duration(500).style("opacity", 0);
  }
}
