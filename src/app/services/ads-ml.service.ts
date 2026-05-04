import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MlHealth {
  status: string;
  service: string;
  version: string;
  kafka_connected: boolean;
  clickhouse_connected: boolean;
  mlflow_connected: boolean;
  models_loaded: boolean;
  n_models: number;
}

export interface MlModelResult {
  model_name: string;
  predicted_class: 'AI' | 'HUMAN';
  probability_ai: number;
  probability_human: number;
  accuracy_loo?: number;
  f1_loo?: number;
  roc_auc_loo?: number;
}

export interface MlPrediction {
  ad_id: number;
  features: Record<string, number>;
  predictions: MlModelResult[];
  recommended_model: string;
  recommended_prediction: 'AI' | 'HUMAN';
  recommended_confidence: number;
}

export interface MlBenchmarkModel {
  model_name: string;
  accuracy_loo: number;
  f1_loo: number;
  roc_auc_loo: number;
  n_errors: number;
  status: string;
}

export interface MlBenchmark {
  best_model: string;
  n_samples: number;
  last_trained: string;
  models: MlBenchmarkModel[];
}

export interface MlTrainResult {
  status: string;
  n_samples: number;
  best_model: string;
  best_accuracy: number;
  models: MlModelResult[];
}

export interface MlKafkaStats {
  consumer_connected: boolean;
  buffered_ads: number;
  buffered_events: number;
  topic: string;
}

@Injectable({ providedIn: 'root' })
export class AdsMlService {

  private readonly baseUrl = 'http://localhost:8099';

  constructor(private http: HttpClient) {}

  getHealth(): Observable<MlHealth> {
    return this.http.get<MlHealth>(`${this.baseUrl}/health`)
      .pipe(catchError(() => throwError(() => new Error('ML service unavailable'))));
  }

  predict(adId: number): Observable<MlPrediction> {
    return this.http.get<MlPrediction>(`${this.baseUrl}/predict/${adId}`)
      .pipe(catchError(() => throwError(() => new Error('Prediction failed'))));
  }

  predictAll(): Observable<MlPrediction[]> {
    return this.http.get<MlPrediction[]>(`${this.baseUrl}/predict-all`)
      .pipe(catchError(() => throwError(() => new Error('Bulk prediction failed'))));
  }

  getBenchmark(): Observable<MlBenchmark> {
    return this.http.get<MlBenchmark>(`${this.baseUrl}/benchmark`)
      .pipe(catchError(() => throwError(() => new Error('Benchmark fetch failed'))));
  }

  train(): Observable<MlTrainResult> {
    return this.http.post<MlTrainResult>(`${this.baseUrl}/train`, {})
      .pipe(catchError(() => throwError(() => new Error('Training failed'))));
  }

  getKafkaStats(): Observable<MlKafkaStats> {
    return this.http.get<MlKafkaStats>(`${this.baseUrl}/kafka/stats`)
      .pipe(catchError(() => throwError(() => new Error('Kafka stats unavailable'))));
  }
}
