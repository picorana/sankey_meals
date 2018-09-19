fs = require('fs')
csvParse = require('csv-parse')
jsnx = require('jsnetworkx')

days = {}
node_root = {}
nodes = {}
edges = {}
G = new jsnx.Graph()

keystone_events = ['Breakfast']


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
        if (count == 5) break;
    }

    console.log(G.nodes(true));
    console.log(G.edges(true))
    console.log(G.nodes().length + " nodes found")
    console.log(G.edges().length + " edges found")

    merge_on_keystone_event(keystone_events);
    save_to_json()
}


function get_glucose_level(val){
    if (val > 200) return 'high';
    else if (val < 100) return 'low';
    else return 'normal';
}


function merge_on_keystone_event (keystone_events){
    
    for (keystone in keystone_events) {
        keystone_nodes = []
        for (node in G.nodes()){
            continue;
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
            id : G.nodes(true)[n][0],
            meal: G.nodes(true)[n][1]["meal"]
        }
        result.nodes.push(node)
    }
    for (e in G.edges(true)) {
        link = {
            source: G.edges()[e][0],
            target: G.edges()[e][1],
            weight: 1
        }
        result.links.push(link)
    }

    fs.writeFile("test.json", JSON.stringify(result), function(err){
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
                glucose_level:glucose_level
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
