import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Home {
  id_home: number;
  names: string;
  address: string;
  status: string;
}

@Injectable({
  providedIn: "root",
})
export class HomeService {
  private baseUrl = 'https://vg-ms-consumo-interno.onrender.com/homes'; 
 

  constructor(private http: HttpClient) {}

  getActiveHomes(): Observable<Home[]> {
    return this.http.get<Home[]>(`${this.baseUrl}/active`);
  }

  getInactiveHomes(): Observable<Home[]> {
    return this.http.get<Home[]>(`${this.baseUrl}/inactive`);
  }

  createHome(homeData: Home): Observable<Home> {
    return this.http.post<Home>(this.baseUrl, homeData);
  }

  deactivateHome(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  reactivateHome(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/restore`, {});
  }

  updateHome(id: number, homeData: Home): Observable<Home> {
    return this.http.put<Home>(`${this.baseUrl}/${id}`, homeData);
  }
}
