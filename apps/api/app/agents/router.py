from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.agents.state import AgentQueryRequest, AgentQueryResponse
from app.agents.graph import CommerceAgentWorkflow

router = APIRouter()

@router.post("/chat", response_model=AgentQueryResponse)
async def chat_with_agent(
    request: AgentQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    workflow = CommerceAgentWorkflow(db)
    return await workflow.run(request)

@router.get("/status")
async def get_agent_status():
    return {
        "status": "ready",
        "framework": "langgraph-ready",
        "capabilities": ["catalog_search", "order_tracking", "discount_lookup"]
    }
