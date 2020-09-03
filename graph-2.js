const colors = d3.scaleOrdinal(["#387c85", "#f29ebe"]);

let sizes = {
  innerRadius: 50,
  outerRadius: 100,
};

let durations = {
  entryAnimation: 2000,
};

d3.json("data2.json").then((data) => draw(data));

function draw(data) {
  d3.select("#chart").html("");

  const hierarchy = d3
    .hierarchy(data)
    .sum((d) => {
      return d.lower;
    })
    .sort((a, b) => b.value - a.value);

  const partition = d3.partition().size([2 * Math.PI, hierarchy.height + 1]);

  partition(hierarchy);
  //   let colors = colorbrewer.Spectral[hierarchy.descendants().slice(1).length];

  let generator = d3
    .pie()
    .sort(null)
    .value((d) => d.value);

  let chart = generator(hierarchy.descendants().slice(1));

  console.log();

  let arcs = d3
    .select("#chart")
    .append("g")
    .attr("transform", "translate(100, 100)")
    .selectAll("path")
    .data(chart)
    .enter()
    .append("path")
    // .style("fill", (d) => colors[d]);

    .attr("fill", (d) => {
      console.log();
      return colors(d.data.data.name);
    });

  let angleInterpolation = d3.interpolate(
    generator.startAngle()(),
    generator.endAngle()()
  );

  let innerRadiusInterpolation = d3.interpolate(0, sizes.innerRadius);
  let outerRadiusInterpolation = d3.interpolate(0, sizes.outerRadius);

  const arc = d3.arc();

  arcs
    .transition()
    .duration(durations.entryAnimation)
    .attrTween("d", (d) => {
      let originalEnd = d.endAngle;
      return (t) => {
        let currentAngle = angleInterpolation(t);
        if (currentAngle < d.startAngle) {
          return "";
        }

        d.endAngle = Math.min(currentAngle, originalEnd);

        return arc(d);
      };
    });

  d3.select("#chart")
    .transition()
    .duration(durations.entryAnimation)
    .tween("arcRadii", () => {
      return (t) =>
        arc
          .innerRadius(innerRadiusInterpolation(t))
          .outerRadius(outerRadiusInterpolation(t));
    });
}
