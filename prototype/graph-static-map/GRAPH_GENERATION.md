# Generating L'Aquila City Graph using city2graph

This directory contains a script to generate a road network graph for L'Aquila, Italy using the [city2graph](https://github.com/c2g-dev/city2graph) library.

## Prerequisites

**Docker** - That's it! No Python installation required.

## Quick Start with Docker (Recommended)

The easiest way to run the graph generation is using Docker:

```bash
# Build and run in one command
./build-and-run.sh
```

This will:
1. Build a Docker image with all dependencies
2. Run the graph generation script
3. Save output files to the `output/` directory

### Manual Docker Commands

If you prefer to run Docker commands manually:

```bash
# Build the Docker image
docker build -t laquila-graph-generator .

# Run the container (output files will be in ./output/)
docker run --rm -v "$(pwd)/output:/app/output" laquila-graph-generator
```

### Windows (PowerShell)

```powershell
# Build the Docker image
docker build -t laquila-graph-generator .

# Run the container (output files will be in .\output\)
docker run --rm -v "${PWD}/output:/app/output" laquila-graph-generator
```

## Alternative: Local Python Installation

If you don't have Docker or prefer to run without it, you can use Python directly:

### Prerequisites
- Python 3.9+
- pip package manager

### Setup

```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\Activate.ps1  # Windows PowerShell

# Install dependencies
pip install -r requirements-graph.txt
```

### Run

```bash
# Make sure virtual environment is activated
python generate_laquila_graph.py

# Deactivate when done
deactivate
```

The script will:
1. Download road segment data from Overture Maps for L'Aquila (bbox: 13.38-13.42°E, 42.34-42.36°N)
2. Process the road segments and connectors
3. Convert the data into a graph structure with nodes (intersections) and edges (roads)
4. Export the results in multiple formats

## Output Files

The script generates the following files in the `output/` directory:

- **`laquila_graph_nodes.geojson`** - GeoJSON file containing all intersection nodes with their coordinates
- **`laquila_graph_edges.geojson`** - GeoJSON file containing all road segments as edges
- **`laquila-city-graph-overture.json`** - Custom JSON format similar to `static-graph-map-example.json` with a subset of nodes and edges
- **`laquila_segment.geojson`** - Raw segment data from Overture Maps
- **`laquila_connector.geojson`** - Raw connector data from Overture Maps

## Graph Structure

The generated graph includes:

- **Nodes**: Road intersections with:
  - Unique ID (`nodeId`)
  - Type (intersection)
  - Name
  - Geographic coordinates (latitude, longitude)

- **Edges**: Road segments with:
  - Unique ID (`edgeId`)
  - Road segment ID
  - Name
  - From/To node references
  - Geometry (LineString with coordinates)
  - Distance (meters)
  - Speed limit (km/h)
  - Number of lanes
  - Direction (bidirectional/one-way)

## Visualization

You can visualize the generated GeoJSON files using:

- [geojson.io](https://geojson.io)
- [QGIS](https://qgis.org)
- Any GIS software that supports GeoJSON

## Customization

To adjust the area of interest, modify the `LAQUILA_BBOX` variable in the script:

```python
# [min_longitude, min_latitude, max_longitude, max_latitude]
LAQUILA_BBOX = [13.38, 42.34, 13.42, 42.36]
```

## Data Source

The road network data is sourced from [Overture Maps](https://overturemaps.org/), an open mapping initiative providing high-quality geospatial data.

## Troubleshooting

**Issue: Download fails or returns empty data**
- Check your internet connection
- Verify the bounding box coordinates are valid
- The Overture Maps API may have rate limits or temporary outages

**Issue: Module not found errors**
- Ensure all dependencies are installed: `pip install -r requirements-graph.txt`
- Verify you're using Python 3.9 or higher

**Issue: Memory errors with large areas**
- Reduce the bounding box size
- The script limits output to 100 nodes and 1000 edges in the custom format to manage file size

## Integration with Digital Twin

The generated graph can be used with the Digital Twin State Manager by:

1. Loading the graph into the state manager's traffic graph component
2. Using node IDs to reference intersections in sensor data
3. Using edge IDs to reference road segments in traffic flow data
4. Updating the `traffic.graph` Kafka topic with real-time graph state changes

Example integration in `city-digital-twin.json`:

```json
{
  "city": {
    "trafficGraph": {
      "nodes": [...],  // from laquila_graph_nodes.geojson
      "edges": [...]   // from laquila_graph_edges.geojson
    }
  }
}
```
