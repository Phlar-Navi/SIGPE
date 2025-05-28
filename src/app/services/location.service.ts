import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err) {
      console.error('Erreur de géolocalisation', err);
      return null;
    }
  }

  async sendLocationToBackend(etudiantId: number) {
    const location = await this.getCurrentLocation();
    if (!location) return;

    const url = `${this.apiUrl}etudiants/${etudiantId}/location`;
    return this.http.post(url, location).toPromise();
  }
}
