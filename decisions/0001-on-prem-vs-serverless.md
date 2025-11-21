---
# These are optional metadata elements. Feel free to remove any of them.
status: accepted
date: 2025-11-17
decision-makers: Agostino, Alessandro, Bryant, Graziano
consulted: Agostino, Alessandro, Bryant, Graziano
informed: DAgostino, Alessandro, Bryant, Graziano
---

# Deployment Architecture: On-Premises vs Serverless vs Hybrid

## Context and Problem Statement

The Urban Digital Twin for Emergency Decision-Making must process 100,000 events per minute from 5,000 data streams across a metropolitan district during emergency conditions, with simulation updates occurring within 5-10 seconds of real-world changes. The system must support up to 50 concurrent operators while minimizing infrastructure and operational costs. 

Where should we deploy this real-time emergency system: on-premises data centers, cloud serverless infrastructure, or a hybrid approach combining edge and cloud resources?

## Decision Drivers

* **Performance**: Must maintain 5-10 second synchronization delay during 100k events/min peak loads
* **Cost Optimization**: Minimize infrastructure and operational costs; scale only when needed
* **Scalability**: Support district expansion and handle variable emergency workloads
* **Reliability**: Operate during network degradation and sensor outages
* **Operational Complexity**: Limited in-house infrastructure team availability
* **Geographic Distribution**: Edge gateways across district

## Considered Options

* **On-Premises Infrastructure** - Deploy all components in city-owned data centers
* **Cloud Serverless Architecture** - Fully managed cloud services with auto-scaling
* **Hybrid Edge-Cloud Architecture** - Edge gateways with local autonomy + cloud backend

## Decision Outcome

Chosen option: **"Cloud Serverless Architecture"**, because it best meets the cost optimization requirement, provides built-in auto-scaling for variable workloads, eliminates upfront capital expenditure, and enables rapid deployment. While the hybrid approach offers edge autonomy benefits, the edge components (gateways with Redis store-and-forward) can still be deployed independently while the core processing runs serverless.

### Consequences

* Good, because auto-scaling handles peak 100k events/min without over-provisioning for normal conditions
* Good, because no upfront hardware investment or data center maintenance costs
* Good, because managed services reduce operational complexity
* Good, because geographic redundancy and disaster recovery are built into cloud infrastructure
* Bad, because potential vendor lock-in to cloud provider APIs
* Bad, because ongoing operational costs depend on sustained cloud usage patterns

## Pros and Cons of the Options

### On-Premises Infrastructure

Deploy all system components (streaming platform, time-series DB, application servers) in city-owned data centers with dedicated hardware.

* Good, because complete control over infrastructure and data residency
* Good, because no dependency on external internet connectivity for core processing
* Good, because predictable fixed costs after initial investment
* Neutral, because requires physical security measures for critical infrastructure data
* Bad, because high upfront capital expenditure
* Bad, because must provision for peak emergency load (100k events/min)
* Bad, because requires dedicated operations team for infrastructure maintenance, patching, scaling
* Bad, because limited ability to scale beyond initial capacity without additional hardware investment
* Bad, because single point of failure without expensive redundant data center setup

### Hybrid Edge-Cloud Architecture

Edge gateways with significant local processing capabilities (simulations, local decision-making) combined with cloud backend for aggregation and cross-district coordination.

* Good, because edge autonomy provides resilience during network outages (addresses C5 gateway communication)
* Good, because local processing reduces cloud data transfer costs and latency
* Good, because distributes computational load across edge and cloud tiers
* Good, because edge can continue emergency response even if cloud connection degrades
* Bad, because requires sophisticated edge hardware with compute capacity for simulations
* Bad, because edge simulations may not have full city-wide context needed for cross-district decisions
* Bad, because higher initial investment than pure serverless approach

## More Information

**Decision Alignment**: This decision enables ADR-0002 (microservices architecture) by leveraging cloud-native service mesh and ADR-0003 (Apache Kafka) by using managed streaming platforms. Edge gateway redundancy (C5) and store-and-forward capabilities (Redis) are still implemented regardless of this decision.
