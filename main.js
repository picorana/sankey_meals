var button_div = document.createElement('div')
button_div.style.backgroundColor + "#f00"
button_div.style.width = "100%"
button_div.style.textAlign = 'center'
button_div.style.height = "100px"
button_div.style.display = '-webkit-inline-box' // change this!!
document.body.append(button_div)

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
var keystone_list = [];
var glucose_levels = ["very_high", "high", "normal", "low", "very_low"];
color_map = {
  very_low: "rgb(69, 117, 180)",
  low: "rgb(171,217,233)",
  normal: "rgb(254,224,144)",
  high: "rgb(253,174,97)",
  very_high: "rgb(244,109,67)"
};


// function to handle the drawing of the buttons under the graph
var draw_buttons = function(possible_keystones = null){
    
    // empty the container
    button_div.innerHTML = null
    if (possible_keystones == null) return;

    // for each possible keystone events append one new button
    else for (elem in possible_keystones){
        elem = possible_keystones[elem]
        var draw_button = document.createElement("div");
        draw_button.className = "keystone_selection_button";
        draw_button.innerHTML = elem;
        draw_button.style.margin = '0 auto'
        draw_button.style.height = '20px'
        draw_button.style.borderRadius = '100px'
        draw_button.style.fontFamily = 'Arial'
        draw_button.style.fontSize = 'small'
        draw_button.style.display = 'block';
        draw_button.style.padding = '8px'
        draw_button.style.color = "#fff"
        if (keystone_list.indexOf(elem) == -1){
            draw_button.style.backgroundColor = "#888"
        } else draw_button.style.backgroundColor = "#55aaff"
        draw_button.onclick = function() {
          elem = this.innerHTML
            if (keystone_list.indexOf(elem) == -1){
            keystone_list.push(elem)  
          } else (keystone_list.splice(keystone_list.indexOf(elem), 1))
          draw(keystone_list);
        };
        button_div.append(draw_button);
    }
}


var merge_node_set = function(energy, this_keystone_nodes, k, g_level, keystone, count){
    
      // create the keystone node
      energy.nodes.push({
        name: k + "_" + g_level,
        color: color_map[g_level],
        type: "keystone_" + k,
        level: g_level,
        meal: k,
        id: count
      });

      this_sources = [];
      this_targets = [];
      this_target_nodes = [];

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
        var already_there = energy.links.find(d => d.source == id.toString() && d.target == count.toString())
        if (already_there != undefined) already_there.value += 1
        else {
        energy.links.push({
          source: id.toString(),
          target: count.toString(),
          value: 1
        })}
      });

      this_targets.forEach(function(id) {
        energy.links.push({
          source: count.toString(),
          target: id.toString(),
          value: 1
        });
      });

} 


var draw = function(keystone_list = []) {
  d3.json("result2.json", function(error, energy) {
    if (error) throw error;

    // extract all the possible elements that can be keystones from the nodes
    possible_keystones = []
    for (node of energy.nodes){
        if (possible_keystones.indexOf(node.type)  == -1) possible_keystones.push(node.type)   
    }
    draw_buttons(possible_keystones)

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

        // if any node that is to be considered in the keystone nodes exists
        if (energy.nodes.some(n => n.type == k)) {
          
          // list all the nodes to be merged together based on glucose level and meal type
          this_keystone_nodes = energy.nodes.filter(
            n => n.type == k && n.level == g_level
          );

          this_keystone_nodes.forEach(n => console.log(n))
          merge_node_set(energy, this_keystone_nodes, k, g_level, true, count)
          count ++

        }
      });
    });

    var dfs = function(node, relative_depth, absolute_depth, prev_type, seq_dict, distance_from_keystone){
        node.relative_depth = relative_depth
        node.absolute_depth = absolute_depth

        if (node.type != prev_type){
            if (seq_dict[node.type] == undefined) seq_dict[node.type] = 0
            else seq_dict[node.type] += 1
        } 
        node.this_sequence_depth = seq_dict[node.type]

        node.name = node.type + "_" + relative_depth + "_" + absolute_depth + "_" + node.this_sequence_depth

        following_nodes = []
        following_nodes = energy.nodes.filter(function(n){
            return energy.links.some(l => l.source == node.id && l.target == n.id)
        })

        if (following_nodes.length == 0) return

        following_nodes.forEach(function(n){

            if (keystone_list.indexOf(node.meal) != -1) {
                // node is a keystone node
                if (distance_from_keystone == undefined){
                    distance_from_keystone = {}
                }
                distance_from_keystone[node.meal] = 0
            } else if (distance_from_keystone != undefined){
                for (elem in distance_from_keystone){
                    distance_from_keystone[elem] += 1
                }
            }

            node.distance_from_keystone = distance_from_keystone
            
            if (n.type == node.type){
                dfs(n, relative_depth+1, absolute_depth+1, node.type, seq_dict, distance_from_keystone)
            } else {
                dfs(n, 0, absolute_depth+1, node.type, seq_dict, distance_from_keystone)
            }
        })
    }

    if (! energy.nodes.some(node => node.absolute_depth != undefined)){
        leftmost_nodes = energy.nodes.filter(node => (energy.links.some(l => l.target == node.id)) ? false : true)
        leftmost_nodes.forEach(function(node) {seq_dict = {}; dfs(node, 0, 0, null, seq_dict, undefined)})
    }

    for (meal of possible_keystones){
        for (g_level of glucose_levels){
            for (var i=0; i<10; i++){
                merge_set = energy.nodes.filter(function(node) {if (node.level == g_level && node.type == meal && node.this_sequence_depth == 0) return true; else return false})
                //if (merge_set.length > 0) merge_node_set(energy, merge_set, meal, g_level, false, count++)
            }
        }
    }

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
      return keystone_list.indexOf(n.type) < 0 // &&
            //n.name != "Sugar to treat";
    });
    energy.links = energy.links.filter(function(l) {
      if (l.source != undefined && l.target != undefined)
        return (
          keystone_list.indexOf(l.source.type) < 0 &&
          keystone_list.indexOf(l.target.type) < 0 // &&
            //l.source.name != "Sugar to treat" &&
            //l.target.name != "Sugar to treat"
        );
      else return false;
    });

    energy.nodes = energy.nodes.filter(function(n){
        return energy.links.some(l => l.source == n || l.target == n)
    })
    
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
    //draw_squares(keystone_list);
    //relayout3(energy)
    //relayout4(energy)
    //stack_rects(energy)
  });
};


var stack_rects = function(energy){
    d3.selectAll("text").remove()

    for (l in energy.links){
        l = energy.links[l]
        if (l.source.type == l.target.type) {
            l.target.x0 = l.source.x1
            l.target.x1 = l.source.x1 + 10
            l.target.y0 = l.source.y0
            l.target.y1 = l.source.y1
            d3.selectAll('rect').filter(function(r){return (r.id == l.target.id)}).attr("x", l.target.x0).attr("y", l.source.y0)
        }
    }

    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
}


var relayout4 = function(energy){

    d3.selectAll("text").remove()
    
    d3.selectAll('rect').each(function(r, i){
        //if (keystone_list.indexOf(r.meal) != -1){
            //r.x0 = width * (1 + keystone_list.indexOf(r.meal)) / (keystone_list.length + 1)
            //r.x1 = width * (1 + keystone_list.indexOf(r.meal)) / (keystone_list.length + 1) + 10
            //d3.select(this).attr("x", width * (1 + keystone_list.indexOf(r.meal)) /(keystone_list.length + 1))
        //} else {
            //if (r.distance_from_keystone == undefined){
                //r.x0 = r.absolute_depth * 100
                //r.x1 = r.absolute_depth * 100
                //d3.select(this).attr("x", r.absolute_depth * 100)
            //}
            //else {
                
                //console.log(r.distance_from_keystone)
                //r.x0 = 1000
                //r.x1 = 1000
                //d3.select(this).attr("x", r.distance_from_keystone['Lunch'] * 100 + 1000)
            //}
        //}})
    })
    
    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
}


var relayout3 = function(energy){

    d3.selectAll('rect').each(function(r, i){
        if (keystone_list.indexOf(r.meal) != -1){
            r.x0 = width * (1 + keystone_list.indexOf(r.meal)) / (keystone_list.length + 1)
            r.x1 = width * (1 + keystone_list.indexOf(r.meal)) / (keystone_list.length + 1) + 10
            d3.select(this).attr("x", width * (1 + keystone_list.indexOf(r.meal)) /(keystone_list.length + 1))
        }
    })

    //column_distance = 100
    //d3.selectAll('text').remove()

    //possible_keystones.forEach(function(type){
        //if (true){
            //nodes = d3.selectAll("rect").nodes().filter(function(n){if (n.__data__.type == type) return true; else return false})
                //max_depth = Math.max.apply(Math, energy.nodes.filter(node => node.type == type).map(node => node.absolute_depth))
               
                //d3.selectAll("rect").each(function(r, i){
                    //if (r.type.indexOf(type) != -1){
                        //r.x0 = max_depth*column_distance;
                        //r.x1 = max_depth*column_distance + 10
                        //d3.select(this).attr("x", max_depth*column_distance)
                    //}
                //})

        //}
    //})
    
    sankey.update(graph);
    link.attr("d", d3.sankeyLinkHorizontal());
}


var draw_squares = function(keystone_list){
    steps = 3
    keystone_list.forEach(function(k){
        svg.append("rect")
            .attr("x", function(){
                return -5 + Math.min.apply(Math, graph.nodes.map(function(d){if (d.type == "keystone_" + k) return d.x0; else return 1000}))
            })
            .attr("y", function(){
                return -5 + Math.min.apply(Math, graph.nodes.map(function(d){if (d.type == "keystone_" + k) return d.y0; else return 1000}))
            })
            .attr("height", function(){
                max_up = Math.max.apply(Math, graph.nodes.map(function(d){if (d.type == "keystone_" + k) return d.y1; else return 0}))
                max_down = Math.min.apply(Math, graph.nodes.map(function(d){if (d.type == "keystone_" + k) return d.y0; else return 1000}))
                return max_up - max_down + 10
            })
            .attr("width", function(){
                max_up = Math.max.apply(Math, graph.nodes.map(function(d){if (d.type == "keystone_" + k) return d.x1; else return 0}))
                max_down = Math.min.apply(Math, graph.nodes.map(function(d){if (d.type == "keystone_" + k) return d.x0; else return 1000}))
                return max_up - max_down + 10
            })
            .attr("fill", "transparent")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "10, 10")
            .attr("stroke", 'rgb(69, 117, 180)')
    })

    //max_depth = Math.max.apply(Math, graph.nodes.map(function(d){return d.depth}))

    //keystone_list.forEach(function(k){
        //k_depth = graph.nodes.map(function(d){
            //if (d.type == "keystone_" + k)
                //return d.depth
            //else return 1
        //})
        //k_depth = Math.max.apply(Math, k_depth)

        //d3.selectAll("rect").each(function(r, i){
            //if (r != undefined && r.type == "keystone_" + k){
                //r.x0 = (k_depth * width) / max_depth;
                //r.x1 = (k_depth * width) / max_depth + 10;
                //d3.select(this).attr("x", (k_depth * width)/max_depth)
            //}

        //})

    //})



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

draw(keystone_list);
