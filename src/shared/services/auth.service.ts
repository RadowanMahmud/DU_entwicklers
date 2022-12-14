import {Injectable, NgZone} from '@angular/core';
import {User} from '../services/user';
import * as auth from 'firebase/auth';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {HttpClient} from '@angular/common/http';
import {
    AngularFirestore,
    AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    userData: any; // Save logged in user data
    constructor(
        private http: HttpClient,
        public afs: AngularFirestore, // Inject Firestore service
        public afAuth: AngularFireAuth, // Inject Firebase auth service
        public router: Router,
        public ngZone: NgZone // NgZone service to remove outside scope warning
    ) {
        /* Saving user data in localstorage when
        logged in and setting up null  when logged out */
        this.afAuth.authState.subscribe((user) => {
            if (user) {
                this.userData = user;
                localStorage.setItem('isLoggedIn', JSON.stringify(this.userData));
                JSON.parse(localStorage.getItem('isLoggedIn')!);
            } else {
                localStorage.setItem('isLoggedIn', 'null');
                JSON.parse(localStorage.getItem('isLoggedIn')!);
            }
        });
    }

    get isLoggedIn(): boolean {
        const user = JSON.parse(localStorage.getItem('isLoggedIn')!);
        return user !== null && user.emailVerified !== false ? true : false;
    }

    // Sign in with email/password
    SignIn(email: string, password: string) {
        return this.afAuth
            .signInWithEmailAndPassword(email, password)
            .then((result) => {
                this.SetUserData(result.user);
                this.router.navigateByUrl('dashboard');
            })
            .catch((error) => {
                window.alert(error.message);
            });
    }

    // Sign in with Google
    GoogleAuth() {
        return this.AuthLogin(new auth.GoogleAuthProvider()).then((res: any) => {
            if (res) {
                this.router.navigateByUrl('dashboard');
            }
        });
    }

    // Auth logic to run auth providers
    AuthLogin(provider: any) {
        return this.afAuth
            .signInWithPopup(provider)
            .then((result) => {
                this.SetUserData(result.user);
                this.router.navigateByUrl('dashboard');
            })
            .catch((error) => {
                window.alert(error);
            });
    }

    /* Setting up user data when sign in with username/password,
    sign up with username/password and sign in with social auth
    provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
    SetUserData(user: any) {
        const userRef: AngularFirestoreDocument<any> = this.afs.doc(
            `users/${user.uid}`
        );
        const userData: User = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
        };
        return userRef.set(userData, {
            merge: true,
        });
    }

    addUsersNoteToFirebase(note: any, user: any) {
        const noteCollection = this.afs.collection<any>('notes');
        const noteDoc = {
            uid: user.uid,
            email: user.email,
            time: new Date(),
            note: note,
        }
        return noteCollection.add(noteDoc).then(res => {
            console.log('Successfully Added Note');
        });
    };

    // Sign out
    SignOut() {
        return this.afAuth.signOut().then(() => {
            localStorage.removeItem('isLoggedIn');
            this.router.navigateByUrl('login');
        });
    }
}
