loadData();

function loadData() {
  d3.json("data-graph2.json").then((data) => {
    drawDiagram("current lower", data);
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

  const arcs = pie(valueField)(data.children.slice(0, -1));

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

  g.selectAll("path")
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
    .text((d) => (d.value > 2 ? d.value : ""));

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
      const arcs = pie(valueField)(data.children);

      const arc = d3.arc().innerRadius(0.8).outerRadius(arcOuterRadius);

      const color = d3.scaleOrdinal(["#387c85", "#f29ebe"]);

      newPath = path
        .data(arcs)
        .join("path")
        .attr("fill", (d) => {
          return color(d.data.classname);
        });

      newPath
        .transition()
        .duration(750)
        .attrTween("d", function (d) {
          var i = d3.interpolate(d.startAngle, d.endAngle);
          return function (t) {
            d.endAngle = i(t);
            return arc(d);
          };
        });

      const newLabel = label.data(arcs).join("text");

      newLabel
        .attr("fill", (d) => {
          if (d.data.classname == "dedicated") {
            return "#387c85";
          }
          return "#f29ebe";
        })
        .attr("transform", (d) => {
          return `translate(${arcLabel().centroid(d)})`;
        })
        .transition()
        .duration(500)
        .text((d) => (d.value > 10 ? d.value : ""));

      newPath
        .on("mouseover", onTooltipMouseOver)
        .on("mousemove", onTooltipMouseMove)
        .on("mouseout", onTooltipMouseOut);

      isDonutShowed = true;
    }
  }

  function onTooltipMouseOver(d) {
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html(`<p>${d.data.name}<br>${d.value}</p>`);
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
  }

  function onTooltipMouseOut(d) {
    showDonutTimeout = setTimeout(showDonut, ANIMATION_TIMEOUT);
    tooltip.transition().duration(500).style("opacity", 0);
  }
}
