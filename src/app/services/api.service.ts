import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {AuthenticationService} from '../_services';
import {User} from '../_models';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  currentUser: User;

  constructor(private httpClient: HttpClient,
              private authenticationService: AuthenticationService) {
    this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
  }

  public getProfile() {
    return this.httpClient.get(`${environment.apiUrl}/${this.currentUser.username}/ux/profile?key=${this.currentUser.token}`);
  }

  public getFitDashboard() {
    return this.httpClient.get(`${environment.apiUrl}/${this.currentUser.username}/ux/feed/dashboard?key=${this.currentUser.token}`);
  }

  public getFitBodyWeight() {
    return this.httpClient.get(`${environment.apiUrl}/${this.currentUser.username}/ux/feed/body/weight/186?key=${this.currentUser.token}`);
  }

  public getProfileValues() {
    return this.httpClient.get(`${environment.apiUrl}/users/profile?key=${this.currentUser.token}`);
  }

  public saveProfileValues(firstName, lastName, dateOfBirth, email, avatar) {
    return this.httpClient.post<any>(
      `${environment.apiUrl}/users/profile/save?key=${this.currentUser.token}`, {firstName, lastName, dateOfBirth, email, avatar}
      ).pipe(map(user => {
        console.log(user);
      }));
  }
}
