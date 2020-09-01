d3.json("data-graph3.json").then((data) => {
  drawDiagram("upper", data);
});

function drawDiagram(valueField, data) {
  d3.select("#svg-component").remove();
  const tooltip = d3.select(".tooltip").style("opacity", 0);
  const format = d3.format(",d");
  const width = 600;
  const height = 600;
  const radius = width / 6;

  const pie = (val) =>
    d3
      .pie()
      .sort(null)
      .padAngle(0.005)
      .value((d) => {
        return d[val];
      });

  const arcs = pie(valueField)(data.children[0].children);

  const arc = d3
    .arc()
    .innerRadius(0.8)
    .outerRadius(radius * 2.5);

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

  function clicked(p) {
    const arcs = pie("upper")(data.children[1].children);
    const donutArc = d3
      .arc()
      .innerRadius(radius * 2.5)
      .outerRadius(radius * 3);

    const path = g
      .append("g")
      .selectAll("path")
      .data(arcs)
      .join("path")
      .transition()
      .duration(500)
      .attr("fill", "#f29ebe")
      .attr("d", donutArc);

    const label = g
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(arcs)
      .join("text")
      .attr("fill", (d) => color())
      .attr("transform", (d) => {
        return `translate(${arcLabel2().centroid(d)})`;
      })
      .text((d) => d.value);
  }

  path
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(`<p>${d.data.name}</p>`)
        .style("left", () => {
          let left = arc.centroid(d)[0];

          if (d.depth < 2) {
            return left + 300 + "px";
          } else {
            return left + 300 + "px";
          }
        })
        .style("top", () => {
          let top = arc.centroid(d)[1];
          if (d.depth < 2) {
            return top + 300 + "px";
          } else {
            return top + 300 + "px";
          }
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
    })
    .on("mouseout", function (d) {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  const label = g
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(arcs)
    .join("text")
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
    const rds = radius * 2;
    return d3.arc().innerRadius(rds).outerRadius(rds);
  }

  function arcLabel2() {
    return d3
      .arc()
      .innerRadius(radius * 2.5)
      .outerRadius(radius * 3);
  }
}
