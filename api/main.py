from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from .analyzer import ABTestAnalyzer
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TestData(BaseModel):
    overall_data: Union[List[Dict], Dict[str, Dict]]
    transaction_data: List[Dict]
    currency: str = 'EUR'
    filters: Dict[str, List[str]] = Field(
        default={'device_category': [], 'item_category2': []},
        description="Filtres pour les données"
    )

    class Config:
        extra = "allow"
        json_encoders = {
            float: lambda v: str(v) if v > 999999 else v
        }

class MetricsRequest(BaseModel):
    overall_data: List[Dict]
    transaction_data: List[Dict]
    filters: Dict[str, List[str]] = {'device_category': [], 'item_category2': []}
    currency: str = 'EUR'

class RangeModel(BaseModel):
    min: float
    max: Union[float, str] = Field(description="Can be a float or 'Infinity'")
    label: str

class RevenueRadarRequest(BaseModel):
    overall_data: List[Dict]
    transaction_data: List[Dict]
    filters: Dict = {}
    currency: str = 'EUR'
    ranges: List[RangeModel]

    class Config:
        json_encoders = {
            float: lambda v: "Infinity" if v == float('inf') else v
        }

@app.post("/metrics")
async def get_metrics(data: MetricsRequest):
    try:
        analyzer = ABTestAnalyzer()
        analyzer.load_overall_data(data.overall_data)
        analyzer.load_transaction_data(data.transaction_data)
        
        if data.filters:
            analyzer.filter_data(data.filters)
            
        results = analyzer.calculate_metrics()
        formatted_results = analyzer.format_metrics(results, data.currency)
        return formatted_results
    except Exception as e:
        print("Error in /metrics:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analyze")
async def analyze_data(data: TestData):
    try:
        print("Received data:", data.dict())
        
        overall_data_list = []
        if isinstance(data.overall_data, dict):
            if 'content' in data.overall_data:
                overall_data_list = data.overall_data['content']
            else:
                overall_data_list = [v for v in data.overall_data.values()]
        else:
            overall_data_list = data.overall_data

        for item in overall_data_list:
            for key in ['sessions', 'users', 'user_pdp_views', 'user_add_to_carts', 
                       'user_begin_checkouts', 'user_purchases', 'purchases', 'quantity']:
                if key in item and isinstance(item[key], str):
                    item[key] = float(item[key].replace(',', ''))
            if 'revenue' in item and isinstance(item['revenue'], str):
                item['revenue'] = float(item['revenue'].replace(',', ''))

        analyzer = ABTestAnalyzer()
        analyzer.load_overall_data(overall_data_list)
        analyzer.load_transaction_data(data.transaction_data)
        
        if data.filters:
            analyzer.filter_data(data.filters)
            
        results = analyzer.calculate_metrics()
        formatted_results = analyzer.format_metrics(results, data.currency)
        return formatted_results
    except Exception as e:
        print("Error processing data:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/revenue-radar")
async def get_revenue_radar(request: RevenueRadarRequest):
    ranges = []
    for r in request.ranges:
        range_dict = r.dict()
        if range_dict['max'] == "Infinity" or range_dict['max'] == float('inf'):
            range_dict['max'] = float('inf')
        ranges.append(range_dict)

    analyzer = ABTestAnalyzer()
    analyzer.load_overall_data(request.overall_data)
    analyzer.load_transaction_data(request.transaction_data)
    
    if request.filters:
        analyzer.filter_data(request.filters)
    
    result = analyzer.get_revenue_radar_data(ranges)
    
    return {"data": result}