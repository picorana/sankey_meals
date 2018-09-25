draw_button = document.createElement("div");
draw_button.id = "breakfast_button";
draw_button.innerHTML = "Breakfast";
draw_button.onclick = function() {
  draw(["Breakfast"]);
};
document.body.append(draw_button);

draw_button = document.createElement("div");
draw_button.id = "lunch_button";
draw_button.innerHTML = "Lunch";
draw_button.onclick = function() {
  draw(["Lunch"]);
};
document.body.append(draw_button);

draw_button = document.createElement("div");
draw_button.id = "lb_button";
draw_button.innerHTML = "Breakfast and Lunch";
draw_button.onclick = function() {
  draw(["Breakfast", "Lunch"]);
};
document.body.append(draw_button);

var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height") - 100;

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

var node;
var link;
var graph;
var keystone_list = ["Breakfast", "Lunch"];
var glucose_levels = ["very_high", "high", "normal", "low", "very_low"];
color_map = {
  very_low: "rgb(69, 117, 180)",
  low: "rgb(171,217,233)",
  normal: "rgb(254,224,144)",
  high: "rgb(253,174,97)",
  very_high: "rgb(244,109,67)"
};

var draw = function(keystone_list = []) {
  d3.json("result2.json", function(error, energy) {
    if (error) throw error;

    d3.selectAll("g").remove();

    link = svg
      .append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", 0.2)
      .selectAll("path");

    node = svg
      .append("g")
      .attr("class", "nodes")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g");
    var nodeMap = {};

    

    count = 0;
    keystone_list.forEach(function(k) {
      glucose_levels.forEach(function(g_level) {
        if (energy.nodes.some(n => n.type == k)) {
          this_keystone_nodes = energy.nodes.filter(
            n => n.type == k && n.level == g_level
          );

          // create the keystone node
          energy.nodes.push({
            name: k + "_" + g_level,
            color: color_map[g_level],
            type: "keystone_" + k,
            id: count
          });

          this_sources = [];
          this_targets = [];

          energy.links = energy.links.filter(function(l) {
            if (
              this_keystone_nodes.some(
                n => (n.id == l.source) | (n.id == l.target)
              )
            ) {
              this_keystone_nodes.forEach(function(n) {
                 
                if (n.id == l.source) {
                  this_targets.push(l.target);
                  return false;
                } else if (n.id == l.target) {
                  this_sources.push(l.source);
                  return false;
                }
              });
            } else return true;
          });

          this_sources.forEach(function(id) {
            energy.links.push({
              source: id.toString(),
              target: count.toString(),
              value: 1
            });
          });

          this_targets.forEach(function(id) {
            energy.links.push({
              source: count.toString(),
              target: id.toString(),
              value: 1
            });
          });

          count++;
        }
      });
    });

    energy.nodes.forEach(function(x) {
      nodeMap[x.id] = x;
    });
    energy.links = energy.links.map(function(x) {
      return {
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        value: x.value
      };
    });

    energy.nodes = energy.nodes.filter(function(n) {
      return keystone_list.indexOf(n.type) < 0 &&
            n.name != "Sugar to treat";
    });
    energy.links = energy.links.filter(function(l) {
      if (l.source != undefined && l.target != undefined)
        return (
          keystone_list.indexOf(l.source.type) < 0 &&
          keystone_list.indexOf(l.target.type) < 0 &&
            l.source.name != "Sugar to treat" &&
            l.target.name != "Sugar to treat"
        );
      else return false;
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
      })
     .attr("stroke", function(d){if (d.type.indexOf("keystone") != -1) return "#000"});

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
    //merge_keystone(["Breakfast"]);
    relayout2(keystone_list);
  });
};


var relayout2 = function(keystone_list){
    steps = 3
    for (var i=0; i<steps; i++){
        svg.append("rect")
            .attr("x", 10)
            .attr("y", 10)
            .attr("height", 100)
            .attr("width", 100)
            .attr("fill", "transparent")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "10, 10")
            .attr("stroke", 'rgb(69, 117, 180)')
    }

    max_depth = Math.max.apply(Math, graph.nodes.map(function(d){return d.depth}))

    keystone_list.forEach(function(k){
        k_depth = graph.nodes.map(function(d){
            if (d.type == "keystone_" + k)
                return d.depth
            else return 1
        })
        k_depth = Math.max.apply(Math, k_depth)

        d3.selectAll("rect").each(function(r, i){
            if (r != undefined && r.type == "keystone_" + k){
                r.x0 = (k_depth * width) / max_depth;
                r.x1 = (k_depth * width) / max_depth + 10;
                d3.select(this).attr("x", (k_depth * width)/max_depth)
            }

        })

    })



    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
}


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


function relayout() {
  d3.selectAll("text").remove();

  columns = [
    "Early_Snack",
    "Breakfast",
    "AM_Snack",
    "Lunch",
    "PM_Snack",
    "Dinner",
    "Bedtime_Snack"
  ];
  levels = ["very_high", "high", "normal", "low", "very_low"];

  rect_width = 10;

  columns.forEach(function(col, i) {
    svg
      .append("text")
      .attr("x", (i * width) / columns.length)
      .attr("y", height + 80)
      .style("font", "10px sans-serif")
      .text(col);
  });

  d3.selectAll("rect").each(function(d, i) {
    cur_rect = this;
    cur_meal = null;
    cur_level = null;

    columns.forEach(function(col, i) {
      if (d.type == col) {
        d.x0 = (i * width) / columns.length;
        d.x1 = (i * width) / columns.length + rect_width;
        d3.select(cur_rect).attr("x", (i * width) / columns.length);
        cur_meal = col;
      }
    });

    final_height = 0;

    d3.selectAll("rect").each(function(r, j) {
      if (
        r.type == cur_meal &&
        levels.indexOf(r.level) < levels.indexOf(d.level)
      ) {
        console.log(d3.select(this).attr("height"));
        final_height += parseFloat(d3.select(this).attr("height")) + 10;
      }
    });

    d.y0 = final_height;
    d3.select(cur_rect).attr("y", final_height);
  });

  sankey.update(graph);

  link.attr("d", d3.sankeyLinkHorizontal());
}

draw(["Breakfast", "Lunch", "Dinner"]);
