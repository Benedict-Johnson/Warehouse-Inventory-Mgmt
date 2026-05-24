# Warehouse Inventory Reservation System

## 1. Project Overview

This project implements a concurrency-safe warehouse inventory reservation system. The core functionality allows users to temporarily reserve inventory from specific warehouses before confirming their purchase. 

Key mechanics include:
* **Temporary Inventory Holds**: A reservation temporarily deducts units from available stock without finalizing the sale immediately.
* **Reservation Lifecycle**: Users have a strict 5-minute window to confirm their reservation. If they confirm, the sale is finalized. If they release or let it expire, the stock is automatically restored to the warehouse.
* **Concurrency-Safe Processing**: High-traffic operations are safeguarded using PostgreSQL row-level locks to completely eliminate race conditions and overselling.

## 2. Live Demo

The application is deployed on Vercel and connected to a Supabase PostgreSQL instance. The full reservation lifecycle (including holding, expiration, confirmation, and stock adjustments) can be tested end-to-end.

**Vercel URL**: https://warehouse-inventory-mgmt.vercel.app/

## 3. Tech Stack

* **Frontend Framework**: Next.js App Router (React Server Components)
* **Language**: TypeScript
* **Database / ORM**: PostgreSQL (hosted via Supabase), Prisma ORM
* **Styling / Components**: Tailwind CSS, shadcn/ui, Lucide Icons
* **Concurrency Mechanisms**: Prisma interactive transactions, PostgreSQL row-level locking (`SELECT ... FOR UPDATE`)

## 4. Local Setup Instructions

Follow these steps to run the application locally:

### Prerequisites
* Node.js v20+
* A PostgreSQL instance (e.g., Supabase)

## 5. Database & Reservation Architecture

The database schema is strictly normalized around four core entities:

* **Product**: Represents the SKU (e.g., Engine, Chassis).
* **Warehouse**: Represents the physical location.
* **Inventory**: Represents the junction between `Product` and `Warehouse`. It tracks `totalUnits` and `reservedUnits`. 
  * `availableUnits` is dynamically computed as `totalUnits - reservedUnits`.
* **Reservation**: Represents a temporary hold on stock. It links directly to the `Inventory` model to ensure precise warehouse-level deductions.

**Data Integrity:**
* The database enforces a `CHECK (total_units >= reserved_units)` constraint on the inventory table to prevent negative availability.
* The reservation enforces status transitions (`PENDING` -> `CONFIRMED` or `RELEASED`).

## 6. Expiry Mechanism in Production

Reservations are strictly enforced with a 5-minute time-to-live (TTL).

* When a reservation is created, an `expiresAt` timestamp is attached.
* If a user attempts to confirm a reservation *after* the expiration time, the backend intercepts the request, automatically triggers a rollback to release the reserved stock, and returns an **HTTP 410 Gone** status code.
* The frontend visibly processes this by transforming the action banner into an expiration warning.

<img width="1896" height="890" alt="410 Registration Expired" src="https://github.com/user-attachments/assets/486c24e0-af1b-45f5-a681-af897b5b50d2" />


## 7. Concurrency Handling

Preventing race conditions and overselling under concurrent load is the most critical feature of this architecture.

**Mechanism:**
When processing a reservation, we use Prisma interactive transactions intertwined with raw PostgreSQL queries. Specifically, we utilize `SELECT ... FOR UPDATE` to implement row-level locking on the targeted `Inventory` row.

1. **Transaction Initialization**: A transaction begins.
2. **Lock Acquisition**: The specific inventory row is locked via `SELECT * FROM "Inventory" WHERE id = $1 FOR UPDATE`. Any simultaneous requests for this exact row will immediately block and wait until the current transaction commits or rolls back.
3. **Validation**: The system verifies if `(totalUnits - reservedUnits) >= requestedQuantity`. 
4. **Commit/Rollback**: 
   * If stock is sufficient, the transaction succeeds, and stock is decremented.
   * If stock is insufficient, the transaction is rolled back, and the API returns **HTTP 409 Conflict**.

**Simultaneous Request Behavior:**
Under simultaneous requests attempting to reserve the exact same limited stock, only the first request will succeed. The subsequent blocked requests will acquire the lock after the first commits, observe the newly depleted stock, and correctly fail with a 409 Conflict.

### Concurrent Request Lifecycle
**Successful Request Processing:**
![Simultaneous request-Success](Simultaneous%20request-Success.png)

**Failed Concurrent Request (Blocked and Rejected):**
<img width="913" height="185" alt="Simultaneous request-insuffiecient" src="https://github.com/user-attachments/assets/8c91dded-7061-4930-8ad9-14d6c9959912" />


**Frontend 409 Feedback:**
<img width="562" height="361" alt="Error 409" src="https://github.com/user-attachments/assets/b82b728e-eb73-496c-bb1f-52c8b5f583b6" />


## 8. Reservation Flow Screenshots

### Homepage Configuration
![Homepage Top](Homepage-top.png)
![Homepage Down](Homepage-down.png)

### Quantity Selection
![Quantity Selector](Quantity%20selector.png)

### Temporary Reservation Hold
![Temporary holding](Temporary%20holding.png)

### Successful Confirmation
![Reservation success](Reservation%20success.png)

### Inventory Deduction Verification
**Before Reservation:**
![Before Reservation count](Before%20Resevation%20count.png)

**After Reservation:**
![After Reservation count](After%20Resevation%20count.png)

## 9. Trade-offs / Future Improvements

* **Lazy Cleanup Over Background Workers**: Currently, expired reservations are cleaned up lazily when the user attempts an action (like confirmation) on an expired state. In a larger production environment, a scheduled CRON job or worker queue (e.g., Redis/BullMQ) should actively sweep and release expired reservations to free up stock automatically.
* **Optimistic UI**: The frontend currently relies on strict server responses before updating stock counts. Implementing optimistic UI updates would make the interface feel snappier.
* **Authentication/Authorization**: Omitted to strictly focus on the inventory/concurrency scope.
* **Distributed Locking**: While PostgreSQL row-level locks are robust and ACID-compliant, extremely high-throughput systems might benefit from an initial distributed lock layer (e.g., Redis Redlock) to reduce database connection saturation.
* **Automated Load Testing**: Could be expanded using tools like Artillery or k6 to continuously benchmark concurrency thresholds.

## 10. What Was Prioritized

During development, the following principles were prioritized strictly against the assignment parameters:
* **Correctness Under Concurrency**: Ensuring zero overselling is mathematically and procedurally guaranteed via row-level locks.
* **Maintainability & Readable Structure**: Code is modular, avoiding overengineering while maintaining clean separation between API routes, UI components, and business logic.
* **Reservation Consistency**: The relationship between product, warehouse, inventory, and reservations is strictly enforced.
* **Production Deployment**: Vercel configuration was explicitly handled to guarantee strict TypeScript compilations and correct build-time generation of the Prisma client.

