d3.json("data.json").then((data) => {
  drawDiagram("lower", data);
});

function drawDiagram(valueField, data, cb) {
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

  const root = partition(hierarchy);
  const color = d3.scaleOrdinal(["#387c85", "#f29ebe"]);

  root.each((d) => (d.current = d));

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
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", (d) => (arcVisible(d) ? (d.children ? 1 : 0) : 0));

  path
    .transition()
    .delay(function (d, i) {
      while (i < 2) {
        return i * 500;
      }
    })
    .duration(500)
    .attrTween("d", function (d) {
      var i = d3.interpolate(d.x0, d.x1);
      return function (t) {
        d.x1 = i(t);
        return arc(d);
      };
    });
  // .attr("d", (d) => arc(d));

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
        .style("left", () => {
          let left = arc.centroid(d)[0];
          if (d.target) {
            left = arc.centroid(d.target)[0];
          }
          if (Math.sign(left) == -1) {
            // left -= x;
          } else {
            // left += x;
          }
          if (d.depth < 2) {
            return left + 300 + "px";
          } else {
            return left + 300 + "px";
          }
        })
        .style("top", () => {
          let top = arc.centroid(d)[1];
          if (d.target) {
            top = arc.centroid(d.target)[1];
          }
          if (Math.sign(top) == -1) {
            // top -= y;
          } else {
            // top += y;
          }
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
    .data(root.descendants().slice(1))
    .join("text")
    .attr("class", function (d) {
      return d.data.classname;
    })
    .attr("dy", "0.35em")
    .attr("fill-opacity", (d) => (+labelVisible(d) ? (d.children ? 1 : 0) : 0))
    .attr("transform", (d) => labelTransform(d))
    .text((d) => d.value);

  const parent = g
    .append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  function clicked(p) {
    parent.datum(p.parent || root);

    root.each((d) => {
      d.target = {
        x0:
          Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1:
          Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth),
      };
      d.clicked = p;

      return d;
    });

    const t = g.transition().duration(750);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path
      .transition(t)
      .tween("data", (d) => {
        const i = d3.interpolate(d.current, d.target);
        return (t) => (d.current = i(t));
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
      .attr("fill-opacity", (d) => +labelVisible(d.target))
      .attrTween("transform", (d) => () => labelTransform(d.current));
  }

  d3.selectAll("input[name='valuefield']").on("click", function () {
    root.sum((d) => d[this.value]);
    partition(root);

    let isTarget = null;

    root.each((d) => {
      if (d.clicked) {
        isTarget = d.target;
        d.target = {
          x0:
            Math.max(
              0,
              Math.min(1, (d.x0 - d.clicked.x0) / (d.clicked.x1 - d.clicked.x0))
            ) *
            2 *
            Math.PI,
          x1:
            Math.max(
              0,
              Math.min(1, (d.x1 - d.clicked.x0) / (d.clicked.x1 - d.clicked.x0))
            ) *
            2 *
            Math.PI,
          y0: Math.max(0, d.y0 - d.clicked.depth),
          y1: Math.max(0, d.y1 - d.clicked.depth),
        };
      }
      return d;
    });

    if (!isTarget) {
      path
        .transition()
        .duration(750)
        .attr("d", (d) => arc(d.current));

      label
        .transition()
        .duration(750)
        .text((d) => d.value)
        .attr("transform", (d) => labelTransform(d.current));
    } else {
      path
        .transition()
        .duration(750)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => (d.current = i(t));
        })
        .attrTween("d", (d) => () => {
          return arc(d.current);
        });

      label
        .transition()
        .duration(750)
        .text((d) => {
          return d.value;
        })
        .attrTween("transform", (d) => () => labelTransform(d.current));
    }
  });

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
}
