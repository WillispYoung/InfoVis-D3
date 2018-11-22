const width = $(document).width();
const height = $(document).height();
const scale = d3.scaleOrdinal(d3.schemeCategory10);

function forceSimulation(nodes, links) {
    return d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter());
}

function drag(simulation) {
    return d3.drag()
        .on("start", function(d) {
            if (!d3.event.active)
                simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", function(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        })
        .on("end", function(d) {
            if (!d3.event.active)
                simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        });
}

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .call(
        d3.zoom().on("zoom", function() {
            svg.attr("transform", d3.event.transform);
        })
    );

d3.json("data/miserables.json").then(function(data) {
    var nodes = data.nodes.map(d => Object.create(d));
    var links = data.links.map(d => Object.create(d));

    const link = svg.append("g")
        .attr("stroke-opacity", 0.6)
        .attr("stroke", "#666")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill", d => scale(d.group));

    var degree = new Map();

    node.each(function(d) {
        if (!degree.has(d.id))
            degree.set(d.id, 0);
    });

    link.each(function(d) {
        degree.set(d.source, degree.get(d.source) + 1);
        degree.set(d.target, degree.get(d.target) + 1);
    });

    // labels are associated with nodes
    const label = svg.append("g")
        .attr("stroke", "#222")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(function(d) { if (degree.get(d.id) >= 10) return d.id; })
        .attr("dx", 12)
        .style("font-size", "10px");

    // update node and label position, also link's
    const simulation = forceSimulation(nodes, links)
        .on("tick", function() {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label.attr("x", d => d.x)
                .attr("y", d => d.y);
        });

    node.call(drag(simulation))
        .on("mouseover", function(d, i) {
            d3.select(this)
                .style("cursor", "hand")
                .attr("r", 7);
            if (degree.get(d.id) < 10) {
                label.each(function(d_) {
                    if (d_.id == d.id)
                        d3.select(this).text(d.id);
                });
            }
        })
        .on("mouseout", function(d, i) {
            d3.select(this)
                .attr("r", 5);
            if (degree.get(d.id) < 10) {
                label.each(function(d_) {
                    if (d_.id == d.id)
                        d3.select(this).text("");
                });
            }
        });
});