// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory } = require('botbuilder');
const jsnx = require('jsnetworkx');
const fs = require('fs');

// checking JSON



// Reading Metro file
var metro_file = fs.readFileSync('metro.txt', 'utf8').split('\n');
var metro_stations = new Array();
var metro = new Array();
var from, dest;
var flag_dest = false;
var flag_from = false;
for(i in metro_file) { 
    var line = metro_file[i].split(',');
    metro.push(line);
}

// Creating the Metro
var metro_graph = new jsnx.Graph();
for(i in metro){
    var line = metro[i];
    for(k in line){
        metro_graph.addNode(line[k]);
        metro_stations.push(line[k]);
    }
    for(var j = 0; j < line.length-1; j++){
        metro_graph.addEdge(line[j], line[j+1]);
    }
    
}

// Get Metro Line
var metro_line_numbers = ["1","2","3","4","5","6","7","8","9","12","A","B"];
function getMetroLine(station){
    for(i in metro){
        var line = metro[i];
        if(line.indexOf(station) > 0){
            return metro_line_numbers[i];
        }
    }
}
//console.log(metro_graph.nodes());
//var path = jsnx.bidirectionalShortestPath(metro_graph, 'Normal', 'Cuauhtémoc');




// Import AdaptiveCard content.
const metro_card = require('./resources/FlightItineraryCard.json');
const ImageGalleryCard = require('./resources/ImageGalleryCard.json');
const LargeWeatherCard = require('./resources/LargeWeatherCard.json');
const RestaurantCard = require('./resources/RestaurantCard.json');
const SolitaireCard = require('./resources/SolitaireCard.json');

// Create array of AdaptiveCard content, this will be used to send a random card to the user.
const CARDS = [
    metro_card
];

const WELCOME_TEXT = 'I will help you out to find the shortest path from station-to-station in the Metro.';

class AdaptiveCardsBot extends ActivityHandler {
    constructor() {
        super();
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(`This is not a STC app,  ${ membersAdded[cnt].name }. ${ WELCOME_TEXT }`);
                    await context.sendActivity('Please tell me, in what Metro station are you and where do you want to go :)');
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMessage(async (context, next) => {
            var text = context.activity.text.split(" ");

            if(text.indexOf('Restart') > 0){
                flag_dest = false;
                flag_from = false;
                await next();
            }
            
            for(i in text){
                var station = text[i];
                var index = metro_stations.indexOf(station);
                if(index > 0){
                    if(!flag_from){
                        from = station;
                        await context.sendActivity(`Nice, you are in the Metro station ${station}`);
                        flag_from = true;
                        flag_dest = true;
                        continue;
                    }
                    if(flag_dest){
                        dest = station;
                        await context.sendActivity(`Perfect, we are going to ${station}`);
                        break;
                    }
                }
            }

            await context.sendActivity(`We are going from ${from} to ${dest}`);
            await context.sendActivity(`I am calculating the shortest path, please wait!`);
            // Calculating path
            var path = jsnx.bidirectionalShortestPath(metro_graph, from, dest);
            var path_len = path.length;
            // Modifying JSON
            var filename = './resources/FlightItineraryCard.json';
            var file_content = fs.readFileSync(filename);
            var content = JSON.parse(file_content);
            content["body"][3]["columns"][0]["items"][1]["text"] = from;
            content["body"][3]["columns"][2]["items"][1]["text"] = dest;
            var from_card = content["body"][3]["columns"][0]["items"][1]["text"];
            var dest_card = content["body"][3]["columns"][2]["items"][1]["text"];
            content["body"][5]["columns"][1]["items"][0]["text"] = path_len;
            
            var from_line = getMetroLine(from);
            var dest_line = getMetroLine(dest);
            content["body"][3]["columns"][0]["items"][0]["text"] = `Linea ${from_line}`;
            content["body"][3]["columns"][2]["items"][0]["text"] = `Linea ${dest_line}`;



            for(i in path){
                var station = path[i];
                var bolder;
                if(i == 0 || i == path.length-1){
                    bolder = "bolder";
                }else{
                    bolder = "";
                }
                var metro_sample = {
                    "type": "TextBlock",
                    "text": station,
                    "weight": bolder,
                    "isSubtle": false
                };
                content["body"][6+i] = metro_sample;
            }

            await context.sendActivity({
                text: 'This is your best option so far:',
                attachments: [CardFactory.adaptiveCard(content)]
            });

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}


module.exports.AdaptiveCardsBot = AdaptiveCardsBot;