from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import curation, proposal, catalog, dashboard, auth
from app.services.ai_service import AIServiceError
from app.services.catalog_service import CatalogImportError
from sqlalchemy.exc import SQLAlchemyError

app = FastAPI(title="圖書館智慧策展系統 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError):
    return JSONResponse(
        status_code=502,
        content={"status": "error", "detail": f"AI 服務錯誤：{str(exc)}"},
    )

@app.exception_handler(CatalogImportError)
async def catalog_import_error_handler(request: Request, exc: CatalogImportError):
    return JSONResponse(
        status_code=400,
        content={"status": "error", "detail": f"館藏導入錯誤：{str(exc)}"},
    )

@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "detail": "資料庫操作錯誤"},
    )

# Include routers
app.include_router(auth.router, prefix="/curation_management/backend", tags=["Auth"])
protected = [Depends(auth.require_authenticated_user)]
app.include_router(curation.router, prefix="/curation_management/backend", tags=["Curation"], dependencies=protected)
app.include_router(proposal.router, prefix="/curation_management/backend", tags=["Proposal"], dependencies=protected)
app.include_router(catalog.router, prefix="/curation_management/backend", tags=["Catalog"], dependencies=protected)
app.include_router(dashboard.router, prefix="/curation_management/backend", tags=["Dashboard"], dependencies=protected)

@app.get("/")
def read_root():
    return {"message": "Welcome to Library Smart Curation API. Access /docs for swagger UI."}

