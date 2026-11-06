"""
LangGraph E-commerce Agent Architecture.
This module defines the graph workflow and orchestrator for customer-facing AI agents.
It handles intent classification, tool invocation, and contextual responses.
"""
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.state import AgentQueryRequest, AgentQueryResponse
from app.agents.tools import search_catalog, check_order_status, get_active_coupons

class CommerceAgentWorkflow:
    """
    Workflow orchestrator for commerce assistant.
    Can be used standalone or plugged directly into a LangGraph StateGraph.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def run(self, query: AgentQueryRequest) -> AgentQueryResponse:
        text = query.message.strip().lower()
        
        # 1. Check for order tracking queries
        if "order" in text or "track" in text or "status" in text:
            # Check if an order ID is present in message
            tokens = query.message.split()
            order_id = next((t for t in tokens if len(t) > 20 or "-" in t), None)
            if order_id:
                order_info = await check_order_status(self.db, order_id, query.user_id)
                if order_info:
                    return AgentQueryResponse(
                        response=f"Order {order_id} is currently {order_info['status'].upper()} (Payment: {order_info['payment_status'].upper()}) with a total of ${order_info['total']:.2f}.",
                        related_actions=["View Order Details", "Contact Support"]
                    )
                return AgentQueryResponse(
                    response=f"I couldn't find an order with ID '{order_id}'. Please double check the ID from your dashboard.",
                    related_actions=["Go to Dashboard"]
                )
            return AgentQueryResponse(
                response="To track an order, please provide your order ID (found in your account dashboard).",
                related_actions=["View My Orders"]
            )

        # 2. Check for discounts / coupons
        if "coupon" in text or "discount" in text or "promo" in text or "sale" in text:
            coupons = await get_active_coupons(self.db)
            if coupons:
                codes_str = ", ".join([f"**{c['code']}** ({c['value']}{'%' if c['type'] == 'percentage' else '$'} off)" for c in coupons])
                return AgentQueryResponse(
                    response=f"Here are the active promo codes available right now: {codes_str}. Apply them at checkout!",
                    related_actions=["Explore Products", "View Cart"]
                )
            return AgentQueryResponse(
                response="There are currently no active public coupons, but free shipping is available for all orders over $100!",
                related_actions=["Explore Products"]
            )

        # 3. Product catalog search & recommendations
        # Extract potential search terms
        clean_terms = text.replace("looking for", "").replace("search", "").replace("find", "").replace("recommend", "").strip()
        search_term = clean_terms if len(clean_terms) > 2 else "phone"
        
        products = await search_catalog(self.db, search_term, limit=4)
        if not products and len(search_term) > 3:
            products = await search_catalog(self.db, "", limit=4)

        if products:
            names = [p["name"] for p in products]
            return AgentQueryResponse(
                response=f"I found {len(products)} relevant item(s) for you: {', '.join(names)}. Click any item to view specifications and add it to your cart.",
                suggested_products=products,
                related_actions=["Browse All Products", "View Deals"]
            )

        return AgentQueryResponse(
            response="Hi! I am your AI Commerce Assistant. I can help you search products, track existing orders, and find active discount codes. What are you looking for today?",
            related_actions=["Browse All Products", "View My Orders", "Check Active Coupons"]
        )
