import { Routes } from '@angular/router';
import { Home } from './home/homes';
import { AboutUs } from './home/about-us/about-us';
import { ContactUs } from './home/contact-us/contact-us';
import { Blog } from './home/blogs/blogs';
import { Store } from './home/store/store';
import { Financing } from './home/financing/financing';
import { Specs, specsLeaveGuard } from './home/portfolio/specs/specs';
import { PrivacyPolicy } from './home/privacy/privacy';
import { Nav } from './home/nav/nav';
import { Nav2 } from './home/nav-2/nav-2';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
 {path:'nav', component:Nav},
  { path: 'about-us', component: AboutUs },
  { path: 'contact', component: ContactUs },
  { path: 'blogs', component: Blog },
  { path: 'store', component: Store },
  { path: 'financing', component: Financing },
  { path: 'specs', component: Specs, canDeactivate: [specsLeaveGuard] },
  {path:'privacy-policy', component:PrivacyPolicy},
  { path: '**', redirectTo: 'home' }, 
  {path: 'floating-nav', component:Nav2}
  
];