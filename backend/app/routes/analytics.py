from fastapi import APIRouter, HTTPException
from app.database import db
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter()

@router.get("/api/analytics/risk")
async def get_risk_analytics():
    """
    Calculate risk scores for all active batches based on:
    - Supplier reliability (past recalls)
    - Storage duration (days since received)
    - Downstream impact (number of connected entities)
    - Status flags
    """
    
    query = """
    MATCH (b:Batch)
    OPTIONAL MATCH (b)<-[:SOURCED_FROM]-(s:Supplier)
    OPTIONAL MATCH (b)<-[:SOURCED_FROM]-(inv:Inventory)
    OPTIONAL MATCH (inv)-[:USED_IN]->(d:Dish)
    OPTIONAL MATCH (d)<-[:CONTAINS]-(o:Order)
    OPTIONAL MATCH (o)-[:PLACED_BY]->(c:Customer)
    
    WITH b, s,
         count(DISTINCT inv) as inventory_count,
         count(DISTINCT d) as dish_count,
         count(DISTINCT o) as order_count,
         count(DISTINCT c) as customer_count
    
    // Calculate supplier reliability
    OPTIONAL MATCH (s)<-[:SOURCED_FROM]-(recalled_batches:Batch {status: 'CONTAMINATED'})
    WITH b, s, inventory_count, dish_count, order_count, customer_count,
         count(DISTINCT recalled_batches) as supplier_recalls
    
    RETURN b.id as batch_id,
           b.ingredient as ingredient,
           b.status as status,
           b.received_date as received_date,
           b.expiry_date as expiry_date,
           COALESCE(s.name, 'Unknown') as supplier_name,
           supplier_recalls,
           inventory_count,
           dish_count,
           order_count,
           customer_count
    ORDER BY b.id
    """
    
    with db.driver.session() as session:
        result = session.run(query)
        records = list(result)
        
        risk_scores = []
        
        for record in records:
            batch_id = record["batch_id"]
            ingredient = record["ingredient"]
            status = record["status"]
            received_date = record["received_date"]
            expiry_date = record["expiry_date"]
            supplier_recalls = record["supplier_recalls"]
            downstream_impact = record["order_count"] + record["customer_count"]
            
            # Calculate risk factors (0-100 scale)
            
            # 1. Supplier Reliability (100 = good, 0 = bad)
            if supplier_recalls == 0:
                supplier_reliability = 95
            elif supplier_recalls == 1:
                supplier_reliability = 70
            else:
                supplier_reliability = max(30, 100 - (supplier_recalls * 25))
            
            # 2. Storage Duration Risk (0 = fresh, 100 = expired)
            try:
                received_dt = datetime.fromisoformat(received_date.replace('Z', '+00:00'))
                expiry_dt = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
                now = datetime.now(received_dt.tzinfo)
                total_life = (expiry_dt - received_dt).days
                days_stored = (now - received_dt).days
                storage_risk = min(100, max(0, int((days_stored / total_life) * 100)))
            except:
                storage_risk = 50  # default if date parsing fails
            
            # 3. Downstream Impact Risk (0 = low impact, 100 = high impact)
            # Based on number of orders/customers affected
            if downstream_impact == 0:
                impact_risk = 5
            elif downstream_impact <= 5:
                impact_risk = 30
            elif downstream_impact <= 15:
                impact_risk = 60
            else:
                impact_risk = min(100, 60 + (downstream_impact - 15) * 3)
            
            # 4. Status Risk
            status_risk_map = {
                'CONTAMINATED': 100,
                'QUARANTINED': 90,
                'FLAGGED': 70,
                'SUSPENDED': 80,
                'ACTIVE': 10,
                'VERIFIED': 5
            }
            status_risk = status_risk_map.get(status, 20)
            
            # Calculate overall risk (weighted average)
            overall_risk = int(
                (supplier_reliability * 0.1) +  # Lower supplier reliability increases risk
                (storage_risk * 0.25) +
                (impact_risk * 0.35) +
                (status_risk * 0.30)
            )
            
            # Invert supplier reliability for display (show as risk factor)
            supplier_risk_display = 100 - supplier_reliability
            
            # Generate recommendation
            if overall_risk >= 70:
                recommendation = "HIGH RISK - Immediate inspection and possible recall required"
            elif overall_risk >= 40:
                recommendation = "MEDIUM RISK - Schedule quality check and monitor closely"
            else:
                recommendation = "LOW RISK - Continue routine monitoring"
            
            risk_scores.append({
                "batch_id": batch_id,
                "ingredient": ingredient,
                "status": status,
                "supplier_name": record["supplier_name"],
                "overall_risk": overall_risk,
                "factors": {
                    "supplier_reliability": supplier_risk_display,
                    "storage_duration": storage_risk,
                    "downstream_impact": impact_risk,
                    "status_flag": status_risk
                },
                "downstream_counts": {
                    "inventory": record["inventory_count"],
                    "dishes": record["dish_count"],
                    "orders": record["order_count"],
                    "customers": record["customer_count"]
                },
                "recommendation": recommendation
            })
        
        return {
            "success": True,
            "risk_scores": risk_scores,
            "total_batches": len(risk_scores),
            "high_risk_count": len([r for r in risk_scores if r["overall_risk"] >= 70]),
            "medium_risk_count": len([r for r in risk_scores if 40 <= r["overall_risk"] < 70]),
            "low_risk_count": len([r for r in risk_scores if r["overall_risk"] < 40])
        }