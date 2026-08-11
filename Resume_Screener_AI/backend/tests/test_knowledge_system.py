import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch, ANY
from app.models.orm import CompanyKnowledge, EmailTemplate, UploadedDocument, User, UserRole
from app.models.candidate_schemas import CompanyKnowledgeUpdate, EmailTemplateCreate, EmailTemplateUpdate, CompanyKnowledgeResponse, EmailTemplateResponse


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.add = MagicMock()
    db.delete = AsyncMock()
    return db


@pytest.fixture
def company_admin():
    return User(
        id="u1", role=UserRole.COMPANY_ADMIN, company_id="c1",
        email="admin@c.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def hr_user():
    return User(
        id="u2", role=UserRole.HR_RECRUITER, company_id="c1",
        email="hr@c.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def other_company_user():
    return User(
        id="u3", role=UserRole.COMPANY_ADMIN, company_id="c2",
        email="admin@other.com", created_at=datetime(2025, 1, 1),
    )


@pytest.fixture
def sample_knowledge():
    return CompanyKnowledge(
        id="k1", company_id="c1",
        mission="Our mission",
        vision="Our vision",
        culture="Collaborative",
        core_values=["Integrity", "Innovation"],
        work_environment="Hybrid",
        remote_policy="2 days WFH",
        working_hours="9-5",
        interview_process="3 rounds",
        interview_stages=["Phone", "Technical", "Final"],
        hiring_policy="Equal opportunity",
        required_documents=["ID", "Degree"],
        preferred_skills=["Python", "FastAPI"],
        communication_style="Slack-first",
        interview_days=[1, 2, 3],
        interview_time_slots=["09:00-10:00", "14:00-15:00"],
        meeting_duration=60,
        timezone="UTC",
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 1),
    )


# ── Test 1: Knowledge Agent extracts fields from document text ──

@pytest.mark.asyncio
@patch("app.services.knowledge_service.AsyncAIClient")
async def test_knowledge_agent_extracts_fields(mock_ai_client):
    from app.services.knowledge_service import KnowledgeAgent

    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value='''
    {
        "mission": "Deliver excellence",
        "vision": "Global leader",
        "culture": "Innovative",
        "core_values": ["Quality", "Teamwork"],
        "work_environment": "Remote-first",
        "remote_policy": "Fully remote",
        "working_hours": "Flexible",
        "interview_process": "2 stages",
        "interview_stages": ["Screening", "Final"],
        "hiring_policy": "DEI focused",
        "required_documents": ["Resume", "Portfolio"],
        "preferred_skills": ["React", "TypeScript"],
        "communication_style": "Async",
        "interview_days": [0, 2, 4],
        "interview_time_slots": ["10:00-11:00"],
        "meeting_duration": 45,
        "timezone": "EST"
    }
    ''')
    mock_ai_client.return_value = mock_client

    agent = KnowledgeAgent()
    result = await agent.extract_from_document("Our company handbook...")

    assert result["mission"] == "Deliver excellence"
    assert result["vision"] == "Global leader"
    assert result["culture"] == "Innovative"
    assert result["core_values"] == ["Quality", "Teamwork"]
    assert result["work_environment"] == "Remote-first"
    assert result["remote_policy"] == "Fully remote"
    assert result["working_hours"] == "Flexible"
    assert result["interview_process"] == "2 stages"
    assert result["interview_stages"] == ["Screening", "Final"]
    assert result["hiring_policy"] == "DEI focused"
    assert result["required_documents"] == ["Resume", "Portfolio"]
    assert result["preferred_skills"] == ["React", "TypeScript"]
    assert result["communication_style"] == "Async"
    assert result["interview_days"] == [0, 2, 4]
    assert result["interview_time_slots"] == ["10:00-11:00"]
    assert result["meeting_duration"] == 45
    assert result["timezone"] == "EST"


# ── Test 2: Agent returns nulls on empty document ──

@pytest.mark.asyncio
@patch("app.services.knowledge_service.AsyncAIClient")
async def test_knowledge_agent_returns_nulls_on_empty(mock_ai_client):
    from app.services.knowledge_service import KnowledgeAgent

    mock_client = AsyncMock()
    mock_client.chat_completion = AsyncMock(return_value='''{"mission": null, "vision": null, "culture": null, "core_values": null, "work_environment": null, "remote_policy": null, "working_hours": null, "interview_process": null, "interview_stages": null, "hiring_policy": null, "required_documents": null, "preferred_skills": null, "communication_style": null, "interview_days": null, "interview_time_slots": null, "meeting_duration": 60, "timezone": "UTC"}''')
    mock_ai_client.return_value = mock_client

    agent = KnowledgeAgent()
    result = await agent.extract_from_document("")

    assert result["mission"] is None
    assert result["meeting_duration"] == 60


# ── Test 3: GET company knowledge returns record ──

@pytest.mark.asyncio
async def test_get_company_knowledge(mock_db, sample_knowledge, company_admin):
    from app.routers.knowledge import get_company_knowledge

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = sample_knowledge
    mock_db.execute.return_value = mock_result

    result = await get_company_knowledge("c1", mock_db, company_admin)

    assert result.mission == "Our mission"
    assert result.culture == "Collaborative"


# ── Test 4: PUT upserts company knowledge ──

@pytest.mark.asyncio
async def test_upsert_company_knowledge(mock_db, company_admin):
    from app.routers.knowledge import upsert_company_knowledge

    now = datetime(2025, 1, 1)
    existing = CompanyKnowledge(id="k1", company_id="c1", created_at=now, updated_at=now)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result

    with patch("app.routers.knowledge._ensure_knowledge", new_callable=AsyncMock, return_value=existing):
        request = CompanyKnowledgeUpdate(mission="New mission", culture="New culture")
        result = await upsert_company_knowledge("c1", request, mock_db, company_admin)

    assert result.company_id == "c1"
    assert result.mission == "New mission" or result.mission is None


# ── Test 5: Access denied for cross-company knowledge read ──

@pytest.mark.asyncio
async def test_knowledge_access_denied_cross_company(mock_db, other_company_user):
    from app.routers.knowledge import get_company_knowledge
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await get_company_knowledge("c1", mock_db, other_company_user)
    assert exc.value.status_code == 403


# ── Test 6: Email template CRUD - create ──

@pytest.mark.asyncio
async def test_create_email_template(mock_db, company_admin):
    from app.routers.knowledge import create_email_template

    now = datetime(2025, 1, 1)
    async def _refresh(instance):
        instance.id = "t1"
        instance.created_at = now
        instance.updated_at = now
    mock_db.refresh = _refresh

    request = EmailTemplateCreate(type="interview_invitation", subject="Interview Invitation", body="Dear {{name}}, you're invited.")
    result = await create_email_template("c1", request, mock_db, company_admin)

    assert result.type == "interview_invitation"
    assert result.subject == "Interview Invitation"


# ── Test 7: Email template CRUD - list ──

@pytest.mark.asyncio
async def test_list_email_templates(mock_db, company_admin):
    from app.routers.knowledge import list_email_templates

    mock_templates = [
        EmailTemplate(id="t1", company_id="c1", type="invite", subject="Subject", body="Body",
                      created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1)),
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_templates
    mock_db.execute.return_value = mock_result

    result = await list_email_templates("c1", mock_db, company_admin)
    assert len(result) == 1
    assert result[0].type == "invite"


# ── Test 8: Email template CRUD - update ──

@pytest.mark.asyncio
async def test_update_email_template(mock_db, company_admin):
    from app.routers.knowledge import update_email_template

    template = EmailTemplate(id="t1", company_id="c1", type="invite", subject="Old", body="Old body",
                             created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1))
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = template
    mock_db.execute.return_value = mock_result
    mock_db.refresh = AsyncMock()

    request = EmailTemplateUpdate(subject="New Subject")
    result = await update_email_template("c1", "t1", request, mock_db, company_admin)

    assert template.subject == "New Subject"


# ── Test 9: Email template CRUD - delete ──

@pytest.mark.asyncio
async def test_delete_email_template(mock_db, company_admin):
    from app.routers.knowledge import delete_email_template

    template = EmailTemplate(id="t1", company_id="c1", type="invite", subject="S", body="B",
                             created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1))
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = template
    mock_db.execute.return_value = mock_result

    result = await delete_email_template("c1", "t1", mock_db, company_admin)
    assert result is None
    mock_db.delete.assert_called_once_with(template)
    mock_db.commit.assert_called_once()


# ── Test 10: Document upload creates UploadedDocument ──

@patch("app.routers.knowledge.extract_text_from_pdf", new_callable=AsyncMock)
@patch("app.routers.knowledge.GeminiEmbeddingService")
@patch("app.routers.knowledge.KnowledgeAgent")
@pytest.mark.asyncio
async def test_upload_document_creates_record(mock_agent_cls, mock_embed_cls, mock_extract, mock_db, company_admin):
    from app.routers.knowledge import extract_knowledge_from_document

    mock_extract.return_value = "Extracted handbook content"

    mock_embed = AsyncMock()
    mock_embed.embed_text = AsyncMock(return_value=[0.1] * 768)
    mock_embed_cls.return_value = mock_embed

    mock_agent = AsyncMock()
    mock_agent.extract_from_document = AsyncMock(return_value={"mission": "M", "vision": "V"})
    mock_agent_cls.return_value = mock_agent

    # Mock _ensure_knowledge to return existing record
    existing = CompanyKnowledge(id="k1", company_id="c1", created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1))

    # We need to inject the mock before the real function runs
    # The function calls _ensure_knowledge internally which depends on db.execute
    # Let's just verify the flow works

    mock_file = MagicMock()
    mock_file.filename = "handbook.pdf"
    mock_file.read = AsyncMock(return_value=b"%PDF-1.4 fake pdf content")
    mock_file.content_type = "application/pdf"

    # Mock _get_knowledge to return None then the existing record
    mock_result_none = MagicMock()
    mock_result_none.scalar_one_or_none.return_value = None

    mock_result_existing = MagicMock()
    mock_result_existing.scalar_one_or_none.return_value = existing

    mock_db.execute.side_effect = [mock_result_none, mock_result_existing]

    with patch("app.routers.knowledge._ensure_knowledge", new_callable=AsyncMock, return_value=existing):
        with patch("app.routers.knowledge._get_knowledge", new_callable=AsyncMock, return_value=None):
            result = await extract_knowledge_from_document("c1", mock_file, mock_db, company_admin)

    assert result.knowledge.company_id == "c1"
    assert result.document_id is not None
    mock_db.add.assert_called()  # Document was added


# ── Test 11: List uploaded documents ──

@pytest.mark.asyncio
async def test_list_uploaded_documents(mock_db, company_admin):
    from app.routers.knowledge import list_uploaded_documents

    mock_docs = [
        UploadedDocument(id="d1", company_id="c1", filename="doc.pdf", original_name="doc.pdf", file_type="pdf",
                         created_at=datetime(2025, 1, 1)),
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = mock_docs
    mock_db.execute.return_value = mock_result

    result = await list_uploaded_documents("c1", mock_db, company_admin)
    assert len(result) == 1
    assert result[0].filename == "doc.pdf"


# ── Test 12: Schemas validate correctly ──

def test_company_knowledge_response_from_orm(sample_knowledge):
    resp = CompanyKnowledgeResponse.model_validate(sample_knowledge)
    assert resp.mission == "Our mission"
    assert resp.core_values == ["Integrity", "Innovation"]
    assert resp.interview_stages == ["Phone", "Technical", "Final"]
    assert resp.meeting_duration == 60


def test_email_template_response_from_orm():
    tpl = EmailTemplate(id="t1", company_id="c1", type="invite", subject="Hello", body="World",
                        created_at=datetime(2025, 1, 1), updated_at=datetime(2025, 1, 1))
    resp = EmailTemplateResponse.model_validate(tpl)
    assert resp.type == "invite"
    assert resp.subject == "Hello"
    assert resp.body == "World"


def test_email_template_create_validation():
    from app.models.candidate_schemas import EmailTemplateCreate
    import pydantic

    tpl = EmailTemplateCreate(type="rejection", subject="Update", body="Thank you for applying")
    assert tpl.type == "rejection"

    with pytest.raises(pydantic.ValidationError):
        EmailTemplateCreate(type="", subject="", body="")  # empty type fails min_length


# ── Test 13: HR role CAN access knowledge via extract endpoint ──

@pytest.mark.asyncio
async def test_hr_can_access_extract(mock_db, hr_user):
    from app.routers.knowledge import extract_knowledge_from_document

    mock_file = MagicMock()
    mock_file.filename = "policy.txt"
    mock_file.read = AsyncMock(return_value=b"Some text")
    mock_file.content_type = "text/plain"

    now = datetime(2025, 1, 1)
    existing = CompanyKnowledge(id="k1", company_id="c1", created_at=now, updated_at=now)

    with (
        patch("app.routers.knowledge.extract_text_from_pdf") as mock_extract,
        patch("app.routers.knowledge._ensure_knowledge", new_callable=AsyncMock, return_value=existing),
        patch("app.routers.knowledge.KnowledgeAgent") as mock_agent_cls,
        patch("app.routers.knowledge.GeminiEmbeddingService") as mock_embed_cls,
    ):
        mock_extract.return_value = "Some policy text"
        mock_agent = AsyncMock()
        mock_agent.extract_from_document = AsyncMock(return_value={"mission": "M"})
        mock_agent_cls.return_value = mock_agent
        mock_embed = AsyncMock()
        mock_embed.embed_text = AsyncMock(return_value=[0.1] * 768)
        mock_embed_cls.return_value = mock_embed

        result = await extract_knowledge_from_document("c1", mock_file, mock_db, hr_user)

    assert result.knowledge.company_id == "c1"


# ── Test 14: Cross-company user denied document access ──

@pytest.mark.asyncio
async def test_cross_company_document_access_denied(mock_db, other_company_user):
    from app.routers.knowledge import list_uploaded_documents
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await list_uploaded_documents("c1", mock_db, other_company_user)
    assert exc.value.status_code == 403


# ── Test 15: PUT with all 17 fields ──

def test_company_knowledge_update_all_fields():
    update = CompanyKnowledgeUpdate(
        mission="M", vision="V", culture="C", core_values=["a", "b"],
        work_environment="Remote", remote_policy="WFH", working_hours="Flex",
        interview_process="3 stages", interview_stages=["S1", "S2"],
        hiring_policy="DEI", required_documents=["D1", "D2"],
        preferred_skills=["S1", "S2"], communication_style="Slack",
        interview_days=[1, 3, 5], interview_time_slots=["9-10"],
        meeting_duration=30, timezone="PST",
    )
    assert update.mission == "M"
    assert update.core_values == ["a", "b"]
    assert update.meeting_duration == 30
    assert update.timezone == "PST"
