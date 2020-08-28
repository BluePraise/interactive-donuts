const data = d3.json("data.json");
d3.select('svg')
    .data(data)
    .enter()
    .append('g')
    .text(d.data.name);