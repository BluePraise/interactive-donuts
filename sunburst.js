const drawDiagram = (valueField, data, cb) => {
  d3.select("#svg-component").remove();
  const tooltip = d3.select(".tooltip").style("opacity", 0);
  const format = d3.format(",d");
  const width = 600;
  const radius = width / 6;
  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius((d) => d.y0 * radius)
    .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

  const hierarchy = d3
    .hierarchy(data)
    .sum((d) => {
      return d[valueField];
    })
    .sort((a, b) => b.value - a.value);

  const partition = d3.partition().size([2 * Math.PI, hierarchy.height + 1]);

  partition(hierarchy);
  const color = d3.scaleOrdinal(["#387c85", "#f29ebe"]);

  hierarchy.each((d) => (d.current = d));

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
    .data(hierarchy.descendants().slice(1))
    .join("path")
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", (d) =>
      arcVisible(d.current) ? (d.children ? 1 : 0) : 0
    )
    .attr("d", arc);

  path
    .filter((d) => d.children)
    .style("cursor", "pointer")
    .on("click", clicked);

  path
    .on("mouseover", function (d) {
      tooltip
        .filter((d) => +this.getAttribute("fill-opacity"))
        .transition()
        .duration(200)
        .style("opacity", 1);
      tooltip
        .filter((d) => +this.getAttribute("fill-opacity"))
        .html(`<p>${d.data.name}</p>`)
        .style("left", d3.event.pageX - 10 + "px")
        .style("top", d3.event.pageY + "px");
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
    .data(hierarchy.descendants().slice(1))
    .join("text")
    .attr("class", function (d) {
      return d.data.classname;
    })
    .attr("dy", "0.35em")
    .attr("fill-opacity", (d) =>
      +labelVisible(d.current) ? (d.children ? 1 : 0) : 0
    )
    .attr("transform", (d) => labelTransform(d.current))
    .text((d) => d.value);

  const parent = g
    .append("circle")
    .datum(hierarchy)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  function clicked(p) {
    parent.datum(p.parent || hierarchy);

    hierarchy.each(
      (d) =>
        (d.target = {
          x0:
            Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          x1:
            Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
            2 *
            Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth),
        })
    );

    const t = g.transition().duration(750);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path
      .transition(t)
      .tween("data", (d) => {
        const i = d3.interpolate(d.current, d.target);
        return (t) => {
          d.current = i(t);
        };
      })
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", (d) =>
        arcVisible(d.target) ? (d.children ? 1 : 0.8) : 0
      )
      .attrTween("d", (d) => () => arc(d.current));

    label
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      })
      .transition(t)
      .attr("fill-opacity", (d) => (+labelVisible(d.target) ? 1 : 0))
      .attrTween("transform", (d) => () => labelTransform(d.current));
  }

  d3.selectAll("input[name='valuefield']").on("click", function (d, i) {
    hierarchy.sum((d) => d[this.value]);
    // drawDiagram(this.value, data);
    partition(hierarchy);

    path.transition().duration(750).attr("d", arc);

    label
      .transition()
      .duration(750)
      .text((d) => d.value)
      .attr("transform", (d) => labelTransform(d.current));
  });

  function arcTweenPath(a, i) {
    var oi = d3.interpolate({ x0: a.x0 + 0.1, x1: a.x1 + 0.1 }, a);

    function tween(t) {
      var b = oi(t);
      a.x0 = b.x0;
      a.x1 = b.x1;
      return arc(b);
    }

    return tween;
  }

  function arcTweenText(a, i) {
    var oi = d3.interpolate({ x0: a.x0s, x1: a.x1s }, a);
    function tween(t) {
      var d = oi(t);
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 100}) translate(${y},0) rotate(${
        x < 180 ? 0 : 180
      })`;
    }
    return tween;
  }

  function arcVisible(d) {
    return d.y1 <= 2 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = ((d.y0 + d.y1) / 2) * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
};

d3.json("data.json").then((data) => {
  drawDiagram("lower", data);
});
