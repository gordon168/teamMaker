import random
import math

def assign_teams(total_people, team_size):
    """
    Assigns people to teams randomly.

    Args:
        total_people (int): The total number of people.
        team_size (int): The desired size of each team.

    Returns:
        dict: A dictionary where keys are team names (e.g., "Team 1")
              and values are lists of player names (e.g., ["Person 1", "Person 3"]).
    """
    if not isinstance(total_people, int) or total_people <= 0:
        raise ValueError("Total people must be a positive integer.")
    if not isinstance(team_size, int) or team_size <= 0:
        raise ValueError("Team size must be a positive integer.")
    if team_size > total_people:
        # If team size is greater than total people, everyone is in one team.
        people = [f"Person {i+1}" for i in range(total_people)]
        random.shuffle(people)
        return {"Team 1": people}

    people = [f"Person {i+1}" for i in range(total_people)]
    random.shuffle(people)

    num_full_teams = total_people // team_size
    leftover_players_count = total_people % team_size

    teams = {}
    player_idx = 0

    # Assign players to full teams
    for i in range(num_full_teams):
        team_name = f"Team {i+1}"
        teams[team_name] = []
        for _ in range(team_size):
            if player_idx < len(people):
                teams[team_name].append(people[player_idx])
                player_idx += 1
            else:
                break # Should not happen if logic is correct

    # Assign leftover players to a new, smaller team
    if leftover_players_count > 0:
        team_name = f"Team {num_full_teams + 1}"
        teams[team_name] = []
        for _ in range(leftover_players_count):
            if player_idx < len(people): # Check ensures we don't go out of bounds
                teams[team_name].append(people[player_idx])
                player_idx += 1
            else:
                break # Should not happen

    return teams

if __name__ == '__main__':
    # Example usage:
    try:
        people_count = 10
        size_per_team = 3
        assigned_teams = assign_teams(people_count, size_per_team)
        print(f"Total people: {people_count}, Team size: {size_per_team}")
        for team, members in assigned_teams.items():
            print(f"{team}: {members}")
        print("-" * 20)

        people_count = 12
        size_per_team = 4
        assigned_teams = assign_teams(people_count, size_per_team)
        print(f"Total people: {people_count}, Team size: {size_per_team}")
        for team, members in assigned_teams.items():
            print(f"{team}: {members}")
        print("-" * 20)

        people_count = 5
        size_per_team = 5
        assigned_teams = assign_teams(people_count, size_per_team)
        print(f"Total people: {people_count}, Team size: {size_per_team}")
        for team, members in assigned_teams.items():
            print(f"{team}: {members}")
        print("-" * 20)

        people_count = 2
        size_per_team = 3 # team_size > total_people
        assigned_teams = assign_teams(people_count, size_per_team)
        print(f"Total people: {people_count}, Team size: {size_per_team}")
        for team, members in assigned_teams.items():
            print(f"{team}: {members}")
        print("-" * 20)

    except ValueError as e:
        print(f"Error: {e}")

import matplotlib.pyplot as plt
import networkx as nx

def display_teams_graph(teams_data):
    """
    Displays the team assignments as a graph.

    Args:
        teams_data (dict): A dictionary from assign_teams function.
                           Keys are team names, values are lists of players.
    """
    if not teams_data:
        print("No team data to display.")
        return

    G = nx.Graph()

    people_nodes = []
    team_nodes = []

    for team_name, members in teams_data.items():
        G.add_node(team_name, type='team')
        team_nodes.append(team_name)
        for person_name in members:
            G.add_node(person_name, type='person')
            people_nodes.append(person_name)
            G.add_edge(person_name, team_name)

    pos = nx.spring_layout(G, k=0.5, iterations=50) # k adjusts distance between nodes

    plt.figure(figsize=(12, 8))

    # Draw nodes
    nx.draw_networkx_nodes(G, pos, nodelist=team_nodes, node_color='skyblue', node_size=3000, label="Teams")
    nx.draw_networkx_nodes(G, pos, nodelist=people_nodes, node_color='lightgreen', node_size=1500, label="People")

    # Draw edges
    nx.draw_networkx_edges(G, pos, width=1.0, alpha=0.5)

    # Draw labels
    nx.draw_networkx_labels(G, pos, font_size=10)

    plt.title("Team Assignments", fontsize=15)
    plt.axis('off') # Turn off the axis
    plt.show()

if __name__ == '__main__':
    try:
        while True:
            try:
                total_people_input = input("Enter the total number of people: ")
                if not total_people_input: # Handle empty input
                    print("Input cannot be empty. Please try again.")
                    continue
                total_people = int(total_people_input)
                if total_people <= 0:
                    print("Number of people must be a positive integer. Please try again.")
                    continue
                break
            except ValueError:
                print("Invalid input. Please enter a whole number for total people.")

        while True:
            try:
                team_size_input = input("Enter the desired team size: ")
                if not team_size_input: # Handle empty input
                    print("Input cannot be empty. Please try again.")
                    continue
                team_size = int(team_size_input)
                if team_size <= 0:
                    print("Team size must be a positive integer. Please try again.")
                    continue
                break
            except ValueError:
                print("Invalid input. Please enter a whole number for team size.")

        assigned_teams = assign_teams(total_people, team_size)
        print(f"\n--- Team Assignments ---")
        print(f"Total people: {total_people}, Desired team size: {team_size}")
        if not assigned_teams:
            print("No teams were formed based on the input.")
        else:
            for team, members in assigned_teams.items():
                print(f"{team}: {members} (Count: {len(members)})")

        # Ask user if they want to see the graph
        while True:
            show_graph_input = input("\nDo you want to display the teams graph? (yes/no): ").strip().lower()
            if show_graph_input in ['yes', 'y']:
                print("Generating graph... (Close the graph window to continue)")
                display_teams_graph(assigned_teams)
                break
            elif show_graph_input in ['no', 'n']:
                print("Graph will not be displayed.")
                break
            else:
                print("Invalid input. Please answer 'yes' or 'no'.")

        print("\nProgram finished.")

    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
