var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height")-100;

var formatNumber = d3.format(",.0f"),
  format = function(d) {
    return formatNumber(d) + " times";
  },
  color = d3.scaleOrdinal(d3.schemeCategory10);

var sankey = d3
  .sankey()
  .nodeWidth(15)
  .nodePadding(10)
  .extent([[1, 1], [width - 1, height - 6]]);

var link = svg
  .append("g")
  .attr("class", "links")
  .attr("fill", "none")
  .attr("stroke", "#000")
  .attr("stroke-opacity", 0.2)
  .selectAll("path");

var node = svg
  .append("g")
  .attr("class", "nodes")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .selectAll("g");

var graph;

d3.json("result2.json", function(error, energy) {
  if (error) throw error;


    var nodeMap = {};
    energy.nodes.forEach(function(x) { nodeMap[x.id] = x; });
    energy.links = energy.links.map(function(x) {
      return {
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        value: x.value
      };
    });

  graph = sankey(energy);

  link = link
    .data(energy.links)
    .enter()
    .append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke-width", function(d) {
      return Math.max(1, d.width);
    });

  link.append("title").text(function(d) {
    return d.source.name + " → " + d.target.name + "\n" + format(d.value);
  });

  node = node
    .data(energy.nodes)
    .enter()
    .append("g")
    .call(
      d3
        .drag()
        .subject(function(d) {
          return d;
        })
        .on("start", function() {
          this.parentNode.appendChild(this);
        })
        .on("drag", dragmove)
    );

  node
    .append("rect")
    .attr("x", function(d) {
      return d.x0;
    })
    .attr("y", function(d) {
      return d.y0;
    })
    .attr("height", function(d) {
      return d.y1 - d.y0;
    })
    .attr("width", function(d) {
      return d.x1 - d.x0;
    })
    .attr("fill", function(d) {
      return d.color;
    });
  // .attr("stroke", "#000");

  node
    .append("text")
    .attr("x", function(d) {
      return d.x0 - 6;
    })
    .attr("y", function(d) {
      return (d.y1 + d.y0) / 2;
    })
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(function(d) {
      return d.name;
    })
    .filter(function(d) {
      return d.x0 < width / 2;
    })
    .attr("x", function(d) {
      return d.x1 + 6;
    })
    .attr("text-anchor", "start");

  node.append("title").text(function(d) {
    return d.name + "\n" + format(d.value);
  });

  //graph.nodes.forEach(function(node){node.x0 = 0; console.log(node)})
  merge_keystone(["Breakfast"]);
  //relayout();
});

// the function for moving the nodes
function dragmove(d) {
  var rectY = d3
    .select(this)
    .select("rect")
    .attr("y");

  d.y0 = d.y0 + d3.event.dy;

  var yTranslate = d.y0 - rectY;

  d3.select(this).attr("transform", "translate(0" + "," + yTranslate + ")");

  sankey.update(graph);
  link.attr("d", d3.sankeyLinkHorizontal());
}


function merge_keystone(keystone_list){
    d3.selectAll("g").each(function(n, i){
        if (this.__data__ != undefined && this.__data__.type == 'Breakfast') {
            console.log(this)
            this.remove()
        };
    })

    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
}


function relayout() {

  d3.selectAll("text").remove();

  columns = ['Early_Snack', 'Breakfast', 'AM_Snack', 'Lunch', 'PM_Snack', 'Dinner', 'Bedtime_Snack']
  levels = ['very_high', 'high', 'normal', 'low', 'very_low']

  rect_width = 10;

  columns.forEach(function(col, i){
    svg.append("text")
      .attr("x", i*width/columns.length)
      .attr("y", height + 80)
      .style("font", "10px sans-serif")
      .text(col)
  })

  d3.selectAll("rect").each(function(d, i) {
    cur_rect = this;
    cur_meal = null;
    cur_level = null;

    columns.forEach(function(col, i){
      if (d.type == col) { 
        d.x0 = i*width/columns.length;
        d.x1 = i*width/columns.length + rect_width;
        d3.select(cur_rect).attr("x", i*width/columns.length);
        cur_meal = col;
      } 
    })

    
    final_height = 0;

    d3.selectAll("rect").each(function(r, j){
      if (r.type == cur_meal && levels.indexOf(r.level) < levels.indexOf(d.level)) {
          console.log(d3.select(this).attr('height'));
          final_height += parseFloat(d3.select(this).attr('height')) + 10;
        } 
    })

    d.y0 = final_height;
    d3.select(cur_rect).attr('y', final_height);



  });

  sankey.update(graph);

  link.attr("d", d3.sankeyLinkHorizontal());
}
