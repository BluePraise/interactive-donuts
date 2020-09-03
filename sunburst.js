loadData();

function loadData() {
  d3.json("data.json").then((data) => {
    drawDiagram("lower", data);
  });
}

function drawDiagram(valueField, data, cb) {
  d3.select("#svg-component").remove();
  const tooltip = d3.select(".tooltip").style("opacity", 0);
  const format = d3.format(",d");
  const width = 600;
  const radius = width / 1.5;
  const ANIMATION_TIMEOUT = 5000;

  const hierarchy = d3
    .hierarchy(data)
    .sum((d) => {
      return d[valueField];
    })
    .sort((a, b) => b.value - a.value);

  const partition = d3.partition().size([2 * Math.PI, radius]);

  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle(0.04)
    .padRadius(radius * 0.15)
    .innerRadius(function (d) {
      if (d.depth == 1) {
        return radius * 1.205 - d.y1;
      }
      return radius - d.y1 + 1;
    })
    .outerRadius(function (d) {
      if (d.depth == 1) {
        return radius - d.y0 + 10;
      }
      return radius * 1.2 - d.y0;
    });

  const root = partition(hierarchy);
  const color = d3.scaleOrdinal(["#387c85", "#f29ebe"]);

  root.each((d) => {
    d.current = d;
  });

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
    });

  path
    .filter((d) => !d.children)
    .transition()
    .delay(function (d, i) {
      return i * 500;
    })
    .duration(500)
    .attrTween("d", function (d) {
      var i = d3.interpolate(d.x0, d.x1);
      return function (t) {
        d.x1 = i(t);
        return arc(d);
      };
    });

  path.style("cursor", "pointer");

  let showTotalTimeout = setTimeout(showTotal, ANIMATION_TIMEOUT);
  let showTotalTimeoutCallCount = 0;

  path
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<p>${d.data.name}</p>`);
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
    .on("mousemove", function (d) {
      tooltip
        .style("left", () => {
          // let left = arc.centroid(d)[0];
          return `${d3.event.layerX + 10}px`;
        })
        .style("top", () => {
          // let top = arc.centroid(d)[1];
          return `${d3.event.layerY + 10}px`;
        });
      clearTimeout(showTotalTimeout);
    })
    .on("mouseout", function (d) {
      showTotalTimeout = setTimeout(showTotal, ANIMATION_TIMEOUT);
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
    .attr("transform", (d) => labelTransform(d));

  label
    .filter((d) => !d.children)
    .transition()
    .delay(function (d, i) {
      return i * 500;
    })
    .duration(500)
    .text((d) => d.value);

  d3.selectAll("input[name='valuefield']").on("click", function () {
    root.sum((d) => d[this.value]);
    partition(root);

    path.transition().duration(750).attr("d", arc);

    label
      .transition()
      .duration(750)
      .text((d) => d.value)
      .attr("transform", (d) => labelTransform(d.current));
  });

  function showTotal() {
    if (!showTotalTimeoutCallCount) {
      path
        .filter((d) => d.children)
        .transition()
        .delay(function (d, i) {
          return i * 500;
        })
        .duration(500)
        .attrTween("d", function (d) {
          var i = d3.interpolate(d.x0, d.x1);
          return function (t) {
            d.x1 = i(t);
            return arc(d);
          };
        });

      label
        .filter((d) => d.children)
        .transition()
        .delay(function (d, i) {
          return i * 500;
        })
        .duration(500)
        .text((d) => d.value);

      showTotalTimeoutCallCount++;
    }
  }

  function labelTransform(d) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = radius - (d.y0 + d.y1) / 2.5;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
}
