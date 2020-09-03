loadData();

function loadData() {
  d3.json("data-graph3.json").then((data) => {
    drawDiagram("upper", data);
  });
}

function drawDiagram(valueField, data) {
  d3.select("#svg-component").remove();
  const tooltip = d3.select(".tooltip").style("opacity", 0);
  const width = 600;
  const height = 600;
  const radius = width / 6;
  const arcOuterRadius = radius * 2.5;
  const smallArcOuterRadius = arcOuterRadius * 0.75;
  const ANIMATION_TIMEOUT = 5000;
  let showDonutTimeout = setTimeout(showDonut, ANIMATION_TIMEOUT);
  let hideDonutTimeout;
  let donutLabel,
    donutPath,
    isDonutShowed = false,
    isDonutHidden = false;

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

  path
    .on("mouseover", onTooltipMouseOver)
    .on("mousemove", onTooltipMouseMove)
    .on("mouseout", onTooltipMouseOut);

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

  function arcLabel() {
    return d3
      .arc()
      .innerRadius(arcOuterRadius * 0.5)
      .outerRadius(arcOuterRadius);
  }

  function smallArcLabel() {
    return d3
      .arc()
      .innerRadius(0.5)
      .outerRadius(smallArcOuterRadius * 1.5);
  }

  function showDonut(p) {
    if (!isDonutShowed) {
      const donutArcs = pie("upper")(data.children[1].children);
      const donutArc = d3
        .arc()
        .innerRadius(smallArcOuterRadius)
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

      donutPath
        .on("mouseover", onTooltipMouseOver)
        .on("mousemove", onTooltipMouseMove)
        .on("mouseout", onTooltipMouseOut);

      const newArc = d3
        .arc()
        .innerRadius(0.8)
        .outerRadius(smallArcOuterRadius - 2);

      path.transition().duration(750).attr("d", newArc);
      label
        .transition()
        .duration(750)
        .attr("dy", ".33em")
        .attr("transform", (d) => {
          return `translate(${smallArcLabel().centroid(d)})`;
        })
        .style("font-size", "15px");

      hideDonutTimeout = setTimeout(hideDonut, ANIMATION_TIMEOUT);

      isDonutShowed = true;
    }
  }

  function hideDonut() {
    if (!isDonutHidden) {
      const donutArcs = pie("upper")(data.children[1].children);

      donutPath.transition().duration(750).attr("fill-opacity", 0);

      donutLabel.transition().duration(750).attr("fill-opacity", 0);
      donutPath.on("mouseover", null).on("mouseout", null);

      isDonutHidden = true;
    }
  }

  function onTooltipMouseOver(d) {
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
  }

  function onTooltipMouseMove(d) {
    tooltip
      .style("left", () => {
        return `${d3.event.layerX + 10}px`;
      })
      .style("top", () => {
        return `${d3.event.layerY + 10}px`;
      });

    clearTimeout(showDonutTimeout);
    if (isDonutShowed) {
      clearTimeout(hideDonutTimeout);
    }
  }

  function onTooltipMouseOut(d) {
    showDonutTimeout = setTimeout(showDonut, ANIMATION_TIMEOUT);
    if (isDonutShowed) {
      hideDonutTimeout = setTimeout(hideDonut, ANIMATION_TIMEOUT);
    }
    tooltip.transition().duration(500).style("opacity", 0);
  }
}
