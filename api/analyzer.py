import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
from scipy import stats

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

    def calculate_statistical_significance(self, control_data: pd.Series, variation_data: pd.Series, metric_type: str) -> Tuple[float, float]:
        """
        Calcule la significativité statistique et l'intervalle de confiance.
        """
        if len(control_data) == 0 or len(variation_data) == 0:
            return 0.0, 0.0

        if metric_type == 'rate':
            # Test de proportion (en utilisant le test binomial normal approximation)
            p1 = variation_data.mean()  # proportion dans le groupe variation
            p2 = control_data.mean()    # proportion dans le groupe contrôle
            n1 = len(variation_data)    # taille du groupe variation
            n2 = len(control_data)      # taille du groupe contrôle
            
            # Calcul de la proportion combinée
            p_pooled = (p1 * n1 + p2 * n2) / (n1 + n2)
            
            # Calcul de l'erreur standard
            se = np.sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2))
            
            # Calcul de la statistique z
            if se == 0:
                return 0.0, 0.0
                
            z_stat = (p1 - p2) / se
            
            # Calcul de la p-value (test bilatéral)
            p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
            
            # Calcul de l'uplift
            uplift = ((p1 - p2) / p2) * 100 if p2 > 0 else 0
            
        elif metric_type == 'revenue':
            # Test de Mann-Whitney pour les métriques de revenue
            try:
                stat, p_value = stats.mannwhitneyu(
                    control_data,
                    variation_data,
                    alternative='two-sided'
                )
            except ValueError:
                return 0.0, 0.0
            
            control_mean = control_data.mean()
            variation_mean = variation_data.mean()
            uplift = ((variation_mean - control_mean) / control_mean) * 100 if control_mean != 0 else 0
            
        else:
            # Test t pour les autres métriques continues
            if len(control_data) < 2 or len(variation_data) < 2:
                return 0.0, 0.0
                
            try:
                stat, p_value = stats.ttest_ind(
                    control_data,
                    variation_data,
                    equal_var=False  # Welch's t-test
                )
            except ValueError:
                return 0.0, 0.0
            
            control_mean = control_data.mean()
            variation_mean = variation_data.mean()
            uplift = ((variation_mean - control_mean) / control_mean) * 100 if control_mean != 0 else 0

        confidence = (1 - p_value) * 100
        return uplift, confidence

    def calculate_metrics(self) -> Dict:
        results = {}
        variations = self.overall_data['variation'].unique()
        control_variation = next(v for v in variations if 'control' in v.lower())
        
        control_overall = self.overall_data[self.overall_data['variation'] == control_variation].iloc[0]
        control_transactions = self.transaction_data[self.transaction_data['variation'] == control_variation]
        
        for variation in variations:
            overall_metrics = self.overall_data[
                self.overall_data['variation'] == variation
            ].iloc[0]
            
            transaction_metrics = self.transaction_data[
                self.transaction_data['variation'] == variation
            ].copy()
            
            # Grouper les transactions pour avoir le revenue total
            transaction_metrics_grouped = transaction_metrics.groupby('transaction_id').agg({
                'revenue': 'sum',
                'quantity': 'sum',
                'item_name_simple': lambda x: list(x),
                'item_category2': lambda x: list(set(x))
            }).reset_index()

            # Calculs de base avec les transactions groupées
            users = overall_metrics['users']
            add_to_carts = overall_metrics['user_add_to_carts']
            transactions = len(transaction_metrics_grouped['transaction_id'].unique())
            revenue = transaction_metrics_grouped['revenue'].sum()

            # Calcul des taux
            add_to_cart_rate = (add_to_carts / users) * 100 if users > 0 else 0
            transaction_rate = (transactions / users) * 100 if users > 0 else 0

            # Initialiser le dictionnaire des résultats pour cette variation
            results[variation] = {
                'users': users,
                'add_to_cart_rate': add_to_cart_rate,
                'transaction_rate': transaction_rate,
                'revenue': revenue
            }

            # Calcul des transactions extrêmes
            if len(transaction_metrics_grouped) > 0:
                # Plus haute transaction (déjà groupée)
                highest_trans = transaction_metrics_grouped.nlargest(1, 'revenue').iloc[0]
                highest_transaction = {
                    'transaction_id': str(highest_trans['transaction_id']),
                    'revenue': float(highest_trans['revenue']),  # Revenue total de la transaction
                    'quantity': int(highest_trans['quantity']),
                    'main_product': highest_trans['item_name_simple'][0],
                    'item_categories': list(highest_trans['item_category2'])
                }

                # Plus basse transaction (déjà groupée)
                lowest_trans = transaction_metrics_grouped.nsmallest(1, 'revenue').iloc[0]
                lowest_transaction = {
                    'transaction_id': str(lowest_trans['transaction_id']),
                    'revenue': float(lowest_trans['revenue']),
                    'quantity': int(lowest_trans['quantity']),
                    'main_product': lowest_trans['item_name_simple'][0],
                    'item_categories': list(lowest_trans['item_category2'])
                }
            else:
                highest_transaction = None
                lowest_transaction = None

            # Ajouter les transactions extrêmes aux résultats
            results[variation]['highest_transaction'] = highest_transaction
            results[variation]['lowest_transaction'] = lowest_transaction

            # Calculer les statistiques si ce n'est pas le groupe de contrôle
            if variation != control_variation:
                # Users (metric continue)
                users_uplift, users_confidence = self.calculate_statistical_significance(
                    self.overall_data[self.overall_data['variation'] == control_variation]['users'],
                    self.overall_data[self.overall_data['variation'] == variation]['users'],
                    'continuous'
                )
                results[variation]['users_uplift'] = users_uplift
                results[variation]['users_confidence'] = users_confidence

                # Add to Cart Rate (taux)
                control_atc_rate = pd.Series([1] * int(control_overall['user_add_to_carts']) + 
                                           [0] * int(control_overall['users'] - control_overall['user_add_to_carts']))
                variation_atc_rate = pd.Series([1] * int(overall_metrics['user_add_to_carts']) + 
                                             [0] * int(overall_metrics['users'] - overall_metrics['user_add_to_carts']))
                
                atc_uplift, atc_confidence = self.calculate_statistical_significance(
                    control_atc_rate,
                    variation_atc_rate,
                    'rate'
                )
                results[variation]['add_to_cart_rate_uplift'] = atc_uplift
                results[variation]['add_to_cart_rate_confidence'] = atc_confidence

                # Transaction Rate (taux)
                control_tr_rate = pd.Series([1] * len(control_transactions['transaction_id'].unique()) + 
                                          [0] * int(control_overall['users'] - len(control_transactions['transaction_id'].unique())))
                variation_tr_rate = pd.Series([1] * transactions + 
                                            [0] * int(users - transactions))
                
                tr_uplift, tr_confidence = self.calculate_statistical_significance(
                    control_tr_rate,
                    variation_tr_rate,
                    'rate'
                )
                results[variation]['transaction_rate_uplift'] = tr_uplift
                results[variation]['transaction_rate_confidence'] = tr_confidence

                # Revenue (Mann-Whitney test)
                control_revenue = control_transactions.groupby('transaction_id')['revenue'].sum()
                variation_revenue = transaction_metrics_grouped.groupby('transaction_id')['revenue'].sum()
                
                revenue_uplift, revenue_confidence = self.calculate_statistical_significance(
                    control_revenue,
                    variation_revenue,
                    'revenue'
                )
                results[variation]['revenue_uplift'] = revenue_uplift
                results[variation]['revenue_confidence'] = revenue_confidence

        # Ajouter les données brutes
        results['raw_data'] = self.get_raw_data()
        return results

    def format_currency(self, value: float, currency: str = 'BRL') -> str:
        try:
            if pd.isna(value) or value == 0:
                return 'R$ 0,00' if currency == 'BRL' else '€0,00'
            
            # Formater le nombre avec séparateur de milliers et décimales
            formatted_number = '{:,.2f}'.format(value)
            
            # Adapter au format brésilien
            if currency == 'BRL':
                formatted_number = formatted_number.replace(',', 'X').replace('.', ',').replace('X', '.')
                return f'R$ {formatted_number}'
            else:
                return f'€ {formatted_number}'
            
        except (ValueError, TypeError):
            return 'R$ 0,00' if currency == 'BRL' else '€0,00'

    def format_metrics(self, metrics: Dict, currency: str = 'EUR') -> Dict:
        formatted = {}
        for variation, data in metrics.items():
            if variation == 'raw_data':
                formatted['raw_data'] = data
                continue
                
            formatted[variation] = {
                'users': f"{data['users']:,.0f}",
                'add_to_cart_rate': f"{data['add_to_cart_rate']:.2f}%",
                'transaction_rate': f"{data['transaction_rate']:.2f}%",
                'revenue': self.format_currency(data['revenue'], currency)
            }
            
            # Formater les transactions extrêmes si elles existent
            if data.get('highest_transaction'):
                formatted[variation]['highest_transaction'] = {
                    **data['highest_transaction'],
                    'revenue': self.format_currency(data['highest_transaction']['revenue'], currency)
                }
            else:
                formatted[variation]['highest_transaction'] = None

            if data.get('lowest_transaction'):
                formatted[variation]['lowest_transaction'] = {
                    **data['lowest_transaction'],
                    'revenue': self.format_currency(data['lowest_transaction']['revenue'], currency)
                }
            else:
                formatted[variation]['lowest_transaction'] = None
            
            # Formater les métriques statistiques
            for metric in ['users', 'add_to_cart_rate', 'transaction_rate', 'revenue']:
                if f'{metric}_uplift' in data:
                    formatted[variation][f'{metric}_uplift'] = f"{'+' if data[f'{metric}_uplift'] >= 0 else ''}{data[f'{metric}_uplift']:.2f}%"
                    formatted[variation][f'{metric}_confidence'] = f"{data[f'{metric}_confidence']:.1f}"

        return formatted
    def get_raw_data(self) -> Dict[str, List[Dict]]:
            """
            Récupère les données brutes groupées par variation.
            """
            if self.transaction_data is None:
                return {"error": "No transaction data available"}

            # Groupe les données par variation
            result = {}
            for variation in self.transaction_data['variation'].unique():
                variation_data = self.transaction_data[self.transaction_data['variation'] == variation]
                result[variation] = variation_data.to_dict('records')

            return {
                "raw_data": result
            }

    def get_revenue_radar_data(self, ranges: List[Dict[str, Union[float, str]]]) -> Dict:
        variations = self.transaction_data['variation'].unique()
        control_variation = next(v for v in variations if 'control' in v.lower())
        variation_data = {}

        for variation in variations:
            variation_data[variation] = self.transaction_data[
                self.transaction_data['variation'] == variation
            ]

        result = []
        for range_info in ranges:
            range_data = {
                'range': range_info['label'],
                'revenues': {},
                'transactions': {},
                'metrics': {}
            }
            
            # Utiliser les ranges dynamiques
            control_transactions = self.get_range_metrics(
                variation_data[control_variation], 
                self.overall_data[self.overall_data['variation'] == control_variation],
                range_info['min'],
                range_info['max']
            )
            
            for variation in variations:
                metrics = self.get_range_metrics(
                    variation_data[variation], 
                    self.overall_data[self.overall_data['variation'] == variation],
                    range_info['min'],
                    range_info['max']
                )
                
                range_data['revenues'][variation] = metrics['revenue']
                range_data['transactions'][variation] = metrics['transactions']
                
                # Calculer les uplifts et significativité seulement pour les variations
                if variation != control_variation:
                    revenue_uplift, revenue_conf = self.calculate_statistical_significance(
                        control_transactions['revenue_data'],
                        metrics['revenue_data'],
                        'revenue'
                    )
                    aov_uplift, aov_conf = self.calculate_statistical_significance(
                        control_transactions['revenue_data'],
                        metrics['revenue_data'],
                        'revenue'
                    )
                    rpu_uplift, rpu_conf = self.calculate_statistical_significance(
                        control_transactions['rpu_data'],
                        metrics['rpu_data'],
                        'revenue'
                    )
                else:
                    revenue_uplift = revenue_conf = aov_uplift = aov_conf = rpu_uplift = rpu_conf = 0
                
                range_data['metrics'][variation] = {
                    'aov': metrics['aov'],
                    'rpu': metrics['rpu'],
                    'transactions': metrics['transactions'],
                    'transaction_share': metrics['transaction_share'],
                    'revenue_uplift': revenue_uplift,
                    'revenue_confidence': revenue_conf,
                    'aov_uplift': aov_uplift,
                    'aov_confidence': aov_conf,
                    'rpu_uplift': rpu_uplift,
                    'rpu_confidence': rpu_conf
                }
            
            result.append(range_data)
        
        return result

    def get_range_metrics(self, df: pd.DataFrame, overall_df: pd.DataFrame, min_val: float, max_val: float) -> Dict:
        """Helper function to calculate metrics for a specific range and variation"""
        # D'abord, grouper les transactions pour avoir le revenue total par transaction
        transactions_grouped = df.groupby('transaction_id').agg({
            'revenue': 'sum',  # Somme du revenue par transaction
            'quantity': 'sum'
        }).reset_index()
        
        if max_val == float('inf'):
            # Pour le range 2000+, prendre tout ce qui est strictement supérieur à 2000
            range_transactions = transactions_grouped[transactions_grouped['revenue'] > min_val]
        else:
            # Pour tous les autres ranges
            range_transactions = transactions_grouped[
                (transactions_grouped['revenue'] >= min_val) & 
                (transactions_grouped['revenue'] <= max_val)
            ]
        
        total_transactions = len(transactions_grouped)  # Total des transactions uniques
        range_transactions_count = len(range_transactions)
        total_revenue = float(range_transactions['revenue'].sum()) if len(range_transactions) > 0 else 0
        users = float(overall_df['users'].iloc[0])
        
        aov = total_revenue / range_transactions_count if range_transactions_count > 0 else 0
        rpu = total_revenue / users if users > 0 else 0

        # Créer les données pour les tests statistiques
        revenue_data = range_transactions['revenue'] if len(range_transactions) > 0 else pd.Series([])
        n_samples = int(users)
        rpu_data = pd.Series([rpu] * n_samples) if users > 0 else pd.Series([])
        
        return {
            'revenue': total_revenue,
            'transactions': range_transactions_count,
            'transaction_share': range_transactions_count / total_transactions if total_transactions > 0 else 0,
            'aov': aov,
            'rpu': rpu,
            'revenue_data': revenue_data,
            'rpu_data': rpu_data
        }