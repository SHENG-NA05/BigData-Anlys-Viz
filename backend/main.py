from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import curation, proposal, catalog, dashboard, auth

app = FastAPI(title="圖書館智慧策展系統 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/curation_management/backend", tags=["Auth"])
app.include_router(curation.router, prefix="/curation_management/backend", tags=["Curation"])
app.include_router(proposal.router, prefix="/curation_management/backend", tags=["Proposal"])
app.include_router(catalog.router, prefix="/curation_management/backend", tags=["Catalog"])
app.include_router(dashboard.router, prefix="/curation_management/backend", tags=["Dashboard"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Library Smart Curation API. Access /docs for swagger UI."}
