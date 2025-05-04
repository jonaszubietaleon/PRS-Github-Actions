import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

interface Consumption {
  id_consumption: number;
  date: string;
  id_home: number;
  names: string;
  quantity: number;
  weight: number;
  price: number;
  salevalue: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsumptionService {
  private baseUrl = "https://vg-ms-consumo-interno.onrender.com/consumption";

  constructor(private http: HttpClient) {}

  listActiveConsumptions(): Observable<Consumption[]> {
    const url = `${this.baseUrl}/lista-activos`;
    return this.http.get<Consumption[]>(url);
  }

  listInactiveConsumptions(): Observable<Consumption[]> {
    const url = `${this.baseUrl}/lista-inactivos`;
    return this.http.get<Consumption[]>(url);
  }

  registerConsumption(consumptionData: any): Observable<any> {
    return this.http.post(this.baseUrl, consumptionData);
  }

  inactivateConsumption(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}/inactivar`;
    return this.http.put(url, {});
  }

  restoreConsumption(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}/restore`;
    return this.http.put(url, {});
  }

  updateConsumption(id: number, consumption: any): Observable<any> {
    // Eliminamos 'names' por seguridad antes de enviarlo
    delete consumption.names;
    return this.http.put(`${this.baseUrl}/${id}`, consumption);
  }

  getHomes(): Observable<any[]> {
    return this.http.get<any[]>('https://vg-ms-consumo-interno.onrender.com/homes');
  }
}
