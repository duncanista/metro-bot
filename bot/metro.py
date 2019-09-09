#encoding: utf-8
import networkx as nx

def pretty(dictionary):
    for element in dictionary:
        print("{} -> {}".format(element, dictionary[element]))

file = open('metro.txt', encoding='utf-8')
metro = nx.Graph()
for line in file.readlines():
    metro_line = line.split(',')
    for station in range(len(metro_line)-1):
        metro.add_edge(metro_line[station], metro_line[station+1])

num_stations = nx.dijkstra_path_length(metro, 'Normal', 'Cuauhtémoc')
print(num_stations)
print(nx.dijkstra_path(metro, 'Normal', 'Cuauhtémoc'))
print(nx.shortest_path(metro, 'Normal', 'Cuauhtémoc'))
    
    


