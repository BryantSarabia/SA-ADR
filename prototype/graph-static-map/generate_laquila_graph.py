"""
Generate a road network graph for L'Aquila, Italy using city2graph library.

This script downloads road segment data from Overture Maps for L'Aquila
and converts it into a graph representation suitable for digital twin applications.
"""

import json

import city2graph as c2g
import geopandas as gpd

# Define L'Aquila bounding box (latitude/longitude)
# L'Aquila city center approximately: 42.35°N, 13.40°E
# Bounding box: [min_lon, min_lat, max_lon, max_lat]
LAQUILA_BBOX = [13.38, 42.34, 13.42, 42.36]

def main():
    print("Processing road segment data for L'Aquila...")
    
    # Set output directory (use /app/output for Docker, current dir otherwise)
    import os
    output_dir = '/app/output' if os.path.exists('/app/output') else '.'
    
    # Read GeoJSON files downloaded via DuckDB
    print("Loading segment data from GeoJSON...")
    segments_gdf = gpd.read_file(f"{output_dir}/laquila_segment.geojson")
    
    print("Loading connector data from GeoJSON...")
    try:
        connectors_gdf = gpd.read_file(f"{output_dir}/laquila_connector.geojson")
        if connectors_gdf.empty:
            connectors_gdf = None
    except Exception as e:
        print(f"Warning: Could not load connectors: {e}")
        connectors_gdf = None
    
    if segments_gdf is None or segments_gdf.empty:
        print("Error: No segment data downloaded. Check your internet connection.")
        return
    
    print(f"Downloaded {len(segments_gdf)} road segments")
    if connectors_gdf is not None and not connectors_gdf.empty:
        print(f"Downloaded {len(connectors_gdf)} connectors")
    
    # Convert to projected CRS for accurate length calculations
    # Using UTM zone 33N for L'Aquila, Italy
    print("\nConverting to projected CRS (UTM 33N)...")
    target_crs = "EPSG:32633"  # UTM zone 33N
    segments_gdf = segments_gdf.to_crs(target_crs)
    if connectors_gdf is not None and not connectors_gdf.empty:
        connectors_gdf = connectors_gdf.to_crs(target_crs)
    
    # Process segments to split at connectors and prepare for graph conversion
    print("\nProcessing road segments...")
    processed_segments = c2g.process_overture_segments(
        segments_gdf=segments_gdf,
        get_barriers=True,
        connectors_gdf=connectors_gdf,
        threshold=1.0
    )
    
    print(f"Processed {len(processed_segments)} road segments")
    
    # Convert segments to graph (nodes and edges)
    print("\nConverting segments to graph...")
    nodes_gdf, edges_gdf = c2g.segments_to_graph(
        segments_gdf=processed_segments,
        multigraph=False,
        as_nx=False
    )
    
    print(f"Generated graph with {len(nodes_gdf)} nodes and {len(edges_gdf)} edges")
    
    # Convert back to WGS84 for GeoJSON export
    print("\nConverting back to WGS84 for export...")
    nodes_gdf = nodes_gdf.to_crs("EPSG:4326")
    edges_gdf = edges_gdf.to_crs("EPSG:4326")
    
    # Export to GeoJSON format
    print("\nExporting to GeoJSON...")
    nodes_gdf.to_file(f'{output_dir}/laquila_graph_nodes.geojson', driver='GeoJSON')
    edges_gdf.to_file(f'{output_dir}/laquila_graph_edges.geojson', driver='GeoJSON')
    
    # Create a custom JSON format similar to the example
    print("\nCreating custom graph format...")
    create_custom_format(nodes_gdf, edges_gdf, f'{output_dir}/laquila-city-graph-overture.json')
    
    print("\n✅ Graph generation complete!")
    print(f"   - Nodes: laquila_graph_nodes.geojson ({len(nodes_gdf)} nodes)")
    print(f"   - Edges: laquila_graph_edges.geojson ({len(edges_gdf)} edges)")
    print(f"   - Custom format: laquila-city-graph-overture.json")


def create_custom_format(nodes_gdf, edges_gdf, output_file):
    """
    Convert the graph to a custom JSON format similar to the example.
    """
    nodes = []
    edges = []
    
    # Process nodes
    for idx, node in nodes_gdf.iterrows():
        node_data = {
            "nodeId": f"N-{idx:03d}",
            "type": "intersection",
            "name": f"Node {idx}",
            "location": {
                "latitude": round(node.geometry.y, 6),
                "longitude": round(node.geometry.x, 6)
            }
        }
        nodes.append(node_data)
    
    # Create node ID mapping
    node_id_map = {idx: f"N-{idx:03d}" for idx in nodes_gdf.index}
    
    # Process edges (limit to first 1000 to avoid huge files)
    edge_count = 0
    for idx, edge in edges_gdf.head(1000).iterrows():
        from_node = idx[0] if isinstance(idx, tuple) else edge.get('from_node_id', None)
        to_node = idx[1] if isinstance(idx, tuple) else edge.get('to_node_id', None)
        
        if from_node is None or to_node is None:
            continue
            
        # Get edge geometry
        geom = edge.geometry
        coords = [[round(x, 6), round(y, 6)] for x, y in geom.coords]
        
        # Calculate distance (in meters if CRS is projected)
        distance = round(geom.length, 1) if hasattr(geom, 'length') else 100
        
        # Get road attributes if available
        road_name = edge.get('names', {}).get('primary', f"Road {edge_count}") if hasattr(edge.get('names', {}), 'get') else f"Road {edge_count}"
        speed_limit = 50  # Default speed limit
        lanes = 2  # Default lanes
        
        edge_data = {
            "edgeId": f"E-{edge_count:03d}",
            "roadSegmentId": f"RS-{edge_count:03d}",
            "name": road_name,
            "fromNode": node_id_map.get(from_node, f"N-{from_node}"),
            "toNode": node_id_map.get(to_node, f"N-{to_node}"),
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "distance": distance,
            "speedLimit": speed_limit,
            "lanes": lanes,
            "direction": "bidirectional"
        }
        edges.append(edge_data)
        edge_count += 1
    
    # Create final output
    graph_data = {
        "nodes": nodes[:100],  # Limit nodes to 100 for readability
        "edges": edges
    }
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, indent=2, ensure_ascii=False)
    
    print(f"   Custom format contains {len(graph_data['nodes'])} nodes and {len(graph_data['edges'])} edges")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"An error occurred: {e}")
