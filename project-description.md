
Title: Urban Digital Twin for Emergency Decision-Making for Smart Cities (UDT-EM)
Objective:
To develop a real-time Urban Digital Twin for emergency decision-making that continuously acquires
operational data from distributed urban infrastructure in a selected district. These sources include roadway
traffic sensors, public transport systems, emergency response assets, and environmental monitoring stations.
Each data stream will have a unique identifier, geographic position, and operational status. The system will
maintain the virtual model synchronised with live conditions, simulate the impact of disruption events (e.g.,
road closures or infrastructure failures), and recommend strategies that keep response times to critical
services such as hospitals, fire stations, and evacuation routes within acceptable thresholds.
System Overview:
The system will maintain a virtual model of key infrastructures and mobility networks, updated using realtime data streams including (but not limited to):
- Traffic monitoring (vehicle flow, congestion levels)
- Public transport operations (availability of stations, delays, elevator status)
- Emergency resources (ambulance locations, hospital capacity)
- Environmental conditions (weather and hazard sensors)
All data will be geo-referenced, timestamped, and associated with specific infrastructure elements. The twin
will process incoming updates to track deviations from expected conditions, such as blocked intersections
or degraded accessibility. When critical operational thresholds are detected, the system will compute and
suggest adaptive response actions aimed at minimising disruption to emergency mobility and maintaining
essential connectivity.
Key Features:
- Real-time visualisation of the urban state: Live map showing traffic conditions and availability of critical
infrastructure.


- Impact simulation of emergency actions: Evaluation of the effect of interventions (e.g.
road closure) before executing them.
- Accessibility monitoring for essential services: Alerts when hindered access could delay
emergency response.
- Operational status tracking: Notifications when key infrastructure elements become impaired or
disconnected.
User Access and Management Levels
The system will support multiple levels of access, reflecting different responsibilities in emergency operations,
including:
- District Operator: Responsible for monitoring and managing a specific district. Has access to detailed
operational data, localised simulation results, and route intervention actions within their assigned
area.
- City Manager: Oversees multiple districts and coordinates cross-district decisions. Receives
aggregated accessibility information and can evaluate broader emergency response strategies
impacting multiple areas.
Each user will be authenticated and authorised in accordance with their role, ensuring the appropriate level
of abstraction and operational authority.
Practical Use Cases:
- Use Case 1 - Road Disruption Near Hospital: A major intersection in the district becomes unexpectedly
blocked. The digital twin detects a loss of accessibility to the local hospital and simulates alternate
routing options. The system recommends the best intervention and notifies the City Manager to
initiate emergency traffic control.
- Use Case 2 - Public Transport Infrastructure Failure: A metro station elevator goes out of service,
reducing access to evacuation paths for nearby facilities. The system identifies a potential delay in
emergency response times and alerts the District Operator, suggesting optimised access routes and
resource repositioning.
- Use Case 3 - Severe Weather Impact Prediction: Real-time weather indicates imminent heavy rainfall
that could reduce road capacity in low-lying streets. The digital twin predicts congestion propagation
across multiple districts and advises early rerouting of ambulances and emergency units to maintain
coverage.


Technical Characteristics and Scalability:
The system must support real-time operation across a metropolitan district with up to 5,000 real-time
infrastructure data streams within a single district, processing at least 100,000 data events per minute
during emergency conditions. Simulation updates must occur with no more than 5-10 seconds delay
from real-world changes.
The system will allow simultaneous access for up to 50 operators, each receiving a role-specific view.
Cost Optimisation
The architecture must minimise infrastructure and operational costs by efficiently managing real-time data
processing workloads. Horizontal scaling should be applied only when needed, and lightweight
communication protocols should be used to limit bandwidth consumption. A detailed cost estimation for
system implementation must be provided, ensuring optimal resource allocation without compromising
performance.
Key Non-functional Requirements:
- Scalability: The system must support the addition of new data streams and expansion to additional
districts without interrupting service.
- Reliability: The system must remain operational during degraded network conditions through
redundancy and limited edge-based autonomy, and even when certain data streams are missing,
delayed, or inaccurate.
- Performance: The digital twin must process and synchronise real-time updates with low latency,
keeping simulation results aligned with the physical state during emergency peaks.
- Security: Access to data about critical infrastructures must be protected through secure
communication, strong authentication, and role-based authorisation.
- Maintainability: The architecture should allow easy maintenance, including updates and scaling with
minimal downtime.
- Energy Efficiency: The system should minimise compute and communication resources wherever
possible, especially during continuous high-volume data processing.