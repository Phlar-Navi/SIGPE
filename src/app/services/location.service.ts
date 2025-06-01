import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { getDistance, isPointWithinRadius } from 'geolib';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // async getCurrentLocation() {
  //   try {
  //     const position = await Geolocation.getCurrentPosition();
  //     return {
  //       latitude: position.coords.latitude,
  //       longitude: position.coords.longitude,
  //     };
  //   } catch (err) {
  //     console.error('Erreur de géolocalisation', err);
  //     return null;
  //   }
  // }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: Number(position.coords.latitude.toFixed(2)),
        longitude: Number(position.coords.longitude.toFixed(2)),
      };
    } catch (err) {
      console.error('Erreur de géolocalisation', err);
      return null;
    }
  }


  async sendLocationToBackend(etudiantId: number): Promise<boolean> {
    const location = await this.getCurrentLocation();
    if (!location) return false;

    try {
      const url = `${this.apiUrl}etudiants/${etudiantId}/location`;
      await this.http.post(url, location).toPromise();
      return true;
    } catch (error) {
      console.error('Erreur envoi localisation', error);
      return false;
    }
  }

  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Conversion en radians
    const toRad = (x: number) => x * Math.PI / 180;
    
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    // Correction : Utilisation de Math.sin() correcte
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance en mètres
  }

  // Ajoutez un debug log pour voir la distance calculée
  // async isInSallePerimetre(etudiantLat: number, etudiantLng: number, salle: { latitude: number, longitude: number, rayon_metres: number }): Promise<boolean> {
  //     const distance = this.haversineDistance(etudiantLat, etudiantLng, salle.latitude, salle.longitude);
  //     console.log(`Distance calculée: ${distance}m (Max autorisé: ${salle.rayon_metres}m)`);
  //     return distance <= salle.rayon_metres;
  // }

  // ! Bizarement concernant la salle, les coordonnées de latitude et longitude SONT INVERSES !!!!!!!!!!!!!!!!!!!!

  async isInSallePerimetre(
    etudiantLat: number, 
    etudiantLng: number, 
    salle: { latitude: number; longitude: number; rayon_metres: number }
  ): Promise<boolean> {
    console.log("Concernant l'etudiant: ", etudiantLat, etudiantLng, "Concernant la salle: ",salle.latitude, salle.longitude, salle.rayon_metres, "Resultat: ", isPointWithinRadius(
      { latitude: etudiantLat, longitude: etudiantLng },
      { latitude: salle.latitude, longitude: salle.longitude },
      salle.rayon_metres
    ))
    return isPointWithinRadius(
      { latitude: etudiantLat, longitude: etudiantLng },
      { latitude: salle.latitude, longitude: salle.longitude },
      salle.rayon_metres
    );
  }
  // async isInSallePerimetre(etudiantLat: number, etudiantLng: number, salle: { latitude: number, longitude: number, rayon_metres: number }): Promise<boolean> {
  //   const distance = this.haversineDistance(etudiantLat, etudiantLng, salle.latitude, salle.longitude);
  //   return distance <= salle.rayon_metres;
  // }


  // async sendLocationToBackend(etudiantId: number) {
  //   const location = await this.getCurrentLocation();
  //   if (!location) return;

  //   const url = `${this.apiUrl}etudiants/${etudiantId}/location`;
  //   return this.http.post(url, location).toPromise();
  // }
}
