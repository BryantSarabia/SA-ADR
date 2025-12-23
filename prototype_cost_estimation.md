# Cost Estimation and Resource Allocation

## Overview
The estimated monthly operational expenditure (OPEX) for the L'Aquila Emergency Management Digital Twin is **€4,850**. This figure is based on **verified pricing for the AWS Milan Region (`eu-south-1`)**, ensuring strict adherence to local data residency requirements. The budget supports the high-throughput requirement of **100,000 events per minute** and includes a substantial **strategic reserve** to mitigate risks associated with traffic spikes and exchange rate fluctuations.

## Component-Based Breakdown

### 1. Shared Platform Layer (~24% of Budget)
The foundational infrastructure is the largest cost driver at **€1,150/month**. Real-world pricing analysis revealed that **Networking** is often underestimated; specifically, deploying three **NAT Gateways** (one per Availability Zone) to ensure High Availability costs approximately €450/month alone. This layer also includes the **EKS Control Plane** and **AWS Business Support**, ensuring 24/7 access to cloud experts.

### 2. Ingestion Layer (~10% of Budget)
Allocated **€480/month**, the ingestion layer handles the 1,700 events/second stream. While the compute cost for **Kafka** brokers (`m6g.large`) is moderate, the **Inter-AZ Data Transfer** fees are significant (€260/month). This is a necessary expense: replicating every event across three physical data centers guarantees that no emergency data is lost, even in the event of a catastrophic facility failure.

### 3. Simulation Layer (~2% of Budget)
The simulation layer remains highly efficient at **€90/month**. By utilizing **Spot Instances** (`t4g.large`) for the City, Vehicle, and Building simulators, we achieve a ~70% cost reduction compared to on-demand pricing. This "stateless" workload is the perfect candidate for such optimization.

### 4. Storage & Analytics Layer (~14% of Budget)
Persisting the 4.3 TB of monthly data costs **€665/month**. We utilize **InfluxDB** on memory-optimized instances (`m6g.2xlarge`) with high-performance `gp3` SSD storage to ensure query latency remains under 100ms. This budget also covers a robust backup strategy involving **Amazon S3** and **Glacier** for long-term, immutable data retention.

### 5. Processing Layer (~6% of Budget)
Business logic execution costs **€290/month**. The critical component here is the **Redis** cluster (`r6g.large`), configured in a primary-replica architecture. This ensures that the "live" state of the Digital Twin is always available in memory for real-time decision-making.

### 6. Presentation Layer (~2% of Budget)
The dashboard hosting and data delivery are budgeted at **€115/month**. This covers static hosting on S3/CloudFront and the data egress fees for serving real-time updates to emergency operators.

### 7. Non-Production Environments (~20% of Budget)
To maintain software quality, **€950/month** is allocated to Staging and Development environments. The Staging environment is a scaled-down replica of production, essential for verifying performance patches and security updates before they touch the live emergency system.

## Conclusion
This budget is realistic and resilient. By validating costs against actual `eu-south-1` pricing, we have identified and accounted for "hidden" expenses like NAT Gateways and cross-zone data transfer. The allocation prioritizes **Reliability** (Platform/Networking) and **Data Integrity** (Storage/Ingestion), ensuring the Digital Twin serves as a dependable tool for emergency management.
