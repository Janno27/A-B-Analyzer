from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from .analyzer import ABTestAnalyzer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TestData(BaseModel):
    overall_data: List[Dict]
    transaction_data: List[Dict]
    currency: str = 'EUR'
    filters: Dict[str, List[str]] = {'device_category': [], 'item_category2': []}

@app.post("/analyze")
async def analyze_data(data: TestData):
    try:
        analyzer = ABTestAnalyzer()
        analyzer.load_overall_data(data.overall_data)
        analyzer.load_transaction_data(data.transaction_data)
        if data.filters:
            analyzer.filter_data(data.filters)
        results = analyzer.calculate_metrics()
        print("Debug - Raw Results:", results)  # Pour debug
        formatted_results = analyzer.format_metrics(results, data.currency)
        print("Debug - Formatted Results:", formatted_results)  # Pour debug
        return formatted_results
    except Exception as e:
        print("Error:", str(e))  # Pour debug
        raise HTTPException(status_code=400, detail=str(e))