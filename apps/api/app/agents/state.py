from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(description="Role of the message sender: 'user', 'assistant', or 'system'")
    content: str = Field(description="Content of the message")

class AgentState(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)
    user_id: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    next_step: Optional[str] = None

class AgentQueryRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class AgentQueryResponse(BaseModel):
    response: str
    suggested_products: List[Dict[str, Any]] = Field(default_factory=list)
    related_actions: List[str] = Field(default_factory=list)
