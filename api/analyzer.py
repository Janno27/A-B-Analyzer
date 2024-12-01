import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional

class ABTestAnalyzer:
    def __init__(self):
        self.overall_data = None
        self.transaction_data = None

    def load_overall_data(self, data: List[Dict]) -> None:
        self.overall_data = pd.DataFrame(data)
        self.overall_data = self.overall_data[
            self.overall_data['item_category2'] == '((Total))'
        ]
        
        numeric_cols = ['sessions', 'users', 'user_pdp_views', 'user_add_to_carts', 
                       'user_begin_checkouts', 'user_purchases', 'purchases', 'quantity']
        for col in numeric_cols:
            if col in self.overall_data.columns:
                self.overall_data[col] = pd.to_numeric(
                    self.overall_data[col].astype(str).str.replace(',', ''), 
                    errors='coerce'
                )

    def load_transaction_data(self, data: List[Dict]) -> None:
        self.transaction_data = pd.DataFrame(data)
        self.transaction_data['revenue'] = pd.to_numeric(
            self.transaction_data['revenue'].astype(str).str.replace(',', ''), 
            errors='coerce'
        )
        self.transaction_data['quantity'] = pd.to_numeric(
            self.transaction_data['quantity'], 
            errors='coerce'
        )

    def filter_data(self, filters: Dict) -> None:
        if not filters or (not filters.get('device_category') and not filters.get('item_category2')):
            return

        if filters.get('device_category'):
            device_filtered_transactions = self.transaction_data[
                self.transaction_data['device_category'].isin(filters['device_category'])
            ]
            filtered_transaction_ids = device_filtered_transactions['transaction_id'].unique()
            self.transaction_data = self.transaction_data[
                self.transaction_data['transaction_id'].isin(filtered_transaction_ids)
            ]

        if filters.get('item_category2'):
            category_filtered_transactions = self.transaction_data[
                self.transaction_data['item_category2'].isin(filters['item_category2'])
            ]
            self.transaction_data = category_filtered_transactions

    def calculate_revenue_ranges(self, transaction_metrics: pd.DataFrame) -> Dict[str, Dict]:
        ranges = [
            (0, 500),
            (501, 1000),
            (1001, 2000),
            (2000, float('inf'))
        ]
        
        result = {}
        for min_val, max_val in ranges:
            range_key = f"{min_val}-{max_val if max_val != float('inf') else '+'}"
            
            # Pour les ventes 2000+
            if max_val == float('inf'):
                range_transactions = transaction_metrics[transaction_metrics['revenue'] >= min_val]
            else:
                range_transactions = transaction_metrics[
                    (transaction_metrics['revenue'] >= min_val) & 
                    (transaction_metrics['revenue'] < max_val)
                ]
            
            # Debug pour voir les transactions de chaque plage
            print(f"Range {range_key}: {len(range_transactions)} transactions")
            if len(range_transactions) > 0:
                print(f"Revenue range: {range_transactions['revenue'].min()} - {range_transactions['revenue'].max()}")
            
            if len(range_transactions) > 0:
                categories_count = range_transactions['item_category2'].value_counts().to_dict()
                result[range_key] = {
                    'count': len(range_transactions),
                    'total_revenue': float(range_transactions['revenue'].sum()),
                    'aov': float(range_transactions['revenue'].mean()),
                    'categories': categories_count
                }
            else:
                result[range_key] = {
                    'count': 0,
                    'total_revenue': 0,
                    'aov': 0,
                    'categories': {}
                }
        
        return result

    def calculate_metrics(self) -> Dict:
        results = {}
        for variation in self.overall_data['variation'].unique():
            overall_metrics = self.overall_data[
                self.overall_data['variation'] == variation
            ].iloc[0]
            
            transaction_metrics = self.transaction_data[
                self.transaction_data['variation'] == variation
            ].copy()
            
            transaction_metrics['revenue'] = pd.to_numeric(
                transaction_metrics['revenue'].astype(str).replace(',', '', regex=True), 
                errors='coerce'
            )
            transaction_metrics['quantity'] = pd.to_numeric(
                transaction_metrics['quantity'], 
                errors='coerce'
            )

            users = overall_metrics['users']
            add_to_carts = overall_metrics['user_add_to_carts']
            transactions = len(transaction_metrics['transaction_id'].unique())
            revenue = transaction_metrics['revenue'].sum()

            aov = revenue / transactions if transactions > 0 else 0
            rpu = revenue / users if users > 0 else 0

            if len(transaction_metrics) > 0:
                # Grouper par transaction pour trouver les transactions extrêmes
                transactions_grouped = transaction_metrics.groupby('transaction_id').agg({
                    'revenue': 'sum',
                    'quantity': 'sum'
                }).reset_index()
                
                # Pour la transaction la plus élevée
                highest_trans_id = transactions_grouped.nlargest(1, 'revenue').iloc[0]['transaction_id']
                highest_trans_details = transaction_metrics[transaction_metrics['transaction_id'] == highest_trans_id]
                
                # Trouver le produit le plus cher dans cette transaction
                main_product_high = highest_trans_details.nlargest(1, 'revenue').iloc[0]
                categories_high = list(highest_trans_details['item_category2'].unique())
                
                highest_transaction = {
                    'transaction_id': str(highest_trans_id),
                    'revenue': float(transactions_grouped.loc[transactions_grouped['transaction_id'] == highest_trans_id, 'revenue'].iloc[0]),
                    'quantity': int(transactions_grouped.loc[transactions_grouped['transaction_id'] == highest_trans_id, 'quantity'].iloc[0]),
                    'main_product': main_product_high.get('item_name_simple', 'N/A'),
                    'item_categories': categories_high
                }
                
                # Pour la transaction la plus basse
                lowest_trans_id = transactions_grouped.nsmallest(1, 'revenue').iloc[0]['transaction_id']
                lowest_trans_details = transaction_metrics[transaction_metrics['transaction_id'] == lowest_trans_id]
                
                # Trouver le produit le plus cher dans cette transaction
                main_product_low = lowest_trans_details.nlargest(1, 'revenue').iloc[0]
                categories_low = list(lowest_trans_details['item_category2'].unique())
                
                lowest_transaction = {
                    'transaction_id': str(lowest_trans_id),
                    'revenue': float(transactions_grouped.loc[transactions_grouped['transaction_id'] == lowest_trans_id, 'revenue'].iloc[0]),
                    'quantity': int(transactions_grouped.loc[transactions_grouped['transaction_id'] == lowest_trans_id, 'quantity'].iloc[0]),
                    'main_product': main_product_low.get('item_name_simple', 'N/A'),
                    'item_categories': categories_low
                }
            else:
                highest_transaction = lowest_transaction = None

            # Ajouter la distribution des revenus
            revenue_distribution = self.calculate_revenue_ranges(transaction_metrics)

            results[variation] = {
                'users': users,
                'add_to_carts': add_to_carts,
                'add_to_cart_rate': (add_to_carts / users) * 100 if users > 0 else 0,
                'transactions': transactions,
                'transaction_rate': (transactions / users) * 100 if users > 0 else 0,
                'revenue': revenue,
                'aov': aov,
                'rpu': rpu,
                'highest_transaction': highest_transaction,
                'lowest_transaction': lowest_transaction,
                'revenue_distribution': revenue_distribution
            }

        # Debug logging
        print("Debug - Revenue Distribution:", {
            variation: results[variation]['revenue_distribution'] 
            for variation in results
        })
        
        return results

    def format_currency(self, value: float, currency: str) -> str:
        if currency == 'EUR':
            return f"€{value:,.2f}"
        elif currency == 'BRL':
            return f"R${value:,.2f}"
        return f"{value:,.2f}"

    def format_metrics(self, metrics: Dict, currency: str = 'EUR') -> Dict:
        formatted = {}
        for variation, data in metrics.items():
            formatted[variation] = {
                'users': f"{data['users']:,.0f}",
                'add_to_carts': f"{data['add_to_carts']:,.0f}",
                'add_to_cart_rate': f"{data['add_to_cart_rate']:.2f}%",
                'transactions': f"{data['transactions']:,.0f}",
                'transaction_rate': f"{data['transaction_rate']:.2f}%",
                'revenue': self.format_currency(data['revenue'], currency),
                'aov': self.format_currency(data['aov'], currency),
                'rpu': self.format_currency(data['rpu'], currency),
                'highest_transaction': (
                    {
                        'transaction_id': data['highest_transaction']['transaction_id'],
                        'revenue': self.format_currency(data['highest_transaction']['revenue'], currency),
                        'quantity': data['highest_transaction']['quantity'],
                        'main_product': data['highest_transaction']['main_product'],
                        'item_categories': data['highest_transaction']['item_categories']
                    } if data.get('highest_transaction') else None
                ),
                'lowest_transaction': (
                    {
                        'transaction_id': data['lowest_transaction']['transaction_id'],
                        'revenue': self.format_currency(data['lowest_transaction']['revenue'], currency),
                        'quantity': data['lowest_transaction']['quantity'],
                        'main_product': data['lowest_transaction']['main_product'],
                        'item_categories': data['lowest_transaction']['item_categories']
                    } if data.get('lowest_transaction') else None
                ),
                'revenue_distribution': {
                    range_label: {
                        'count': stats['count'],
                        'total_revenue': self.format_currency(stats['total_revenue'], currency),
                        'aov': self.format_currency(stats['aov'], currency),
                        'categories': stats['categories']
                    }
                    for range_label, stats in data['revenue_distribution'].items()
                }
            }
        return formatted