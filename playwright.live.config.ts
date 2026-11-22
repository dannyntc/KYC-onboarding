import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e-live',testMatch:'**/*.e2e.ts',workers:1,use:{baseURL:'http://127.0.0.1:3107',headless:true,storageState:{cookies:[],origins:[{origin:'http://127.0.0.1:3107',localStorage:[{name:'kyc-onboarding-tour-seen',value:'1'}]}]}},webServer:[
 {command:'node scripts/mock-openai.mjs',url:'http://127.0.0.1:3106/health',reuseExistingServer:false,timeout:30000},
 {command:'npx next dev --hostname 127.0.0.1 --port 3107',url:'http://127.0.0.1:3107',reuseExistingServer:false,timeout:120000,env:{OPENAI_API_KEY:'test-only-key',OPENAI_MODEL:'simulated-model',OPENAI_BASE_URL:'http://127.0.0.1:3106/v1'}},
]});
