import { Routes } from '@angular/router';
import { App } from './app';
import { AccountManagementComponent } from './features/account-management/account-management.component';

export const ACCOUNTS_ROUTES: Routes = [
    {
        path: '',
        component: App,
        children: [
            {
                path: '',
                component: AccountManagementComponent
            }
        ]
    }
];
