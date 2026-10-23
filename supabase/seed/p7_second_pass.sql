-- P7 second research pass (2026-10-24), stopped early at the owner's request. Drafts only; re-runnable.
-- "read" = full post opened; "card" = seen live in the board's search results, full post not opened yet.
insert into public.companies (slug, name) values
  ('insular-life','Insular Life'),('sta-clara-international','Sta. Clara International'),('crowdsource-solutions','Crowdsource Solutions'),
  ('golden-suntec','Golden Suntec Solutions'),('jaka-investments','JAKA Investments Corporation'),('sb-finance','SB Finance'),
  ('global-empire','Global Empire Manufacturing Corporation'),('atsoca','ATSOCA Learning & Consultancy'),('casa-bella','Casa Bella Home and Living'),
  ('unilab','Unilab'),('integrated-computer-systems','Integrated Computer Systems'),('csi-interfusion','CSI Interfusion'),
  ('salenga-law','Salenga Law Firm'),('ark-one-solutions','Ark One Solutions'),('universal-music','Universal Music Group'),
  ('ayala-land-hospitality','Ayala Land Hospitality'),('modern-tradition','Modern Tradition Restaurant Group'),('fredley-group','Fredley Group of Companies'),
  ('dunsk-kuhner','Dunsk Kuhner Corporation'),('soluxionlab','SoluxionLab'),('ams-group','AMS Group of Companies'),
  ('hardhead-technologies','Hardhead Technologies'),('tiger-global','Tiger Global Business Services'),('em-power','EM Power Beautiful Skin Corporation'),
  ('rare-global-food','Rare Global Food Trading'),('honda-cars-dasmarinas','Honda Cars Dasmariñas'),('filmetrics','Filmetrics Corporation'),
  ('vitro','VITRO Inc.'),('achieve-without-borders','Achieve Without Borders'),('sl-agritech','SL Agritech Corporation'),
  ('marquis-events-place','The Marquis Events Place'),('xure-app','XURE App'),('bonflex-packaging','Bonflex Packaging Corporation'),
  ('pa-alvarez','P.A. Alvarez Properties and Development'),('eli-it-solutions','ELI IT Solutions'),('endsofttech','Endsofttech Web Solutions')
on conflict (slug) do nothing;

insert into public.partnerships (company_id, campus, status, hte_entry_id, matched_name_as_listed, source, notes)
select c.id, cfg.campus, case when h.id is null then 'not_listed' else 'listed_in_hte' end::public.partnership_status, h.id, h.name_as_listed,
  'NU Laguna AILPO: FINAL LIST OF HTEs FOR 26-27.pdf',
  case when h.id is null then 'Not found in the AY 2026-2027 list. That does not mean there is no MOA. Ask your FIC.' end
from public.companies c cross join public.app_config cfg
left join public.hte_list_entries h on h.list_version = cfg.hte_list_version
  and h.entry_no = case c.slug when 'insular-life' then 469 when 'ark-one-solutions' then 39 when 'tiger-global' then 480 end
where not exists (select 1 from public.partnerships p where p.company_id = c.id and p.campus = cfg.campus);

insert into public.opportunities (slug, company_id, title, role_category, city, setup, posted_on, apply_channel, apply_url, source_url, notes, post_status, last_checked_at, is_published)
select v.slug, c.id, v.title, v.role::public.role_category, v.city, v.setup::public.work_setup, v.posted::date, v.ch::public.apply_channel, v.url, v.url,
  case v.how when 'card' then 'Seen live in the board''s search results on Oct 24; full post not opened yet. ' else '' end || coalesce(v.note, ''),
  'open', now(), false
from (values
  ('taskus-it-support-ojt-pasig','taskus','IT Support OJT (Student Trainee)','it_support','Pasig','onsite','2026-08-28','jobstreet','https://ph.jobstreet.com/job/94283000','read','Needs an endorsement letter from your OJT coordinator.'),
  ('insular-life-it-intern','insular-life','IT Internship (IT Solutions)','other','Muntinlupa (Alabang)','hybrid','2026-09-25','jobstreet','https://ph.jobstreet.com/job/94873654','read','Open to IT, Communications and Multimedia students; 400 hours minimum; allowance provided (amount not stated).'),
  ('sta-clara-it-ojt','sta-clara-international','IT Internship / OJT','it_support','Mandaluyong','unknown','2026-09-25','jobstreet','https://ph.jobstreet.com/job/94887231','read','IT support plus helping develop and test new systems.'),
  ('globe-ojt-engineering-network','globe','OJT, Engineering and Network Infrastructure','network','Manila (Santa Ana)','unknown','2026-08-13','jobstreet','https://ph.jobstreet.com/job/94955831','read',null),
  ('nexus-it-computer-intern','nexus','Internship for IT/Computer Students','it_support','Makati','unknown','2026-09-30','jobstreet','https://ph.jobstreet.com/job/94967253','read','Desktop, printer and peripheral support; Windows and MS Office.'),
  ('crowdsource-it-automation-intern','crowdsource-solutions','IT Intern, Automation','automation','Makati','hybrid','2026-09-30','jobstreet','https://ph.jobstreet.com/job/94975643','read','Builds n8n automations; 400 hours minimum.'),
  ('golden-suntec-csharp-intern','golden-suntec','C# Developer Intern / OJT','dev','Pasig (Ortigas)','onsite','2026-10-01','jobstreet','https://ph.jobstreet.com/job/95000866','read','400 to 600 hours.'),
  ('jaka-it-technical-intern','jaka-investments','IT Technical Intern','it_support','Makati','unknown','2026-10-02','jobstreet','https://ph.jobstreet.com/job/95012341','read','For BSIT, BSCS, BSCpE or BSECE.'),
  ('sb-finance-infosec-intern','sb-finance','Information Security Intern','cyber','Makati','unknown','2026-10-05','jobstreet','https://ph.jobstreet.com/job/95059610','read','SIEM alert monitoring, SOC reports, endpoint security.'),
  ('sb-finance-it-intern','sb-finance','IT Intern (QA Tester or Solutions Architect)','qa','Makati','unknown','2026-10-06','jobstreet','https://ph.jobstreet.com/job/95074574','read',null),
  ('global-empire-it-dm-intern','global-empire','IT and Digital Marketing Intern','it_support','Pasig','onsite',null,'bossjob','https://bossjob.ph/en-us/job/marketing-strategist-pasig-506529','read','Basic IT support plus social media and marketing work.'),
  ('atsoca-ojt-tech','atsoca','OJT, Tech Department','automation','Manila','hybrid',null,'bossjob','https://bossjob.ph/en-us/job/web-developer-manila-554193','read','Systems, automation, website and data work.'),
  ('trend-micro-cybersecurity-intern','trend-micro','Cybersecurity Intern','cyber','Manila','unknown','2026-09-09','company_portal','https://trendmicro.wd3.myworkdayjobs.com/External/job/Manila/Cybersecurity-Intern_R0005760','read','Threat research, cloud security, security training modules.'),
  ('trend-micro-grid-devops-intern','trend-micro','Grid DevOps Intern','dev','Manila','unknown','2026-09-09','company_portal','https://trendmicro.wd3.myworkdayjobs.com/External/job/Manila/GRID-DEVOPS-INTERN_R0010148','read',null),
  ('casa-bella-it-intern','casa-bella','IT Intern','it_support','Makati','unknown','2026-06-23','linkedin','https://ph.linkedin.com/jobs/view/it-intern-at-casa-bella-home-and-living-4432291402','card',null),
  ('unilab-it-intern-pooling','unilab','Internship for Information Technology (Pooling)','other','Mandaluyong','unknown','2026-08-13','linkedin','https://ph.linkedin.com/jobs/view/internship-for-information-technology-for-pooling-at-unilab-inc-4436077719','card',null),
  ('unilab-data-analytics-pooling','unilab','Internship for Data Analytics (Pooling)','data','Mandaluyong','unknown','2026-09-21','linkedin','https://ph.linkedin.com/jobs/view/internship-for-data-analytics-for-pooling-at-unilab-inc-4452902136','card',null),
  ('ics-it-intern','integrated-computer-systems','IT Intern','it_support','Mandaluyong','unknown','2026-04-09','linkedin','https://ph.linkedin.com/jobs/view/it-intern-at-integrated-computer-systems-inc-4397638056','card',null),
  ('csi-interfusion-data-engineer-intern','csi-interfusion','Data Engineer Intern, Speech and Language Intelligence','data','Quezon City','unknown','2026-05-15','linkedin','https://ph.linkedin.com/jobs/view/data-engineer-intern-speech-and-language-intelligence-at-csi-interfusion-4415082324','card',null),
  ('salenga-rust-programmer-ojt','salenga-law','Programmer, Rust (OJT)','dev','Pasig','unknown','2026-03-03','linkedin','https://ph.linkedin.com/jobs/view/programmer-%E2%80%93-rust-on-the-job-trainee-at-salenga-law-firm-4379408489','card',null),
  ('ark-one-it-trainee','ark-one-solutions','IT Trainee','other','Muntinlupa','unknown','2026-07-15','linkedin','https://ph.linkedin.com/jobs/view/it-trainee-at-ark-one-solutions-inc-4440225804','card','Check whether it is for students or fresh graduates.'),
  ('universal-music-data-analytics-intern','universal-music','Data Analytics Intern','data','Manila','unknown','2026-09-02','linkedin','https://ph.linkedin.com/jobs/view/data-analytics-intern-at-universal-music-group-4462124281','card',null),
  ('alhi-data-analyst-intern','ayala-land-hospitality','Data Analyst Intern','data','Taguig','unknown','2026-10-18','linkedin','https://ph.linkedin.com/jobs/view/data-analyst-intern-at-ayala-land-hospitality-4479930555','card',null),
  ('taskus-noc-intern','taskus','Network Operations Center Specialist Intern','network','Imus, Cavite','unknown','2026-10-17','linkedin','https://ph.linkedin.com/jobs/view/network-operations-center-specialist-intern-at-taskus-4451284484','card',null),
  ('amadeus-software-qa-intern','amadeus','Software QA Engineering Intern','qa','Taguig','unknown','2026-03-19','linkedin','https://ph.linkedin.com/jobs/view/software-qa-engineering-intern-at-amadeus-4387751438','card',null),
  ('globe-network-surveillance-intern','globe','Intern, Network Surveillance Engineer (Batangas City)','network','Batangas City','unknown','2026-10-12','linkedin','https://ph.linkedin.com/jobs/view/intern-network-surveillance-engineer-batangas-city-at-globe-telecom-4411195589','card',null),
  ('globe-customer-data-analytics-intern','globe','Intern, Customer Data Analytics','data','Taguig','unknown','2026-10-12','linkedin','https://ph.linkedin.com/jobs/view/intern-customer-data-analytics-at-globe-telecom-4411500562','card',null),
  ('ai-rudder-qa-intern','ai-rudder','Quality Assurance Intern','qa','Makati','unknown','2026-10-13','linkedin','https://ph.linkedin.com/jobs/view/quality-assurance-intern-a37245-at-ai-rudder-4478772766','card',null),
  ('modern-tradition-it-intern','modern-tradition','IT Intern','it_support','Quezon City','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=e79880c77b785ae2','card',null),
  ('fredley-it-intern','fredley-group','IT Interns','it_support','Quezon City','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=df8976ad10c9520d','card',null),
  ('dunsk-kuhner-it-intern','dunsk-kuhner','IT Intern','it_support','Carmona, Cavite','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=86c83c2d78c5db64','card',null),
  ('soluxionlab-qa-intern','soluxionlab','Quality Assurance Intern','qa','Muntinlupa','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=01c539f0870878f5','card',null),
  ('ams-group-it-intern','ams-group','IT Intern','it_support','Manila (Intramuros)','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=da82c1bcb2f3188a','card',null),
  ('hardhead-it-business-ops-intern','hardhead-technologies','IT Business Operations Intern (OJT)','other','Marikina','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=fce31855be573f59','card',null),
  ('tiger-global-internship','tiger-global','Internship (HR, Finance, Marketing, Admin and IT)','other','Muntinlupa (Madrigal Business Park)','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=d56c01fc94a7083c','card','Students only; IT is one of several tracks; post says October to November.'),
  ('em-power-it-intern','em-power','IT Intern','it_support','Bacoor, Cavite','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=c3c7d8b21b98e0ee','card',null),
  ('rare-global-it-intern','rare-global-food','IT Staff Intern','it_support','Parañaque','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=fad8550d8e3b78fe','card',null),
  ('honda-dasmarinas-it-intern','honda-cars-dasmarinas','IT Intern','it_support','Dasmariñas, Cavite','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=faef4ce366edca50','card',null),
  ('filmetrics-it-ojt','filmetrics','On-the-Job Trainee for IT','it_support','Quezon City','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=e51897bced4a00b5','card',null),
  ('vitro-it-intern','vitro','IT Intern','it_support','Makati','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=6261f600111fd0e4','card',null),
  ('awb-business-systems-analyst-intern','achieve-without-borders','Business Systems Analyst Intern','business_analyst','Makati','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=a5163ea4459e0628','card',null),
  ('sl-agritech-it-intern','sl-agritech','IT Intern','it_support','Makati','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=f421d1b587b6a1be','card',null),
  ('marquis-it-intern','marquis-events-place','IT Internship','it_support','Taguig','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=6c482a20f0fa7da7','card',null),
  ('xure-app-qa-intern','xure-app','IT Quality Assurance Intern','qa','San Juan','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=c53d812057717a8e','card',null),
  ('bonflex-it-ojt','bonflex-packaging','IT OJT','it_support','Biñan, Laguna','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=afa7460568b0e9e2','card',null),
  ('pa-alvarez-it-ojt','pa-alvarez','OJT, IT','it_support','San Pedro, Laguna','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=beec9859750c6383','card',null),
  ('eli-frontend-intern','eli-it-solutions','Front End Developer Intern','dev','Valenzuela','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=4c2d4dacf0d04630','card',null),
  ('eli-backend-intern','eli-it-solutions','Backend Developer Intern','dev','Valenzuela','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=35eaf9537ab152eb','card',null),
  ('eli-fullstack-intern','eli-it-solutions','Full Stack Developer Intern','dev','Valenzuela','hybrid',null,'indeed','https://ph.indeed.com/viewjob?jk=1acef8e79b6d1665','card',null),
  ('endsofttech-intern','endsofttech','Internship: Full Stack, QA, Web Dev','dev','Las Piñas','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=fd1b4f0759c8facc','card',null),
  ('opsolutions-software-qa-intern','opsolutions','Software QA Engineer Intern','qa','Silang, Cavite','unknown',null,'indeed','https://ph.indeed.com/viewjob?jk=16e9d55233ce2435','card',null)
) as v(slug, cslug, title, role, city, setup, posted, ch, url, how, note)
join public.companies c on c.slug = v.cslug
on conflict (slug) do nothing;

-- the one disclosed allowance in this batch
update public.opportunities set allowance_status = 'disclosed', allowance_basis = 'per_day', allowance_min = 100, allowance_max = 100,
  allowance_source = 'PHP 100 per 8-hour day on the JobStreet post'
where slug = 'golden-suntec-csharp-intern' and allowance_status = 'not_disclosed';

insert into public.fact_sources (entity, entity_id, field, value, source_url, source_type, state, observed_on)
select 'opportunity', o.id, 'post',
  case when o.notes like 'Seen live%' then 'Listed in the board''s search results' else 'Post seen live' end, o.source_url, 'official_post',
  case when o.notes like 'Seen live%' then 'reported' else 'confirmed' end::public.fact_state, '2026-10-24'
from public.opportunities o
where o.created_at > now() - interval '1 day' and not o.is_published
  and not exists (select 1 from public.fact_sources f where f.entity = 'opportunity' and f.entity_id = o.id and f.field = 'post');

-- KMC re-posted its OSS internship on JobStreet for Makati, Quezon City and Taguig
update public.opportunities set apply_url = 'https://ph.jobstreet.com/job/95059874', source_url = 'https://ph.jobstreet.com/job/95059874',
  apply_channel = 'jobstreet', post_status = 'open', posted_on = '2026-10-05', last_checked_at = now(),
  notes = 'Also posted for Quezon City and Taguig. Academic requirement only, with internship allowance.'
where slug = 'kmc-it-oss-intern';

-- "TrendAI" is Trend Micro: the same roles are on Trend Micro's own careers portal
update public.opportunities set company_id = (select id from public.companies where slug = 'trend-micro')
where company_id = (select id from public.companies where slug = 'trendai');
delete from public.partnerships where company_id = (select id from public.companies where slug = 'trendai');
delete from public.companies where slug = 'trendai';

-- company size from the JobStreet post's "employees" line
update public.companies c set size_text = v.sz || ' employees',
  size_band = case when v.sz in ('1-10', '11-50') then 'small' when v.sz = '51-100' then 'medium' when v.sz = '101-1,000' then 'large' else 'enterprise' end::public.company_size
from (values ('94873654','101-1,000'),('94879161','101-1,000'),('94887231','1,001-5,000'),('94967253','101-1,000'),('95000866','11-50'),('95012341','101-1,000'),
  ('95078245','101-1,000'),('95101112','1,001-5,000'),('95172277','51-100'),('95195599','101-1,000'),('95236393','1,001-5,000'),('95237561','101-1,000'),
  ('95298654','1,001-5,000'),('95319848','101-1,000'),('95349461','101-1,000'),('95353294','101-1,000'),('95359393','1,001-5,000'),('95373480','51-100'),
  ('95382449','1,001-5,000'),('95434686','101-1,000'),('95439794','101-1,000'),('95468776','1,001-5,000'),('95469561','101-1,000')) as v(job, sz)
join public.opportunities o on o.apply_url like '%/job/' || v.job or o.source_url like '%/job/' || v.job or (v.job = '95468776' and o.slug = 'cgi-crm-intern') or (v.job = '95469561' and o.slug = 'keywords-it-intern')
where c.id = o.company_id;
