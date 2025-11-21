Challenges/Risk Analysis [for both deliverables D1 and D2] 

In this section, you should describe, using the table below, the most challenging, discussed, or risky design tasks, architecture requirements, or design decisions related to this project. Please describe when the risk arises, and when and how it has been solved.  

  

  

Risk ID and description 

Date the risk is identified 

Date the risk is resolved 

Explanation of how the risk has been managed 

C1 - Real-time Synchronization Drift - Mantenere il digital twin sincronizzato con la realtà fisica entro 5-10s con 100k eventi/min 

 

10/11/2025 

Da identificare  

We will use a time series DB such as Influx DB to handle real time data sent from sensors. 

C2 - Simulation Computational Bottleneck - Simulare impatto di interventi in tempo reale su grafo stradale complesso 

 

10/11/2025 

 

  

  

C3 - Geographic Data Consistency - Mantenere consistenza tra routing, mappe, e metadata sensori 

 

10/11/2025 

 

 

C4 - Data loss or sensor outages 

 

10/11/2025 

 

We will introduce ingestion redundancy. It means that multiple sensors will be collocated near to another for introducing data redundancy 

 

C5 - Gateway communication problems and outages 

10/11/2025 

 

We will introduce a mechanism of store-and-forward in case the Gateway loses internet connection. The data will be buffered locally at edge by using existing technologies such as Redis (buy, don’t build) 

To protect against gateway hardware failure, a simple standby gateway will be deployed in a fail-over configuration. This redundant gateway will automatically handle incoming sensor data if the primary gateway becomes unresponsive 

Gateways will be powered by the public energy grid, backed by an uninterruptible power supply. 

C6 - Communication between sensors and the gateways 

10/11/2025 

 

For sensors that don't need fast data transfer, we use LoRaWAN (0.3-50 kbps). This approach ensures the lowest possible power consumption for those sensors. 

C7 - Communication between cameras and the platform and camera power source 

10/11/2025 

 

Cameras require high-speed data transmission for video streaming, so they will be connected via 4G/5G. The video data will be published to a video processing service (e.g. AWS Kinesis Video Streams). The cameras must be capable of running the necessary client software to interface with such services. 

For power reliability, they will be primarily powered by the public grid, with integrated solar panels serving as a backup system to maintain functionality during blackouts 

C8 - Gateways deployment 

10/11/2025 

 

The Gateways will be deployed on elevated sites, such as building rooftops, to maximize their communication range and ensure robust connectivity with all sensors and cameras. 

C9 - High ingest volume 

10/11/2025 

 

 

To handle high volume of data ingestion, we will use a fully managed, scalable streaming platform such as Apache Kafka. This ensures the system can maintain low latency and high reliability. 

C10 - Sensor health monitoring 

10/11/2025 

 

 

Every sensor will be configured to send a periodic heartbeat message at a regular interval, regardless of whether it has data to report 

C11 - Security breach 

10/11/2025 

 

 

All data, from sensors to gateways and from gateways to cloud services, will be encrypted using industry standard protocols (TLS 1.2+). Video streams to Kinesis will use secure, encrypted sessions. 

Access to dashboard and applications will require MFA 

Devices and services will use secure credential types like X.509 certificates for IoT devices, IAM roles for cloud services instead of passwords. OAuth 2.0 will be used for M2M authentication where applicable. 

All users' activities, API calls, and administrative actions will be logged to an audit trail 

RBAC for data segregation 

C12 - Cost optimization 

10/11/2025 

 

 

Our architecture will prioritize cost efficiency without compromising performance or reliability 

Gateways will pre-process sensor data before transmission to minimize bandwidth and cloud ingestion costs. 

We will prioritize fully managed auto-scaling services to ensure we only pay for the compute and storage resources we actively use. 

A tiered storage strategy will be implemented. Frequently accessed data will reside in performant storage, while historical data will be automatically transitioned to lower-cost tiers based on predefined policies 

C13 – Indoor-Outdoor data gap 

 

 

For solving the poor indoor navigation data, we will... 

C14 – Data Privacy and Ethical Use 

13/11/2025 

 

People's movements, behavior, and images can create a big problem over privacy violations. Using anonymous dataset should fix this but depending on administrative response the entire data processing (and so the project) could be blocked. 

C15 – Human in the loop 

13/11/2025 

 

If the system is only IA driven, it can cause problems that can become very critical. We should avoid it and ask for a human intervention for some specific operations 

