// ── PORTS ────────────────────────────────────────────────────
export const SEA_PORTS = [
  { code:'USNYC', name:'New York, NY',                    country:'United States', region:'Americas' },
  { code:'INMAA', name:'Chennai (ex Madras)',              country:'India',         region:'Asia Pacific' },
  { code:'INTUT', name:'Tuticorin',                        country:'India',         region:'Asia Pacific' },
  { code:'INMUN', name:'Mundra',                           country:'India',         region:'Asia Pacific' },
  { code:'INNSA', name:'Jawaharlal Nehru (Nhava Sheva)',   country:'India',         region:'Asia Pacific' },
  { code:'INENR', name:'Ennore',                           country:'India',         region:'Asia Pacific' },
  { code:'USJAX', name:'Jacksonville, FL',                 country:'United States', region:'Americas' },
  { code:'USORF', name:'Norfolk, VA',                      country:'United States', region:'Americas' },
  { code:'SADMM', name:'Ad Dammam',                        country:'Saudi Arabia',  region:'Middle East' },
  { code:'TZDAR', name:'Dar es Salaam',                    country:'Tanzania',      region:'Africa' },
  { code:'AEJEA', name:'Jebel Ali',                        country:'UAE',           region:'Middle East' },
  { code:'SGSIN', name:'Singapore',                        country:'Singapore',     region:'Asia Pacific' },
  { code:'CNSHA', name:'Shanghai',                         country:'China',         region:'Asia Pacific' },
  { code:'GBFXT', name:'Felixstowe',                       country:'United Kingdom',region:'Europe' },
  { code:'DEHAM', name:'Hamburg',                          country:'Germany',       region:'Europe' },
  { code:'NLRTM', name:'Rotterdam',                        country:'Netherlands',   region:'Europe' },
];

export const AIR_PORTS = [
  { code:'MAA', name:'Chennai International',              country:'India',         region:'Asia Pacific' },
  { code:'DXB', name:'Dubai International',                country:'UAE',           region:'Middle East' },
  { code:'BOM', name:'Mumbai Chhatrapati Shivaji',         country:'India',         region:'Asia Pacific' },
  { code:'JFK', name:'John F Kennedy International',       country:'United States', region:'Americas' },
  { code:'LHR', name:'London Heathrow',                    country:'United Kingdom',region:'Europe' },
  { code:'SIN', name:'Singapore Changi',                   country:'Singapore',     region:'Asia Pacific' },
  { code:'FRA', name:'Frankfurt International',            country:'Germany',       region:'Europe' },
];

// ── CONTAINER TYPES ──────────────────────────────────────────
export const CONTAINER_TYPES = [
  { code:'20GP',  name:"20' General Purpose",  cbm:33.0,  kg:28000 },
  { code:'40GP',  name:"40' General Purpose",  cbm:67.4,  kg:26500 },
  { code:'40HC',  name:"40' High Cube",         cbm:76.2,  kg:26580 },
  { code:'45HC',  name:"45' High Cube",         cbm:86.0,  kg:29500 },
  { code:'20RE',  name:"20' Reefer",            cbm:28.2,  kg:27400 },
  { code:'40RE',  name:"40' Reefer",            cbm:64.9,  kg:29500 },
  { code:'20OT',  name:"20' Open Top",          cbm:32.4,  kg:27700 },
  { code:'40OT',  name:"40' Open Top",          cbm:66.2,  kg:35000 },
  { code:'20FR',  name:"20' Flat Rack",         cbm:28.4,  kg:27940 },
  { code:'40FR',  name:"40' Flat Rack",         cbm:53.2,  kg:39000 },
];

export const CURRENCIES = [
  { code:'USD', symbol:'$',   name:'United States Dollar' },
  { code:'EUR', symbol:'€',   name:'Euro' },
  { code:'GBP', symbol:'£',   name:'British Pound' },
  { code:'INR', symbol:'₹',   name:'Indian Rupee' },
  { code:'AED', symbol:'د.إ', name:'UAE Dirham' },
  { code:'SGD', symbol:'S$',  name:'Singapore Dollar' },
  { code:'AUD', symbol:'A$',  name:'Australian Dollar' },
  { code:'JPY', symbol:'¥',   name:'Japanese Yen' },
  { code:'SAR', symbol:'﷼',   name:'Saudi Riyal' },
];

export const CHARGE_OPTIONS = [
  { id:'freight',    label:'Freight',                   required:true },
  { id:'origin',     label:'Origin Charges',            required:false },
  { id:'origin_cus', label:'Origin Custom Charges',     required:false },
  { id:'dest',       label:'Destination Charges',       required:false },
  { id:'dest_cus',   label:'Destination Custom Charges',required:false },
];

export const CARRIERS = [
  'Maersk','MSC','CMA CGM','Evergreen','COSCO',
  'ONE','Yang Ming','Hapag-Lloyd','HMM','ZIM',
];

export const CARGO_TYPES = [
  'General Cargo','Hazardous','Perishable',
  'Oversized / OOG','Liquid Bulk','Refrigerated','Vehicles',
];

export const INCOTERMS = ['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'];

export const COUNTRIES = [
  'India','United States','United Arab Emirates','Singapore',
  'United Kingdom','Germany','Australia','China','Saudi Arabia',
  'Tanzania','Netherlands','Other',
];

// ── ENQUIRY STATUSES ─────────────────────────────────────────
export const ENQUIRY_STATUSES = [
  'All','Booking Placed','Expired','Lost','No Rates',
  'Quoted','Rates Available','Rates Requested','With Rates',
];

// ── ENQUIRIES ────────────────────────────────────────────────
export const ENQUIRIES = [
  {
    id:'INQ6766607', status:'With Rates', mode:'SEA-FCL',
    origin:{ code:'INMAA', name:'Chennai (ex Madras)', country:'India' },
    dest:  { code:'USNYC', name:'New York, NY',        country:'United States' },
    cutOff:'2026-04-01', load:'20GP x1', created:'2026-03-25', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ7982530', status:'With Rates', mode:'SEA-FCL',
    origin:{ code:'INMAA', name:'Chennai (ex Madras)', country:'India' },
    dest:  { code:'USNYC', name:'New York, NY',        country:'United States' },
    cutOff:'2026-03-25', load:'20GP x1', created:'2026-03-25', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ7895179', status:'With Rates', mode:'AIR',
    origin:{ code:'MAA', name:'Chennai International', country:'India' },
    dest:  { code:'DXB', name:'Dubai International',   country:'UAE' },
    cutOff:'2026-04-02', load:'860.00 KG', created:'2026-03-25', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ2441184', status:'With Rates', mode:'AIR',
    origin:{ code:'MAA', name:'Chennai International', country:'India' },
    dest:  { code:'DXB', name:'Dubai International',   country:'UAE' },
    cutOff:'2026-03-31', load:'100.00 KG', created:'2026-03-24', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ97250081', status:'No Rates', mode:'SEA-LCL',
    origin:{ code:'INTUT', name:'Tuticorin',  country:'India' },
    dest:  { code:'SADMM', name:'Ad Dammam',  country:'Saudi Arabia' },
    cutOff:'2026-03-24', load:'4.00 W/M', created:'2026-03-24', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ64996663', status:'With Rates', mode:'AIR',
    origin:{ code:'MAA', name:'Chennai International', country:'India' },
    dest:  { code:'DXB', name:'Dubai International',   country:'UAE' },
    cutOff:'2026-03-24', load:'100.00 KG', created:'2026-03-24', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ39810209', status:'With Rates', mode:'SEA-FCL',
    origin:{ code:'USJAX', name:'Jacksonville, FL', country:'United States' },
    dest:  { code:'INMUN', name:'Mundra',           country:'India' },
    cutOff:'2026-03-24', load:'20GP x1', created:'2026-03-24', by:'Shaik Shahnavaz',
  },
  {
    id:'INQ36548434', status:'With Rates', mode:'SEA-FCL',
    origin:{ code:'USJAX', name:'Jacksonville, FL', country:'United States' },
    dest:  { code:'INMUN', name:'Mundra',           country:'India' },
    cutOff:'2026-03-24', load:'20GP x1', created:'2026-03-24', by:'Shaik Shahnavaz',
  },
];

// ── RECENT SEARCHES ──────────────────────────────────────────
export const RECENT_SEARCHES_DEFAULT = [
  {
    id:'rs_1',
    originCode:'USNYC', originName:'New York, NY, United States, North America',
    destCode:'INTUT',   destName:'Tuticorin, India, Indian Subcontinent',
    mode:'SEA-FCL', load:'40HC x1', ago:'11 hours ago',
  },
  {
    id:'rs_2',
    originCode:'INMAA', originName:'Chennai (ex Madras), India, Indian Subcontinent',
    destCode:'USNYC',   destName:'New York, NY, United States, North America',
    mode:'SEA-FCL', load:'20GP x1', ago:'14 hours ago',
  },
  {
    id:'rs_3',
    originCode:'INMAA', originName:'Chennai (ex Madras), India, Indian Subcontinent',
    destCode:'USNYC',   destName:'New York, NY, United States, North America',
    mode:'SEA-FCL', load:'20GP x1', ago:'18 hours ago',
  },
];

// ── KYC DOCS ─────────────────────────────────────────────────
export const KYC_DOCS = [
  { id:'govt_id',     label:'Government ID (Passport / Aadhar)',    required:true  },
  { id:'biz_reg',     label:'Business Registration Certificate',    required:false },
  { id:'tax_id',      label:'Tax ID / GST / PAN',                   required:false },
  { id:'addr_proof',  label:'Address Proof (Utility bill)',          required:true  },
];

// ── MOCK USER ────────────────────────────────────────────────
export const MOCK_USER = {
  id:'usr_001',
  name:'Shaik Shahnavaz',
  email:'shaik@merkayindia.com',
  company:'Merkay India Pvt Ltd',
  phone:'+91 98765 43210',
  avatar:'SS',
  kycStatus:'approved',
};
