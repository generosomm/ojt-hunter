-- P5 templates. Placeholders come from the signed-in user's profile and the chosen role.
-- {{x}} = required (shows [x] when unknown), {{x?}} = optional (the whole line disappears when empty).
-- Available: company, role, source, full_name, first_name, program, year_level, school, campus,
-- required_hours, max_hours, available_from, projects, skills, portfolio_url, email, phone, questions, applied_on
insert into public.email_templates (key, name, use_when, subject, body, needs_resume, asks_questions, sort_order) values
('application', 'Application email', 'Applying to a posted role by email', '{{role}} application, {{full_name}}',
$t$Hi {{company}} Hiring Team,

I'm {{full_name}}, a {{year_level}} {{program}} student at {{school}}. I saw the {{role}} opening on {{source}} and would like to apply for my required {{required_hours}}-hour OJT, available from {{available_from}}.

{{projects}}

The work in this role is close to what I want to keep learning, and I can help with tasks from day one while I learn your team's way of working.

{{questions?}}

I've attached my resume.
Portfolio: {{portfolio_url?}}

Thank you for your time.

Best regards,
{{full_name}}
{{phone?}}
{{email}}$t$, true, true, 10),

('cold', 'Cold email (no post)', 'The company has no open post but publishes an HR email', 'OJT inquiry: {{program}} student, {{full_name}}',
$t$Hi {{company}} Team,

I'm {{full_name}}, a {{year_level}} {{program}} student at {{school}}. I'm looking for a company for my required {{required_hours}}-hour OJT, available from {{available_from}}, and I'd like to ask if {{company}} takes IT interns for that period.

{{projects}}

{{questions?}}

I've attached my resume in case there's a fit.
Portfolio: {{portfolio_url?}}

Thank you,
{{full_name}}
{{phone?}}
{{email}}$t$, true, true, 20),

('questions', 'Questions before applying', 'You want to confirm the basics before investing in an application', 'Question about OJT at {{company}}',
$t$Hi {{company}} Team,

I'm {{full_name}}, a {{year_level}} {{program}} student at {{school}}. Before I apply for the {{role}} OJT, may I ask a few quick questions?

{{questions}}

Thank you, and I hope to hear from you.

Best regards,
{{full_name}}
{{email}}$t$, false, true, 30),

('moa_question', 'MOA question (not an HTE partner)', 'The company is not on your school''s HTE list', 'OJT and school partnership question, {{full_name}}',
$t$Hi {{company}} Team,

I'm {{full_name}}, a {{year_level}} {{program}} student at {{school}}, and I'm interested in the {{role}} OJT.

{{company}} isn't on our campus partner list yet. Do you require an existing MOA with our specific campus ({{campus}}), or can you accommodate a new school partnership? Our OJT coordinator handles new partner requests, so I'd like to check early before applying.

Thank you,
{{full_name}}
{{email}}$t$, false, false, 40),

('extend_hours', 'Reply: can you extend your hours?', 'HR asks if you can do more hours than required', 'Re: {{role}} application',
$t$Hi,

Thank you for considering my application. I can extend up to {{max_hours}} hours, and I'll confirm the extension with my OJT coordinator.

To plan it properly, may I ask:
- What are the working days and hours?
- Does the allowance cover all the hours?
- When would I start?

Thank you,
{{full_name}}$t$, false, false, 50),

('follow_up', 'Follow-up after 1 to 2 weeks', 'No reply yet. Send it in the same email thread.', 'Re: {{role}} application, {{full_name}}',
$t$Hi {{company}} Hiring Team,

I'm following up on my application for {{role}}, sent on {{applied_on}}. I'm still very interested and available from {{available_from}} for my {{required_hours}}-hour OJT.

Please let me know if you need anything else from me.

Thank you,
{{full_name}}
{{email}}$t$, false, false, 60),

('resume_fix', 'Forgot the resume', 'You sent an application without the attachment', 'Re: {{role}} application, resume attached',
$t$Hi,

Sorry, I forgot to attach my resume in my previous email. It's attached here.

Thank you,
{{full_name}}$t$, true, false, 70),

('thank_you', 'Interview thank-you', 'Within a day after an interview', 'Thank you, {{role}} interview',
$t$Hi,

Thank you for the interview today for the {{role}} OJT. I enjoyed learning more about the team and the work, and I'm still very interested.

If you need anything else from me, I'm happy to send it.

Best regards,
{{full_name}}$t$, false, false, 80),

('decline', 'Polite decline', 'Turning down an offer (for example, unpaid or too far)', 'Re: {{role}} offer',
$t$Hi,

Thank you for the offer for the {{role}} OJT and for your time during the process. After thinking it through, I've decided not to continue, mainly because [your reason].

I really appreciate the opportunity, and I hope we cross paths again.

Best regards,
{{full_name}}$t$, false, false, 90),

('cover_letter', 'Short cover letter', 'JobStreet or LinkedIn text boxes. Check that the company name is right.', null,
$t$Hi {{company}} Hiring Team,

I'm a {{year_level}} {{program}} student at {{school}} applying for the {{role}} OJT. I need {{required_hours}} hours and I'm available from {{available_from}}.

{{projects}}

I'd like to bring that experience to your team and keep learning on real work. Thank you for considering my application.

{{full_name}}$t$, false, false, 100);
