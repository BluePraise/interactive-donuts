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
  const arcOuterRadius = radius * 2;
  const smallArcOuterRadius = arcOuterRadius * 0.75;
  const ANIMATION_TIMEOUT = 5000;
  let showLowerGapTimeout = setTimeout(showLowerGap, ANIMATION_TIMEOUT);
  let showFutureGapTimeout,
    lowerGapLabel,
    futurePath,
    futureLabel,
    isLowerGapShowed = false,
    isFutureGapShowed = false;

  const pie = (val) =>
    d3
      .pie()
      .padAngle(0.005)
      .value((d) => {
        return d[val];
      })
      .sort(null)
      .sortValues((a, b) => b - a);

  const arc = d3.arc().innerRadius(0.5).outerRadius(arcOuterRadius);

  const gapArc = d3.arc().innerRadius(0.8).outerRadius(arcOuterRadius);

  const color = d3.scaleOrdinal(
    ["mainstreaming", "dedicated"],
    ["#387c85", "#f29ebe"]
  );

  const svg = d3
    .select("#partitionSVG")
    .append("svg")
    .attr("id", "svg-component")
    .style("width", "100%")
    .style("height", "700px");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 3},${width / 2})`);

  g.append("text")
    .classed("caption", true)
    .attr("transform", `translate(0,${width / 2.5})`)
    .html(
      `Estimated <tspan fill='#387c85'>global biodiversity finance</tspan><tspan x="0" dy="1.5em"> (billion $) in 2019</tspan>`
    );

  const sort = (a, b) => b.value - a.value;

  const lowerData = pie(valueField)(data.children.slice(0, -1)).sort(sort);
  const lowerGapData = pie(valueField)(data.children).sort(sort);
  const futureData = pie("future lower")(data.children.slice(0, -1)).sort(sort);
  const futureGapData = pie("future lower")(data.children).sort(sort);

  const futureG = svg
    .append("g")
    .attr("transform", `translate(${width + 100},${width / 2})`);

  const lowerPath = g
    .append("g")
    .selectAll("path")
    .data(lowerData)
    .join("path")
    .attr("fill", (d) => {
      return color(d.data.classname);
    });

  lowerPath
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

  const lowerLabel = g
    .append("g")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(lowerData)
    .join("text")
    .attr("fill", (d) =>
      d.data.classname == "dedicated" ? "#387c85" : "#f29ebe"
    )
    .attr("transform", (d) => {
      return `translate(${arcLabel().centroid(d)})`;
    });

  lowerLabel
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

  d3.selectAll("path")
    .on("mouseover", onTooltipMouseOver)
    .on("mousemove", onTooltipMouseMove)
    .on("mouseout", onTooltipMouseOut);

  function showLowerGap(p) {
    isLowerGapShowed = true;

    const t = g.transition().duration(750);

    const lowerGapPath = g
      .select("g")
      .selectAll("path")
      .data(lowerGapData)
      .join(
        (enter) =>
          enter
            .append("path")
            .each((d) => {
              d.startAngleOld = d.startAngle;
              return (d.startAngle *= 0.95);
            })
            .attr("d", (d) => {
              console.log(d.startAngle, d.startAngleOld);
              return arc(d);
            })
            .call((enter) =>
              enter
                .transition(t)
                .each((d) => (d.startAngle = d.startAngleOld))
                .attr("d", arc)
                .attr("fill", (d) => {
                  return color(d.data.classname);
                })
            ),
        (update) =>
          update
            .each((d) => {
              d.startAngleOld = d.startAngle;
              return (d.startAngle *= 0.99);
            })
            .attr("d", arc)
            .call((update) =>
              update
                .each((d) => (d.startAngle = d.startAngleOld))
                .transition(t)
                .attr("d", arc)
                .attr("fill", (d) => {
                  return color(d.data.classname);
                })
            )
      );

    // lowerGapPath.filter((d) => d.value < 10).attr("d", arc);

    // lowerGapPath
    //   .transition()
    //   .duration(750)
    //   .attr("d", arc)
    //   .attrTween("d", function (d) {
    //     var i = d3.interpolate(d.startAngle, d.endAngle - 2);
    //     return function (t) {
    //       d.endAngle = i(t);
    //       return arc(d);
    //     };
    //   });

    g.select("text")
      .classed("caption", true)
      .html(
        `Estimated <tspan fill='#387c85'>global biodiversity finance</tspan> and <tspan fill='#f29ebe' x="0" dy="1.5em">biodiversity finance gap</tspan> (billion $) in 2019`
      );

    lowerGapPath
      .on("mouseover", onTooltipMouseOver)
      .on("mousemove", onTooltipMouseMove)
      .on("mouseout", onTooltipMouseOut);

    const lowerGapLabel = lowerLabel.data(lowerGapData).join("text");

    lowerGapLabel
      .attr("fill", (d) => {
        if (d.data.classname == "dedicated") {
          return "#387c85";
        }
        return "#f29ebe";
      })
      .attr("dy", "0.35em")
      .transition()
      .duration(750)
      .attr("transform", (d) => {
        return `translate(${arcLabel().centroid(d)})`;
      })
      .text((d) => (d.value > 10 ? d.value : ""));

    futureG
      .append("text")
      .classed("caption", true)
      .attr("fill", "#000")
      .attr("transform", `translate(0,${width / 2.5})`)
      .html(
        `Estimated <tspan fill='#387c85'>global biodiversity finance</tspan> <tspan x="0" dy="1.5em">(billion $) in 2030</tspan>`
      );

    futurePath = futureG
      .append("g")
      .selectAll("path")
      .data(futureData)
      .join("path")
      .attr("fill", (d) => {
        return color(d.data.classname);
      });

    futurePath
      .transition()
      .delay(function (d, i) {
        return i * 400;
      })
      .duration(500)
      .attrTween("d", function (d) {
        var i = d3.interpolate(d.startAngle, d.endAngle);
        return function (t) {
          d.endAngle = i(t);
          return gapArc(d);
        };
      });

    futurePath
      .on("mouseover", onTooltipMouseOver)
      .on("mousemove", onTooltipMouseMove)
      .on("mouseout", onTooltipMouseOut);

    futureLabel = futureG
      .append("g")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(futureData)
      .join("text")
      .attr("fill", (d) => {
        if (d.data.classname == "dedicated") {
          return "#387c85";
        }
        return "#f29ebe";
      });

    futureLabel
      .attr("transform", (d) => {
        return `translate(${arcLabel().centroid(d)})`;
      })
      .transition()
      .delay(function (d, i) {
        return i * 450;
      })
      .duration(500)
      .text((d) => (d.value > 10 ? d.value : ""));

    showFutureGapTimeout = setTimeout(showFutureGap, ANIMATION_TIMEOUT);
  }

  function showFutureGap(p) {
    isFutureGapShowed = true;

    const futureGapPath = futurePath
      .data(futureGapData)
      .join("path")
      .attr("fill", (d) => {
        return color(d.data.classname);
      });

    futureGapPath
      .transition()
      .duration(750)
      .attrTween("d", function (d) {
        var i = d3.interpolate(d.startAngle, d.endAngle);
        return function (t) {
          d.endAngle = i(t);
          return gapArc(d);
        };
      });

    futureG
      .select("text")
      .classed(".caption", true)
      .html(
        `Estimated <tspan fill='#387c85'>global biodiversity finance</tspan> and <tspan fill='#f29ebe' x="0" dy="1.5em">biodiversity finance gap</tspan> (billion $) in 2030`
      );

    futureGapPath
      .on("mouseover", onTooltipMouseOver)
      .on("mousemove", onTooltipMouseMove)
      .on("mouseout", onTooltipMouseOut);

    const futureGapLabel = futureLabel.data(futureGapData).join("text");

    futureGapLabel
      .attr("fill", (d) => {
        if (d.data.classname == "dedicated") {
          return "#387c85";
        }
        return "#f29ebe";
      })
      .attr("dy", "0.35em")
      .attr("transform", (d) => {
        return `translate(${arcLabel().centroid(d)})`;
      })
      .transition()
      .duration(500)
      .text((d) => (d.value > 15 ? d.value : ""));
  }

  function onTooltipMouseOver(event, d) {
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

  function onTooltipMouseMove(event, d) {
    tooltip
      .style("left", () => {
        return `${event.layerX + 10}px`;
      })
      .style("top", () => {
        return `${event.layerY + 10}px`;
      });

    if (!isLowerGapShowed) {
      clearTimeout(showLowerGapTimeout);
    }
    if (
      !isFutureGapShowed &&
      isLowerGapShowed &&
      d.value == d.data["future lower"]
    ) {
      clearTimeout(showFutureGapTimeout);
    }
  }

  function onTooltipMouseOut(event, d) {
    if (!isLowerGapShowed) {
      showLowerGapTimeout = setTimeout(showLowerGap, ANIMATION_TIMEOUT);
    }
    if (
      !isFutureGapShowed &&
      isLowerGapShowed &&
      d.value == d.data["future lower"]
    ) {
      showFutureGapTimeout = setTimeout(showFutureGap, ANIMATION_TIMEOUT);
    }
    tooltip.transition().duration(500).style("opacity", 0);
  }
}
