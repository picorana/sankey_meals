fs = require('fs')
csvParse = require('csv-parse')
jsnx = require('jsnetworkx')

days = {}
G = new jsnx.Graph()

keystone_events = ['Breakfast']
color_map = {
    very_low: 'rgb(69, 117, 180)',
    low: 'rgb(171,217,233)',
    normal: 'rgb(254,224,144)',
    high: 'rgb(253,174,97)',
    very_high: 'rgb(244,109,67)'
}

fs.createReadStream('data/event.csv') // I think this stream is not closing itself when it's done
    .pipe(csvParse())
    .on('data', function (data) {
        date = new Date(data[0])
        if (!isValidDate(date)) {return}; 
        date_string = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' +  date.getDate();          
        if (date_string in days) {
            days[date_string].push(data)
        }
        else days[date_string] = [data]
    })
    .on('end', examine_data)


function isValidDate(d){
    return d instanceof Date && !isNaN(d)
}


function examine_data(){
    
    count = 0
    
    for (day in days) {
        examine_day(days[day]);
        count++;
        //if (count == 4) break;
    }


    //merge_on_keystone_event(keystone_events);
    save_to_json()
    
    //console.log(G.nodes(true));
    console.log(G.edges(true))
    console.log(G.nodes().length + " nodes found")
    console.log(G.edges().length + " edges found")
}


function get_glucose_level(val){
    if (val < 54) return 'very_low';
    else if (val < 70) return 'low';
    else if (val < 180) return 'normal';
    else if (val < 250) return 'high';
    else return 'very_high';
}


function merge_on_keystone_event (keystone_events){

    for (k in keystone_events) {
        keystone_nodes = []
        nodes_to_remove = []
        G.addNode(k, {meal:keystone_events[k], glucose_level:'a', type: 'keystone_node'})
        for (n in G.nodes(true)){
            if (G.nodes(true)[n][1]['type'] == keystone_events[k]){
                for (var i=0; i<jsnx.neighbors(G, G.nodes()[n]).length; i++){
                    G.addEdge(k, jsnx.neighbors(G, G.nodes()[n])[i])
                }
            nodes_to_remove.push(G.nodes()[n])
            }
        }
        for (n in nodes_to_remove){
            G.removeNode(nodes_to_remove[n])
        }
    }

}


function save_to_json () {
    result = {
        nodes : [],
        links: []
    }

    for (n in G.nodes(true)) {
        node = {
            id : G.nodes(true)[n][0].toString(),
            name: G.nodes(true)[n][1]["meal"],
            meal: G.nodes(true)[n][1]["meal"] + "_" + G.nodes(true)[n][1]["glucose_level"],
            type: G.nodes(true)[n][1]["type"],
            level: G.nodes(true)[n][1]["glucose_level"],
            color: color_map[G.nodes(true)[n][1]["glucose_level"]],
            time: G.nodes(true)[n][1]["time"]
        }
        result.nodes.push(node)
    }
    for (e in G.edges(true)) {
        link = {
            source: G.edges()[e][0].toString(),
            target: G.edges()[e][1].toString(),
            value: 1
        }
        result.links.push(link)
    }

    fs.writeFile("result2.json", JSON.stringify(result), function(err){
        if (err) {
            return console.log(err);
        }
        console.log("file saved");
    })
}


function examine_day(day){

    // what happens if there are two consecutive lunches? 

    node_ids = []
    tmp_meal_list = []
    for (var i=0; i<day.length; i++){ // cleanup from logs without meal names
        if (day[i][4].length < 1) continue;
        else tmp_meal_list.push(day[i]);
    }

    for (var i=0; i < tmp_meal_list.length; i++) {
        ev = tmp_meal_list[i];
        glucose = ev[2] // glucose
        meal = ev[4] // meal
        glucose_level = get_glucose_level(parseFloat(glucose))
        node_id = Date.parse(ev[0]);
        node_ids.push(node_id);
        G.addNode(
            node_id, {
                meal:meal, 
                type: meal,
                glucose_level:glucose_level,
                time: node_id
        })
    }

    for (var i=0; i<node_ids.length-1; i++){
        G.addEdge(
            node_ids[i], 
            node_ids[i+1], 
            {value:1}
        )
    }


}
