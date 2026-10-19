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
import { TradeIn } from './home/trade-in-imported/trade-in/trade-in';
import { Imported } from './home/trade-in-imported/imported/imported';
import { TradeInImported } from './home/trade-in-imported/trade-in-imported';


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
  {path: 'floating-nav', component:Nav2},
  { path: 'import', component: Imported },
  { path: 'trade-in', component: TradeIn },
  { path:'imported-trade-in', component: TradeInImported},
];