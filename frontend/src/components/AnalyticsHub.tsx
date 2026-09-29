import { useEffect, useState } from 'react';
import type { InvestigationResponse } from '../api/types';

interface RiskScore {
  batch_id: string;
  ingredient: string;
  overall_risk: number;
  factors: {
    supplier_reliability: number;
    storage_duration: number;
    downstream_impact: number;
    seasonality: number;
  };
  recommendation: string;
}

export const AnalyticsHub: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    const mockRiskData: RiskScore[] = [
      {
        batch_id: 'B001',
        ingredient: 'Organic Tomatoes',
        overall_risk: 35,
        factors: {
          supplier_reliability: 90,
          storage_duration: 45,
          downstream_impact: 25,
          seasonality: 80
        },
        recommendation: 'Low risk - Continue monitoring'
      },
      {
        batch_id: 'B002',
        ingredient: 'Paneer Block',
        overall_risk: 78,
        factors: {
          supplier_reliability: 65,
          storage_duration: 85,
          downstream_impact: 90,
          seasonality: 70
        },
        recommendation: 'High risk - Immediate inspection required'
      },
      {
        batch_id: 'B003',
        ingredient: 'Basmati Rice',
        overall_risk: 42,
        factors: {
          supplier_reliability: 85,
          storage_duration: 30,
          downstream_impact: 50,
          seasonality: 95
        },
        recommendation: 'Medium risk - Schedule quality check'
      }
    ];
    
    setRiskData(mockRiskData);
    setLoading(false);
  }, []);

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-critical';
    if (risk >= 40) return 'text-[#F7B801]';
    return 'text-verified';
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 70) return 'HIGH RISK';
    if (risk >= 40) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted font-mono text-xs uppercase tracking-widest">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-surface border-b border-ui-border px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Predictive Intelligence</h2>
          <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">Risk Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-accent/10 border border-accent">
            <span className="text-[9px] font-bold text-accent uppercase tracking-widest">AI-POWERED</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        
        {/* Summary Cards */}
        <div className="mb-12">
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-6 pb-2 border-b border-ui-border">
            Risk Overview
          </h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-critical">
                {riskData.filter(r => r.overall_risk >= 70).length.toString().padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">High Risk Batches</div>
            </div>
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-[#F7B801]">
                {riskData.filter(r => r.overall_risk >= 40 && r.overall_risk < 70).length.toString().padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Medium Risk Batches</div>
            </div>
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-verified">
                {riskData.filter(r => r.overall_risk < 40).length.toString().padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Low Risk Batches</div>
            </div>
          </div>
        </div>

        {/* Detailed Risk Analysis */}
        <div>
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-6 pb-2 border-b border-ui-border">
            Batch Risk Scores
          </h2>
          
          <div className="space-y-4">
            {riskData.sort((a, b) => b.overall_risk - a.overall_risk).map((batch) => (
              <div
                key={batch.batch_id}
                className="bg-surface border border-ui-border p-6 hover:border-accent transition-colors"
              >
                {/* Batch Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold font-mono text-ink">{batch.batch_id}</div>
                    <div className="text-sm text-ink font-medium uppercase tracking-wider">{batch.ingredient}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-bold font-mono text-4xl ${getRiskColor(batch.overall_risk)}`}>
                      {batch.overall_risk}
                    </div>
                    <div className={`px-3 py-1.5 border-2 text-[9px] font-bold tracking-widest uppercase ${
                      batch.overall_risk >= 70 ? 'border-critical text-critical bg-critical/10' :
                      batch.overall_risk >= 40 ? 'border-[#F7B801] text-[#F7B801] bg-[#F7B801]/10' :
                      'border-verified text-verified bg-verified/10'
                    }`}>
                      {getRiskLabel(batch.overall_risk)}
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">Supplier Reliability</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-canvas">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${batch.factors.supplier_reliability}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-ink">{batch.factors.supplier_reliability}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">Storage Duration</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-canvas">
                        <div 
                          className="h-full bg-[#F7B801]" 
                          style={{ width: `${batch.factors.storage_duration}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-ink">{batch.factors.storage_duration}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">Downstream Impact</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-canvas">
                        <div 
                          className="h-full bg-critical" 
                          style={{ width: `${batch.factors.downstream_impact}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-ink">{batch.factors.downstream_impact}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">Seasonality Risk</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-canvas">
                        <div 
                          className="h-full bg-[#9B59B6]" 
                          style={{ width: `${batch.factors.seasonality}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-ink">{batch.factors.seasonality}%</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-canvas border-l-2 border-accent p-4">
                  <div className="text-[10px] font-bold text-muted tracking-widest uppercase mb-2">AI Recommendation</div>
                  <p className="text-sm text-ink leading-relaxed">{batch.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
