import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',testMatch:'**/*.e2e.ts',workers:1,use:{baseURL:'http://127.0.0.1:3105',headless:true},webServer:{command:'npx next dev --hostname 127.0.0.1 --port 3105',url:'http://127.0.0.1:3105',reuseExistingServer:false,timeout:120000}});
