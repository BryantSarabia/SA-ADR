
ID 

Non-Functional Requirements 

Description 

Priority 

 

Scalability 

The system must support the addition of new data streams and expansion to additional districts without interrupting service 

The system must be able to scale out to process up to 100k events/min across a district and support up to 50 concurrent operators 

Highest 

 

Reliability 

The system must remain operational during degraded network conditions through redundancy and limited edge-based autonomy, and even when certain data streams are missing, delayed, or inaccurate. 

 

High 

 

Performance 

The digital twin must process and synchronise real-time updates with low latency, keeping simulation results aligned with the physical state during emergency peaks 

Simulation updates must occur with no more than 5-10 seconds delay from real-world changes 

High 

 

Security 

Access to data about critical infrastructures must be protected through secure communication, strong authentication, and role-based authorisation 

Audit trails 

Highest 

 

Usability 

The dashboards should be intuitive 

Low 

 

Maintainability 

The architecture should allow easy maintenance, including updates and scaling with minimal downtime 

Medium 

 

Efficiency 

Energy: the system should minimise compute and communication resources wherever possible, especially during continuous high-volume data processing 

Cost: the architecture must minimise infrastructure and operational costs by efficiently managing real-time data processing workloads. Horizontal scaling should be applied only when needed, and lightweight communication protocols should be used to limit bandwidth consumption 

High 

