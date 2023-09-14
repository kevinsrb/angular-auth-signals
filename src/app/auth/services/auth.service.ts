import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environments } from 'src/environments/environments';
import { AuthStatus, CheckTokenResponse, LoginResponse, User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl: string = environments.baseurl;

  private http = inject( HttpClient )

  private _currenUser = signal<User|null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking  );

  public currentUser = computed(() => this._currenUser());
  public authStatus = computed(() => this._authStatus());


  constructor() {
    this.chehkAuthStatus().subscribe();
   }

  private setAutentication(user: User, token: string):boolean{
    this._currenUser.set(user)
    this._authStatus.set( AuthStatus.autenticated )
    localStorage.setItem('token', token)

    return true;
  }


  login(email:string, password: string): Observable<boolean>{

    const url = `${this.baseUrl}/auth/login`
    const body = { email, password };

    return this.http.post<LoginResponse>(url, body)
      .pipe(
        map( ({user, token}) => this.setAutentication(user, token)),
        catchError( err => throwError( () => err.error.message)
        )
      )
  }

  chehkAuthStatus(): Observable<boolean>{
    const url = `${this.baseUrl}/auth/check-token`
    const token = localStorage.getItem('token')

    if( !token ) {
      this.logout()
      return of(false)

    }

    const headers = new HttpHeaders()
    .set('Authorization', `Bearer ${token}`)

    return this.http.get<CheckTokenResponse>(url, { headers})
    .pipe(
      map( ({user, token}) => this.setAutentication(user, token)),
      catchError( () => {
        this._authStatus.set( AuthStatus.notAuthenticated )
        return of(false)
      })
    )
  }

  logout(){
    localStorage.removeItem('token')
    this._currenUser.set(null)
    this._authStatus.set( AuthStatus.notAuthenticated )

  }
}
